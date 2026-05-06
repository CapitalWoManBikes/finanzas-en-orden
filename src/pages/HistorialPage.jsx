import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { getAllMonthlySummaries } from '../lib/firestore'
import { useFinance } from '../hooks/useFinance'
import { formatCOP, MONTHS } from '../utils/format'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import Spinner from '../components/ui/Spinner'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-700">{formatCOP(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function StatPill({ label, value, color = 'emerald' }) {
  const colorMap = {
    emerald: 'text-emerald-600',
    red: 'text-red-500',
    blue: 'text-blue-600',
  }
  return (
    <div className="text-right">
      <p className={`font-bold text-sm ${colorMap[color]}`}>{value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

export default function HistorialPage() {
  const { user } = useAuth()
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const { transactions } = useFinance(selected?.month, selected?.year)

  useEffect(() => {
    const load = async () => {
      const data = await getAllMonthlySummaries(user.uid)
      setSummaries(data)
      setLoading(false)
    }
    load()
  }, [user])

  const chartData = [...summaries].reverse().map((s) => ({
    name: `${MONTHS[s.month - 1].slice(0, 3)} ${String(s.year).slice(2)}`,
    Ingreso: s.income ?? 0,
    Gastado: s.totalSpent ?? 0,
    Ahorro: s.totalSaved ?? 0,
  }))

  const best = summaries.length > 0
    ? summaries.reduce((best, s) => ((s.savingsRate ?? 0) > (best.savingsRate ?? 0) ? s : best), summaries[0])
    : null

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Análisis</p>
          <h1 className="text-2xl font-bold text-slate-900">Historial mensual</h1>
          <p className="text-sm text-slate-500 mt-0.5">Evolución de tus finanzas mes a mes.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : summaries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-semibold text-slate-500">Sin historial disponible</p>
            <p className="text-sm mt-1">Registra ingresos y gastos para ver tu evolución.</p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            {summaries.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                  <p className="text-2xl font-black text-slate-900">{summaries.length}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Meses registrados</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                  <p className="text-2xl font-black text-emerald-600">
                    {Math.round(summaries.reduce((s, m) => s + (m.savingsRate ?? 0), 0) / summaries.length)}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Ahorro promedio</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                  {best && (
                    <>
                      <p className="text-sm font-black text-slate-900">{MONTHS[best.month - 1]}</p>
                      <p className="text-xs text-emerald-600 font-bold">{best.savingsRate ?? 0}% ahorro</p>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">Mejor mes</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Evolution chart */}
            {chartData.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="mb-5">
                  <p className="font-bold text-slate-800 text-sm">Evolución financiera</p>
                  <p className="text-xs text-slate-400 mt-0.5">Ingreso, gasto y ahorro por mes</p>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gIngreso" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gGastado" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gAhorro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Ingreso" stroke="#10b981" strokeWidth={2} fill="url(#gIngreso)" dot={false} />
                    <Area type="monotone" dataKey="Gastado" stroke="#ef4444" strokeWidth={2} fill="url(#gGastado)" dot={false} />
                    <Area type="monotone" dataKey="Ahorro" stroke="#3b82f6" strokeWidth={2} fill="url(#gAhorro)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex gap-5 justify-center mt-3">
                  {[
                    { color: '#10b981', label: 'Ingreso' },
                    { color: '#ef4444', label: 'Gastado' },
                    { color: '#3b82f6', label: 'Ahorro' },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: l.color }} />
                      <span className="text-xs text-slate-400 font-medium">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Month cards */}
            <div className="space-y-2.5">
              {summaries.map((s) => {
                const isOpen = selected?.id === s.id
                const savRate = s.savingsRate ?? 0
                return (
                  <div
                    key={s.id}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all cursor-pointer
                      ${isOpen ? 'border-emerald-200' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div
                      className="flex justify-between items-center px-5 py-4 gap-4"
                      onClick={() => setSelected(isOpen ? null : s)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1">
                          <p className="font-bold text-slate-900">{MONTHS[s.month - 1]} {s.year}</p>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold
                            ${savRate >= 20 ? 'bg-emerald-100 text-emerald-700' :
                              savRate >= 10 ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'}`}>
                            {savRate}% ahorro
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              (s.totalSpent / s.income) > 0.9 ? 'bg-red-400' :
                              (s.totalSpent / s.income) > 0.7 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min((s.totalSpent / (s.income || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-5 flex-shrink-0">
                        <StatPill label="Ingreso" value={formatCOP(s.income)} color="emerald" />
                        <StatPill label="Gastado" value={formatCOP(s.totalSpent)} color="red" />
                        <StatPill label="Ahorrado" value={formatCOP(s.totalSaved)} color="blue" />
                      </div>
                      <svg
                        className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {isOpen && (
                      <div className="border-t border-gray-100 px-5 py-4">
                        {transactions.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-4">Sin transacciones registradas.</p>
                        ) : (
                          <>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                              Transacciones · {transactions.length}
                            </p>
                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                              {transactions.map((t) => (
                                <div key={t.id} className="flex justify-between items-center py-1.5 gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-700 truncate">{t.name}</p>
                                    <p className="text-xs text-slate-400">{t.category} · {t.date}</p>
                                  </div>
                                  <p className="font-bold text-sm text-slate-800 flex-shrink-0">{formatCOP(t.amount)}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
