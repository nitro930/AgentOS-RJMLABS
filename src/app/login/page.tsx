'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, User, Eye, EyeOff, Loader2, Zap } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuthResponse {
  user?: {
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
  session?: {
    id: string
    token: string
    expiresAt: string
  }
  error?: string
}

// ─── Animated Grid Background ────────────────────────────────────────────────
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#0f1117_70%)]" />

      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Animated scan line */}
      <motion.div
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-emerald-500/20"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: 0,
          }}
          animate={{
            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 5,
          }}
        />
      ))}

      {/* Glow orbs */}
      <motion.div
        className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-emerald-500/5 blur-[100px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-emerald-500/5 blur-[100px]"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// ─── Main Login Page ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // If already authenticated, redirect to home
    const token = localStorage.getItem('agentos_token')
    if (token) {
      router.push('/')
    }
  }, [router])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setLoading(true)

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        })

        const data: AuthResponse = await res.json()

        if (!res.ok) {
          setError(data.error || 'Authentication failed')
          setLoading(false)
          return
        }

        if (data.session?.token) {
          localStorage.setItem('agentos_token', data.session.token)
          localStorage.setItem('agentos_session_id', data.session.id)
          localStorage.setItem('agentos_session_expires', data.session.expiresAt)

          if (data.user) {
            localStorage.setItem('agentos_user', JSON.stringify(data.user))
          }

          if (rememberMe) {
            localStorage.setItem('agentos_remember', 'true')
          }

          router.push('/')
        } else {
          setError('Invalid server response')
        }
      } catch {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [username, password, rememberMe, router]
  )

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4 relative overflow-hidden">
      <GridBackground />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Login Card */}
        <div className="bg-[#1a1b2e]/80 backdrop-blur-xl border border-[#2d2e3d] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Top accent line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

          <div className="p-8">
            {/* Logo Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <Zap className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                RJMLABS.CO.UK
              </h1>
              <p className="text-[#9ca3af] text-sm mt-1 font-medium">
                AgentOS Platform
              </p>
            </motion.div>

            {/* Error Display */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <label
                  htmlFor="username"
                  className="block text-[#9ca3af] text-xs font-medium mb-1.5 uppercase tracking-wider"
                >
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                    disabled={loading}
                    className="w-full bg-[#0f1117]/60 border border-[#2d2e3d] rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors disabled:opacity-50"
                  />
                </div>
              </motion.div>

              {/* Password Input */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <label
                  htmlFor="password"
                  className="block text-[#9ca3af] text-xs font-medium mb-1.5 uppercase tracking-wider"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full bg-[#0f1117]/60 border border-[#2d2e3d] rounded-lg pl-10 pr-10 py-2.5 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#9ca3af] transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="w-3.5 h-3.5 rounded border-[#2d2e3d] bg-[#0f1117]/60 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 focus:ring-1 accent-emerald-500 disabled:opacity-50"
                  />
                  <span className="text-[#9ca3af] text-xs group-hover:text-[#d1d5db] transition-colors">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-emerald-400/70 text-xs hover:text-emerald-400 transition-colors"
                  tabIndex={-1}
                >
                  Forgot password?
                </button>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <button
                  type="submit"
                  disabled={loading || !username.trim() || !password}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/30 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Sign In
                    </>
                  )}
                </button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="relative mt-6 mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2d2e3d]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#1a1b2e] text-[#4b5563]">
                  Secure Access
                </span>
              </div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-center"
            >
              <p className="text-[#4b5563] text-[10px] font-mono">
                RJMLABS.CO.UK &middot; AgentOS v1.0.0
              </p>
              <p className="text-[#3b3f4a] text-[10px] font-mono mt-0.5">
                256-bit encrypted session
              </p>
            </motion.div>
          </div>
        </div>

        {/* Subtle reflection */}
        <div className="h-8 bg-gradient-to-b from-[#1a1b2e]/20 to-transparent blur-sm -mt-1 rounded-b-2xl" />
      </motion.div>
    </div>
  )
}
