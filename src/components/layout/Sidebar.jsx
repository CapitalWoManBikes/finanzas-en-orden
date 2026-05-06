import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Ico({ d, className = 'w-5 h-5 flex-shrink-0' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
    </svg>
  )
}

const D = {
  dashboard: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  ingresos: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  gastos: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  base: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  historial: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  admin: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  chevron: 'M15 19l-7-7 7-7',
}

const NAV = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/ingresos', icon: 'ingresos', label: 'Ingresos' },
  { to: '/gastos', icon: 'gastos', label: 'Gastos' },
  { to: '/gastos-base', icon: 'base', label: 'Gastos base' },
  { to: '/historial', icon: 'historial', label: 'Historial' },
]

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }) {
  const { userData, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = userData?.name
    ? userData.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full flex flex-col z-30
          bg-slate-950 border-r border-slate-800/50
          transition-all duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 flex-shrink-0 border-b border-slate-800/50 ${collapsed ? 'justify-center' : 'px-4 gap-3'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-base leading-none">$</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-xs leading-tight truncate">Finanzas en Orden</p>
                <p className="text-slate-500 text-[11px] truncate">{userData?.name?.split(' ')[0]}</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-base leading-none">$</span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 items-center justify-center text-slate-500 hover:text-slate-200 transition flex-shrink-0"
            title={collapsed ? 'Expandir' : 'Contraer'}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={D.chevron} />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden px-2">
          {!collapsed && (
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Menú</p>
          )}
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              title={collapsed ? label : ''}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150
                ${collapsed ? 'justify-center py-3 px-0' : 'px-3 py-2.5'}
                ${isActive
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`
              }
            >
              <Ico d={D[icon]} />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}

          {userData?.role === 'admin' && (
            <>
              {!collapsed && (
                <p className="px-3 pt-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Sistema</p>
              )}
              <NavLink
                to="/admin"
                onClick={onClose}
                title={collapsed ? 'Admin' : ''}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150
                  ${collapsed ? 'justify-center py-3 px-0' : 'px-3 py-2.5'}
                  ${isActive ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'}`
                }
              >
                <Ico d={D.admin} />
                {!collapsed && <span className="truncate">Admin</span>}
              </NavLink>
            </>
          )}
        </nav>

        {/* User + logout */}
        <div className="border-t border-slate-800/50 p-2 space-y-1">
          {!collapsed && userData && (
            <div className="px-3 py-2 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px] font-bold text-emerald-400 flex-shrink-0 ring-1 ring-emerald-500/30">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-300 truncate">{userData?.name}</p>
                <p className="text-[10px] text-slate-600 truncate">{userData?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesión' : ''}
            className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition py-2.5
              ${collapsed ? 'justify-center px-0' : 'px-3'}`}
          >
            <Ico d={D.logout} />
            {!collapsed && <span className="truncate">Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
