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
    // Handle redirect result in parallel — don't block onAuthStateChanged
    getRedirectResult(auth).catch((e) => console.error('Redirect result error:', e))

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let data = await getUser(firebaseUser.uid)

        if (!data) {
          // New Google user or redirect result not yet processed — create doc now
          await createUser(firebaseUser.uid, {
            name: firebaseUser.displayName ?? firebaseUser.email,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL ?? null,
            provider: firebaseUser.providerData?.[0]?.providerId ?? 'google',
          })
          data = await getUser(firebaseUser.uid)
        }

        setUser(firebaseUser)
        setUserData(data)
      } else {
        setUser(null)
        setUserData(null)
      }
      setLoading(false)
    })

    return unsubscribe
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
