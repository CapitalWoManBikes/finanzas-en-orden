import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { setMonthlyIncome, setMonthlyBudget, addDefaultExpense, updateUser } from '../../lib/firestore'
import { MONTHS, currentMonth, currentYear, formatCOP } from '../../utils/format'
import { Card, Button } from '../fo'
import Spinner from '../ui/Spinner'

const STEPS = ['Ingreso', 'Gastos base', 'Distribución']

const TARGETS = {
  fixedExpenses: { pct: 0.52, label: 'Gastos fijos',  color: 'oklch(0.65 0.18 255)' },
  savings:       { pct: 0.15, label: 'Ahorro',         color: 'oklch(0.74 0.16 160)' },
  dailySpending: { pct: 0.33, label: 'Gasto diario',   color: 'oklch(0.80 0.16 80)'  },
}

const r1k = (n) => Math.round(n / 1000) * 1000

function generateSuggestedExpenses(income) {
  return [
    { name: 'Arriendo',            amount: r1k(income * 0.30),  category: 'Vivienda',      accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Agua',                amount: r1k(income * 0.016), category: 'Servicios',     accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Luz',                 amount: r1k(income * 0.016), category: 'Servicios',     accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Gas',                 amount: r1k(income * 0.010), category: 'Servicios',     accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Internet',            amount: r1k(income * 0.018), category: 'Servicios',     accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Celular',             amount: r1k(income * 0.016), category: 'Servicios',     accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Transporte',          amount: r1k(income * 0.07),  category: 'Transporte',    accountType: 'fixedExpenses', expenseType: 'fijo',     isActive: true,  isRecurring: true },
    { name: 'Deudas',              amount: r1k(income * 0.05),  category: 'Deudas',        accountType: 'fixedExpenses', expenseType: 'deuda',    isActive: false, isRecurring: true },
    { name: 'Alimentación',        amount: r1k(income * 0.20),  category: 'Alimentación',  accountType: 'dailySpending', expenseType: 'variable', isActive: true,  isRecurring: true },
    { name: 'Aseo personal',       amount: r1k(income * 0.05),  category: 'Personal',      accountType: 'dailySpending', expenseType: 'variable', isActive: true,  isRecurring: true },
    { name: 'Insumos hogar',       amount: r1k(income * 0.05),  category: 'Hogar',         accountType: 'dailySpending', expenseType: 'variable', isActive: true,  isRecurring: true },
    { name: 'Suscripciones',       amount: r1k(income * 0.02),  category: 'Ocio',          accountType: 'dailySpending', expenseType: 'fijo',     isActive: false, isRecurring: true },
    { name: 'Fondo de emergencia', amount: r1k(income * 0.10),  category: 'Ahorro',        accountType: 'savings',       expenseType: 'ahorro',   isActive: true,  isRecurring: true },
    { name: 'Ahorro meta',         amount: r1k(income * 0.05),  category: 'Ahorro',        accountType: 'savings',       expenseType: 'ahorro',   isActive: false, isRecurring: true },
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

function FoInput({ value, onChange, onFocus, placeholder, large = false, suffix }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--fo-surface-2)', border: '1px solid var(--fo-line)', borderRadius: 'var(--fo-r-md)', overflow: 'hidden' }}>
      <span style={{ padding: large ? '14px 16px' : '10px 14px', color: 'var(--fo-fg-dim)', fontSize: large ? 16 : 13, fontWeight: 600, borderRight: '1px solid var(--fo-line)', background: 'var(--fo-surface-3)', flexShrink: 0 }}>$</span>
      <input
        type="number" min="0" value={value} onChange={onChange} onFocus={onFocus} placeholder={placeholder}
        style={{ flex: 1, padding: large ? '14px 16px' : '10px 14px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--fo-fg)', fontSize: large ? 20 : 14, fontWeight: 600, fontFamily: 'inherit', minWidth: 0 }}
      />
      {suffix}
    </div>
  )
}

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

  const goToExpenses = () => { setExpenses(generateSuggestedExpenses(incomeNum)); setStep(1) }

  const goToDistribution = () => {
    const configured = calcConfigured(expenses)
    setBudget({ fixedExpenses: configured.fixedExpenses || '', savings: configured.savings || '', dailySpending: configured.dailySpending || '' })
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
    <div className="fo-app" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Stepper */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= step ? 'var(--fo-accent)' : 'var(--fo-line)', transition: 'background 300ms' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {STEPS.map((s, i) => (
              <span key={s} style={{ fontSize: 11, fontWeight: 600, color: i <= step ? 'var(--fo-accent-fg)' : 'var(--fo-fg-faint)' }}>
                {i < step ? '✓ ' : ''}{s}
              </span>
            ))}
          </div>
        </div>

        <Card style={{ padding: 28 }}>

          {/* Step 0 — Ingreso */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>¿Cuánto ganas al mes?</h2>
                <p style={{ fontSize: 13, color: 'var(--fo-fg-muted)' }}>Ingresa tu salario o ingreso mensual principal.</p>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--fo-fg-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Ingreso — {MONTHS[month - 1]} {year}
                </p>
                <FoInput large value={income} onChange={(e) => setIncome(e.target.value)} onFocus={() => setIncome('')} placeholder="3,000,000" />
                {incomeNum > 0 && <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--fo-pos)' }}>{formatCOP(incomeNum)}</p>}
              </div>

              {incomeNum > 0 && (
                <div style={{ background: 'var(--fo-surface-2)', borderRadius: 'var(--fo-r-md)', padding: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--fo-fg-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Distribución sugerida</p>
                  {Object.entries(TARGETS).map(([key, t]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 99, background: t.color }} />
                        <span style={{ fontSize: 13, color: 'var(--fo-fg-muted)' }}>{t.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--fo-surface-3)', color: 'var(--fo-fg-muted)' }}>{Math.round(t.pct * 100)}%</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fo-fg)', fontVariantNumeric: 'tabular-nums' }}>{formatCOP(r1k(incomeNum * t.pct))}</span>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: 11, color: 'var(--fo-fg-faint)', marginTop: 4 }}>Los valores se autocompletarán en el siguiente paso.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 1 — Gastos base */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Gastos recurrentes</h2>
                <p style={{ fontSize: 13, color: 'var(--fo-fg-muted)' }}>
                  Calculados para <span style={{ fontWeight: 700, color: 'var(--fo-pos)' }}>{formatCOP(incomeNum)}</span>. Edítalos libremente.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {Object.entries(TARGETS).map(([key, t]) => {
                  const recommended = r1k(incomeNum * t.pct)
                  const conf = configured[key]
                  const pct = recommended > 0 ? Math.min(Math.round((conf / recommended) * 100), 100) : 0
                  const over = conf > recommended * 1.1
                  return (
                    <div key={key} style={{ background: 'var(--fo-surface-2)', borderRadius: 'var(--fo-r-sm)', padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 99, background: t.color }} />
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--fo-fg-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</p>
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--fo-fg)', fontVariantNumeric: 'tabular-nums' }}>{formatCOP(conf)}</p>
                      <p style={{ fontSize: 10, color: 'var(--fo-fg-faint)' }}>de {formatCOP(recommended)}</p>
                      <div style={{ marginTop: 6, height: 3, borderRadius: 99, background: 'var(--fo-line)' }}>
                        <div style={{ height: 3, borderRadius: 99, width: `${pct}%`, background: over ? 'var(--fo-neg)' : t.color, transition: 'width 300ms' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                {expenses.map((exp, i) => (
                  <div key={i} style={{ padding: 12, border: '1px solid var(--fo-line)', borderRadius: 'var(--fo-r-sm)', background: exp.isActive ? 'var(--fo-surface-2)' : 'transparent', opacity: exp.isActive ? 1 : 0.45 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <button
                        onClick={() => updateExpense(i, 'isActive', !exp.isActive)}
                        style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, cursor: 'pointer', border: exp.isActive ? 'none' : '2px solid var(--fo-line)', background: exp.isActive ? 'var(--fo-accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {exp.isActive && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
                      </button>
                      <input
                        type="text" value={exp.name} onChange={(e) => updateExpense(i, 'name', e.target.value)} placeholder="Nombre del gasto"
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--fo-fg)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
                      />
                      <button onClick={() => removeExpense(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fo-fg-faint)', fontSize: 18, padding: '0 4px', lineHeight: 1 }}>×</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, paddingLeft: 28 }}>
                      <select
                        value={exp.accountType} onChange={(e) => updateExpense(i, 'accountType', e.target.value)}
                        style={{ flex: 1, background: 'var(--fo-surface-3)', border: '1px solid var(--fo-line)', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: 'var(--fo-fg-muted)', fontFamily: 'inherit', outline: 'none' }}
                      >
                        <option value="fixedExpenses">Gastos fijos</option>
                        <option value="savings">Ahorro</option>
                        <option value="dailySpending">Gasto diario</option>
                      </select>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--fo-line)', borderRadius: 8, overflow: 'hidden', background: 'var(--fo-surface-3)', flexShrink: 0 }}>
                        <span style={{ padding: '6px 8px', fontSize: 11, color: 'var(--fo-fg-dim)', borderRight: '1px solid var(--fo-line)' }}>$</span>
                        <input
                          type="number" min="0" value={exp.amount}
                          onChange={(e) => updateExpense(i, 'amount', e.target.value)}
                          onFocus={() => { const u = [...expenses]; u[i] = { ...u[i], amount: '' }; setExpenses(u) }}
                          style={{ width: 96, padding: '6px 8px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--fo-fg)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addExpense}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fo-accent-fg)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: 0 }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Agregar gasto
              </button>
            </div>
          )}

          {/* Step 2 — Distribución */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Distribuye tu ingreso</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 13, color: 'var(--fo-fg-muted)' }}>
                    Ingreso: <span style={{ fontWeight: 700, color: 'var(--fo-pos)' }}>{formatCOP(incomeNum)}</span>
                  </p>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: remaining < 0 ? 'var(--fo-neg-soft)' : remaining === 0 ? 'var(--fo-pos-soft)' : 'var(--fo-surface-3)', color: remaining < 0 ? 'var(--fo-neg)' : remaining === 0 ? 'var(--fo-pos)' : 'var(--fo-fg-muted)' }}>
                    {remaining === 0 ? '✓ Completo' : `Sin asignar: ${formatCOP(remaining)}`}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {Object.entries(TARGETS).map(([key, t]) => {
                  const recommended = r1k(incomeNum * t.pct)
                  const pct = incomeNum > 0 ? Math.round((recommended / incomeNum) * 100) : 0
                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 99, background: t.color }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fo-fg)' }}>{t.label}</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--fo-fg-faint)' }}>
                          Sugerido: <span style={{ fontWeight: 600, color: 'var(--fo-fg-muted)' }}>{formatCOP(recommended)}</span>
                          <span style={{ color: 'var(--fo-accent-fg)', marginLeft: 4 }}>({pct}%)</span>
                        </span>
                      </div>
                      <FoInput
                        value={budget[key]}
                        onChange={(e) => setBudget({ ...budget, [key]: e.target.value })}
                        onFocus={() => setBudget((b) => ({ ...b, [key]: '' }))}
                        placeholder="0"
                        suffix={String(budget[key]) !== String(recommended) && (
                          <button
                            onClick={() => setBudget({ ...budget, [key]: recommended })}
                            style={{ padding: '6px 12px', marginRight: 8, fontSize: 11, fontWeight: 700, color: 'var(--fo-accent-fg)', background: 'var(--fo-accent-soft)', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                          >
                            Usar
                          </button>
                        )}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--fo-line)' }}>
            {step > 0
              ? <Button variant="ghost" onClick={() => setStep(step - 1)}>← Atrás</Button>
              : <div />}

            {step === 0 && <Button variant="primary" size="lg" onClick={goToExpenses} disabled={!incomeNum} style={{ minWidth: 140 }}>Continuar →</Button>}
            {step === 1 && <Button variant="primary" size="lg" onClick={goToDistribution} style={{ minWidth: 140 }}>Continuar →</Button>}
            {step === 2 && (
              <Button variant="primary" size="lg" onClick={finish} disabled={loading || remaining < 0} style={{ minWidth: 140 }}>
                {loading ? <Spinner size="sm" /> : 'Empezar →'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
