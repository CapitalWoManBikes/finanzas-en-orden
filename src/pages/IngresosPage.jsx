import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { addIncomeEntry, deleteIncomeEntry, getIncomeEntries, getMonthlyIncome } from '../lib/firestore'
import { formatCOP, MONTHS, currentMonth, currentYear } from '../utils/format'
import { Card, Button, Input, SectionHeader, Money, Chip } from '../components/fo'
import Spinner from '../components/ui/Spinner'

const today = () => new Date().toISOString().slice(0, 10)
const emptyForm = () => ({ date: today(), amount: '', source: '', status: 'confirmed', notes: '' })
const sel = { background: 'var(--fo-surface-2)', border: '1px solid var(--fo-line)', borderRadius: 'var(--fo-r-md)', padding: '10px 14px', fontSize: 14, color: 'var(--fo-fg)', fontFamily: 'inherit', outline: 'none' }

export default function IngresosPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonth())
  const [year, setYear] = useState(currentYear())
  const [legacyIncome, setLegacyIncome] = useState(null)
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [legacy, data] = await Promise.all([
        getMonthlyIncome(user.uid, month, year),
        getIncomeEntries(user.uid, month, year),
      ])
      setLegacyIncome(legacy)
      setEntries(data)
    } catch (e) {
      console.error('Error loading income entries', e)
    } finally {
      setLoading(false)
    }
  }, [user, month, year])

  useEffect(() => { load() }, [load])

  const confirmedTotal = entries
    .filter((entry) => (entry.status ?? 'confirmed') === 'confirmed')
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)
  const expectedTotal = entries
    .filter((entry) => entry.status === 'expected')
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)
  const activeConfirmed = entries.length > 0 ? confirmedTotal : legacyIncome?.income ?? 0

  const handleSave = async (e) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0 || !form.date) return
    setSaving(true)
    const entryDate = new Date(`${form.date}T00:00:00`)
    const entryMonth = entryDate.getMonth() + 1
    const entryYear = entryDate.getFullYear()
    await addIncomeEntry(user.uid, {
      date: form.date,
      month: entryMonth,
      year: entryYear,
      amount,
      source: form.source || 'Ingreso',
      status: form.status,
      notes: form.notes,
    })
    setForm(emptyForm())
    await load()
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este ingreso?')) return
    await deleteIncomeEntry(user.uid, id)
    await load()
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <SectionHeader overline="Finanzas" title="Ingresos" subtitle="Registra dinero recibido o ingresos esperados por fecha."/>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ padding: '14px 0 18px', borderBottom: '1px solid var(--fo-line)', marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: 'var(--fo-fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Periodo</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ ...sel, flex: 1 }}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ ...sel, width: 110 }}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }} className="income-summary">
            <style>{`@media(max-width:640px){.income-summary{grid-template-columns:1fr!important}}`}</style>
            <Summary label="Confirmado" value={activeConfirmed} tone="var(--fo-pos)" />
            <Summary label="Esperado" value={expectedTotal} tone="var(--fo-accent-fg)" />
            <Summary label="Proyectado" value={activeConfirmed + expectedTotal} tone="var(--fo-fg)" />
          </div>

          <form onSubmit={handleSave} style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="income-form-row">
              <style>{`@media(max-width:640px){.income-form-row{grid-template-columns:1fr!important}}`}</style>
              <div>
                <span style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--fo-fg-muted)' }}>Fecha</span>
                <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ ...sel, width: '100%' }}/>
              </div>
              <Input label="Valor (COP)" prefix="$" type="number" min="0" required
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="500,000"/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="income-form-row">
              <Input label="Origen" value={form.source}
                onChange={e => setForm({ ...form, source: e.target.value })}
                placeholder="Venta, salario, extra..."/>
              <div>
                <span style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--fo-fg-muted)' }}>Estado</span>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...sel, width: '100%' }}>
                  <option value="confirmed">Confirmado</option>
                  <option value="expected">Esperado</option>
                </select>
              </div>
            </div>
            <Input label="Notas (opcional)" value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Cliente, pago parcial, detalle..."/>
            <Button type="submit" full size="lg" disabled={saving}>
              {saving ? <Spinner size="sm"/> : 'Registrar ingreso'}
            </Button>
          </form>
        </Card>

        <Card padded={false}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--fo-line)' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>Ingresos del periodo</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fo-fg-dim)' }}>El presupuesto principal usa solo ingresos confirmados.</p>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner/></div>
          ) : entries.length === 0 ? (
            <div style={{ padding: 24, color: 'var(--fo-fg-dim)', fontSize: 13 }}>
              No hay ingresos variables registrados para este periodo.
              {legacyIncome?.income > 0 && <p style={{ margin: '8px 0 0' }}>Se sigue usando tu ingreso mensual anterior: {formatCOP(legacyIncome.income)}.</p>}
            </div>
          ) : entries.map((entry, i) => (
            <div key={entry.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '13px 20px', gap: 12,
              borderBottom: i < entries.length - 1 ? '1px solid var(--fo-line-soft)' : 'none',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>{entry.source || 'Ingreso'}</p>
                  <Chip tone={(entry.status ?? 'confirmed') === 'confirmed' ? 'pos' : 'accent'}>
                    {(entry.status ?? 'confirmed') === 'confirmed' ? 'Confirmado' : 'Esperado'}
                  </Chip>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--fo-fg-dim)' }}>{entry.date}{entry.notes ? ` · ${entry.notes}` : ''}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Money value={entry.amount} style={{ fontSize: 14, color: (entry.status ?? 'confirmed') === 'confirmed' ? 'var(--fo-pos)' : 'var(--fo-accent-fg)' }}/>
                <button onClick={() => handleDelete(entry.id)} style={{ background: 'none', border: 'none', color: 'var(--fo-neg)', cursor: 'pointer', fontSize: 12 }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </AppLayout>
  )
}

function Summary({ label, value, tone }) {
  return (
    <div style={{ background: 'var(--fo-surface-2)', border: '1px solid var(--fo-line)', borderRadius: 'var(--fo-r-md)', padding: 12 }}>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-fg-dim)', fontWeight: 700 }}>{label}</p>
      <Money value={value} style={{ display: 'block', marginTop: 4, fontSize: 16, color: tone }}/>
    </div>
  )
}
