import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFinance } from '../hooks/useFinance'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { formatCOP, MONTHS, currentMonth, currentYear } from '../utils/format'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import Spinner from '../components/ui/Spinner'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

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

  // Alerts
  const alerts = []
  if (!income) alerts.push({ type: 'warning', msg: 'No tienes ingreso registrado para este mes.' })
  if (spendRate > 90) alerts.push({ type: 'danger', msg: `Llevas el ${spendRate}% del ingreso gastado.` })
  if (savingsRate < 10 && incomeVal > 0) alerts.push({ type: 'warning', msg: 'Tu tasa de ahorro es menor al 10%.' })
  if (available > 0 && incomeVal > 0) alerts.push({ type: 'success', msg: `Tienes ${formatCOP(available)} sin gastar. ¡Considera ahorrar!` })

  // Pie chart by category
  const byCategory = {}
  transactions.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
  })
  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))

  // Bar chart: budget vs spent
  const barData = [
    { name: 'G. Fijos', presupuesto: budget?.fixedExpensesBudget ?? 0, gastado: transactions.filter((t) => t.accountType === 'fixedExpenses').reduce((s, t) => s + t.amount, 0) },
    { name: 'Ahorro', presupuesto: budget?.savingsBudget ?? 0, gastado: transactions.filter((t) => t.accountType === 'savings').reduce((s, t) => s + t.amount, 0) },
    { name: 'Gasto diario', presupuesto: budget?.dailySpendingBudget ?? 0, gastado: transactions.filter((t) => t.accountType === 'dailySpending').reduce((s, t) => s + t.amount, 0) },
  ]

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500">{MONTHS[month - 1]} {year} · Hola, {userData?.name?.split(' ')[0]} 👋</p>
          </div>
          <Link to="/ingresos" className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition text-sm">
            + Registrar ingreso
          </Link>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2 mb-6">
            {alerts.map((a, i) => (
              <div key={i} className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                a.type === 'danger' ? 'bg-red-50 text-red-700 border border-red-200' :
                a.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {a.type === 'danger' ? '🚨' : a.type === 'warning' ? '⚠️' : '✅'} {a.msg}
              </div>
            ))}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Ingreso mensual', value: formatCOP(incomeVal), icon: '💵', color: 'emerald' },
            { label: 'Total gastado', value: formatCOP(totalSpent), icon: '💳', color: 'blue' },
            { label: 'Ahorro acumulado', value: formatCOP(totalSaved), icon: '🏦', color: 'purple' },
            { label: 'Saldo disponible', value: formatCOP(available), icon: '💰', color: available >= 0 ? 'green' : 'red' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-2xl mb-2">{card.icon}</p>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              <p className="text-sm text-slate-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-slate-500 mb-1">% Gasto sobre ingreso</p>
            <p className="text-2xl font-bold text-slate-800 mb-3">{spendRate}%</p>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${spendRate > 90 ? 'bg-red-500' : spendRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(spendRate, 100)}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-slate-500 mb-1">% Ahorro sobre ingreso</p>
            <p className="text-2xl font-bold text-slate-800 mb-3">{savingsRate}%</p>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(savingsRate, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-slate-700 mb-4">Presupuesto vs Gastado</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v) => formatCOP(v)} />
                <Bar dataKey="presupuesto" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Presupuesto" />
                <Bar dataKey="gastado" fill="#10b981" radius={[4, 4, 0, 0]} name="Gastado" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-slate-700 mb-4">Gastos por categoría</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCOP(v)} />
                  <Legend iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Sin gastos registrados</div>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-slate-700">Últimos gastos</h3>
            <Link to="/gastos" className="text-sm text-emerald-600 hover:underline">Ver todos</Link>
          </div>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">No hay gastos registrados este mes.</p>
              <Link to="/gastos" className="inline-block mt-3 text-sm text-emerald-600 hover:underline">Registrar gasto</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex justify-between items-center px-5 py-3">
                  <div>
                    <p className="font-medium text-slate-700 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.category} · {t.date}</p>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{formatCOP(t.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
