import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import {
  getMonthlyBudget,
  getMonthlyIncome,
  getIncomeEntries,
  getDefaultExpenses,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from '../lib/firestore'
import { formatCOP, MONTHS, CATEGORIES, ACCOUNT_TYPES, EXPENSE_TYPES, PAYMENT_METHODS, currentMonth, currentYear } from '../utils/format'
import { calculateMonthlySummary } from '../utils/financeSummary'
import { Card, Button, Input, Chip, SectionHeader, Money, Ico, ICONS } from '../components/fo'
import Spinner from '../components/ui/Spinner'

const EMPTY = {
  date: new Date().toISOString().slice(0, 10),
  name: '', amount: '', category: 'Alimentación',
  accountType: 'dailySpending', expenseType: 'variable',
  paymentMethod: 'Efectivo', notes: '',
}

const ACCT = {
  fixedExpenses: { tone: 'accent', label: 'Gastos fijos' },
  savings:       { tone: 'pos',    label: 'Ahorro' },
  dailySpending: { tone: 'warn',   label: 'Gasto diario' },
}

const sel = {
  background: 'var(--fo-surface-2)', border: '1px solid var(--fo-line)',
  borderRadius: 'var(--fo-r-md)', padding: '10px 14px', fontSize: 14,
  color: 'var(--fo-fg)', fontFamily: 'inherit', outline: 'none', width: '100%',
}
const lbl = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--fo-fg-muted)' }

