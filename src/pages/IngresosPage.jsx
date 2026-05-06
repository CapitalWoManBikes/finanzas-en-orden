import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { getMonthlyIncome, setMonthlyIncome, getAllMonthlyIncomes } from '../lib/firestore'
import { formatCOP, MONTHS, currentMonth, currentYear } from '../utils/format'
import Spinner from '../components/ui/Spinner'

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
    setTimeout(() => setSuccess(false), 2000)
    setSaving(false)
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Ingresos mensuales</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex gap-3 mb-5">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-28 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {loading ? <div className="flex justify-center py-6"><Spinner /></div> : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingreso mensual (COP)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.income}
                    onChange={(e) => setForm({ ...form, income: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-semibold"
                    placeholder="3000000"
                  />
                </div>
                {form.income && <p className="text-emerald-600 font-medium mt-1 text-sm">{formatCOP(parseFloat(form.income) || 0)}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                  placeholder="Salario, freelance, bonos..."
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Spinner size="sm" /> : success ? '✓ Guardado' : current ? 'Actualizar ingreso' : 'Guardar ingreso'}
              </button>
            </form>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-slate-700">Historial de ingresos</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {history.map((h) => (
                <div key={h.id} className="flex justify-between items-center px-5 py-3">
                  <div>
                    <p className="font-medium text-slate-700 text-sm">{MONTHS[h.month - 1]} {h.year}</p>
                    {h.notes && <p className="text-xs text-slate-400">{h.notes}</p>}
                  </div>
                  <p className="font-bold text-emerald-600">{formatCOP(h.income)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
