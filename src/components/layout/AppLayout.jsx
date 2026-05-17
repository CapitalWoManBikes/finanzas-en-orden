import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Logo, Ico, ICONS } from '../fo'

const NAV = [
  { id: 'dash',   icon: ICONS.dash,   label: 'Inicio',       href: '/dashboard' },
  { id: 'income', icon: ICONS.income, label: 'Ingresos',     href: '/ingresos' },
  { id: 'spend',  icon: ICONS.spend,  label: 'Gastos',       href: '/gastos' },
  { id: 'base',   icon: ICONS.base,   label: 'Gastos base',  href: '/gastos-base' },
  { id: 'hist',   icon: ICONS.hist,   label: 'Historial',    href: '/historial' },
  { id: 'cog',    icon: ICONS.cog,    label: 'Configuración',href: '/configuracion' },
]

const MOBILE_TABS = [
  { id: 'dash',   icon: ICONS.dash,   label: 'Inicio',   href: '/dashboard' },
  { id: 'spend',  icon: ICONS.spend,  label: 'Gastos',   href: '/gastos' },
  { id: 'income', icon: ICONS.income, label: 'Ingresos', href: '/ingresos' },
  { id: 'hist',   icon: ICONS.hist,   label: 'Historial',href: '/historial' },
]

function Sidebar({ activeId }) {
  const navigate = useNavigate()
  const { userData, logout } = useAuth()
  const initials = userData?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'var(--fo-surface-1)',
      borderRight: '1px solid var(--fo-line)',
      display: 'flex', flexDirection: 'column',
      padding: 16, gap: 2,
      height: '100vh', position: 'sticky', top: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px 18px' }}>
        <Logo size={32}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Finanzas en Orden</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-fg-dim)' }}>{userData?.name?.split(' ')[0]}</p>
        </div>
      </div>

      {NAV.map(it => {
        const isA = activeId === it.id
        return (
          <button key={it.id} onClick={() => navigate(it.href)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 14, fontSize: 14,
            color: isA ? '#fff' : 'var(--fo-fg-muted)',
            background: isA ? 'var(--fo-accent-grad)' : 'transparent',
            fontWeight: isA ? 600 : 500, cursor: 'pointer', border: 'none',
            boxShadow: isA ? 'var(--fo-shadow-accent)' : 'none',
            transition: 'background 120ms', textAlign: 'left', width: '100%',
          }}>
            <Ico d={it.icon} size={18}/> {it.label}
          </button>
        )
      })}

      {userData?.role === 'admin' && (
        <button onClick={() => navigate('/admin')} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px', borderRadius: 14, fontSize: 14,
          color: 'var(--fo-fg-muted)', background: 'transparent',
          fontWeight: 500, cursor: 'pointer', border: 'none', width: '100%',
        }}>
          <Ico d={ICONS.cog} size={18}/> Admin
        </button>
      )}

      <div style={{ flex: 1 }}/>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 10, borderRadius: 14,
        border: '1px solid var(--fo-line)', background: 'var(--fo-surface-2)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'var(--fo-accent-grad)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userData?.name}</p>
          <button onClick={logout} style={{
            margin: 0, fontSize: 11, color: 'var(--fo-neg)', background: 'none',
            border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
          }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  )
}

function MobileHeader({ title }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { userData, logout } = useAuth()

  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 30 }}/>}
      {open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, zIndex: 40,
          background: 'var(--fo-surface-1)', borderRight: '1px solid var(--fo-line)',
          display: 'flex', flexDirection: 'column', padding: 16, gap: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px 18px' }}>
            <Logo size={32}/><p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Finanzas en Orden</p>
          </div>
          {NAV.map(it => (
            <button key={it.id} onClick={() => { navigate(it.href); setOpen(false) }} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 14, fontSize: 14,
              color: 'var(--fo-fg-muted)', background: 'transparent',
              fontWeight: 500, cursor: 'pointer', border: 'none', textAlign: 'left', width: '100%',
            }}>
              <Ico d={it.icon} size={18}/> {it.label}
            </button>
          ))}
          <div style={{ flex: 1 }}/>
          <button onClick={() => { logout(); navigate('/login') }} style={{
            padding: '10px 12px', borderRadius: 14, fontSize: 13,
            color: 'var(--fo-neg)', background: 'transparent', border: 'none',
            cursor: 'pointer', textAlign: 'left', width: '100%',
          }}>
            Cerrar sesión
          </button>
        </div>
      )}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
        height: 56, display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 14,
        background: 'rgba(14,17,24,0.90)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--fo-line)',
      }}>
        <button onClick={() => setOpen(true)} style={{
          width: 38, height: 38, borderRadius: 12, border: '1px solid var(--fo-line)',
          background: 'var(--fo-surface-2)', color: 'var(--fo-fg-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Ico d="M4 6h16M4 12h16M4 18h16" size={18}/>
        </button>
        <Logo size={28}/>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, flex: 1 }}>{title}</p>
      </header>
    </>
  )
}

function MobileTabBar({ activeId }) {
  const navigate = useNavigate()
  return (
    <div style={{
      position: 'fixed', left: 12, right: 12, bottom: 14, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      background: 'rgba(15,18,26,0.88)', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--fo-line)', borderRadius: 24,
      padding: '8px 6px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
    }}>
      {MOBILE_TABS.map(t => {
        const isA = activeId === t.id
        return (
          <button key={t.id} onClick={() => navigate(t.href)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: isA ? 'var(--fo-accent-fg)' : 'var(--fo-fg-dim)',
            padding: '6px 0', background: 'transparent', border: 'none', cursor: 'pointer',
          }}>
            <Ico d={t.icon} size={18}/>
            <span style={{ fontSize: 9, fontWeight: 600 }}>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

const LOCATION_MAP = {
  '/dashboard':    'dash',
  '/ingresos':     'income',
  '/gastos':       'spend',
  '/gastos-base':  'base',
  '/historial':    'hist',
  '/configuracion':'cog',
}

const TITLES = {
  '/dashboard':    'Inicio',
  '/ingresos':     'Ingresos',
  '/gastos':       'Gastos',
  '/gastos-base':  'Gastos base',
  '/historial':    'Historial',
  '/configuracion':'Configuración',
  '/admin':        'Admin',
}

export default function AppLayout({ children }) {
  const { pathname } = useLocation()
  const activeId = LOCATION_MAP[pathname] ?? 'dash'
  const title = TITLES[pathname] ?? 'Finanzas en Orden'

  return (
    <div className="fo-app" style={{ minHeight: '100vh' }}>
      {/* Desktop layout */}
      <div style={{ display: 'none' }} className="desktop-shell">
        <style>{`@media(min-width:1024px){.desktop-shell{display:flex!important;minHeight:100vh} .mobile-only{display:none!important}}`}</style>
        <Sidebar activeId={activeId}/>
        <main style={{ flex: 1, minWidth: 0, padding: '28px 32px 40px' }}>
          {children}
        </main>
      </div>

      {/* Mobile layout */}
      <div className="mobile-only" style={{ minHeight: '100vh' }}>
        <MobileHeader title={title}/>
        <main style={{ paddingTop: 56, paddingBottom: 90, minHeight: '100vh' }}>
          <div style={{ padding: '20px 16px' }}>
            {children}
          </div>
        </main>
        <MobileTabBar activeId={activeId}/>
      </div>
    </div>
  )
}
