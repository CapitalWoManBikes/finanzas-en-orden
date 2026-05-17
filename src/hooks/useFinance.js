import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getMonthlyIncome,
  getIncomeEntries,
  getMonthlyBudget,
  getDefaultExpenses,
  getTransactions,
  syncMonthlySummary,
} from '../lib/firestore'
import { currentMonth, currentYear } from '../utils/format'

export function useFinance(month = currentMonth(), year = currentYear()) {
  const { user } = useAuth()
  const [income, setIncome] = useState(null)
  const [budget, setBudget] = useState(null)
  const [incomeEntries, setIncomeEntries] = useState([])
  const [defaultExpenses, setDefaultExpenses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [inc, entries, bud, defaults, txs] = await Promise.all([
        getMonthlyIncome(user.uid, month, year),
        getIncomeEntries(user.uid, month, year),
        getMonthlyBudget(user.uid, month, year),
        getDefaultExpenses(user.uid),
        getTransactions(user.uid, month, year),
      ])
      setIncome(inc)
      setIncomeEntries(entries)
      setBudget(bud)
      setDefaultExpenses(defaults)
      setTransactions(txs)

      if (inc || entries.length > 0) await syncMonthlySummary(user.uid, month, year)
    } catch (err) {
      console.error('useFinance error:', err)
    } finally {
      setLoading(false)
    }
  }, [user, month, year])

  useEffect(() => { load() }, [load])

  return { income, incomeEntries, budget, defaultExpenses, transactions, loading, reload: load }
}
