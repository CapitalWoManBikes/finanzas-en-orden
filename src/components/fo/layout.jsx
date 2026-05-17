import { Button } from './base.jsx';

/**
 * Componentes de layout — Finanzas en Orden (Dirección B)
 *
 * Sidebar y TopBar para escritorio.
 * MobileHeader y MobileTabBar para la versión móvil.
 *
 * Si tu app es 100% móvil, ignora Sidebar/TopBar.
 */

/* ============================================================
   Iconos SVG inline (sin dependencia)
   ============================================================ */
const Ico = ({ d, size = 18, w = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={w}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d}/>
  </svg>
);

export const ICONS = {
  dash:    'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  income:  'M7 14l5-5 5 5M12 9v12M5 5h14',
  spend:   'M3 7h18M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7',
  base:    'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',
  goal:    'M12 22V8M5 12l7-7 7 7',
  hist:    'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2',
  search:  'M21 21l-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z',
  bell:    'M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-4-5.7V5a2 2 0 0 0-4 0v.3A6 6 0 0 0 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0',
  cog:     'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2.1-1.2l-.4-2.5h-4l-.4 2.5a7.4 7.4 0 0 0-2.1 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2.1 1.2l.4 2.5h4l.4-2.5a7.4 7.4 0 0 0 2.1-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
  plus:    'M12 5v14M5 12h14',
  back:    'M15 18l-6-6 6-6',
  more:    'M5 12h.01M12 12h.01M19 12h.01',
};

export { Ico };

/* ============================================================
   Logo
   ============================================================ */
export function Logo({ size = 30 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size / 3.4,
      background: 'var(--fo-accent-grad)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 8px 22px -8px var(--fo-accent)',
      flexShrink: 0,
    }}>
      <svg viewBox="0 0 24 24" width="60%" height="60%" fill="none">
        <path d="M7 18V6h7a3 3 0 0 1 0 6H7m0 0h6.5L18 18"
              stroke="#fff" strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

/* ============================================================
   Sidebar (escritorio)
   <Sidebar active="dash" onNavigate={(id)=>...} user={{name,initials}}/>
   ============================================================ */
const DEFAULT_NAV = [
  { id: 'dash',   icon: ICONS.dash,   label: 'Inicio',       href: '/' },
  { id: 'income', icon: ICONS.income, label: 'Ingresos',     href: '/ingresos' },
  { id: 'spend',  icon: ICONS.spend,  label: 'Gastos',       href: '/gastos' },
  { id: 'base',   icon: ICONS.base,   label: 'Gastos base',  href: '/gastos-base' },
  { id: 'goal',   icon: ICONS.goal,   label: 'Metas',        href: '/metas' },
  { id: 'hist',   icon: ICONS.hist,   label: 'Historial',    href: '/historial' },
];

export function Sidebar({
  active = 'dash',
  items = DEFAULT_NAV,
  onNavigate,
  user = { name: 'Ana C.', initials: 'AC', plan: 'Plan personal' },
  streak,
}) {
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'var(--fo-surface-1)',
      borderRight: '1px solid var(--fo-line)',
      display: 'flex', flexDirection: 'column',
      padding: 16, gap: 4,
      height: '100vh',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px 18px' }}>
        <Logo size={32}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Finanzas en Orden</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-fg-dim)' }}>Cuenta personal</p>
        </div>
      </div>

      {items.map(it => {
        const isA = active === it.id;
        return (
          <a
            key={it.id}
            href={it.href}
            onClick={(e) => {
              if (onNavigate) { e.preventDefault(); onNavigate(it.id); }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 14, fontSize: 14,
              color: isA ? '#fff' : 'var(--fo-fg-muted)',
              background: isA ? 'var(--fo-accent-grad)' : 'transparent',
              fontWeight: isA ? 600 : 500, cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: isA ? 'var(--fo-shadow-accent)' : 'none',
              transition: 'background 120ms',
            }}
          >
            <Ico d={it.icon} size={18}/> {it.label}
          </a>
        );
      })}

      {streak && (
        <div style={{
          marginTop: 18, padding: '12px 14px', borderRadius: 16,
          background: 'var(--fo-surface-2)', border: '1px solid var(--fo-line)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--fo-fg-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--fo-pos)' }}/> En racha
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{streak.title}</p>
          {streak.subtitle && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--fo-fg-dim)' }}>{streak.subtitle}</p>}
        </div>
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
          fontSize: 12, fontWeight: 700,
        }}>
          {user.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{user.name}</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-fg-dim)' }}>{user.plan}</p>
        </div>
        <Ico d={ICONS.cog} size={15}/>
      </div>
    </aside>
  );
}

/* ============================================================
   TopBar (escritorio)
   <TopBar greeting="Buenos días, Ana ✨" period="Mayo 2026" onNew={()=>...}/>
   ============================================================ */
