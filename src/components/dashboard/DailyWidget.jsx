import { useNavigate } from 'react-router-dom'
import { calcDailyData } from '../../utils/dailyBudget'
import { formatCOP } from '../../utils/format'

const STATUS = {
  green:  { color: 'var(--fo-pos)', bg: 'var(--fo-pos-soft)', border: 'var(--fo-pos)', msg: 'Vas dentro del presupuesto' },
  yellow: { color: 'oklch(0.78 0.17 85)', bg: 'oklch(0.78 0.17 85 / 0.10)', border: 'oklch(0.78 0.17 85 / 0.35)', msg: 'Cerca del limite diario' },
  red:    { color: 'var(--fo-neg)', bg: 'var(--fo-neg-soft)', border: 'oklch(0.65 0.22 25 / 0.35)', msg: 'Superaste el presupuesto' },
}

export default function DailyWidget({ income, budget, defaultExpenses, transactions, paymentConfig }) {
  const navigate = useNavigate()
  const d = calcDailyData({ income, budget, defaultExpenses, transactions, paymentConfig })
  const s = STATUS[d.status]
  const todayPct = d.dailyAllowance > 0 ? Math.min((d.todaySpent / d.dailyAllowance) * 100, 100) : 0
  const canSpendToday = Math.max(d.dailyAllowance - d.todaySpent, 0)

  if (d.incomeVal <= 0) {
    return (
      <div style={{
        background: 'var(--fo-surface-1)',
        border: '1px solid var(--fo-warn)',
        borderRadius: 'var(--fo-r-xl)',
        padding: '22px 24px',
      }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--fo-warn)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Presupuesto pendiente
        </p>
        <h3 style={{ margin: '8px 0 6px', fontSize: 22, color: 'var(--fo-fg)' }}>Agrega tus ingresos</h3>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--fo-fg-dim)', lineHeight: 1.5 }}>
          Necesito el ingreso del mes para calcular tu dinero disponible, presupuesto diario y alertas de gasto.
        </p>
        <button onClick={() => navigate('/ingresos')} style={{
          marginTop: 16,
          padding: '10px 14px',
          borderRadius: 'var(--fo-r-md)',
          background: 'var(--fo-accent-grad)',
          color: '#fff',
          border: 'none',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          Registrar ingreso
        </button>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--fo-surface-1)',
      border: '1px solid var(--fo-line)',
      borderRadius: 'var(--fo-r-xl)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--fo-line-soft)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--fo-fg-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Puedes gastar hoy
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 34, fontWeight: 800, color: 'var(--fo-fg)', lineHeight: 1, fontFamily: 'var(--fo-font-num)' }}>
              {formatCOP(canSpendToday)}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--fo-fg-dim)' }}>
              Hoy puedes gastar maximo {formatCOP(d.dailyAllowance)} sin pasarte.
            </p>
          </div>
          <span style={{
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background: s.bg,
            color: s.color,
            border: `1px solid ${s.border}`,
            marginTop: 2,
            whiteSpace: 'nowrap',
          }}>
            {s.msg}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid var(--fo-line-soft)' }} className="daily-kpis">
        <style>{`@media(max-width:640px){.daily-kpis{grid-template-columns:1fr!important}.daily-kpis>div{border-left:none!important;border-top:1px solid var(--fo-line-soft)}}`}</style>
        <KPICell label="Presupuesto disponible" value={formatCOP(d.plannedAvailableMoney)} sub="mes actual" />
        <KPICell label="Has gastado" value={formatCOP(d.monthlyDailySpent)} sub="gasto diario del mes" border />
        <KPICell label="Te quedan" value={formatCOP(d.remaining)} sub={`${d.monthDaysLeft} dias del mes`} border />
      </div>

      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--fo-line-soft)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--fo-fg-dim)', fontWeight: 600 }}>Gasto de hoy vs recomendado</span>
          <span style={{ fontSize: 11, color: 'var(--fo-fg-muted)', fontWeight: 700, fontFamily: 'var(--fo-font-num)' }}>
            {formatCOP(d.todaySpent)} / {formatCOP(d.dailyAllowance)}
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 999, background: 'var(--fo-surface-3)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            borderRadius: 999,
            background: s.color,
            width: `${todayPct}%`,
            transition: 'width 600ms ease',
          }} />
        </div>
      </div>

      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--fo-line-soft)' }}>
        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: 'var(--fo-fg-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Resumen rapido
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FlowRow label="Tu presupuesto disponible es de" value={d.plannedAvailableMoney} color="oklch(0.78 0.17 85)" sign="" />
          <FlowRow label="Has gastado" value={d.monthlyDailySpent} color="var(--fo-neg)" sign="-" />
          <div style={{ borderTop: '1px solid var(--fo-line-soft)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--fo-fg)' }}>Te quedan para este mes</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: d.availableMoney < 0 ? 'var(--fo-neg)' : 'var(--fo-pos)', fontFamily: 'var(--fo-font-num)' }}>
              {formatCOP(d.availableMoney)}
            </span>
          </div>
        </div>
      </div>

      {d.moneyWontLast ? (
        <div style={{ margin: '14px 16px 0', padding: '10px 14px', background: 'var(--fo-neg-soft)', border: '1px solid oklch(0.65 0.22 25 / 0.3)', borderRadius: 'var(--fo-r-md)' }}>
          <span style={{ fontSize: 12, color: 'var(--fo-neg)', fontWeight: 600 }}>
            Estas gastando mas de lo recomendado. Reduce el gasto diario para llegar al proximo pago.
          </span>
        </div>
      ) : (
        <div style={{ margin: '14px 16px 0', padding: '10px 14px', background: 'var(--fo-pos-soft)', border: '1px solid oklch(0.74 0.16 160 / 0.3)', borderRadius: 'var(--fo-r-md)' }}>
          <span style={{ fontSize: 12, color: 'var(--fo-pos)', fontWeight: 600 }}>
            Te quedan {formatCOP(d.remaining)} para el resto del periodo.
          </span>
        </div>
      )}

      <div style={{ padding: '12px 24px 16px' }}>
        <button onClick={() => navigate('/configuracion')} style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontSize: 11,
          color: 'var(--fo-fg-dim)',
          fontFamily: 'inherit',
        }}>
          Configurar modalidad de pago
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
      <p style={{ margin: '4px 0 2px', fontSize: 18, fontWeight: 800, color: 'var(--fo-fg)', lineHeight: 1, fontFamily: 'var(--fo-font-num)' }}>{value}</p>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--fo-fg-dim)' }}>{sub}</p>
    </div>
  )
}

function FlowRow({ label, value, color, sign }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, color: 'var(--fo-fg-muted)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--fo-font-num)' }}>{sign} {formatCOP(value)}</span>
    </div>
  )
}
