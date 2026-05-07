import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { getAllMonthlySummaries } from '../lib/firestore'
import { useFinance } from '../hooks/useFinance'
import { formatCOP, MONTHS } from '../utils/format'
import { Card, Chip, SectionHeader, Money, ProgressBar, Ico, ICONS } from '../components/fo'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Spinner from '../components/ui/Spinner'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--fo-surface-2)', border: '1px solid var(--fo-line)', borderRadius: 12, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--fo-fg)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: p.color, display: 'inline-block' }}/>
          <span style={{ color: 'var(--fo-fg-muted)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: 'var(--fo-fg)' }}>{formatCOP(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function HistorialPage() {
  const { user } = useAuth()
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const { transactions } = useFinance(selected?.month, selected?.year)

  useEffect(() => {
    getAllMonthlySummaries(user.uid).then(data => { setSummaries(data); setLoading(false) })
  }, [user])

  const chartData = [...summaries].reverse().map(s => ({
    name: `${MONTHS[s.month - 1].slice(0, 3)} ${String(s.year).slice(2)}`,
    Ingreso: s.income ?? 0, Gastado: s.totalSpent ?? 0, Ahorro: s.totalSaved ?? 0,
  }))

  const best = summaries.length > 0
    ? summaries.reduce((b, s) => ((s.savingsRate ?? 0) > (b.savingsRate ?? 0) ? s : b), summaries[0])
    : null

  return (
    <AppLayout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <SectionHeader overline="Análisis" title="Historial mensual" subtitle="Evolución de tus finanzas mes a mes."/>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size="lg"/></div>
        ) : summaries.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 56 }}>
            <Ico d={ICONS.hist} size={36} style={{ color: 'var(--fo-fg-dim)', margin: '0 auto 12px' }}/>
            <p style={{ fontWeight: 600, fontSize: 14 }}>Sin historial disponible</p>
            <p style={{ fontSize: 13, color: 'var(--fo-fg-dim)', marginTop: 4 }}>Registra ingresos y gastos para ver tu evolución.</p>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
              <Card style={{ textAlign: 'center' }}>
                <p className="fo-num" style={{ fontSize: 28, margin: 0 }}>{summaries.length}</p>
                <p style={{ fontSize: 11, color: 'var(--fo-fg-dim)', marginTop: 4 }}>Meses registrados</p>
              </Card>
              <Card style={{ textAlign: 'center' }}>
                <p className="fo-num" style={{ fontSize: 28, margin: 0, color: 'var(--fo-pos)' }}>
                  {Math.round(summaries.reduce((s, m) => s + (m.savingsRate ?? 0), 0) / summaries.length)}%
                </p>
                <p style={{ fontSize: 11, color: 'var(--fo-fg-dim)', marginTop: 4 }}>Ahorro promedio</p>
              </Card>
              <Card style={{ textAlign: 'center' }}>
                {best && <>
                  <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{MONTHS[best.month - 1]}</p>
                  <p style={{ fontSize: 12, color: 'var(--fo-pos)', fontWeight: 600 }}>{best.savingsRate ?? 0}% ahorro</p>
                  <p style={{ fontSize: 11, color: 'var(--fo-fg-dim)', marginTop: 2 }}>Mejor mes</p>
                </>}
              </Card>
            </div>

            {/* Chart */}
            {chartData.length > 1 && (
              <Card style={{ marginBottom: 16 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700 }}>Evolución financiera</p>
                <p style={{ margin: '0 0 18px', fontSize: 11, color: 'var(--fo-fg-dim)' }}>Ingreso, gasto y ahorro por mes</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="oklch(0.74 0.16 160)" stopOpacity={0.25}/><stop offset="95%" stopColor="oklch(0.74 0.16 160)" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="oklch(0.70 0.20 20)" stopOpacity={0.2}/><stop offset="95%" stopColor="oklch(0.70 0.20 20)" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="oklch(0.66 0.20 255)" stopOpacity={0.25}/><stop offset="95%" stopColor="oklch(0.66 0.20 255)" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--fo-line)"/>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--fo-fg-dim)' }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize: 10, fill: 'var(--fo-fg-dim)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000000).toFixed(1)}M`}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Area type="monotone" dataKey="Ingreso" stroke="oklch(0.74 0.16 160)" strokeWidth={2} fill="url(#gI)" dot={false}/>
                    <Area type="monotone" dataKey="Gastado" stroke="oklch(0.70 0.20 20)" strokeWidth={2} fill="url(#gG)" dot={false}/>
                    <Area type="monotone" dataKey="Ahorro"  stroke="oklch(0.66 0.20 255)" strokeWidth={2} fill="url(#gA)" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12 }}>
                  {[['oklch(0.74 0.16 160)','Ingreso'],['oklch(0.70 0.20 20)','Gastado'],['oklch(0.66 0.20 255)','Ahorro']].map(([c,l]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 12, height: 2, borderRadius: 999, background: c, display: 'inline-block' }}/>
                      <span style={{ fontSize: 11, color: 'var(--fo-fg-dim)' }}>{l}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Month rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {summaries.map(s => {
                const isOpen = selected?.id === s.id
                const savRate = s.savingsRate ?? 0
                const spendPct = Math.min(((s.totalSpent ?? 0) / (s.income || 1)) * 100, 100)
                return (
                  <Card key={s.id} padded={false} style={{ border: isOpen ? '1px solid var(--fo-accent-line)' : undefined, cursor: 'pointer' }}>
                    <div onClick={() => setSelected(isOpen ? null : s)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{MONTHS[s.month - 1]} {s.year}</p>
                          <Chip tone={savRate >= 20 ? 'pos' : savRate >= 10 ? 'accent' : 'warn'}>{savRate}% ahorro</Chip>
                        </div>
                        <ProgressBar value={spendPct} tone={spendPct > 90 ? 'neg' : spendPct > 70 ? 'warn' : 'pos'} height={4}/>
                      </div>
                      <div style={{ display: 'flex', gap: 20, flexShrink: 0 }} className="hist-stats">
                        <style>{`@media(max-width:640px){.hist-stats{display:none!important}}`}</style>
                        {[['Ingreso', s.income, 'var(--fo-pos)'], ['Gastado', s.totalSpent, 'var(--fo-neg)'], ['Ahorrado', s.totalSaved, 'var(--fo-accent-fg)']].map(([l, v, c]) => (
                          <div key={l} style={{ textAlign: 'right' }}>
                            <Money value={v ?? 0} style={{ fontSize: 13, color: c }}/>
                            <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--fo-fg-dim)' }}>{l}</p>
                          </div>
                        ))}
                      </div>
                      <Ico d="M19 9l-7 7-7-7" size={16} style={{ color: 'var(--fo-fg-dim)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}/>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--fo-line)', padding: '14px 20px' }}>
                        {transactions.length === 0 ? (
                          <p style={{ fontSize: 13, color: 'var(--fo-fg-dim)', textAlign: 'center', padding: '12px 0' }}>Sin transacciones registradas.</p>
                        ) : (
                          <>
                            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--fo-fg-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Transacciones · {transactions.length}</p>
                            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                              {transactions.map(t => (
                                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--fo-line-soft)' }}>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fo-fg-dim)' }}>{t.category} · {t.date}</p>
                                  </div>
                                  <Money value={t.amount} style={{ fontSize: 13, flexShrink: 0, marginLeft: 12 }}/>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