export function TopBar({
  greeting = 'Buenos días',
  period = '',
  searchPlaceholder = 'Buscar movimiento, meta o categoría…',
  onNew,
  unread = false,
  newLabel = 'Nuevo gasto',
}) {
  return (
    <header style={{
      height: 64, padding: '0 28px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div>
        {period && (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-fg-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            {period}
          </p>
        )}
        <p style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {greeting}
        </p>
      </div>

      <div style={{ flex: 1 }}/>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px',
        background: 'var(--fo-surface-1)',
        border: '1px solid var(--fo-line)',
        borderRadius: 14,
        fontSize: 13, color: 'var(--fo-fg-dim)',
        minWidth: 280,
      }}>
        <Ico d={ICONS.search} size={15}/>
        <span style={{ flex: 1 }}>{searchPlaceholder}</span>
        <kbd style={{
          background: 'var(--fo-surface-2)', borderRadius: 6,
          padding: '2px 6px', fontSize: 10, color: 'var(--fo-fg-dim)',
          fontFamily: 'var(--fo-font-mono)',
        }}>
          ⌘K
        </kbd>
      </div>

      <button style={{
        width: 40, height: 40, borderRadius: 12,
        border: '1px solid var(--fo-line)',
        background: 'var(--fo-surface-1)',
        color: 'var(--fo-fg-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', cursor: 'pointer',
      }}>
        <Ico d={ICONS.bell} size={16}/>
        {unread && <span style={{
          position: 'absolute', top: 8, right: 8,
          width: 7, height: 7, borderRadius: 999, background: 'var(--fo-neg)',
        }}/>}
      </button>

      {onNew && (
        <Button onClick={onNew} icon={<Ico d={ICONS.plus} size={14}/>}>
          {newLabel}
        </Button>
      )}
    </header>
  );
}

/* ============================================================
   MobileHeader — header con gradiente para top de pantallas móviles
   ============================================================ */
export function MobileHeader({ user, balance, deltaLabel, actions = [], compact = false }) {
  return (
    <div style={{
      padding: compact ? '14px 20px 22px' : '14px 20px 32px',
      background: 'var(--fo-hero-grad)',
      color: '#fff', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.15), transparent 60%)',
      }}/>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
            }}>
              {user.initials}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, opacity: 0.7 }}>{user.greeting || 'Hola'}</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{user.name}</p>
            </div>
          </div>
        )}
        <button style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', cursor: 'pointer',
        }}>
          <Ico d={ICONS.bell} size={16}/>
        </button>
      </div>

      {balance != null && (
        <div style={{ marginTop: 24, position: 'relative' }}>
          <p style={{ margin: 0, fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Saldo disponible
          </p>
          <p className="fo-num" style={{ margin: '6px 0 0', fontSize: 38, letterSpacing: '-0.03em' }}>
            {balance}
          </p>
          {deltaLabel && (
            <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.85 }}>{deltaLabel}</p>
          )}
        </div>
      )}

      {actions.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${actions.length}, 1fr)`,
          gap: 8, marginTop: 22, position: 'relative',
        }}>
          {actions.map(a => (
            <button
              key={a.label}
              onClick={a.onClick}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6, padding: '12px 0',
                background: 'rgba(255,255,255,0.14)', border: 'none',
                borderRadius: 16, color: '#fff', cursor: 'pointer',
              }}
            >
              <Ico d={a.icon} size={18}/>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{a.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MobileTabBar — barra inferior con FAB central
   <MobileTabBar active="home" onNavigate={(id)=>...} onPlus={()=>...}/>
   ============================================================ */
const DEFAULT_TABS = [
  { id: 'home',   icon: ICONS.dash,  label: 'Inicio' },
  { id: 'spend',  icon: ICONS.spend, label: 'Gastos' },
  { id: 'goal',   icon: ICONS.goal,  label: 'Metas' },
  { id: 'more',   icon: ICONS.more,  label: 'Más' },
];

export function MobileTabBar({ active = 'home', tabs = DEFAULT_TABS, onNavigate, onPlus }) {
  // Insert FAB slot in the middle
  const half = Math.floor(tabs.length / 2);
  const left = tabs.slice(0, half);
  const right = tabs.slice(half);

  const renderTab = (t) => {
    const isA = active === t.id;
    return (
      <button
        key={t.id}
        onClick={() => onNavigate?.(t.id)}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 3,
          color: isA ? 'var(--fo-accent-fg)' : 'var(--fo-fg-dim)',
          padding: '6px 0', background: 'transparent', border: 'none',
          cursor: 'pointer',
        }}
      >
        <Ico d={t.icon} size={18}/>
        <span style={{ fontSize: 9, fontWeight: 600 }}>{t.label}</span>
      </button>
    );
  };

  return (
    <div style={{
      position: 'fixed', left: 12, right: 12, bottom: 14,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      background: 'rgba(15,18,26,0.85)', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--fo-line)', borderRadius: 24,
      padding: '8px 6px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
      zIndex: 50,
    }}>
      {left.map(renderTab)}
      <button
        onClick={onPlus}
        style={{
          width: 52, height: 52, borderRadius: 18,
          background: 'var(--fo-accent-grad)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: -22, boxShadow: '0 12px 26px -8px var(--fo-accent)',
          border: 'none', cursor: 'pointer', flexShrink: 0,
        }}
      >
        <Ico d={ICONS.plus} size={22} w={2.2}/>
      </button>
      {right.map(renderTab)}
    </div>
  );
}

/* ============================================================
   AppShell — wrapper estándar para escritorio con sidebar + topbar
   <AppShell active="dash" topBarProps={{...}}>...</AppShell>
   ============================================================ */
export function AppShell({ active, topBarProps = {}, sidebarProps = {}, children }) {
  return (
    <div className="fo-app" style={{ width: '100%', minHeight: '100vh', display: 'flex' }}>
      <Sidebar active={active} {...sidebarProps}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar {...topBarProps}/>
        <main style={{ flex: 1, padding: '8px 28px 32px', overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
