const amount = (value) => Math.max(Number(value) || 0, 0)

const sum = (items, predicate) =>
  (items ?? []).filter(predicate).reduce((total, item) => total + amount(item.amount), 0)

export function calculateMonthlySummary({ income, budget, transactions, defaultExpenses }) {
  const incomeVal = amount(income?.income)
  const txs = transactions ?? []
  const defaults = defaultExpenses ?? []

  const activeDefaults = defaults.filter((item) => item.isActive !== false)
  const fixedDefaults = sum(activeDefaults, (item) => item.accountType === 'fixedExpenses')
  const debtDefaults = sum(activeDefaults, (item) => item.expenseType === 'deuda')
  const savingsDefaults = sum(activeDefaults, (item) => item.accountType === 'savings')

  const fixedExpensesBudget = amount(budget?.fixedExpensesBudget) || fixedDefaults
  const savingsBudget = amount(budget?.savingsBudget) || savingsDefaults
  const plannedAvailableMoney = Math.max(incomeVal - fixedExpensesBudget - savingsBudget, 0)
  const dailySpendingBudget = amount(budget?.dailySpendingBudget) || plannedAvailableMoney
  const totalBudget = fixedExpensesBudget + savingsBudget + dailySpendingBudget

  const fixedExpensesSpent = sum(txs, (t) => t.accountType === 'fixedExpenses')
  const dailySpent = sum(txs, (t) => t.accountType === 'dailySpending')
  const totalSaved = sum(txs, (t) => t.accountType === 'savings')

  const totalSpent = fixedExpensesSpent + dailySpent + totalSaved
  const availableMoney = incomeVal - totalSpent
  const savingsRate = incomeVal > 0 ? Math.round((totalSaved / incomeVal) * 100) : 0
  const spendingRate = incomeVal > 0 ? Math.round((totalSpent / incomeVal) * 100) : 0
  const dailyBudgetRemaining = dailySpendingBudget - dailySpent

  return {
    income: incomeVal,
    totalSpent,
    totalSaved,
    availableMoney,
    savingsRate,
    spendingRate,
    fixedExpensesSpent,
    dailySpent,
    fixedExpensesRegistered: fixedDefaults,
    debtCommitments: debtDefaults,
    savingsGoal: savingsBudget,
    fixedExpensesBudget,
    savingsBudget,
    dailySpendingBudget,
    totalBudget,
    plannedAvailableMoney,
    weeklyBudget: Math.round(dailySpendingBudget / 4.345),
    unassignedMoney: incomeVal - totalBudget,
    isOverBudget: totalSpent > incomeVal,
    overBudgetAmount: Math.max(totalSpent - incomeVal, 0),
    dailyBudgetRemaining,
    accountBalances: {
      fixedExpenses: fixedExpensesBudget - fixedExpensesSpent,
      savings: savingsBudget - totalSaved,
      dailySpending: dailyBudgetRemaining,
    },
  }
}
