import React from 'react';

/**
 * Componentes base — Finanzas en Orden (Dirección B)
 *
 * Atómicos, sin dependencias. Estilan con CSS variables de tokens.css.
 * Si usas TypeScript, renombra a .tsx y agrega los tipos sugeridos en JSDoc.
 */

/* ============================================================
   cx — utilidad para concatenar clases
   ============================================================ */
export const cx = (...a) => a.filter(Boolean).join(' ');

/* ============================================================
   Card — superficie base
   <Card>contenido</Card>
   ============================================================ */
export function Card({ as: Tag = 'div', className = '', padded = true, hover = false, children, ...rest }) {
  return (
    <Tag
      className={cx(
        'fo-card',
        padded && 'fo-card--padded',
        hover && 'fo-card--hover',
        className
      )}
      style={{
        background: 'var(--fo-surface-1)',
        border: '1px solid var(--fo-line)',
        borderRadius: 'var(--fo-r-lg)',
        boxShadow: 'var(--fo-shadow-sm)',
        padding: padded ? 18 : undefined,
        transition: 'border-color 160ms ease, transform 160ms ease',
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ============================================================
   Button
   <Button variant="primary|soft|ghost" size="sm|md|lg" icon={<Icon/>}>
   ============================================================ */
export function Button({
  variant = 'primary',
  size = 'md',
  icon = null,
  iconRight = null,
  full = false,
  className = '',
  children,
  ...rest
}) {
  const sizes = {
    sm: { padding: '7px 12px', fontSize: 12, radius: 'var(--fo-r-sm)' },
    md: { padding: '10px 16px', fontSize: 13, radius: 'var(--fo-r-md)' },
    lg: { padding: '14px 18px', fontSize: 14, radius: 'var(--fo-r-md)' },
  };
  const s = sizes[size];

  const variants = {
    primary: {
      background: 'var(--fo-accent-grad)',
      color: '#fff',
      border: '1px solid transparent',
      boxShadow: 'var(--fo-shadow-accent)',
    },
    soft: {
      background: 'var(--fo-surface-2)',
      color: 'var(--fo-fg)',
      border: '1px solid var(--fo-line)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--fo-fg)',
      border: '1px solid var(--fo-line)',
    },
  };
  const v = variants[variant];

  return (
    <button
      className={cx('fo-btn', `fo-btn--${variant}`, className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        borderRadius: s.radius,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'transform 120ms ease, filter 120ms ease',
        width: full ? '100%' : undefined,
        ...v,
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'translateY(1px)'}
      onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

/* ============================================================
   Input
   <Input label="Correo" hint="Lo usamos solo para iniciar sesión"/>
   ============================================================ */
export function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  className = '',
  id,
  ...rest
}) {
  const generatedId = React.useId ? React.useId() : Math.random().toString(36).slice(2);
  const inputId = id || generatedId;

  return (
    <label htmlFor={inputId} className={cx('fo-input-group', className)} style={{ display: 'block' }}>
      {label && (
        <span style={{
          display: 'block', marginBottom: 6,
          fontSize: 12, fontWeight: 600,
          color: 'var(--fo-fg-muted)',
        }}>
          {label}
        </span>
      )}
      <div style={{
        position: 'relative',
        display: 'flex', alignItems: 'center',
        background: 'var(--fo-surface-2)',
        border: `1px solid ${error ? 'var(--fo-neg)' : 'var(--fo-line)'}`,
        borderRadius: 'var(--fo-r-md)',
        transition: 'border-color 120ms, box-shadow 120ms',
      }}>
        {prefix && <span style={{ paddingLeft: 14, color: 'var(--fo-fg-dim)', display: 'flex' }}>{prefix}</span>}
        <input
          id={inputId}
          style={{
            flex: 1,
            padding: '12px 14px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--fo-fg)',
            fontSize: 14,
            fontFamily: 'inherit',
          }}
          onFocus={(e) => {
            e.currentTarget.parentElement.style.borderColor = 'var(--fo-accent-line)';
            e.currentTarget.parentElement.style.boxShadow = '0 0 0 4px var(--fo-accent-soft)';
          }}
          onBlur={(e) => {
            e.currentTarget.parentElement.style.borderColor = error ? 'var(--fo-neg)' : 'var(--fo-line)';
            e.currentTarget.parentElement.style.boxShadow = 'none';
          }}
          {...rest}
        />
        {suffix && <span style={{ paddingRight: 14, color: 'var(--fo-fg-dim)', display: 'flex' }}>{suffix}</span>}
      </div>
      {(hint || error) && (
        <span style={{
          display: 'block', marginTop: 6,
          fontSize: 11,
          color: error ? 'var(--fo-neg)' : 'var(--fo-fg-dim)',
        }}>
          {error || hint}
        </span>
      )}
    </label>
  );
}

/* ============================================================
   Chip / Badge
   <Chip tone="pos|neg|warn|accent|default">+12,4%</Chip>
   ============================================================ */
export function Chip({ tone = 'default', icon, className = '', children, ...rest }) {
  const tones = {
    default: { bg: 'var(--fo-surface-2)', fg: 'var(--fo-fg-muted)', border: 'var(--fo-line)' },
    pos:     { bg: 'var(--fo-pos-soft)',  fg: 'var(--fo-pos)',      border: 'transparent' },
    neg:     { bg: 'var(--fo-neg-soft)',  fg: 'var(--fo-neg)',      border: 'transparent' },
    warn:    { bg: 'var(--fo-warn-soft)', fg: 'var(--fo-warn)',     border: 'transparent' },
    accent:  { bg: 'var(--fo-accent-soft)', fg: 'var(--fo-accent-fg)', border: 'transparent' },
  };
  const t = tones[tone];

  return (
    <span
      className={cx('fo-chip', `fo-chip--${tone}`, className)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 9px', borderRadius: 999,
        fontSize: 11, fontWeight: 600, letterSpacing: '-0.005em',
        background: t.bg, color: t.fg,
        border: `1px solid ${t.border}`,
      }}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}

/* ============================================================
   KPI — tarjeta de métrica
   <KPI label="Ahorro acumulado" value="$ 850.000" delta="+18%" tone="pos" sub="Meta: $ 1M"/>
   ============================================================ */
export function KPI({ label, value, delta, deltaTone = 'pos', sub, sparkline, accent }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--fo-fg-dim)', fontWeight: 500 }}>{label}</p>
        {delta && <Chip tone={deltaTone}>{delta}</Chip>}
      </div>
      <p className="fo-num" style={{
        margin: '8px 0 0',
        fontSize: 24,
        color: accent ? 'var(--fo-accent-fg)' : 'var(--fo-fg)',
      }}>
        {value}
      </p>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--fo-fg-dim)' }}>{sub}</p>}
      {sparkline && (
        <svg viewBox="0 0 100 24" width="100%" height="28" style={{ marginTop: 10, display: 'block' }}>
          <polyline fill="none" stroke="var(--fo-accent)" strokeWidth="1.5" points={sparkline}/>
          <polyline fill="var(--fo-accent-soft)" stroke="none" points={`0,24 ${sparkline} 100,24`}/>
        </svg>
      )}
    </Card>
  );
}

/* ============================================================
   ProgressBar
   <ProgressBar value={65} tone="accent|pos|warn|neg"/>
   ============================================================ */
export function ProgressBar({ value = 0, tone = 'accent', height = 6, className = '', animated = true }) {
  const tones = {
    accent: 'var(--fo-accent)',
    pos:    'var(--fo-pos)',
    warn:   'var(--fo-warn)',
    neg:    'var(--fo-neg)',
  };
  return (
    <div
      className={cx('fo-progress', className)}
      style={{
        height,
        background: 'var(--fo-surface-2)',
        borderRadius: 999,
        overflow: 'hidden',
      }}
    >
      <div
        className={animated ? 'fo-bar-fill' : ''}
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: tones[tone],
          borderRadius: 999,
        }}
      />
    </div>
  );
}

