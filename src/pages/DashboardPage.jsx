import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFinance } from '../hooks/useFinance'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { formatCOP, MONTHS, currentMonth, currentYear } from '../utils/format'
import DailyWidget from '../components/dashboard/DailyWidget'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import Spinner from '../components/ui/Spinner'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

const ACCOUNT_BADGE = {
  fixedExpenses: { label: 'Gastos fijos', cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200' },
  savings: { label: 'Ahorro', cls: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200' },
  dailySpending: { label: 'Gasto diario', cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
}

function Chip({ type }) {
  const b = ACCOUNT_BADGE[type] ?? { label: type, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.cls}`}>{b.label}</span>
}

function KpiCard({ icon, value, label, accent = 'emerald', negative }) {
  const accentMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-500',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${accentMap[accent]}`}>
        {icon}
      </div>
      <p className={`text-xl lg:text-2xl font-bold tracking-tight ${negative ? 'text-red-500' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {formatCOP(p.value)}</p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { userData } = useAuth()
  const [month] = useState(currentMonth())
  const [year] = useState(currentYear())
  const { income, budget, transactions, loading } = useFinance(month, year)

  const incomeVal = income?.income ?? 0
  const totalSpent = transactions.reduce((s, t) => s + (t.amount || 0), 0)
  const totalSaved = transactions.filter((t) => t.accountType === 'savings').reduce((s, t) => s + t.amount, 0)
  const available = incomeVal - totalSpent
  const savingsRate = incomeVal > 0 ? Math.round((totalSaved / incomeVal) * 100) : 0
  const spendRate = incomeVal > 0 ? Math.round((totalSpent / incomeVal) * 100) : 0

  const hasActivity = transactions.length > 0

  const alerts = []
  if (!income) alerts.push({ type: 'warning', msg: 'No tienes ingreso registrado para este mes.', link: '/ingresos', linkLabel: 'Registrar' })
  if (hasActivity && spendRate > 90) alerts.push({ type: 'danger', msg: `Llevas el ${spendRate}% del ingreso gastado este mes.` })
  if (hasActivity && savingsRate < 10) alerts.push({ type: 'warning', msg: 'Tu tasa de ahorro es menor al 10%. Revisa tus gastos.' })
  if (hasActivity && savingsRate >= 15) alerts.push({ type: 'success', msg: `¡Excelente! Llevas un ${savingsRate}% de ahorro este mes.` })

  const byCategory = {}
  transactions.forEach((t) => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount })
  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))

  const barData = [
    { name: 'G. Fijos', presupuesto: budget?.fixedExpensesBudget ?? 0, gastado: transactions.filter((t) => t.accountType === 'fixedExpenses').reduce((s, t) => s + t.amount, 0) },
    { name: 'Ahorro', presupuesto: budget?.savingsBudget ?? 0, gastado: transactions.filter((t) => t.accountType === 'savings').reduce((s, t) => s + t.amount, 0) },
    { name: 'Gasto diario', presupuesto: budget?.dailySpendingBudget ?? 0, gastado: transactions.filter((t) => t.accountType === 'dailySpending').reduce((s, t) => s + t.amount, 0) },
  ]

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-slate-400 text-sm mt-4">Cargando datos...</p>
        </div>
      </div>
    </AppLayout>
  )

  const alertStyle = {
    danger: { bg: 'bg-red-50 border-red-200 text-red-700', icon: '🚨' },
    warning: { bg: 'bg-amber-50 border-amber-200 text-amber-700', icon: '⚠️' },
    success: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: '✅' },
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
              {MONTHS[month - 1]} {year}
            </p>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              Hola, {userData?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Aquí está el resumen de tus finanzas este mes.</p>
          </div>
          <Link
            to="/ingresos"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition text-sm shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ingreso
          </Link>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a, i) => {
              const s = alertStyle[a.type]
              return (
                <div key={i} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${s.bg}`}>
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 text-base">{s.icon}</span>
                    <span>{a.msg}</span>
                  </div>
                  {a.link && (
                    <Link to={a.link} className="flex-shrink-0 underline text-xs font-semibold opacity-80 hover:opacity-100">
                      {a.linkLabel}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Daily Widget — solo si hay ingreso y presupuesto diario configurado */}
        {income && budget?.dailySpendingBudget > 0 && (
          <DailyWidget
            income={income}
            budget={budget}
            transactions={transactions}
            paymentConfig={userData?.paymentConfig}
          />
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            accent="emerald"
            label="Ingreso mensual"
            value={formatCOP(incomeVal)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          />
          <KpiCard
            accent="red"
            label="Total gastado"
            value={formatCOP(totalSpent)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
          />
          <KpiCard
            accent="blue"
            label="Ahorro acumulado"
            value={formatCOP(totalSaved)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          />
          <KpiCard
            accent={available >= 0 ? 'amber' : 'red'}
            label="Saldo disponible"
            value={formatCOP(available)}
            negative={available < 0}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 16v-1m0-14v-.01" /></svg>}
          />
        </div>

        {/* Progress bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Porcentaje de gasto</p>
                <p className="text-xs text-slate-400">{formatCOP(totalSpent)} de {formatCOP(incomeVal)}</p>
              </div>
              <span className={`text-2xl font-bold ${spendRate > 90 ? 'text-red-500' : 'text-slate-900'}`}>{spendRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${spendRate > 90 ? 'bg-red-500' : spendRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(spendRate, 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Tasa de ahorro</p>
                <p className="text-xs text-slate-400">{formatCOP(totalSaved)} ahorrado</p>
              </div>
              <span className={`text-2xl font-bold ${savingsRate < 10 && incomeVal > 0 ? 'text-amber-500' : 'text-slate-900'}`}>{savingsRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(savingsRate, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-slate-800 mb-1">Presupuesto vs Gastado</p>
            <p className="text-xs text-slate-400 mb-4">Comparación por cuenta</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="presupuesto" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Presupuesto" />
                <Bar dataKey="gastado" fill="#10b981" radius={[4, 4, 0, 0]} name="Gastado" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-slate-800 mb-1">Gastos por categoría</p>
            <p className="text-xs text-slate-400 mb-4">Distribución del mes actual</p>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={65} strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCOP(v)} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-300">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">Sin gastos registrados</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
            <div>
              <p className="font-bold text-slate-800 text-sm">Últimos gastos</p>
              <p className="text-xs text-slate-400">{transactions.length} transacciones este mes</p>
            </div>
            <Link to="/gastos" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition">
              Ver todos →
            </Link>
          </div>
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <svg className="w-10 h-10 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-sm font-medium">No hay gastos registrados</p>
              <Link to="/gastos" className="inline-block mt-2 text-xs text-emerald-600 font-semibold hover:underline">
                Registrar primer gasto
              </Link>
            </div>
          ) : (
            <div>
              {transactions.slice(0, 5).map((t, i) => (
                <div key={t.id} className={`flex items-center justify-between px-5 py-3.5 gap-3 ${i < 4 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/60 transition`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm truncate">{t.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400">{t.date}</p>
                      <span className="text-slate-200">·</span>
                      <Chip type={t.accountType} />
                    </div>
                  </div>
                  <p className="font-bold text-slate-800 text-sm flex-shrink-0">{formatCOP(t.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  )
}
