import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { getDefaultExpenses, addDefaultExpense, updateDefaultExpense, deleteDefaultExpense } from '../lib/firestore'
import { formatCOP, CATEGORIES, ACCOUNT_TYPES, EXPENSE_TYPES } from '../utils/format'
import Spinner from '../components/ui/Spinner'

const EMPTY = { name: '', amount: '', category: 'Otros', accountType: 'dailySpending', expenseType: 'variable', isActive: true, isRecurring: true }

const ACCOUNT_META = {
  fixedExpenses: { label: 'Gastos fijos', dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  savings: { label: 'Ahorro', dot: 'bg-violet-400', badge: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200' },
  dailySpending: { label: 'Gasto diario', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition bg-white'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5'

export default function GastosBasePage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const load = async () => {
    setLoading(true)
    const data = await getDefaultExpenses(user.uid)
    setExpenses(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (exp) => { setEditing(exp.id); setForm({ ...exp, amount: String(exp.amount) }); setShowForm(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    const data = { ...form, amount: parseFloat(form.amount) || 0 }
    if (editing) await updateDefaultExpense(user.uid, editing, data)
    else await addDefaultExpense(user.uid, data)
    setShowForm(false)
    await load()
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este gasto base?')) return
    await deleteDefaultExpense(user.uid, id)
    await load()
  }

  const handleToggle = async (exp) => {
    await updateDefaultExpense(user.uid, exp.id, { isActive: !exp.isActive })
    await load()
  }

  const active = expenses.filter((e) => e.isActive)
  const total = active.reduce((s, e) => s + (e.amount || 0), 0)

  const grouped = ACCOUNT_TYPES.reduce((acc, { value }) => {
    acc[value] = expenses.filter((e) => e.accountType === value)
    return acc
  }, {})

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Configuración</p>
            <h1 className="text-2xl font-bold text-slate-900">Gastos base</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Total activos: <span className="font-bold text-emerald-600">{formatCOP(total)}</span>
            </p>
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

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : expenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">No tienes gastos base configurados</p>
            <button onClick={openNew} className="mt-3 text-xs text-emerald-600 font-semibold hover:underline">
              Agregar primer gasto base
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {ACCOUNT_TYPES.map(({ value, label }) => {
              const items = grouped[value]
              if (!items?.length) return null
              const meta = ACCOUNT_META[value]
              const subtotal = items.filter(e => e.isActive).reduce((s, e) => s + (e.amount || 0), 0)
              return (
                <div key={value} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100 bg-gray-50/40">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                      <p className="font-bold text-slate-700 text-sm">{label}</p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.badge}`}>
                        {items.length}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-600">{formatCOP(subtotal)}</p>
                  </div>
                  <div>
                    {items.map((exp, i) => (
                      <div
                        key={exp.id}
                        className={`flex items-center gap-3 px-5 py-3 transition ${!exp.isActive ? 'opacity-40' : 'hover:bg-gray-50/60'}
                          ${i < items.length - 1 ? 'border-b border-gray-50' : ''}`}
                      >
                        <button
                          onClick={() => handleToggle(exp)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition
                            ${exp.isActive
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-gray-300 hover:border-emerald-400'
                            }`}
                        >
                          {exp.isActive && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${exp.isActive ? 'text-slate-800' : 'text-slate-400'}`}>{exp.name}</p>
                          <p className="text-xs text-slate-400">{exp.category}</p>
                        </div>
                        <p className="font-bold text-slate-700 text-sm mr-2">{formatCOP(exp.amount)}</p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(exp)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-slate-900">{editing ? 'Editar gasto base' : 'Nuevo gasto base'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Gasto recurrente mensual</p>
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
              <div>
                <label className={labelCls}>Nombre del gasto</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls} placeholder="Ej: Arriendo, Netflix..." />
              </div>
              <div>
                <label className={labelCls}>Valor mensual (COP)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                  <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className={`${inputCls} pl-6`} placeholder="0" />
                </div>
                {form.amount > 0 && <p className="text-xs text-emerald-600 font-semibold mt-1">{formatCOP(parseFloat(form.amount) || 0)}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className={labelCls}>Tipo de gasto</label>
                <select value={form.expenseType} onChange={(e) => setForm({ ...form, expenseType: e.target.value })} className={inputCls}>
                  {EXPENSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
                <div
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition
                    ${form.isActive ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}
                >
                  {form.isActive && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Gasto activo</p>
                  <p className="text-xs text-slate-400">Se incluye en el presupuesto mensual</p>
                </div>
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2 transition">
                  {saving ? <Spinner size="sm" /> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
