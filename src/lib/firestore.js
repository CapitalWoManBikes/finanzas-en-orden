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
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

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
}

export async function getAllMonthlyIncomes(uid) {
  const snap = await getDocs(query(collection(db, 'users', uid, 'monthlyIncome'), orderBy('year', 'desc'), orderBy('month', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
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
}

// ── Transactions ────────────────────────────────────────
export async function getTransactions(uid, month, year) {
  const snap = await getDocs(
    query(
      collection(db, 'users', uid, 'transactions'),
      where('month', '==', month),
      where('year', '==', year),
      orderBy('date', 'desc')
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addTransaction(uid, data) {
  return addDoc(collection(db, 'users', uid, 'transactions'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateTransaction(uid, txId, data) {
  await updateDoc(doc(db, 'users', uid, 'transactions', txId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTransaction(uid, txId) {
  await deleteDoc(doc(db, 'users', uid, 'transactions', txId))
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

export async function getAllMonthlySummaries(uid) {
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'monthlySummaries'), orderBy('year', 'desc'), orderBy('month', 'desc'))
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ── Admin ───────────────────────────────────────────────
export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
