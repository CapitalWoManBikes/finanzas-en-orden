import { Link } from 'react-router-dom'
import { calcDailyData } from '../../utils/dailyBudget'
import { formatCOP } from '../../utils/format'

const STATUS = {
  green:  { bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500', msg: '¡Vas muy bien hoy! Sigue así.' },
  yellow: { bg: 'bg-amber-500',   light: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   bar: 'bg-amber-500',   msg: 'Cuidado, estás cerca del límite diario.' },
  red:    { bg: 'bg-red-500',     light: 'bg-red-50 border-red-200',         text: 'text-red-700',     bar: 'bg-red-500',     msg: 'Superaste tu presupuesto diario.' },
}

export default function DailyWidget({ income, budget, transactions, paymentConfig }) {
  const d = calcDailyData({ income, budget, transactions, paymentConfig })
  const s = STATUS[d.status]
  const todayPct = d.dailyAllowance > 0 ? Math.min(Math.round((d.todaySpent / d.dailyAllowance) * 100), 100) : 0

  return (
    <div className={`rounded-2xl border ${s.light} overflow-hidden`}>
      {/* Hero */}
      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Presupuesto de hoy</p>
            <p className="text-3xl font-bold text-slate-900 leading-none">{formatCOP(d.dailyAllowance)}</p>
            <p className={`text-xs font-semibold mt-1 ${s.text}`}>{s.msg}</p>
          </div>
          <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${s.bg}`} />
        </div>

        {/* Progress hoy */}
        <div className="mb-1 flex justify-between text-xs text-slate-500 font-medium">
          <span>Gastado hoy</span>
          <span>{formatCOP(d.todaySpent)} / {formatCOP(d.dailyAllowance)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div className={`h-2 rounded-full transition-all ${s.bar}`} style={{ width: `${todayPct}%` }} />
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/70 rounded-xl p-3">
            <p className="text-[11px] text-slate-400 font-medium mb-0.5">Faltan para pago</p>
            <p className="text-lg font-bold text-slate-800">{d.daysLeft} días</p>
            <p className="text-[11px] text-slate-400">{d.nextPaymentDate}</p>
          </div>
          <div className="bg-white/70 rounded-xl p-3">
            <p className="text-[11px] text-slate-400 font-medium mb-0.5">Dinero disponible</p>
            <p className={`text-lg font-bold ${d.availableMoney < 0 ? 'text-red-500' : 'text-slate-800'}`}>
              {formatCOP(d.availableMoney)}
            </p>
            <p className="text-[11px] text-slate-400">este mes</p>
          </div>
        </div>
      </div>

      {/* Flujo del mes */}
      <div className="px-5 pb-4 border-t border-white/60 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Flujo del mes</p>
        <div className="space-y-2">
          <FlowRow label="Ingreso" value={d.incomeVal} color="text-emerald-600" sign="+" />
          <FlowRow label="Gastos fijos" value={d.fixedSpent} color="text-blue-600" sign="−" />
          <FlowRow label="Ahorro" value={d.savingsSpent} color="text-violet-600" sign="−" />
          <FlowRow label="Gasto diario" value={d.monthlyDailySpent} color="text-amber-600" sign="−" />
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="text-xs font-bold text-slate-700">Disponible</span>
            <span className={`text-xs font-bold ${d.availableMoney < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {formatCOP(d.availableMoney)}
            </span>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {d.moneyWontLast && (
        <div className="mx-4 mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>A este ritmo, el dinero no alcanza hasta el próximo pago.</span>
        </div>
      )}
      {!d.moneyWontLast && d.status === 'green' && d.availableMoney > 0 && (
        <div className="mx-4 mb-4 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
          <span>✅</span>
          <span>Vas bien. Tienes {formatCOP(d.remaining)} restantes para el mes.</span>
        </div>
      )}

      <div className="px-5 pb-4">
        <Link to="/configuracion" className="text-[11px] text-slate-400 hover:text-slate-600 font-medium transition">
          Configurar modalidad de pago →
        </Link>
      </div>
    </div>
  )
}

function FlowRow({ label, value, color, sign }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{sign} {formatCOP(value)}</span>
    </div>
  )
}
