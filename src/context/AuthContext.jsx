import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
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
    return onAuthStateChanged(auth, async (firebaseUser) => {
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
    const cred = await signInWithPopup(auth, googleProvider)
    const existing = await getUser(cred.user.uid)
    if (!existing) {
      await createUser(cred.user.uid, {
        name: cred.user.displayName,
        email: cred.user.email,
        photoURL: cred.user.photoURL,
        provider: 'google',
      })
    } else {
      await updateUser(cred.user.uid, {
        name: cred.user.displayName,
        photoURL: cred.user.photoURL,
      })
    }
    const data = await getUser(cred.user.uid)
    setUserData(data)
    return cred.user
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, userData, loading, register, login, loginWithGoogle, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
