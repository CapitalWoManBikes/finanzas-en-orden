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

export function calcDailyData({ income, budget, transactions, paymentConfig }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const incomeVal = income?.income ?? 0
  const dailyBudget = budget?.dailySpendingBudget ?? 0

  const dailyTxs = transactions.filter((t) => t.accountType === 'dailySpending')
  const fixedTxs = transactions.filter((t) => t.accountType === 'fixedExpenses')
  const savingsTxs = transactions.filter((t) => t.accountType === 'savings')

  const monthlyDailySpent = dailyTxs.reduce((s, t) => s + (t.amount || 0), 0)
  const fixedSpent = fixedTxs.reduce((s, t) => s + (t.amount || 0), 0)
  const savingsSpent = savingsTxs.reduce((s, t) => s + (t.amount || 0), 0)
  const todaySpent = dailyTxs
    .filter((t) => t.date === todayStr)
    .reduce((s, t) => s + (t.amount || 0), 0)

  const daysLeft = getDaysUntilPayment(paymentConfig)
  const remaining = Math.max(dailyBudget - monthlyDailySpent, 0)
  const dailyAllowance = daysLeft > 0 ? Math.round(remaining / daysLeft) : 0
  const availableMoney = incomeVal - fixedSpent - savingsSpent - monthlyDailySpent

  let status = 'green'
  if (dailyAllowance > 0 && todaySpent > dailyAllowance * 1.5) status = 'red'
  else if (dailyAllowance > 0 && todaySpent > dailyAllowance) status = 'yellow'

  const moneyWontLast = remaining < dailyAllowance * daysLeft * 0.5 && dailyAllowance > 0

  return {
    dailyAllowance,
    todaySpent,
    daysLeft,
    nextPaymentDate: formatNextPaymentDate(paymentConfig),
    remaining,
    availableMoney,
    monthlyDailySpent,
    dailyBudget,
    incomeVal,
    fixedSpent,
    savingsSpent,
    status,
    moneyWontLast,
  }
}
