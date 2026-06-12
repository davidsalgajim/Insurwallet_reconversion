'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from 'firebase/auth'

import {
  clearServerSession,
  createServerSession,
} from '@/lib/firebase/session-cookie'

type AuthContextValue = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    void (async () => {
      const [{ auth }, { onAuthStateChanged }] = await Promise.all([
        import('@/lib/firebase/client'),
        import('firebase/auth'),
      ])

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser)

        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken()
            await createServerSession(token)
          } catch {
            await clearServerSession().catch(() => undefined)
            const [{ auth }, { signOut: firebaseSignOut }] = await Promise.all([
              import('@/lib/firebase/client'),
              import('firebase/auth'),
            ])
            await firebaseSignOut(auth)
            setUser(null)
          }
        } else {
          await clearServerSession().catch(() => undefined)
        }

        setLoading(false)
      })
    })()

    return () => {
      unsubscribe?.()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
