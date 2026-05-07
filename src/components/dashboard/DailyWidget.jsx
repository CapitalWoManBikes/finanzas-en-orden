import { useNavigate } from 'react-router-dom'
import { calcDailyData } from '../../utils/dailyBudget'
import { formatCOP } from '../../utils/format'

const STATUS = {
  green:  { color: 'var(--fo-pos)',    bg: 'var(--fo-pos-soft)',    border: 'var(--fo-pos)',    dot: 'var(--fo-pos)',    msg: 'Vas dentro del presupuesto' },
  yellow: { color: 'oklch(0.78 0.17 85)', bg: 'oklch(0.78 0.17 85 / 0.10)', border: 'oklch(0.78 0.17 85 / 0.35)', dot: 'oklch(0.78 0.17 85)', msg: 'Cerca del límite diario' },
  red:    { color: 'var(--fo-neg)',    bg: 'var(--fo-neg-soft)',    border: 'oklch(0.65 0.22 25 / 0.35)', dot: 'var(--fo-neg)',    msg: 'Superaste el presupuesto' },
}

export default function DailyWidget({ income, budget, transactions, paymentConfig }) {
  const navigate = useNavigate()
  const d = calcDailyData({ income, budget, transactions, paymentConfig })
  const s = STATUS[d.status]
  const todayPct = d.dailyAllowance > 0 ? Math.min((d.todaySpent / d.dailyAllowance) * 100, 100) : 0

  return (
    <div style={{
      background: 'var(--fo-surface-1)',
      border: '1px solid var(--fo-line)',
      borderRadius: 'var(--fo-r-xl)',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--fo-line-soft)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--fo-fg-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Presupuesto de hoy
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 32, fontWeight: 700, color: 'var(--fo-fg)', lineHeight: 1, fontFamily: 'var(--fo-font-num)' }}>
              {formatCOP(d.dailyAllowance)}
            </p>
          </div>
          <span style={{
            padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            marginTop: 2,
          }}>
            {s.msg}
          </span>
        </div>
      </div>

      {/* KPIs 2 columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--fo-line-soft)' }}>
        <KPICell label="Gastado hoy" value={formatCOP(d.todaySpent)} sub={`${Math.round(todayPct)}% del día`} />
        <KPICell label="Próximo pago" value={`${d.daysLeft} días`} sub={d.nextPaymentDate} border />
      </div>

      {/* Barra de progreso */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--fo-line-soft)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--fo-fg-dim)', fontWeight: 500 }}>Uso del presupuesto diario</span>
          <span style={{ fontSize: 11, color: 'var(--fo-fg-muted)', fontWeight: 600, fontFamily: 'var(--fo-font-num)' }}>
            {formatCOP(d.todaySpent)} / {formatCOP(d.dailyAllowance)}
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 999, background: 'var(--fo-surface-3)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999,
            background: s.color,
            width: `${todayPct}%`,
            transition: 'width 600ms ease',
          }} />
        </div>
      </div>

      {/* Flujo del mes */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--fo-line-soft)' }}>
        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: 'var(--fo-fg-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Flujo del mes
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FlowRow label="Ingreso" value={d.incomeVal} color="var(--fo-pos)" sign="+" />
          <FlowRow label="Gastos fijos" value={d.fixedSpent} color="var(--fo-accent-fg)" sign="−" />
          <FlowRow label="Ahorro" value={d.savingsSpent} color="oklch(0.66 0.20 290)" sign="−" />
          <FlowRow label="Gasto diario" value={d.monthlyDailySpent} color="oklch(0.78 0.17 85)" sign="−" />
          <div style={{ borderTop: '1px solid var(--fo-line-soft)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fo-fg)' }}>Disponible</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: d.availableMoney < 0 ? 'var(--fo-neg)' : 'var(--fo-pos)', fontFamily: 'var(--fo-font-num)' }}>
              {formatCOP(d.availableMoney)}
            </span>
          </div>
        </div>
      </div>

      {/* Alerta / estado */}
      {d.moneyWontLast && (
        <div style={{ margin: '0 16px 0', padding: '10px 14px', background: 'var(--fo-neg-soft)', border: '1px solid oklch(0.65 0.22 25 / 0.3)', borderRadius: 'var(--fo-r-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>⚠</span>
          <span style={{ fontSize: 12, color: 'var(--fo-neg)', fontWeight: 500 }}>A este ritmo el dinero no alcanza hasta el próximo pago.</span>
        </div>
      )}
      {!d.moneyWontLast && d.status === 'green' && d.availableMoney > 0 && (
        <div style={{ margin: '0 16px 0', padding: '10px 14px', background: 'var(--fo-pos-soft)', border: '1px solid oklch(0.74 0.16 160 / 0.3)', borderRadius: 'var(--fo-r-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>✓</span>
          <span style={{ fontSize: 12, color: 'var(--fo-pos)', fontWeight: 500 }}>Tienes {formatCOP(d.remaining)} disponibles para el resto del mes.</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '12px 24px 16px' }}>
        <button onClick={() => navigate('/configuracion')} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontSize: 11, color: 'var(--fo-fg-dim)', fontFamily: 'inherit',
        }}>
          Configurar modalidad de pago →
        </button>
      </div>
    </div>
  )
}

function KPICell({ label, value, sub, border }) {
  return (
    <div style={{
      padding: '14px 24px',
      borderLeft: border ? '1px solid var(--fo-line-soft)' : 'none',
    }}>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-fg-dim)', fontWeight: 500 }}>{label}</p>
      <p style={{ margin: '4px 0 2px', fontSize: 18, fontWeight: 700, color: 'var(--fo-fg)', lineHeight: 1, fontFamily: 'var(--fo-font-num)' }}>{value}</p>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-fg-dim)' }}>{sub}</p>
    </div>
  )
}

function FlowRow({ label, value, color, sign }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--fo-fg-muted)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: 'var(--fo-font-num)' }}>{sign} {formatCOP(value)}</span>
    </div>
  )
}
