import { calculateMonthlySummary } from './financeSummary'

export function getNextPaymentDate(config = {}) {
  const { mode = 'monthly', payDay = 1, firstQuincena = 1, secondQuincena = 16 } = config
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const y = today.getFullYear()
  const m = today.getMonth()

  if (mode === 'monthly') {
    let next = new Date(y, m, payDay)
    if (next <= today) next = new Date(y, m + 1, payDay)
    return next
  }

  const candidates = [
    new Date(y, m, firstQuincena),
    new Date(y, m, secondQuincena),
    new Date(y, m + 1, firstQuincena),
    new Date(y, m + 1, secondQuincena),
  ].filter((d) => d > today).sort((a, b) => a - b)
  return candidates[0] ?? new Date(y, m + 1, firstQuincena)
}

export function getDaysUntilPayment(config) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next = getNextPaymentDate(config)
  return Math.max(Math.round((next - today) / 86400000), 1)
}

export function formatNextPaymentDate(config) {
  const next = getNextPaymentDate(config)
  return next.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
}

export function getDaysLeftInMonth() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  lastDay.setHours(0, 0, 0, 0)
  return Math.max(Math.round((lastDay - today) / 86400000) + 1, 1)
}

export function calcDailyData({ income, incomeEntries, budget, transactions = [], paymentConfig, defaultExpenses }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const summary = calculateMonthlySummary({ income, incomeEntries, budget, transactions, defaultExpenses })
  const incomeVal = summary.income
  const dailyBudget = summary.dailySpendingBudget

  const dailyTxs = transactions.filter((t) => t.accountType === 'dailySpending')

  const monthlyDailySpent = summary.dailySpent
  const fixedSpent = summary.fixedExpensesSpent
  const savingsSpent = summary.totalSaved
  const todaySpent = dailyTxs
    .filter((t) => t.date === todayStr)
    .reduce((s, t) => s + (t.amount || 0), 0)

  const daysLeft = getDaysUntilPayment(paymentConfig)
  const monthDaysLeft = getDaysLeftInMonth()
  const remaining = Math.max(summary.dailyBudgetRemaining, 0)
  const dailyAllowance = monthDaysLeft > 0 ? Math.round(remaining / monthDaysLeft) : 0
  const weeklyAllowance = Math.round(remaining / Math.max(daysLeft / 7, 1))
  const availableMoney = summary.availableMoney

  let status = 'green'
  if (!incomeVal || availableMoney < 0 || (dailyAllowance > 0 && todaySpent > dailyAllowance * 1.5)) status = 'red'
  else if (dailyAllowance > 0 && todaySpent > dailyAllowance) status = 'yellow'

  const moneyWontLast = incomeVal > 0 && (availableMoney < 0 || todaySpent > dailyAllowance)

  return {
    dailyAllowance,
    weeklyAllowance,
    todaySpent,
    daysLeft,
    monthDaysLeft,
    nextPaymentDate: formatNextPaymentDate(paymentConfig),
    remaining,
    availableMoney,
    monthlyDailySpent,
    dailyBudget,
    incomeVal,
    expectedIncome: summary.expectedIncome,
    projectedIncome: summary.projectedIncome,
    totalSpent: summary.totalSpent,
    fixedSpent,
    savingsSpent,
    fixedExpensesRegistered: summary.fixedExpensesRegistered,
    savingsGoal: summary.savingsGoal,
    plannedAvailableMoney: summary.plannedAvailableMoney,
    status,
    moneyWontLast,
  }
}
