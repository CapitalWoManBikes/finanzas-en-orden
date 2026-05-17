import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFinance } from '../hooks/useFinance'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import { formatCOP, MONTHS, currentMonth, currentYear } from '../utils/format'
import { calculateMonthlySummary } from '../utils/financeSummary'
import { Card, KPI, Chip, Button, ProgressBar, SectionHeader, Money, Ico, ICONS } from '../components/fo'
import DailyWidget from '../components/dashboard/DailyWidget'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import Spinner from '../components/ui/Spinner'

const COLORS = ['oklch(0.66 0.20 255)', 'oklch(0.74 0.16 160)', 'oklch(0.80 0.16 80)', 'oklch(0.70 0.20 20)', 'oklch(0.74 0.16 200)', 'oklch(0.74 0.16 300)']

const ACCT_CHIP = {
  fixedExpenses: <Chip tone="accent">Gastos fijos</Chip>,
  savings:       <Chip tone="pos">Ahorro</Chip>,
  dailySpending: <Chip tone="warn">Gasto diario</Chip>,
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--fo-surface-2)', border: '1px solid var(--fo-line)', borderRadius: 12, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--fo-fg)' }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCOP(p.value)}</p>)}
    </div>
  )
}

export default function DashboardPage() {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const [month] = useState(currentMonth())
  const [year] = useState(currentYear())
  const { income, incomeEntries, budget, defaultExpenses, transactions, loading } = useFinance(month, year)

  const summary = calculateMonthlySummary({ income, incomeEntries, budget, transactions, defaultExpenses })
  const incomeVal = summary.income
  const totalSpent = summary.totalSpent
  const totalSaved = summary.totalSaved
  const available = summary.availableMoney
  const savingsRate = summary.savingsRate
  const spendRate = summary.spendingRate
  const hasActivity = transactions.length > 0
  const hasConfiguredPlan = summary.fixedExpensesBudget > 0 || summary.savingsBudget > 0

  const alerts = []
  if (incomeVal <= 0) {
    alerts.push({
      tone: 'warn',
      msg: 'No tienes ingreso registrado para este mes.',
      link: '/ingresos',
      linkLabel: 'Registrar ahora'
    })
  } else {
    if (summary.isOverBudget) {
      alerts.push({
        tone: 'neg',
        msg: `Tu saldo está en negativo por ${formatCOP(summary.overBudgetAmount)}.`,
        linkLabel: 'Revisar gastos',
        link: '/gastos'
      })
    } else if (hasActivity && spendRate > 90) {
      alerts.push({
        tone: 'neg',
        msg: `¡Atención! Has gastado el ${spendRate}% de tu presupuesto mensual.`,
        linkLabel: 'Ver Gastos',
        link: '/gastos'
      })
    } else if (hasActivity && spendRate > 70) {
      alerts.push({
        tone: 'warn',
        msg: `Cuidado: Ya has consumido el ${spendRate}% de tu ingreso.`
      })
    }

    if (!hasConfiguredPlan) {
      alerts.push({
        tone: 'warn',
        msg: 'AÃºn no tienes gastos fijos o metas configuradas. El presupuesto se calcula solo con tu ingreso.',
        linkLabel: 'Configurar',
        link: '/gastos-base'
      })
    }

    if (hasActivity && savingsRate < 10) {
      alerts.push({
        tone: 'warn',
        msg: 'Tu ahorro es menor al 10%. Considera reducir gastos diarios.',
        linkLabel: 'Optimizar',
        link: '/gastos-base'
      })
    } else if (hasActivity && savingsRate >= 15) {
      alerts.push({
        tone: 'pos',
        msg: `¡Vas genial! Has ahorrado el ${savingsRate}% de tus ingresos.`
      })
    }
  }

  const byCategory = {}
  transactions.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount })
  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))

  const barData = [
    { name: 'G. Fijos',     presupuesto: summary.fixedExpensesBudget, gastado: summary.fixedExpensesSpent },
    { name: 'Ahorro',       presupuesto: summary.savingsBudget,       gastado: summary.totalSaved },
    { name: 'Gasto diario', presupuesto: summary.dailySpendingBudget, gastado: summary.dailySpent },
  ]

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16, color: 'var(--fo-fg-dim)' }}>
        <Spinner size="lg"/>
        <p style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>Sincronizando tus finanzas...</p>
      </div>
    </AppLayout>
  )

  const firstName = userData?.name?.split(' ')[0] ?? ''

  return (
    <AppLayout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <SectionHeader
          overline={`${MONTHS[month - 1]} ${year}`}
          title={`Hola, ${firstName}`}
          subtitle="Aquí está el resumen de tus finanzas este mes."
          action={
            <Button onClick={() => navigate('/ingresos')} icon={<Ico d={ICONS.plus} size={14}/>}>
              Ingreso
            </Button>
          }
        />

        {/* Alerts */}
        {alerts.map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            padding: '11px 16px', borderRadius: 'var(--fo-r-md)',
            background: a.tone === 'neg' ? 'var(--fo-neg-soft)' : a.tone === 'warn' ? 'var(--fo-warn-soft)' : 'var(--fo-pos-soft)',
            border: `1px solid ${a.tone === 'neg' ? 'var(--fo-neg)' : a.tone === 'warn' ? 'var(--fo-warn)' : 'var(--fo-pos)'}`,
            color: a.tone === 'neg' ? 'var(--fo-neg)' : a.tone === 'warn' ? 'var(--fo-warn)' : 'var(--fo-pos)',
            fontSize: 13, fontWeight: 500, marginBottom: 10,
          }}>
            <span>{a.msg}</span>
            {a.link && <Link to={a.link} style={{ color: 'inherit', fontWeight: 700, fontSize: 12, textDecoration: 'underline' }}>{a.linkLabel}</Link>}
          </div>
        ))}

        {/* Daily Widget */}
        <div style={{ marginBottom: 20 }}>
          <DailyWidget
            income={income}
            incomeEntries={incomeEntries}
            budget={budget}
            defaultExpenses={defaultExpenses}
            transactions={transactions}
            paymentConfig={userData?.paymentConfig}
          />
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }} className="kpi-grid">
          <style>{`@media(min-width:768px){.kpi-grid{grid-template-columns:repeat(4,1fr)!important}}`}</style>
          <KPI label="Ingreso mensual" value={formatCOP(incomeVal)} accent/>
          <KPI label="Total gastado" value={formatCOP(totalSpent)} delta={spendRate > 0 ? `${spendRate}%` : undefined} deltaTone={spendRate > 80 ? 'neg' : 'warn'}/>
          <KPI label="Ahorro acumulado" value={formatCOP(totalSaved)} delta={savingsRate > 0 ? `${savingsRate}%` : undefined} deltaTone="pos"/>
          <KPI label="Saldo disponible" value={formatCOP(available)} deltaTone={available < 0 ? 'neg' : 'pos'}/>
        </div>

        {/* Progress bars */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }} className="prog-grid">
          <style>{`@media(max-width:640px){.prog-grid{grid-template-columns:1fr!important}}`}</style>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Porcentaje de gasto</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fo-fg-dim)' }}>{formatCOP(totalSpent)} de {formatCOP(incomeVal)}</p>
              </div>
              <span style={{ fontSize: 24, fontWeight: 800, color: spendRate > 90 ? 'var(--fo-neg)' : 'var(--fo-fg)', fontVariantNumeric: 'tabular-nums' }}>{spendRate}%</span>
            </div>
            <ProgressBar value={spendRate} tone={spendRate > 90 ? 'neg' : spendRate > 70 ? 'warn' : 'pos'}/>
          </Card>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Tasa de ahorro</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fo-fg-dim)' }}>{formatCOP(totalSaved)} ahorrado</p>
              </div>
              <span style={{ fontSize: 24, fontWeight: 800, color: savingsRate < 10 && incomeVal > 0 ? 'var(--fo-warn)' : 'var(--fo-fg)', fontVariantNumeric: 'tabular-nums' }}>{savingsRate}%</span>
            </div>
            <ProgressBar value={savingsRate} tone="accent"/>
          </Card>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }} className="chart-grid">
          <style>{`@media(max-width:768px){.chart-grid{grid-template-columns:1fr!important}}`}</style>
          <Card>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700 }}>Presupuesto vs Gastado</p>
            <p style={{ margin: '0 0 16px', fontSize: 11, color: 'var(--fo-fg-dim)' }}>Comparación por cuenta</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--fo-fg-dim)' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: 'var(--fo-fg-dim)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="presupuesto" fill="var(--fo-surface-3)" radius={[4, 4, 0, 0]} name="Presupuesto"/>
                <Bar dataKey="gastado" fill="oklch(0.66 0.20 255)" radius={[4, 4, 0, 0]} name="Gastado"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700 }}>Gastos por categoría</p>
            <p style={{ margin: '0 0 16px', fontSize: 11, color: 'var(--fo-fg-dim)' }}>Distribución del mes actual</p>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={65} strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v => formatCOP(v)}/>
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: 'var(--fo-fg-muted)' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--fo-fg-dim)' }}>
                <Ico d={ICONS.spend} size={32}/>
                <p style={{ margin: '10px 0 0', fontSize: 13 }}>Sin gastos registrados</p>
              </div>
            )}
          </Card>
        </div>

        {/* Recent transactions */}
        <Card padded={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--fo-line)' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>Últimos gastos</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fo-fg-dim)' }}>{transactions.length} transacciones este mes</p>
            </div>
            <Link to="/gastos" style={{ fontSize: 12, fontWeight: 600, color: 'var(--fo-accent-fg)', textDecoration: 'none' }}>
              Ver todos →
            </Link>
          </div>
          {transactions.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--fo-fg-dim)' }}>
              <Ico d={ICONS.spend} size={32}/>
              <p style={{ margin: '10px 0 6px', fontSize: 13 }}>No hay gastos registrados</p>
              <Link to="/gastos" style={{ fontSize: 12, color: 'var(--fo-accent-fg)', fontWeight: 600 }}>Registrar primer gasto</Link>
            </div>
          ) : (
            transactions.slice(0, 5).map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 20px', gap: 12,
                borderBottom: i < 4 ? '1px solid var(--fo-line-soft)' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--fo-fg-dim)' }}>{t.date}</span>
                    {ACCT_CHIP[t.accountType]}
                  </div>
                </div>
                <Money value={t.amount} style={{ fontSize: 14 }}/>
              </div>
            ))
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
