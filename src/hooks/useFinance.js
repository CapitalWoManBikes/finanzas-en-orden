import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getMonthlyIncome,
  getMonthlyBudget,
  getTransactions,
  syncMonthlySummary,
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

      if (inc) await syncMonthlySummary(user.uid, month, year)
    } catch (err) {
      console.error('useFinance error:', err)
    } finally {
      setLoading(false)
    }
  }, [user, month, year])

  useEffect(() => { load() }, [load])

  return { income, budget, transactions, loading, reload: load }
}
