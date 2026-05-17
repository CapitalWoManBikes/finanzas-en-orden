import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { getUser, createUser, updateUser } from '../lib/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let authUnsubscribe = null

    const init = async () => {
      // Await redirect result FIRST so the Firestore doc exists before onAuthStateChanged fires
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          const existing = await getUser(result.user.uid)
          if (!existing) {
            await createUser(result.user.uid, {
              name: result.user.displayName,
              email: result.user.email,
              photoURL: result.user.photoURL,
              provider: 'google',
            })
          } else {
            await updateUser(result.user.uid, {
              name: result.user.displayName,
              photoURL: result.user.photoURL,
            })
          }
        }
      } catch (e) {
        console.error('Redirect result error:', e)
      }

      // Subscribe after redirect handling so getUser finds the doc already created
      authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const data = await getUser(firebaseUser.uid)
          setUser(firebaseUser)
          setUserData(data)
        } else {
          setUser(null)
          setUserData(null)
        }
        setLoading(false)
      })
    }

    init()

    return () => {
      if (authUnsubscribe) authUnsubscribe()
    }
  }, [])

  const refreshUserData = async () => {
    if (!user) return
    const data = await getUser(user.uid)
    setUserData(data)
    return data
  }

  const register = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await createUser(cred.user.uid, { name, email, photoURL: null, provider: 'email' })
    const data = await getUser(cred.user.uid)
    setUserData(data)
    return cred.user
  }

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const data = await getUser(cred.user.uid)
    setUserData(data)
    return cred.user
  }

  const loginWithGoogle = async () => {
    await signInWithRedirect(auth, googleProvider)
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, userData, loading, register, login, loginWithGoogle, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
