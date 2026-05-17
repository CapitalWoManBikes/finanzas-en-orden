import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { getDefaultExpenses, addDefaultExpense, updateDefaultExpense, deleteDefaultExpense } from '../lib/firestore'
import { formatCOP, CATEGORIES, ACCOUNT_TYPES, EXPENSE_TYPES } from '../utils/format'
import { Card, Button, Input, Chip, SectionHeader, Money, Ico, ICONS } from '../components/fo'
import Spinner from '../components/ui/Spinner'

const EMPTY = { name: '', amount: '', category: 'Otros', accountType: 'dailySpending', expenseType: 'variable', isActive: true, isRecurring: true }

const ACCT = {
  fixedExpenses: { tone: 'accent', label: 'Gastos fijos' },
  savings:       { tone: 'pos',    label: 'Ahorro' },
  dailySpending: { tone: 'warn',   label: 'Gasto diario' },
}

const sel = { background: 'var(--fo-surface-2)', border: '1px solid var(--fo-line)', borderRadius: 'var(--fo-r-md)', padding: '10px 14px', fontSize: 14, color: 'var(--fo-fg)', fontFamily: 'inherit', outline: 'none', width: '100%' }
const lbl = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--fo-fg-muted)' }

export default function GastosBasePage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setExpenses(await getDefaultExpenses(user.uid))
    setLoading(false)
  }, [user])
  useEffect(() => { load() }, [load])

  const openNew  = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (exp) => { setEditing(exp.id); setForm({ ...exp, amount: String(exp.amount) }); setShowForm(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    const data = { ...form, amount: parseFloat(form.amount) || 0 }
    if (editing) await updateDefaultExpense(user.uid, editing, data)
    else await addDefaultExpense(user.uid, data)
    setShowForm(false); await load(); setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este gasto base?')) return
    await deleteDefaultExpense(user.uid, id); await load()
  }

  const handleToggle = async (exp) => {
    await updateDefaultExpense(user.uid, exp.id, { isActive: !exp.isActive }); await load()
  }

  const active = expenses.filter(e => e.isActive)
  const total  = active.reduce((s, e) => s + (e.amount || 0), 0)

  const grouped = ACCOUNT_TYPES.reduce((acc, { value }) => {
    acc[value] = expenses.filter(e => e.accountType === value); return acc
  }, {})

  return (
    <AppLayout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <SectionHeader overline="Configuración" title="Gastos base"
          subtitle={<>Total activos: <Money value={total} style={{ fontSize: 13, color: 'var(--fo-pos)' }}/></>}
          action={<Button onClick={openNew} icon={<Ico d={ICONS.plus} size={14}/>}>Nuevo gasto</Button>}
        />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size="lg"/></div>
        ) : expenses.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 48 }}>
            <Ico d={ICONS.base} size={36} style={{ color: 'var(--fo-fg-dim)', margin: '0 auto 12px' }}/>
            <p style={{ fontSize: 13, color: 'var(--fo-fg-dim)', marginBottom: 12 }}>No tienes gastos base configurados</p>
            <Button variant="soft" onClick={openNew}>Agregar primer gasto base</Button>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ACCOUNT_TYPES.map(({ value, label }) => {
              const items = grouped[value]
              if (!items?.length) return null
              const a = ACCT[value]
              const subtotal = items.filter(e => e.isActive).reduce((s, e) => s + (e.amount || 0), 0)
              return (
                <Card key={value} padded={false}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--fo-line)', background: 'var(--fo-surface-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Chip tone={a.tone}>{label}</Chip>
                      <span style={{ fontSize: 11, color: 'var(--fo-fg-dim)' }}>{items.length} gastos</span>
                    </div>
                    <Money value={subtotal} style={{ fontSize: 13 }}/>
                  </div>
                  {items.map((exp, i) => (
                    <div key={exp.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                      borderBottom: i < items.length - 1 ? '1px solid var(--fo-line-soft)' : 'none',
                      opacity: exp.isActive ? 1 : 0.4,
                    }}>
                      <button onClick={() => handleToggle(exp)} style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0, cursor: 'pointer', border: 'none',
                        background: exp.isActive ? 'var(--fo-accent)' : 'var(--fo-surface-3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {exp.isActive && <Ico d="M5 13l4 4L19 7" size={11} style={{ color: '#fff' }}/>}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{exp.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fo-fg-dim)' }}>{exp.category}</p>
                      </div>
                      <Money value={exp.amount} style={{ fontSize: 13 }}/>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Button variant="icon" size="sm" onClick={() => openEdit(exp)} title="Editar">
                          <Ico d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={13}/>
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(exp.id)} title="Eliminar">
                          <Ico d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={13}/>
                        </Button>
                      </div>
                    </div>
                  ))}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'var(--fo-surface-1)', border: '1px solid var(--fo-line)', borderRadius: 'var(--fo-r-xl)', width: '100%', maxWidth: 460, boxShadow: 'var(--fo-shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--fo-line)' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{editing ? 'Editar gasto base' : 'Nuevo gasto base'}</p>
              <Button variant="icon" size="sm" type="button" onClick={() => setShowForm(false)} style={{ width: 32, height: 32, borderRadius: 10 }}>
                <Ico d="M6 18L18 6M6 6l12 12" size={16}/>
              </Button>
            </div>
            <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Nombre del gasto" type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Arriendo, Netflix…"/>
              <div>
                <Input label="Valor mensual (COP)" prefix="$" type="number" min="0" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  onFocus={() => setForm(f => ({ ...f, amount: '' }))} placeholder="0"/>
                {form.amount > 0 && <p style={{ fontSize: 11, color: 'var(--fo-pos)', marginTop: 4 }}>{formatCOP(parseFloat(form.amount)||0)}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><span style={lbl}>Categoría</span><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={sel}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><span style={lbl}>Cuenta</span><select value={form.accountType} onChange={e => setForm({ ...form, accountType: e.target.value })} style={sel}>{ACCOUNT_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}</select></div>
              </div>
              <div><span style={lbl}>Tipo de gasto</span><select value={form.expenseType} onChange={e => setForm({ ...form, expenseType: e.target.value })} style={sel}>{EXPENSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--fo-r-md)',
                border: '1px solid var(--fo-line)', background: 'var(--fo-surface-2)', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: form.isActive ? 'var(--fo-accent)' : 'var(--fo-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {form.isActive && <Ico d="M5 13l4 4L19 7" size={11} style={{ color: '#fff' }}/>}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--fo-fg)' }}>Gasto activo</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-fg-dim)' }}>Se incluye en el presupuesto mensual</p>
                </div>
              </button>
              <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                <Button variant="ghost" full type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button full size="lg" type="submit" disabled={saving}>{saving ? <Spinner size="sm"/> : 'Guardar'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
