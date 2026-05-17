export function calculateMonthlySummary({ income, budget, transactions }) {
  const incomeVal = income?.income ?? 0
  const txs = transactions ?? []

  const fixedExpensesSpent = txs
    .filter((t) => t.accountType === 'fixedExpenses')
    .reduce((s, t) => s + (t.amount || 0), 0)
  const dailySpent = txs
    .filter((t) => t.accountType === 'dailySpending')
    .reduce((s, t) => s + (t.amount || 0), 0)
  const totalSaved = txs
    .filter((t) => t.accountType === 'savings')
    .reduce((s, t) => s + (t.amount || 0), 0)

  const totalSpent = fixedExpensesSpent + dailySpent + totalSaved
  const availableMoney = incomeVal - totalSpent
  const savingsRate = incomeVal > 0 ? Math.round((totalSaved / incomeVal) * 100) : 0
  const spendingRate = incomeVal > 0 ? Math.round((totalSpent / incomeVal) * 100) : 0

  const fixedExpensesBudget = budget?.fixedExpensesBudget ?? 0
  const savingsBudget = budget?.savingsBudget ?? 0
  const dailySpendingBudget = budget?.dailySpendingBudget ?? 0
  const totalBudget = fixedExpensesBudget + savingsBudget + dailySpendingBudget

  return {
    income: incomeVal,
    totalSpent,
    totalSaved,
    availableMoney,
    savingsRate,
    spendingRate,
    fixedExpensesSpent,
    dailySpent,
    fixedExpensesBudget,
    savingsBudget,
    dailySpendingBudget,
    totalBudget,
    unassignedMoney: incomeVal - totalBudget,
    isOverBudget: totalSpent > incomeVal,
    overBudgetAmount: Math.max(totalSpent - incomeVal, 0),
    accountBalances: {
      fixedExpenses: fixedExpensesBudget - fixedExpensesSpent,
      savings: savingsBudget - totalSaved,
      dailySpending: dailySpendingBudget - dailySpent,
    },
  }
}
