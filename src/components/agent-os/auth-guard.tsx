'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthUser {
  id: string
  username: string
  email?: string | null
  displayName?: string | null
  avatarUrl?: string | null
  roleId?: string | null
  status: string
  role?: {
    id: string
    name: string
    color: string
    permissions: { resource: string; actions: string }[]
  } | null
}

interface AuthContextValue {
  isAuthenticated: boolean
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const TOKEN_KEY = 'agentos_token'
const USER_KEY = 'agentos_user'
const SESSION_ID_KEY = 'agentos_session_id'
const SESSION_EXPIRES_KEY = 'agentos_session_expires'
const REMEMBER_KEY = 'agentos_remember'

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider / Guard ────────────────────────────────────────────────────────

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount, check localStorage for existing session
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      const storedUser = localStorage.getItem(USER_KEY)
      const storedExpires = localStorage.getItem(SESSION_EXPIRES_KEY)

      if (storedToken) {
        // Check if session has expired
        if (storedExpires) {
          const expiresAt = new Date(storedExpires)
          if (expiresAt.getTime() < Date.now()) {
            // Session expired, clear it
            clearAuthStorage()
            router.push('/login')
            setLoading(false)
            return
          }
        }

        setToken(storedToken)

        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
          } catch {
            localStorage.removeItem(USER_KEY)
          }
        }
      } else {
        // No token, redirect to login
        router.push('/login')
      }
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  const login = useCallback(
    async (username: string, password: string, rememberMe = false) => {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      if (data.session?.token) {
        localStorage.setItem(TOKEN_KEY, data.session.token)
        localStorage.setItem(SESSION_ID_KEY, data.session.id)
        localStorage.setItem(SESSION_EXPIRES_KEY, data.session.expiresAt)

        if (data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user))
          setUser(data.user)
        }

        setToken(data.session.token)

        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, 'true')
        }

        router.push('/')
      } else {
        throw new Error('Invalid server response')
      }
    },
    [router]
  )

  const logout = useCallback(async () => {
    try {
      // Call the logout API to invalidate the session server-side
      const currentToken = localStorage.getItem(TOKEN_KEY)
      if (currentToken) {
        await fetch('/api/auth', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentToken }),
        }).catch(() => {
          // Silently handle network errors on logout
        })
      }
    } finally {
      clearAuthStorage()
      setUser(null)
      setToken(null)
      router.push('/login')
    }
  }, [router])

  // Show nothing while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-[#6b7280] text-xs font-mono">Initializing...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render children
  if (!token) {
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        user,
        token,
        loading: false,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthGuard')
  }
  return context
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(SESSION_ID_KEY)
  localStorage.removeItem(SESSION_EXPIRES_KEY)
  // Keep the remember preference
}
