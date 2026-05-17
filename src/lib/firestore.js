import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { calculateMonthlySummary } from '../utils/financeSummary'

// ── Users ──────────────────────────────────────────────
export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export async function createUser(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    role: 'user',
    supportAccess: false,
    isActive: true,
    hasCompletedOnboarding: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateUser(uid, data) {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() })
}

// ── Default Expenses ────────────────────────────────────
const expensesCol = (uid) =>
  collection(db, 'users', uid, 'initialSetup', 'defaultExpenses', 'items')

export async function getDefaultExpenses(uid) {
  const snap = await getDocs(expensesCol(uid))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addDefaultExpense(uid, data) {
  return addDoc(expensesCol(uid), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function updateDefaultExpense(uid, expenseId, data) {
  await updateDoc(doc(db, 'users', uid, 'initialSetup', 'defaultExpenses', 'items', expenseId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteDefaultExpense(uid, expenseId) {
  await deleteDoc(doc(db, 'users', uid, 'initialSetup', 'defaultExpenses', 'items', expenseId))
}

// ── Monthly Income ──────────────────────────────────────
const monthId = (month, year) => `${year}-${String(month).padStart(2, '0')}`

export async function getMonthlyIncome(uid, month, year) {
  const snap = await getDoc(doc(db, 'users', uid, 'monthlyIncome', monthId(month, year)))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function setMonthlyIncome(uid, month, year, data) {
  const id = monthId(month, year)
  const ref = doc(db, 'users', uid, 'monthlyIncome', id)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  } else {
    await setDoc(ref, { ...data, month, year, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  }
  await syncMonthlySummary(uid, month, year)
}

export async function getAllMonthlyIncomes(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'monthlyIncome'))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)
}

// ── Monthly Budget ──────────────────────────────────────
export async function getMonthlyBudget(uid, month, year) {
  const snap = await getDoc(doc(db, 'users', uid, 'monthlyBudgets', monthId(month, year)))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function setMonthlyBudget(uid, month, year, data) {
  const id = monthId(month, year)
  const ref = doc(db, 'users', uid, 'monthlyBudgets', id)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  } else {
    await setDoc(ref, { ...data, month, year, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  }
  await syncMonthlySummary(uid, month, year)
}

// ── Transactions ────────────────────────────────────────
export async function getTransactions(uid, month, year) {
  const snap = await getDocs(
    query(
      collection(db, 'users', uid, 'transactions'),
      where('month', '==', month),
      where('year', '==', year)
    )
  )
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.date > a.date ? 1 : -1))
}

export async function addTransaction(uid, data) {
  const ref = await addDoc(collection(db, 'users', uid, 'transactions'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  if (data.month && data.year) await syncMonthlySummary(uid, data.month, data.year)
  return ref
}

export async function updateTransaction(uid, txId, data) {
  const ref = doc(db, 'users', uid, 'transactions', txId)
  const before = await getDoc(ref)
  await updateDoc(doc(db, 'users', uid, 'transactions', txId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
  const oldData = before.exists() ? before.data() : null
  const monthsToSync = new Map()
  if (oldData?.month && oldData?.year) monthsToSync.set(`${oldData.year}-${oldData.month}`, { month: oldData.month, year: oldData.year })
  if (data.month && data.year) monthsToSync.set(`${data.year}-${data.month}`, { month: data.month, year: data.year })
  await Promise.all([...monthsToSync.values()].map(({ month, year }) => syncMonthlySummary(uid, month, year)))
}

export async function deleteTransaction(uid, txId) {
  const ref = doc(db, 'users', uid, 'transactions', txId)
  const before = await getDoc(ref)
  await deleteDoc(ref)
  const data = before.exists() ? before.data() : null
  if (data?.month && data?.year) await syncMonthlySummary(uid, data.month, data.year)
}

// ── Monthly Summary ─────────────────────────────────────
export async function setMonthlySummary(uid, month, year, data) {
  const id = monthId(month, year)
  await setDoc(
    doc(db, 'users', uid, 'monthlySummaries', id),
    { ...data, month, year, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export async function syncMonthlySummary(uid, month, year) {
  const [income, budget, transactions] = await Promise.all([
    getMonthlyIncome(uid, month, year),
    getMonthlyBudget(uid, month, year),
    getTransactions(uid, month, year),
  ])

  const summary = calculateMonthlySummary({ income, budget, transactions })
  await setMonthlySummary(uid, month, year, summary)
  return summary
}

export async function getAllMonthlySummaries(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'monthlySummaries'))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)
}

// ── Admin ───────────────────────────────────────────────
export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
