import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { getDefaultExpenses, addDefaultExpense, updateDefaultExpense, deleteDefaultExpense } from '../lib/firestore'
import { formatCOP, CATEGORIES, ACCOUNT_TYPES, EXPENSE_TYPES } from '../utils/format'
import Spinner from '../components/ui/Spinner'

const EMPTY = { name: '', amount: '', category: 'Otros', accountType: 'dailySpending', expenseType: 'variable', isActive: true, isRecurring: true }

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
    if (editing) {
      await updateDefaultExpense(user.uid, editing, data)
    } else {
      await addDefaultExpense(user.uid, data)
    }
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

  const total = expenses.filter((e) => e.isActive).reduce((s, e) => s + (e.amount || 0), 0)

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Mis gastos base</h1>
            <p className="text-slate-400 text-sm mt-1">Total activos: <span className="text-emerald-600 font-semibold">{formatCOP(total)}</span></p>
          </div>
          <button onClick={openNew} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition text-sm">
            + Nuevo gasto
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {expenses.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm">No tienes gastos base configurados.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {expenses.map((exp) => (
                  <div key={exp.id} className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 ${!exp.isActive ? 'opacity-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={exp.isActive}
                      onChange={() => handleToggle(exp)}
                      className="accent-emerald-500 w-4 h-4 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 text-sm">{exp.name}</p>
                      <p className="text-xs text-slate-400">{exp.category} · {ACCOUNT_TYPES.find(a => a.value === exp.accountType)?.label}</p>
                    </div>
                    <p className="font-bold text-slate-700 text-sm mr-3">{formatCOP(exp.amount)}</p>
                    <button onClick={() => openEdit(exp)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Editar</button>
                    <button onClick={() => handleDelete(exp.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Eliminar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-slate-800">{editing ? 'Editar gasto base' : 'Nuevo gasto base'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Valor (COP)</label>
                <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de gasto</label>
                <select value={form.expenseType} onChange={(e) => setForm({ ...form, expenseType: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {EXPENSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-emerald-500" />
                <span className="text-sm text-gray-700">Activo</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2">
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
