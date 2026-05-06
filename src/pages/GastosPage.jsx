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

const EMPTY = {
  date: new Date().toISOString().slice(0, 10),
  name: '', amount: '', category: 'Alimentación',
  accountType: 'dailySpending', expenseType: 'variable',
  paymentMethod: 'Efectivo', notes: '',
}

const ACCOUNT_META = {
  fixedExpenses: { label: 'Gastos fijos', badge: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200', dot: 'bg-blue-500' },
  savings: { label: 'Ahorro', badge: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200', dot: 'bg-violet-500' },
  dailySpending: { label: 'Gasto diario', badge: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200', dot: 'bg-amber-500' },
}

function AccountBadge({ type }) {
  const m = ACCOUNT_META[type] ?? { label: type, badge: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.badge}`}>{m.label}</span>
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5'

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
    if (editing) await updateTransaction(user.uid, editing, data)
    else await addTransaction(user.uid, data)
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
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Registro</p>
            <h1 className="text-2xl font-bold text-slate-900">Gastos</h1>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition text-sm shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo gasto
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {ACCOUNT_TYPES.map(({ value, label }) => {
            const amt = filtered.filter((t) => t.accountType === value).reduce((s, t) => s + t.amount, 0)
            const meta = ACCOUNT_META[value]
            return (
              <div key={value} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                </div>
                <p className="font-bold text-slate-800 text-base">{formatCOP(amt)}</p>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-2.5 items-center">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
            >
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="relative flex-1 min-w-36">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar gasto..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
            >
              <option value="">Todas las categorías</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select
              value={filter.accountType}
              onChange={(e) => setFilter({ ...filter, accountType: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
            >
              <option value="">Todas las cuentas</option>
              {ACCOUNT_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
            <div>
              <p className="font-bold text-slate-800 text-sm">{filtered.length} gastos</p>
              <p className="text-xs text-slate-400">Total: <span className="font-semibold text-slate-700">{formatCOP(total)}</span></p>
            </div>
            {(filter.category || filter.accountType || filter.search) && (
              <button
                onClick={() => setFilter({ category: '', accountType: '', search: '' })}
                className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Limpiar filtros
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <svg className="w-10 h-10 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-sm font-medium">Sin gastos para mostrar</p>
            </div>
          ) : (
            <div>
              {filtered.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between px-5 py-3.5 gap-3 hover:bg-gray-50/60 transition ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-semibold text-slate-800 text-sm truncate">{t.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-xs text-slate-400">{t.date}</p>
                      <span className="text-slate-200 text-xs">·</span>
                      <p className="text-xs text-slate-400">{t.category}</p>
                      <span className="text-slate-200 text-xs">·</span>
                      <AccountBadge type={t.accountType} />
                    </div>
                  </div>
                  <p className="font-bold text-slate-900 text-sm whitespace-nowrap">{formatCOP(t.amount)}</p>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(t)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-900">{editing ? 'Editar gasto' : 'Nuevo gasto'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Completa los campos del gasto</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Fecha</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Valor (COP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                    <input type="number" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className={`${inputCls} pl-6`} placeholder="0" />
                  </div>
                  {form.amount > 0 && <p className="text-xs text-emerald-600 font-medium mt-1">{formatCOP(parseFloat(form.amount) || 0)}</p>}
                </div>
              </div>

              <div>
                <label className={labelCls}>Nombre del gasto</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls} placeholder="Ej: Arriendo, Mercado..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Categoría</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Cuenta</label>
                  <select value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })} className={inputCls}>
                    {ACCOUNT_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tipo de gasto</label>
                  <select value={form.expenseType} onChange={(e) => setForm({ ...form, expenseType: e.target.value })} className={inputCls}>
                    {EXPENSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Método de pago</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className={inputCls}>
                    {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Observaciones <span className="text-slate-400 font-normal">(opcional)</span></label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className={`${inputCls} resize-none`} placeholder="Notas adicionales..." />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2 transition">
                  {saving ? <Spinner size="sm" /> : editing ? 'Actualizar' : 'Guardar gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
