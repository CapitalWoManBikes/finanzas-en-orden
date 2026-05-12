import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { getMonthlyIncome, setMonthlyIncome, getAllMonthlyIncomes } from '../lib/firestore'
import { formatCOP, MONTHS, currentMonth, currentYear } from '../utils/format'
import { Card, Button, Input, SectionHeader, Money, Chip } from '../components/fo'
import Spinner from '../components/ui/Spinner'

const sel = { background: 'var(--fo-surface-2)', border: '1px solid var(--fo-line)', borderRadius: 'var(--fo-r-md)', padding: '10px 14px', fontSize: 14, color: 'var(--fo-fg)', fontFamily: 'inherit', outline: 'none' }

export default function IngresosPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonth())
  const [year, setYear]   = useState(currentYear())
  const [form, setForm]   = useState({ income: '', notes: '' })
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [inc, all] = await Promise.all([getMonthlyIncome(user.uid, month, year), getAllMonthlyIncomes(user.uid)])
      setCurrent(inc); setForm({ income: inc?.income ?? '', notes: inc?.notes ?? }); setHistory(all)
    } catch (e) {
      console.error("Error loading income", e);
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [month, year])

  const handleSave = async (e) => {
    e.preventDefault()
    const val = parseFloat(form.income)
    if (!val || val <= 0) return
    setSaving(true)
    await setMonthlyIncome(user.uid, month, year, { income: val, notes: form.notes })
    await load(); setSuccess(true); setTimeout(() => setSuccess(false), 2500); setSaving(false)
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <SectionHeader overline="Finanzas" title="Ingresos mensuales" subtitle="Registra tu ingreso para llevar un control preciso."/>

        <Card style={{ marginBottom: 16 }}>
          {/* Selector de período */}
          <div style={{ padding: '14px 0 18px', borderBottom: '1px solid var(--fo-line)', marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: 'var(--fo-fg-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Seleccionar período</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ ...sel, flex: 1 }}>
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ ...sel, width: 110 }}>
                {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner/></div> : (
            <>
              {current && (
                <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 'var(--fo-r-md)', background: 'var(--fo-pos-soft)', border: '1px solid var(--fo-pos)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-pos)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ingreso registrado</p>
                    <Money value={current.income} style={{ fontSize: 22, display: 'block', marginTop: 4, color: 'var(--fo-pos)' }}/>
                  </div>
                  <Chip tone="pos">✓ Activo</Chip>
                </div>
              )}
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input label="Ingreso mensual (COP)" prefix="$" type="number" min="0" required
                  value={form.income} onChange={e => setForm({ ...form, income: e.target.value })}
                  onFocus={() => setForm(f => ({ ...f, income: '' }))} placeholder="3,000,000"/>
                {form.income && <p style={{ fontSize: 12, color: 'var(--fo-pos)', marginTop: -8 }}>{formatCOP(parseFloat(form.income)||0)}</p>}
                <Input label="Observaciones (opcional)" value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Salario, freelance, bonos…"/>
                <Button type="submit" full size="lg" disabled={saving}
                  variant={success ? 'success' : 'primary'}>
                  {saving ? <Spinner size="sm"/> : success ? '✓ Guardado exitosamente' : current ? 'Actualizar ingreso' : 'Guardar ingreso'}
                </Button>
              </form>
            </>
          )}
        </Card>

        {history.length > 0 && (
          <Card padded={false}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--fo-line)' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>Historial de ingresos</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fo-fg-dim)' }}>{history.length} meses registrados</p>
            </div>
            {history.map((h, i) => {
              const isCurrent = h.month === month && h.year === year
              return (
                <div key={h.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '13px 20px', gap: 12,
                  borderBottom: i < history.length - 1 ? '1px solid var(--fo-line-soft)' : 'none',
                  background: isCurrent ? 'var(--fo-pos-soft)' : 'transparent',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{MONTHS[h.month - 1]} {h.year}</p>
                      {isCurrent && <Chip tone="pos">Actual</Chip>}
                    </div>
                    {h.notes && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fo-fg-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{h.notes}</p>}
                  </div>
                  <Money value={h.income} style={{ fontSize: 14, color: 'var(--fo-pos)' }}/>
                </div>
              )
            })}
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