export default function GastosPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonth())
  const [year, setYear]   = useState(currentYear())
  const [income, setIncome] = useState(null)
  const [incomeEntries, setIncomeEntries] = useState([])
  const [budget, setBudget] = useState(null)
  const [defaultExpenses, setDefaultExpenses] = useState([])
  const [txs, setTxs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [filter, setFilter]     = useState({ category: '', accountType: '', search: '' })

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true);
    try {
      const [incomeData, entries, budgetData, defaults, txs] = await Promise.all([
        getMonthlyIncome(user.uid, month, year),
        getIncomeEntries(user.uid, month, year),
        getMonthlyBudget(user.uid, month, year),
        getDefaultExpenses(user.uid),
        getTransactions(user.uid, month, year),
      ]);
      setIncome(incomeData);
      setIncomeEntries(entries);
      setBudget(budgetData);
      setDefaultExpenses(defaults);
      setTxs(txs);
    } catch (e) {
      console.error("Error loading transactions", e);
    } finally {
      setLoading(false);
    }
  }, [user, month, year])
  useEffect(() => { load() }, [load])

  const openNew  = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (tx) => { setEditing(tx.id); setForm({ ...tx }); setShowForm(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return
    setSaving(true)
    const data = { ...form, amount: amt, month: parseInt(form.date.slice(5, 7)), year: parseInt(form.date.slice(0, 4)) }
    if (editing) await updateTransaction(user.uid, editing, data)
    else await addTransaction(user.uid, data)
    setShowForm(false); await load(); setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await deleteTransaction(user.uid, id); await load()
  }

  const filtered = txs.filter(t =>
    (!filter.category || t.category === filter.category) &&
    (!filter.accountType || t.accountType === filter.accountType) &&
    (!filter.search || t.name.toLowerCase().includes(filter.search.toLowerCase()))
  )
  const total = filtered.reduce((s, t) => s + t.amount, 0)
  const summary = calculateMonthlySummary({ income, incomeEntries, budget, defaultExpenses, transactions: txs })
  const balanceTone = summary.availableMoney < 0 ? 'var(--fo-neg)' : summary.spendingRate > 85 ? 'var(--fo-warn)' : 'var(--fo-pos)'
  const balanceMsg = !income
    ? 'Registra un ingreso para activar el saldo del mes.'
    : summary.availableMoney < 0
      ? `Te pasaste por ${formatCOP(summary.overBudgetAmount)}.`
      : summary.spendingRate > 85
        ? 'Estás cerca de gastar todo el ingreso.'
        : 'Saldo al día.'

  return (
    <AppLayout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <SectionHeader overline="Registro" title="Gastos"
          action={<Button onClick={openNew} icon={<Ico d={ICONS.plus} size={14}/>}>Nuevo gasto</Button>}
        />

        {/* Saldo tipo cuenta */}
        <Card style={{ marginBottom: 16, borderColor: summary.availableMoney < 0 ? 'var(--fo-neg)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-fg-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Saldo disponible
              </p>
              <p className="fo-num" style={{ margin: '6px 0 0', fontSize: 34, lineHeight: 1, color: balanceTone }}>
                {formatCOP(summary.availableMoney)}
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: balanceTone, fontWeight: 600 }}>
                {balanceMsg}
              </p>
            </div>
            <div style={{ minWidth: 210, display: 'grid', gap: 8 }}>
              <BalanceLine label="Ingreso" value={summary.income} tone="var(--fo-pos)" sign="+" />
              <BalanceLine label="Gastado / movido" value={summary.totalSpent} tone="var(--fo-neg)" sign="-" />
              <div style={{ height: 1, background: 'var(--fo-line)' }} />
              <BalanceLine label={`${summary.spendingRate}% usado`} value={summary.availableMoney} tone={balanceTone} />
            </div>
          </div>
        </Card>

        {/* Resumen por cuenta */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
          {ACCOUNT_TYPES.map(({ value, label }) => {
            const amt = filtered.filter(t => t.accountType === value).reduce((s, t) => s + t.amount, 0)
            const a = ACCT[value]
            const accountBalance = summary.accountBalances[value] ?? 0
            return (
              <Card key={value}>
                <Chip tone={a.tone} style={{ marginBottom: 8 }}>{label}</Chip>
                <Money value={amt} style={{ fontSize: 18, display: 'block', marginTop: 6 }}/>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: accountBalance < 0 ? 'var(--fo-neg)' : 'var(--fo-fg-dim)' }}>
                  {accountBalance < 0 ? 'Exceso' : 'Queda'}: {formatCOP(Math.abs(accountBalance))}
                </p>
              </Card>
            )
          })}
        </div>

        {/* Filtros */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ ...sel, width: 'auto' }}>
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ ...sel, width: 'auto' }}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div style={{ flex: 1, minWidth: 140, position: 'relative' }}>
              <Ico d={ICONS.search} size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fo-fg-dim)' }}/>
              <input placeholder="Buscar gasto…" value={filter.search}
                onChange={e => setFilter({ ...filter, search: e.target.value })}
                style={{ ...sel, paddingLeft: 36 }}/>
            </div>
            <select value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })} style={{ ...sel, width: 'auto' }}>
              <option value="">Todas las categorías</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filter.accountType} onChange={e => setFilter({ ...filter, accountType: e.target.value })} style={{ ...sel, width: 'auto' }}>
              <option value="">Todas las cuentas</option>
              {ACCOUNT_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            {(filter.category || filter.accountType || filter.search) && (
              <Button variant="ghost" size="sm" onClick={() => setFilter({ category: '', accountType: '', search: '' })}>
                Limpiar
              </Button>
            )}
          </div>
        </Card>

        {/* Lista */}
        <Card padded={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--fo-line)' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{filtered.length} gastos</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fo-fg-dim)' }}>Total: <Money value={total} style={{ fontSize: 11 }}/></p>
            </div>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size="lg"/></div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--fo-fg-dim)' }}>
              <Ico d={ICONS.spend} size={32}/>
              <p style={{ margin: '10px 0 0', fontSize: 13 }}>Sin gastos para mostrar</p>
            </div>
          ) : filtered.map((t, i) => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 20px', gap: 12,
              borderBottom: i < filtered.length - 1 ? '1px solid var(--fo-line-soft)' : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: 'var(--fo-fg-dim)' }}>{t.date}</span>
                  <span style={{ color: 'var(--fo-line)' }}>·</span>
                  <span style={{ fontSize: 10, color: 'var(--fo-fg-dim)' }}>{t.category}</span>
                  <span style={{ color: 'var(--fo-line)' }}>·</span>
                  <Chip tone={ACCT[t.accountType]?.tone ?? 'default'} style={{ fontSize: 9, padding: '0 6px' }}>{ACCT[t.accountType]?.label ?? t.accountType}</Chip>
                </div>
              </div>
              <Money value={t.amount} style={{ fontSize: 14, flexShrink: 0, fontWeight: 700 }}/>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Button variant="icon" size="sm" onClick={() => openEdit(t)} title="Editar" style={{ width: 32, height: 32 }}>
                  <Ico d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={14}/>
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(t.id)} title="Eliminar" style={{ width: 32, height: 32 }}>
                  <Ico d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={14}/>
                </Button>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'var(--fo-surface-1)', border: '1px solid var(--fo-line)', borderRadius: 'var(--fo-r-xl)', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--fo-shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--fo-line)', position: 'sticky', top: 0, background: 'var(--fo-surface-1)' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{editing ? 'Editar gasto' : 'Nuevo gasto'}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fo-fg-dim)' }}>Completa los campos</p>
              </div>
              <Button variant="icon" size="sm" type="button" onClick={() => setShowForm(false)} style={{ width: 32, height: 32, borderRadius: 10 }}>
                <Ico d="M6 18L18 6M6 6l12 12" size={16}/>
              </Button>
            </div>
            <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 14
              }}>
                <div>
                  <span style={lbl}>Fecha</span>
                  <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={sel}/>
                </div>
                <div>
                  <span style={lbl}>Valor (COP)</span>
                  <Input prefix="$" type="number" min="0" required value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    onFocus={() => setForm(f => ({ ...f, amount: '' }))} placeholder="0"/>
                  {form.amount > 0 && <p style={{ fontSize: 11, color: 'var(--fo-pos)', marginTop: 4 }}>{formatCOP(parseFloat(form.amount)||0)}</p>}
                </div>
              </div>
              <Input label="Nombre del gasto" type="text" required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Mercado, Arriendo…"/>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 14
              }}>
                <div><span style={lbl}>Categoría</span><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={sel}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><span style={lbl}>Cuenta</span><select value={form.accountType} onChange={e => setForm({ ...form, accountType: e.target.value })} style={sel}>{ACCOUNT_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}</select></div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 14
              }}>
                <div><span style={lbl}>Tipo</span><select value={form.expenseType} onChange={e => setForm({ ...form, expenseType: e.target.value })} style={sel}>{EXPENSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div><span style={lbl}>Método de pago</span><select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} style={sel}>{PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
              </div>
              <Input label="Observaciones (opcional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas…"/>
              <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                <Button variant="ghost" full type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button full size="lg" type="submit" disabled={saving}>{saving ? <Spinner size="sm"/> : editing ? 'Actualizar' : 'Guardar gasto'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function BalanceLine({ label, value, tone, sign }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--fo-fg-dim)' }}>{label}</span>
      <span className="fo-num" style={{ fontSize: 13, fontWeight: 700, color: tone }}>
        {sign ? `${sign} ` : ''}{formatCOP(value)}
      </span>
    </div>
  )
}
