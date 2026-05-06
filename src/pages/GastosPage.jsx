import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import {
  getTransactions, addTransaction, updateTransaction, deleteTransaction,
} from '../lib/firestore'
import {
  formatCOP, MONTHS, CATEGORIES, ACCOUNT_TYPES, EXPENSE_TYPES, PAYMENT_METHODS,
  currentMonth, currentYear,
} from '../utils/format'
import Spinner from '../components/ui/Spinner'

const EMPTY = { date: new Date().toISOString().slice(0, 10), name: '', amount: '', category: 'Alimentación', accountType: 'dailySpending', expenseType: 'variable', paymentMethod: 'Efectivo', notes: '' }

export default function GastosPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonth())
  const [year, setYear] = useState(currentYear())
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [filter, setFilter] = useState({ category: '', accountType: '', search: '' })

  const load = async () => {
    setLoading(true)
    const data = await getTransactions(user.uid, month, year)
    setTxs(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [month, year])

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (tx) => { setEditing(tx.id); setForm({ ...tx }); setShowForm(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return
    setSaving(true)
    const txMonth = parseInt(form.date.slice(5, 7))
    const txYear = parseInt(form.date.slice(0, 4))
    const data = { ...form, amount: amt, month: txMonth, year: txYear }
    if (editing) {
      await updateTransaction(user.uid, editing, data)
    } else {
      await addTransaction(user.uid, data)
    }
    setShowForm(false)
    await load()
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await deleteTransaction(user.uid, id)
    await load()
  }

  const filtered = txs.filter((t) => {
    if (filter.category && t.category !== filter.category) return false
    if (filter.accountType && t.accountType !== filter.accountType) return false
    if (filter.search && !t.name.toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  })

  const total = filtered.reduce((s, t) => s + t.amount, 0)

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Gastos</h1>
          <button onClick={openNew} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition text-sm">
            + Nuevo gasto
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-wrap gap-3">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <input
            type="text"
            placeholder="Buscar gasto..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1 min-w-32"
          />
          <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={filter.accountType} onChange={(e) => setFilter({ ...filter, accountType: e.target.value })} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Todas las cuentas</option>
            {ACCOUNT_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {ACCOUNT_TYPES.map(({ value, label }) => {
            const amt = filtered.filter((t) => t.accountType === value).reduce((s, t) => s + t.amount, 0)
            return (
              <div key={value} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="font-bold text-slate-700">{formatCOP(amt)}</p>
              </div>
            )
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-slate-700">{filtered.length} gastos · Total: <span className="text-emerald-600">{formatCOP(total)}</span></h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">Sin gastos para mostrar.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-slate-700 text-sm truncate">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.date} · {t.category} · {ACCOUNT_TYPES.find(a => a.value === t.accountType)?.label}</p>
                  </div>
                  <p className="font-bold text-slate-800 mr-4 text-sm whitespace-nowrap">{formatCOP(t.amount)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(t)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Editar</button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-slate-800">{editing ? 'Editar gasto' : 'Nuevo gasto'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valor (COP)</label>
                  <input type="number" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del gasto</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ej: Arriendo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cuenta</label>
                  <select value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {ACCOUNT_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.expenseType} onChange={(e) => setForm({ ...form, expenseType: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {EXPENSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Método de pago</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Spinner size="sm" /> : editing ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
