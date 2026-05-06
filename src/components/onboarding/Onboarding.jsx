import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { setMonthlyIncome, setMonthlyBudget, addDefaultExpense, updateUser } from '../../lib/firestore'
import { DEFAULT_EXPENSES, MONTHS, currentMonth, currentYear, formatCOP } from '../../utils/format'
import Spinner from '../ui/Spinner'

const STEPS = ['Ingreso', 'Gastos base', 'Distribución']

// Suma los gastos activos por tipo de cuenta
function calcSuggested(expenses) {
  const sum = { fixedExpenses: 0, savings: 0, dailySpending: 0 }
  expenses.forEach((e) => {
    if (e.isActive && e.amount > 0 && sum[e.accountType] !== undefined) {
      sum[e.accountType] += e.amount
    }
  })
  return sum
}

export default function Onboarding() {
  const { user, refreshUserData } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [income, setIncome] = useState('')
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES.map((e) => ({ ...e })))
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

  // Al pasar al step 2, precalcula sugerencias desde los gastos base
  const goToDistribution = () => {
    const suggested = calcSuggested(expenses)
    setBudget({
      fixedExpenses: suggested.fixedExpenses || '',
      savings: suggested.savings || '',
      dailySpending: suggested.dailySpending || '',
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

  const suggested = calcSuggested(expenses)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-500 px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💰</span>
            <h1 className="text-2xl font-bold text-white">Configura tus finanzas</h1>
          </div>
          <div className="flex gap-2 mt-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? 'bg-white text-emerald-600' : 'bg-emerald-400 text-white'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${i <= step ? 'text-white font-medium' : 'text-emerald-200'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className="w-8 h-0.5 bg-emerald-400 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* Step 0: Income */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">¿Cuánto ganas al mes?</h2>
              <p className="text-slate-500 mb-6">Ingresa tu salario o ingreso mensual principal.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingreso mensual — {MONTHS[month - 1]} {year}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input
                    type="number"
                    min="0"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-semibold"
                    placeholder="3000000"
                  />
                </div>
                {incomeNum > 0 && (
                  <p className="text-emerald-600 font-medium mt-2">{formatCOP(incomeNum)}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Default expenses */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Tus gastos recurrentes</h2>
              <p className="text-slate-500 mb-4">Edita, activa/desactiva o elimina según tu situación real.</p>

              {/* Preview of suggested distribution */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { key: 'fixedExpenses', label: 'G. fijos', icon: '🏠' },
                  { key: 'savings', label: 'Ahorro', icon: '🏦' },
                  { key: 'dailySpending', label: 'G. diario', icon: '🛒' },
                ].map(({ key, label, icon }) => (
                  <div key={key} className="bg-slate-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-xs text-slate-400 mb-1">{icon} {label}</p>
                    <p className="font-bold text-slate-700 text-sm">{formatCOP(suggested[key])}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {expenses.map((exp, i) => (
                  <div key={i} className="flex gap-2 items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={exp.isActive}
                      onChange={(e) => updateExpense(i, 'isActive', e.target.checked)}
                      className="accent-emerald-500 w-4 h-4 flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={exp.name}
                      onChange={(e) => updateExpense(i, 'name', e.target.value)}
                      className="flex-1 border-0 bg-transparent focus:outline-none font-medium text-slate-700 text-sm"
                      placeholder="Nombre del gasto"
                    />
                    <select
                      value={exp.accountType}
                      onChange={(e) => updateExpense(i, 'accountType', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-shrink-0"
                    >
                      <option value="fixedExpenses">G. fijos</option>
                      <option value="savings">Ahorro</option>
                      <option value="dailySpending">G. diario</option>
                    </select>
                    <div className="relative flex-shrink-0">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        value={exp.amount}
                        onChange={(e) => updateExpense(i, 'amount', e.target.value)}
                        className="w-28 pl-5 pr-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <button onClick={() => removeExpense(i)} className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0">×</button>
                  </div>
                ))}
              </div>
              <button
                onClick={addExpense}
                className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
              >
                + Agregar gasto
              </button>
            </div>
          )}

          {/* Step 2: Budget distribution */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Distribuye tu ingreso</h2>
              <p className="text-slate-500 text-sm mb-1">
                Ingreso: <span className="font-semibold text-emerald-600">{formatCOP(incomeNum)}</span>
              </p>
              <p className={`text-sm mb-5 font-medium ${remaining < 0 ? 'text-red-500' : remaining === 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                Sin asignar: {formatCOP(remaining)}
              </p>

              <div className="space-y-4">
                {[
                  { key: 'fixedExpenses', label: 'Gastos fijos', icon: '🏠', sugKey: 'fixedExpenses' },
                  { key: 'savings', label: 'Ahorro', icon: '🏦', sugKey: 'savings' },
                  { key: 'dailySpending', label: 'Gasto diario', icon: '🛒', sugKey: 'dailySpending' },
                ].map(({ key, label, icon, sugKey }) => {
                  const sug = suggested[sugKey]
                  const pct = incomeNum > 0 ? Math.round((sug / incomeNum) * 100) : 0
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-gray-700">{icon} {label}</label>
                        {sug > 0 && (
                          <span className="text-xs text-slate-400">
                            Sugerido: <span className="font-semibold text-slate-600">{formatCOP(sug)}</span>
                            <span className="ml-1 text-emerald-600">({pct}%)</span>
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="number"
                          min="0"
                          value={budget[key]}
                          onChange={(e) => setBudget({ ...budget, [key]: e.target.value })}
                          className="w-full pl-8 pr-28 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="0"
                        />
                        {sug > 0 && String(budget[key]) !== String(sug) && (
                          <button
                            type="button"
                            onClick={() => setBudget({ ...budget, [key]: sug })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-lg"
                          >
                            Usar sugerido
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition">
                Atrás
              </button>
            ) : <div />}

            {step === 0 && (
              <button
                onClick={() => setStep(1)}
                disabled={!incomeNum}
                className="px-8 py-2.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition disabled:opacity-40"
              >
                Continuar
              </button>
            )}

            {step === 1 && (
              <button
                onClick={goToDistribution}
                className="px-8 py-2.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition"
              >
                Continuar
              </button>
            )}

            {step === 2 && (
              <button
                onClick={finish}
                disabled={loading || remaining < 0}
                className="px-8 py-2.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition disabled:opacity-40 flex items-center gap-2"
              >
                {loading ? <Spinner size="sm" /> : 'Empezar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
