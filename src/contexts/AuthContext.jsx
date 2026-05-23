import { createContext, useContext, useEffect, useState } from 'react'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { auth, db, DOMAIN } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser,  setCurrentUser]  = useState(null)
  const [userProfile,  setUserProfile]  = useState(null)
  const [loading,      setLoading]      = useState(true)

  // username → username@hrmt.store
  function toEmail(username) {
    return username.includes('@') ? username : `${username}@${DOMAIN}`
  }

  async function login(username, password) {
    const cred = await signInWithEmailAndPassword(auth, toEmail(username), password)
    // Record login event (non-blocking — don't await so login stays fast)
    addDoc(collection(db, 'login_activity'), {
      uid:          cred.user.uid,
      username:     username.trim().toLowerCase(),
      logged_in_at: serverTimestamp(),
    }).catch(() => {})
    return cred
  }

  async function logout() {
    await signOut(auth)
    setUserProfile(null)
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid))
        setUserProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
  }, [])

  const role = userProfile?.role ?? null

  const value = {
    currentUser,
    userProfile,
    role,
    loading,
    login,
    logout,
    isAdmin:      role === 'super_admin',
    isPOSManager: role === 'pos_manager',
    isAccountant: role === 'accountant',
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
