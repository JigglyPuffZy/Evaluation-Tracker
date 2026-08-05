import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { ensureUserProfile } from '../lib/ensureUserProfile'
import { supabase } from '../lib/supabase'

export type AuthUser = {
  id: string
  email: string
  displayName: string
}

type AuthContextValue = {
  user: AuthUser | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(user: User | null): AuthUser | null {
  if (!user || !user.email) {
    return null
  }

  const local = user.email.split('@')[0] ?? 'User'
  const displayName = local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return {
    id: user.id,
    email: user.email,
    displayName,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      if (data.session?.user) {
        try {
          await ensureUserProfile(data.session.user)
        } catch {
          // Profile may already exist from SQL backfill
        }
      }
      setSession(data.session)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (nextSession?.user) {
        try {
          await ensureUserProfile(nextSession.user)
        } catch {
          // ignore duplicate profile
        }
      }
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (data.user) {
      await ensureUserProfile(data.user)
    }
  }, [])

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  }, [])

  const user = useMemo(() => mapUser(session?.user ?? null), [session])

  const value = useMemo(
    () => ({
      user,
      session,
      isAuthenticated: session !== null,
      isLoading,
      login,
      logout,
    }),
    [user, session, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
