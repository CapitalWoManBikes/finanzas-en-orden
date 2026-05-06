import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { getAllMonthlySummaries } from '../lib/firestore'
import { useFinance } from '../hooks/useFinance'
import { formatCOP, MONTHS } from '../utils/format'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import Spinner from '../components/ui/Spinner'

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
    name: `${MONTHS[s.month - 1].slice(0, 3)} ${s.year}`,
    Ingreso: s.income ?? 0,
    Gastado: s.totalSpent ?? 0,
    Ahorro: s.totalSaved ?? 0,
  }))

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Historial mensual</h1>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📅</p>
            <p>Aún no hay historial disponible.</p>
          </div>
        ) : (
          <>
            {/* Evolution chart */}
            {chartData.length > 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                <h3 className="font-semibold text-slate-700 mb-4">Evolución financiera</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v) => formatCOP(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="Ingreso" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Gastado" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Ahorro" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Summary cards */}
            <div className="space-y-3">
              {summaries.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelected(selected?.id === s.id ? null : s)}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:border-emerald-300 transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{MONTHS[s.month - 1]} {s.year}</p>
                      <p className="text-xs text-slate-400">
                        Ahorro: <span className="text-emerald-600 font-medium">{s.savingsRate ?? 0}%</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Ingreso: <span className="font-semibold text-slate-700">{formatCOP(s.income)}</span></p>
                      <p className="text-sm text-slate-400">Gastado: <span className="font-semibold text-red-500">{formatCOP(s.totalSpent)}</span></p>
                      <p className="text-sm text-slate-400">Ahorrado: <span className="font-semibold text-emerald-600">{formatCOP(s.totalSaved)}</span></p>
                    </div>
                  </div>
                  {selected?.id === s.id && transactions.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold text-slate-500 mb-2">TRANSACCIONES</p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {transactions.map((t) => (
                          <div key={t.id} className="flex justify-between text-sm">
                            <span className="text-slate-600">{t.name}</span>
                            <span className="font-medium">{formatCOP(t.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
