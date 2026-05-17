import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { updateUser } from '../lib/firestore'
import { Card, Button, SectionHeader, Chip } from '../components/fo'
import Spinner from '../components/ui/Spinner'
import { getNextPaymentDate, getDaysUntilPayment, formatNextPaymentDate } from '../utils/dailyBudget'

const sel = { background: 'var(--fo-surface-2)', border: '1px solid var(--fo-line)', borderRadius: 'var(--fo-r-md)', padding: '10px 14px', fontSize: 14, color: 'var(--fo-fg)', fontFamily: 'inherit', outline: 'none', width: '100%' }
const lbl = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: 'var(--fo-fg-muted)' }
const DAYS = Array.from({ length: 28 }, (_, i) => i + 1)

export default function ConfiguracionPage() {
  const { user, userData, refreshUserData } = useAuth()
  const saved = userData?.paymentConfig ?? {}

  const [mode, setMode]               = useState(saved.mode ?? 'monthly')
  const [payDay, setPayDay]           = useState(saved.payDay ?? 1)
  const [firstQuincena, setFirst]     = useState(saved.firstQuincena ?? 1)
  const [secondQuincena, setSecond]   = useState(saved.secondQuincena ?? 16)
  const [biweeklyPct, setBiweeklyPct] = useState(saved.biweeklyPct ?? 50)
  const [saving, setSaving]           = useState(false)
  const [success, setSuccess]         = useState(false)

  const currentConfig = { mode, payDay, firstQuincena, secondQuincena, biweeklyPct }
  const daysLeft  = getDaysUntilPayment(currentConfig)
  const nextDate  = formatNextPaymentDate(currentConfig)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await updateUser(user.uid, { paymentConfig: currentConfig })
    await refreshUserData()
    setSuccess(true); setTimeout(() => setSuccess(false), 2500); setSaving(false)
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <SectionHeader overline="Configuración" title="Modalidad de pago" subtitle="Define cuándo recibes tu ingreso para calcular el presupuesto diario."/>

        {/* Preview */}
        <div style={{ marginBottom: 16, padding: '16px 20px', borderRadius: 'var(--fo-r-lg)', background: 'var(--fo-accent-soft)', border: '1px solid var(--fo-accent-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-accent-fg)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Próximo pago</p>
            <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: 'var(--fo-accent-fg)' }}>{nextDate}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-accent-fg)' }}>Días restantes</p>
            <p className="fo-num" style={{ margin: '2px 0 0', fontSize: 28, color: 'var(--fo-accent-fg)' }}>{daysLeft}</p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <span style={lbl}>Modalidad de pago</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['monthly','Mensual'],['biweekly','Quincenal']].map(([m, l]) => (
                  <Button key={m} type="button" full
                    variant={mode === m ? 'primary' : 'soft'}
                    onClick={() => setMode(m)}>
                    {l}
                  </Button>
                ))}
              </div>
            </div>

            {mode === 'monthly' && (
              <div>
                <span style={lbl}>Día de pago mensual</span>
                <select value={payDay} onChange={e => setPayDay(Number(e.target.value))} style={sel}>
                  {DAYS.map(d => <option key={d} value={d}>Día {d}</option>)}
                </select>
                <p style={{ fontSize: 11, color: 'var(--fo-fg-dim)', marginTop: 6 }}>Ej: si te pagan el 30, selecciona día 30.</p>
              </div>
            )}

            {mode === 'biweekly' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <span style={lbl}>1.ª quincena (día)</span>
                    <select value={firstQuincena} onChange={e => setFirst(Number(e.target.value))} style={sel}>
                      {DAYS.slice(0, 15).map(d => <option key={d} value={d}>Día {d}</option>)}
                    </select>
                  </div>
                  <div>
                    <span style={lbl}>2.ª quincena (día)</span>
                    <select value={secondQuincena} onChange={e => setSecond(Number(e.target.value))} style={sel}>
                      {DAYS.slice(14).map(d => <option key={d} value={d}>Día {d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <span style={lbl}>% del ingreso en la 1.ª quincena — {biweeklyPct}%</span>
                  <input type="range" min="10" max="90" step="5" value={biweeklyPct}
                    onChange={e => setBiweeklyPct(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--fo-accent)' }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--fo-fg-dim)' }}>1.ª: {biweeklyPct}%</span>
                    <span style={{ fontSize: 11, color: 'var(--fo-fg-dim)' }}>2.ª: {100 - biweeklyPct}%</span>
                  </div>
                </div>
              </>
            )}

            <Button type="submit" full size="lg" disabled={saving}
              variant={success ? 'success' : 'primary'}>
              {saving ? <Spinner size="sm"/> : success ? '✓ Guardado' : 'Guardar configuración'}
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  )
}
