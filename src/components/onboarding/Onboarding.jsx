import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { setMonthlyIncome, setMonthlyBudget, addDefaultExpense, updateUser } from '../../lib/firestore'
import { MONTHS, currentMonth, currentYear, formatCOP } from '../../utils/format'
import Spinner from '../ui/Spinner'

const STEPS = ['Ingreso', 'Gastos base', 'Distribución']

// Porcentajes objetivo recomendados
const TARGETS = {
  fixedExpenses: { pct: 0.52, label: 'Gastos fijos', dot: 'bg-blue-400', bar: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700' },
  savings:       { pct: 0.15, label: 'Ahorro',       dot: 'bg-violet-400', bar: 'bg-violet-400', badge: 'bg-violet-50 text-violet-700' },
  dailySpending: { pct: 0.33, label: 'G. diario',    dot: 'bg-amber-400', bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700' },
}

// Redondea al múltiplo de 1000 más cercano
const r1k = (n) => Math.round(n / 1000) * 1000

// Genera gastos sugeridos proporcionales al ingreso
function generateSuggestedExpenses(income) {
  return [
    { name: 'Arriendo',            amount: r1k(income * 0.30), category: 'Vivienda',      accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Agua',                amount: r1k(income * 0.016), category: 'Servicios',    accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Luz',                 amount: r1k(income * 0.016), category: 'Servicios',    accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Gas',                 amount: r1k(income * 0.010), category: 'Servicios',    accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Internet',            amount: r1k(income * 0.018), category: 'Servicios',    accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Celular',             amount: r1k(income * 0.016), category: 'Servicios',    accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Transporte',          amount: r1k(income * 0.07),  category: 'Transporte',   accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Deudas',              amount: r1k(income * 0.05),  category: 'Deudas',       accountType: 'fixedExpenses', expenseType: 'deuda',    isActive: false, isRecurring: true },
    { name: 'Alimentación',        amount: r1k(income * 0.20),  category: 'Alimentación', accountType: 'dailySpending', expenseType: 'variable', isActive: true,  isRecurring: true },
    { name: 'Aseo personal',       amount: r1k(income * 0.05),  category: 'Personal',     accountType: 'dailySpending', expenseType: 'variable', isActive: true,  isRecurring: true },
    { name: 'Insumos hogar',       amount: r1k(income * 0.05),  category: 'Hogar',        accountType: 'dailySpending', expenseType: 'variable', isActive: true,  isRecurring: true },
    { name: 'Suscripciones',       amount: r1k(income * 0.02),  category: 'Ocio',         accountType: 'dailySpending', expenseType: 'fijo',     isActive: false, isRecurring: true },
    { name: 'Fondo de emergencia', amount: r1k(income * 0.10),  category: 'Ahorro',       accountType: 'savings',       expenseType: 'ahorro',   isActive: true,  isRecurring: true },
    { name: 'Ahorro meta',         amount: r1k(income * 0.05),  category: 'Ahorro',       accountType: 'savings',       expenseType: 'ahorro',   isActive: false, isRecurring: true },
  ]
}

function calcConfigured(expenses) {
  const sum = { fixedExpenses: 0, savings: 0, dailySpending: 0 }
  expenses.forEach((e) => {
    if (e.isActive && e.amount > 0 && sum[e.accountType] !== undefined)
      sum[e.accountType] += e.amount
  })
  return sum
}

const inputBase = 'flex items-center border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 overflow-hidden bg-white'
const inputPrefix = 'px-3 text-gray-400 font-semibold border-r border-gray-200 bg-gray-50 py-3 flex-shrink-0 text-sm'
const inputField = 'flex-1 px-3 py-3 focus:outline-none bg-white min-w-0 text-slate-800 font-semibold'

export default function Onboarding() {
  const { user, refreshUserData } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [income, setIncome] = useState('')
  const [expenses, setExpenses] = useState([])
  const [budget, setBudget] = useState({ fixedExpenses: '', savings: '', dailySpending: '' })

  const month = currentMonth()
  const year = currentYear()
  const incomeNum = parseFloat(income) || 0
  const totalBudget = (parseFloat(budget.fixedExpenses) || 0) + (parseFloat(budget.savings) || 0) + (parseFloat(budget.dailySpending) || 0)
  const remaining = incomeNum - totalBudget

  const updateExpense = (i, field, val) => {
    const updated = [...expenses]
    updated[i] = { ...updated[i], [field]: field === 'amount' ? parseFloat(val) || 0 : val }
    setExpenses(updated)
  }

  const addExpense = () =>
    setExpenses([...expenses, { name: '', amount: 0, category: 'Otros', accountType: 'dailySpending', expenseType: 'variable', isActive: true, isRecurring: false }])

  const removeExpense = (i) => setExpenses(expenses.filter((_, idx) => idx !== i))

  // Al pasar al step 1: genera gastos sugeridos basados en el ingreso
  const goToExpenses = () => {
    setExpenses(generateSuggestedExpenses(incomeNum))
    setStep(1)
  }

  // Al pasar al step 2: precalcula distribución desde gastos configurados
  const goToDistribution = () => {
    const configured = calcConfigured(expenses)
    setBudget({
      fixedExpenses: configured.fixedExpenses || '',
      savings: configured.savings || '',
      dailySpending: configured.dailySpending || '',
    })
    setStep(2)
  }

  const finish = async () => {
    setLoading(true)
    try {
      await setMonthlyIncome(user.uid, month, year, { income: incomeNum, notes: 'Configuración inicial' })
      await setMonthlyBudget(user.uid, month, year, {
        fixedExpensesBudget: parseFloat(budget.fixedExpenses) || 0,
        savingsBudget: parseFloat(budget.savings) || 0,
        dailySpendingBudget: parseFloat(budget.dailySpending) || 0,
        unassignedMoney: remaining,
      })
      for (const exp of expenses) {
        if (exp.name) await addDefaultExpense(user.uid, exp)
      }
      await updateUser(user.uid, { hasCompletedOnboarding: true })
      await refreshUserData()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const configured = calcConfigured(expenses)

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center lg:justify-center lg:p-6">
      <div className="flex-1 lg:flex-none w-full max-w-lg bg-white lg:rounded-2xl lg:shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-emerald-500 px-5 pt-10 pb-5 lg:px-8 lg:pt-7 lg:pb-6 flex-shrink-0">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-base leading-none">$</span>
            </div>
            <h1 className="text-lg font-bold text-white">Configura tus finanzas</h1>
          </div>
          <div className="space-y-2">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
            <div className="flex justify-between">
              {STEPS.map((s, i) => (
                <span key={s} className={`text-xs font-semibold ${i <= step ? 'text-white' : 'text-emerald-200'}`}>
                  {i < step ? '✓ ' : ''}{s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8 lg:py-7">

          {/* Step 0: Income */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">¿Cuánto ganas al mes?</h2>
                <p className="text-slate-500 text-sm mt-1">Ingresa tu salario o ingreso mensual principal.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Ingreso — {MONTHS[month - 1]} {year}
                </label>
                <div className={inputBase}>
                  <span className={`${inputPrefix} text-base`}>$</span>
                  <input
                    type="number" min="0"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    onFocus={() => setIncome('')}
                    className={`${inputField} text-xl`}
                    placeholder="3,000,000"
                  />
                </div>
                {incomeNum > 0 && (
                  <p className="text-emerald-600 font-semibold mt-2 text-sm">{formatCOP(incomeNum)}</p>
                )}
              </div>

              {/* Preview de distribución */}
              {incomeNum > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Distribución sugerida</p>
                  {Object.entries(TARGETS).map(([key, t]) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.dot}`} />
                        <span className="text-xs text-slate-600 font-medium">{t.label}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.badge}`}>
                          {Math.round(t.pct * 100)}%
                        </span>
                        <span className="text-xs font-bold text-slate-700 w-24 text-right">{formatCOP(r1k(incomeNum * t.pct))}</span>
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-400 pt-1">Los valores se autocompletarán en el siguiente paso.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Gastos base */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Gastos recurrentes</h2>
                <p className="text-slate-500 text-sm mt-1">Valores calculados para <span className="font-semibold text-emerald-600">{formatCOP(incomeNum)}</span>. Edítalos libremente.</p>
              </div>

              {/* Recomendado vs configurado */}
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TARGETS).map(([key, t]) => {
                  const recommended = r1k(incomeNum * t.pct)
                  const conf = configured[key]
                  const pct = recommended > 0 ? Math.min(Math.round((conf / recommended) * 100), 100) : 0
                  const over = conf > recommended * 1.1
                  return (
                    <div key={key} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate">{t.label}</p>
                      </div>
                      <p className="text-xs font-bold text-slate-800">{formatCOP(conf)}</p>
                      <p className="text-[10px] text-slate-400">de {formatCOP(recommended)}</p>
                      <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all ${over ? 'bg-red-400' : t.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Lista de gastos */}
              <div className="space-y-2">
                {expenses.map((exp, i) => (
                  <div key={i} className={`p-3 border rounded-xl transition ${exp.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => updateExpense(i, 'isActive', !exp.isActive)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition
                          ${exp.isActive ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}
                      >
                        {exp.isActive && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="text"
                        value={exp.name}
                        onChange={(e) => updateExpense(i, 'name', e.target.value)}
                        className="flex-1 bg-transparent focus:outline-none font-semibold text-slate-800 text-sm min-w-0"
                        placeholder="Nombre del gasto"
                      />
                      <button
                        onClick={() => removeExpense(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pl-8">
                      <select
                        value={exp.accountType}
                        onChange={(e) => updateExpense(i, 'accountType', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white text-slate-600 font-medium"
                      >
                        <option value="fixedExpenses">Gastos fijos</option>
                        <option value="savings">Ahorro</option>
                        <option value="dailySpending">Gasto diario</option>
                      </select>
                      <div className="flex items-center border border-gray-200 rounded-lg focus-within:ring-1 focus-within:ring-emerald-500 overflow-hidden bg-white flex-shrink-0">
                        <span className="px-2 text-gray-400 text-xs font-semibold border-r border-gray-200 bg-gray-50 py-1.5 flex-shrink-0">$</span>
                        <input
                          type="number" min="0"
                          value={exp.amount}
                          onChange={(e) => updateExpense(i, 'amount', e.target.value)}
                          onFocus={() => { const u = [...expenses]; u[i] = { ...u[i], amount: '' }; setExpenses(u) }}
                          className="w-28 px-2 py-1.5 text-sm focus:outline-none bg-white font-semibold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addExpense}
                className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 text-sm font-semibold transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar gasto
              </button>
            </div>
          )}

          {/* Step 2: Distribución */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Distribuye tu ingreso</h2>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-slate-500 text-sm">Ingreso: <span className="font-bold text-emerald-600">{formatCOP(incomeNum)}</span></p>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${remaining < 0 ? 'bg-red-50 text-red-600' : remaining === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {remaining === 0 ? '✓ Completo' : `Sin asignar: ${formatCOP(remaining)}`}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(TARGETS).map(([key, t]) => {
                  const recommended = r1k(incomeNum * t.pct)
                  const pct = incomeNum > 0 ? Math.round((recommended / incomeNum) * 100) : 0
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                          <label className="text-sm font-semibold text-slate-700">{t.label}</label>
                        </div>
                        <span className="text-xs text-slate-400">
                          Sugerido: <span className="font-semibold text-slate-600">{formatCOP(recommended)}</span>
                          <span className="text-emerald-500 ml-1">({pct}%)</span>
                        </span>
                      </div>
                      <div className={inputBase}>
                        <span className={inputPrefix}>$</span>
                        <input
                          type="number" min="0"
                          value={budget[key]}
                          onChange={(e) => setBudget({ ...budget, [key]: e.target.value })}
                          onFocus={() => setBudget((b) => ({ ...b, [key]: '' }))}
                          className={inputField}
                          placeholder="0"
                        />
                        {String(budget[key]) !== String(recommended) && (
                          <button
                            type="button"
                            onClick={() => setBudget({ ...budget, [key]: recommended })}
                            className="flex-shrink-0 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 mr-2 rounded-lg hover:bg-emerald-100 transition"
                          >
                            Usar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-5 lg:px-8 border-t border-gray-100 flex justify-between items-center bg-white">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl font-semibold text-slate-600 hover:bg-gray-50 transition text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Atrás
            </button>
          ) : <div />}

          {step === 0 && (
            <button
              onClick={goToExpenses}
              disabled={!incomeNum}
              className="w-48 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition disabled:opacity-40 text-base shadow-sm"
            >
              Continuar
            </button>
          )}
          {step === 1 && (
            <button
              onClick={goToDistribution}
              className="w-48 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition text-base shadow-sm"
            >
              Continuar
            </button>
          )}
          {step === 2 && (
            <button
              onClick={finish}
              disabled={loading || remaining < 0}
              className="w-48 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition disabled:opacity-40 text-base shadow-sm flex items-center justify-center"
            >
              {loading ? <Spinner size="sm" /> : 'Empezar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
