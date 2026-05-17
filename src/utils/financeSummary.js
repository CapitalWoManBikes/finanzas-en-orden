const amount = (value) => Math.max(Number(value) || 0, 0)

const sum = (items, predicate) =>
  (items ?? []).filter(predicate).reduce((total, item) => total + amount(item.amount), 0)

export function calculateMonthlySummary({ income, incomeEntries, budget, transactions, defaultExpenses }) {
  const entries = incomeEntries ?? []
  const confirmedIncome = sum(entries, (entry) => (entry.status ?? 'confirmed') === 'confirmed')
  const expectedIncome = sum(entries, (entry) => entry.status === 'expected')
  const incomeVal = entries.length > 0 ? confirmedIncome : amount(income?.income)
  const projectedIncome = incomeVal + expectedIncome
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
    expectedIncome,
    projectedIncome,
    hasIncomeEntries: entries.length > 0,
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