/* ============================================================
   StripedBar — barra segmentada (fijos / ahorro / diario)
   <StripedBar segments={[{value:42,color:'a'},{value:28,color:'p'}]}/>
   ============================================================ */
export function StripedBar({ segments = [], height = 6, gap = 4, className = '' }) {
  return (
    <div className={cx('fo-stripedbar', className)} style={{ display: 'flex', gap, height }}>
      {segments.map((s, i) => (
        <div
          key={i}
          className="fo-bar-fill"
          style={{
            flex: s.value,
            background: s.color || 'var(--fo-accent)',
            borderRadius: 999,
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   SectionHeader — título de sección con sub y acción
   ============================================================ */
export function SectionHeader({ overline, title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
      <div>
        {overline && (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-fg-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            {overline}
          </p>
        )}
        {title && <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h2>}
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fo-fg-dim)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ============================================================
   Money — formatea como pesos colombianos
   <Money value={184500} /> → $ 184.500
   ============================================================ */
export function Money({ value, signed = false, positive, className = '', style = {} }) {
  const formatted = '$ ' + new Intl.NumberFormat('es-CO').format(Math.round(Math.abs(value)));
  const sign = signed ? (positive ?? value >= 0 ? '+ ' : '− ') : '';
  return (
    <span
      className={cx('fo-num', 'tnum', className)}
      style={{ color: positive ? 'var(--fo-pos)' : undefined, ...style }}
    >
      {sign}{formatted}
    </span>
  );
}
