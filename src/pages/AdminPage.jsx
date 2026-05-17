import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { getAllUsers, updateUser } from '../lib/firestore'
import Spinner from '../components/ui/Spinner'

export default function AdminPage() {
  const { userData } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getAllUsers()
    setUsers(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (uid, current) => {
    await updateUser(uid, { isActive: !current })
    await load()
  }

  const changeRole = async (uid, role) => {
    await updateUser(uid, { role })
    await load()
  }

  if (userData?.role !== 'admin') return null

  const active = users.filter((u) => u.isActive).length

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Panel Admin</h1>
        <p className="text-slate-400 text-sm mb-6">Gestión de usuarios y métricas generales.</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Usuarios totales', value: users.length, icon: '👥' },
            { label: 'Usuarios activos', value: active, icon: '✅' },
            { label: 'Usuarios inactivos', value: users.length - active, icon: '🔒' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-3xl mb-1">{card.icon}</p>
              <p className="text-3xl font-bold text-slate-800">{card.value}</p>
              <p className="text-sm text-slate-400">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-slate-700">Usuarios registrados</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-bold text-emerald-600 flex-shrink-0">
                    {u.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 text-sm truncate">{u.name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                    <option value="support">support</option>
                  </select>
                  <button
                    onClick={() => toggleActive(u.id, u.isActive)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    {u.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
