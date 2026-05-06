import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { getMonthlyIncome, setMonthlyIncome, getAllMonthlyIncomes } from '../lib/firestore'
import { formatCOP, MONTHS, currentMonth, currentYear } from '../utils/format'
import Spinner from '../components/ui/Spinner'

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition bg-white'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5'

export default function IngresosPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonth())
  const [year, setYear] = useState(currentYear())
  const [form, setForm] = useState({ income: '', notes: '' })
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const load = async () => {
    setLoading(true)
    const [inc, all] = await Promise.all([
      getMonthlyIncome(user.uid, month, year),
      getAllMonthlyIncomes(user.uid),
    ])
    setCurrent(inc)
    setForm({ income: inc?.income ?? '', notes: inc?.notes ?? '' })
    setHistory(all)
    setLoading(false)
  }

  useEffect(() => { load() }, [month, year])

  const handleSave = async (e) => {
    e.preventDefault()
    const val = parseFloat(form.income)
    if (!val || val <= 0) return
    setSaving(true)
    await setMonthlyIncome(user.uid, month, year, { income: val, notes: form.notes })
    await load()
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
    setSaving(false)
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Finanzas</p>
          <h1 className="text-2xl font-bold text-slate-900">Ingresos mensuales</h1>
          <p className="text-sm text-slate-500 mt-0.5">Registra tu ingreso para llevar un control preciso.</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Period selector */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <p className="text-xs font-semibold text-slate-500 mb-3">Seleccionar período</p>
            <div className="flex gap-2.5">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white font-medium text-slate-700"
              >
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-28 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white font-medium text-slate-700"
              >
                {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Form */}
          <div className="p-5">
            {loading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : (
              <>
                {current && (
                  <div className="mb-5 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Ingreso registrado</p>
                      <p className="text-xl font-bold text-emerald-700 mt-0.5">{formatCOP(current.income)}</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className={labelCls}>Ingreso mensual (COP)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.income}
                        onChange={(e) => setForm({ ...form, income: e.target.value })}
                        className={`${inputCls} pl-8 text-lg font-bold`}
                        placeholder="3,000,000"
                      />
                    </div>
                    {form.income && (
                      <p className="text-emerald-600 font-semibold mt-1.5 text-sm">
                        {formatCOP(parseFloat(form.income) || 0)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Observaciones <span className="text-slate-400 font-normal">(opcional)</span></label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={2}
                      className={`${inputCls} resize-none`}
                      placeholder="Salario, freelance, bonos..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition
                      ${success
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                      } disabled:opacity-50`}
                  >
                    {saving ? (
                      <Spinner size="sm" />
                    ) : success ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Guardado exitosamente
                      </>
                    ) : (
                      current ? 'Actualizar ingreso' : 'Guardar ingreso'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="font-bold text-slate-800 text-sm">Historial de ingresos</p>
              <p className="text-xs text-slate-400 mt-0.5">{history.length} meses registrados</p>
            </div>
            <div>
              {history.map((h, i) => {
                const isCurrent = h.month === month && h.year === year
                return (
                  <div
                    key={h.id}
                    className={`flex justify-between items-center px-5 py-3.5 gap-3 transition
                      ${i < history.length - 1 ? 'border-b border-gray-50' : ''}
                      ${isCurrent ? 'bg-emerald-50/60' : 'hover:bg-gray-50/60'}
                    `}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 text-sm">{MONTHS[h.month - 1]} {h.year}</p>
                        {isCurrent && (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            Actual
                          </span>
                        )}
                      </div>
                      {h.notes && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-48">{h.notes}</p>}
                    </div>
                    <p className="font-bold text-emerald-600 text-sm whitespace-nowrap">{formatCOP(h.income)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
