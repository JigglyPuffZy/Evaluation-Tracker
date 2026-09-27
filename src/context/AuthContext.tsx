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
import {
  canClearAllData,
  canDeleteImportBatch,
  canImportData,
  isReadOnlyRole,
} from '../lib/permissions'
import { supabase } from '../lib/supabase'
import {
  clearSupabaseAuthStorage,
  formatSupabaseNetworkError,
  isSupabaseNameResolutionError,
} from '../lib/supabaseEnv'
import { fetchUserProfile } from '../lib/userProfile'
import type { AppRole, UserProfile } from '../types/user'

export type AuthUser = {
  id: string
  email: string
  displayName: string
  role: AppRole
}

type AuthContextValue = {
  user: AuthUser | null
  profile: UserProfile | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  canImport: boolean
  canDeleteBatch: boolean
  canClearAll: boolean
  isReadOnly: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(user: User | null, profile: UserProfile | null): AuthUser | null {
  if (!user || !user.email) {
    return null
  }

  const displayName =
    profile?.fullName ??
    (user.email.split('@')[0] ?? 'User')
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')

  return {
    id: user.id,
    email: user.email,
    displayName,
    role: profile?.role ?? 'staff',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null)
      return
    }

    try {
      const nextProfile = await fetchUserProfile(session.user.id)
      setProfile(nextProfile)
    } catch (error) {
      console.warn('Could not load user profile:', error)
      setProfile(null)
    }
  }, [session?.user?.id])

  useEffect(() => {
    let mounted = true

    clearSupabaseAuthStorage()

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (!mounted) return
        if (error) {
          if (isSupabaseNameResolutionError(error.message)) {
            clearSupabaseAuthStorage()
            await supabase.auth.signOut({ scope: 'local' })
          }
          console.warn('Supabase session check failed:', formatSupabaseNetworkError(error.message))
          setSession(null)
          setProfile(null)
          setIsLoading(false)
          return
        }
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
      .catch(async (error: unknown) => {
        if (!mounted) return
        const message = error instanceof Error ? error.message : 'Failed to fetch'
        if (isSupabaseNameResolutionError(message)) {
          clearSupabaseAuthStorage()
          await supabase.auth.signOut({ scope: 'local' })
        }
        console.warn('Supabase session check failed:', formatSupabaseNetworkError(message))
        setSession(null)
        setProfile(null)
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
      if (!nextSession) {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null)
      return
    }

    void refreshProfile()
  }, [session?.user?.id, refreshProfile])

  const login = useCallback(async (email: string, password: string) => {
    let data
    let error

    try {
      ;({ data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      }))
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Failed to fetch'
      throw new Error(formatSupabaseNetworkError(message))
    }

    if (error) {
      throw new Error(formatSupabaseNetworkError(error.message))
    }

    if (data.user) {
      try {
        await ensureUserProfile(data.user)
      } catch {
        // Auth succeeded; profile can be created later via SQL or trigger
      }
    }
  }, [])

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
    setProfile(null)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      throw new Error('Enter your email address first.')
    }

    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (error) {
      throw new Error(formatSupabaseNetworkError(error.message))
    }
  }, [])

  const user = useMemo(() => mapUser(session?.user ?? null, profile), [session, profile])
  const role = user?.role ?? 'staff'

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      isAuthenticated: session !== null,
      isLoading,
      canImport: canImportData(role),
      canDeleteBatch: canDeleteImportBatch(role),
      canClearAll: canClearAllData(role),
      isReadOnly: isReadOnlyRole(role),
      login,
      logout,
      resetPassword,
      refreshProfile,
    }),
    [user, profile, session, isLoading, role, login, logout, resetPassword, refreshProfile],
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
