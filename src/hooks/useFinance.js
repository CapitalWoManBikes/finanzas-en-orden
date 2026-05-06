import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getMonthlyIncome,
  getMonthlyBudget,
  getTransactions,
  setMonthlySummary,
} from '../lib/firestore'
import { currentMonth, currentYear } from '../utils/format'

export function useFinance(month = currentMonth(), year = currentYear()) {
  const { user } = useAuth()
  const [income, setIncome] = useState(null)
  const [budget, setBudget] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [inc, bud, txs] = await Promise.all([
        getMonthlyIncome(user.uid, month, year),
        getMonthlyBudget(user.uid, month, year),
        getTransactions(user.uid, month, year),
      ])
      setIncome(inc)
      setBudget(bud)
      setTransactions(txs)

      if (inc) {
        const totalSpent = txs.reduce((s, t) => s + (t.amount || 0), 0)
        const totalSaved = txs.filter((t) => t.accountType === 'savings').reduce((s, t) => s + t.amount, 0)
        await setMonthlySummary(user.uid, month, year, {
          income: inc.income,
          totalSpent,
          totalSaved,
          availableMoney: inc.income - totalSpent,
          savingsRate: inc.income > 0 ? Math.round((totalSaved / inc.income) * 100) : 0,
          fixedExpensesSpent: txs.filter((t) => t.accountType === 'fixedExpenses').reduce((s, t) => s + t.amount, 0),
          dailySpent: txs.filter((t) => t.accountType === 'dailySpending').reduce((s, t) => s + t.amount, 0),
        })
      }
    } catch (err) {
      console.error('useFinance error:', err)
    } finally {
      setLoading(false)
    }
  }, [user, month, year])

  useEffect(() => { load() }, [load])

  return { income, budget, transactions, loading, reload: load }
}
