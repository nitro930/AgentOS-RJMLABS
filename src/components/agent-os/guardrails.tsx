'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Ban,
  Eye,
  Filter,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  AlertTriangle,
} from 'lucide-react'

// Types
interface Guardrail {
  id: string
  name: string
  description: string | null
  type: string
  category: string
  isActive: boolean
  severity: string
  action: string
  conditions: string
  patterns: string
  rateLimitRps: number | null
  rateLimitRpm: number | null
  dailyLimit: number | null
  redirectTarget: string | null
  agentId: string | null
  tags: string
  hitCount: number
  lastHitAt: string | null
  createdAt: string
  updatedAt: string
  _count?: { violations: number }
}

interface GuardrailViolation {
  id: string
  guardrailId: string
  agentId: string | null
  type: string
  input: string | null
  output: string | null
  action: string
  severity: string
  isResolved: boolean
  resolvedBy: string | null
  resolvedAt: string | null
  metadata: string
  createdAt: string
  guardrail?: { name: string; type: string }
}

interface ContentPolicy {
  id: string
  name: string
  description: string | null
  type: string
  rules: string
  isActive: boolean
  agentId: string | null
  violationCount: number
  lastViolationAt: string | null
  createdAt: string
  updatedAt: string
}

type TabId = 'guardrails' | 'violations' | 'policies'

const TYPE_COLORS: Record<string, string> = {
  input_filter: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  output_filter: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  rate_limit: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  content_policy: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  scope_restriction: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cost_limit: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  time_restriction: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const ACTION_COLORS: Record<string, string> = {
  block: 'bg-red-500/20 text-red-400 border-red-500/30',
  warn: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  log: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  redirect: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  sanitize: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const CATEGORY_COLORS: Record<string, string> = {
  safety: 'bg-red-500/10 text-red-400',
  compliance: 'bg-amber-500/10 text-amber-400',
  performance: 'bg-emerald-500/10 text-emerald-400',
  cost: 'bg-orange-500/10 text-orange-400',
  privacy: 'bg-purple-500/10 text-purple-400',
}

const POLICY_TYPE_COLORS: Record<string, string> = {
  blocklist: 'bg-red-500/20 text-red-400 border-red-500/30',
  allowlist: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  pii_filter: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  toxicity: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  custom: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

export function Guardrails() {
  const [activeTab, setActiveTab] = useState<TabId>('guardrails')
  const [guardrails, setGuardrails] = useState<Guardrail[]>([])
  const [violations, setViolations] = useState<GuardrailViolation[]>([])
  const [policies, setPolicies] = useState<ContentPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [resolvedFilter, setResolvedFilter] = useState<string>('all')
  const [showCreateGuardrail, setShowCreateGuardrail] = useState(false)
  const [showCreatePolicy, setShowCreatePolicy] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state for new guardrail
  const [guardrailForm, setGuardrailForm] = useState({
    name: '',
    description: '',
    type: 'input_filter',
    category: 'safety',
    severity: 'medium',
    action: 'block',
    patterns: '',
    conditions: '',
    rateLimitRps: '',
    rateLimitRpm: '',
    dailyLimit: '',
    redirectTarget: '',
  })

  // Form state for new content policy
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    type: 'blocklist',
    rulesText: '',
  })

  const fetchGuardrails = useCallback(async () => {
    try {
      const res = await fetch('/api/guardrails')
      if (res.ok) {
        const data = await res.json()
        setGuardrails(data)
      }
    } catch {}
  }, [])

  const fetchViolations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (severityFilter !== 'all') params.set('severity', severityFilter)
      if (resolvedFilter !== 'all') params.set('isResolved', resolvedFilter === 'resolved' ? 'true' : 'false')
      const res = await fetch(`/api/guardrails/violations?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setViolations(data)
      }
    } catch {}
  }, [severityFilter, resolvedFilter])

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await fetch('/api/content-policies')
      if (res.ok) {
        const data = await res.json()
        setPolicies(data)
      }
    } catch {}
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchGuardrails(), fetchViolations(), fetchPolicies()]).finally(() => setLoading(false))
  }, [fetchGuardrails, fetchViolations, fetchPolicies])

  const handleToggleGuardrail = async (id: string, currentActive: boolean) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/guardrails/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (res.ok) {
        await fetchGuardrails()
      }
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const handleDeleteGuardrail = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/guardrails/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchGuardrails()
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const handleCreateGuardrail = async () => {
    try {
      const body: Record<string, unknown> = {
        name: guardrailForm.name,
        description: guardrailForm.description || null,
        type: guardrailForm.type,
        category: guardrailForm.category,
        severity: guardrailForm.severity,
        action: guardrailForm.action,
      }
      if (guardrailForm.patterns) {
        try { body.patterns = JSON.parse(guardrailForm.patterns) } catch { body.patterns = guardrailForm.patterns.split(',').map(p => p.trim()) }
      }
      if (guardrailForm.conditions) {
        try { body.conditions = JSON.parse(guardrailForm.conditions) } catch { body.conditions = {} }
      }
      if (guardrailForm.rateLimitRps) body.rateLimitRps = parseInt(guardrailForm.rateLimitRps)
      if (guardrailForm.rateLimitRpm) body.rateLimitRpm = parseInt(guardrailForm.rateLimitRpm)
      if (guardrailForm.dailyLimit) body.dailyLimit = parseInt(guardrailForm.dailyLimit)
      if (guardrailForm.redirectTarget) body.redirectTarget = guardrailForm.redirectTarget

      const res = await fetch('/api/guardrails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowCreateGuardrail(false)
        setGuardrailForm({
          name: '', description: '', type: 'input_filter', category: 'safety',
          severity: 'medium', action: 'block', patterns: '', conditions: '',
          rateLimitRps: '', rateLimitRpm: '', dailyLimit: '', redirectTarget: '',
        })
        await fetchGuardrails()
      }
    } catch {}
  }

  const handleResolveViolation = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/guardrails/violations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true, resolvedBy: 'operator' }),
      })
      if (res.ok) await fetchViolations()
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const handleCreatePolicy = async () => {
    try {
      const body: Record<string, unknown> = {
        name: policyForm.name,
        description: policyForm.description || null,
        type: policyForm.type,
      }
      if (policyForm.rulesText) {
        try { body.rules = JSON.parse(policyForm.rulesText) } catch {
          body.rules = policyForm.rulesText.split('\n').filter(r => r.trim()).map(r => ({
            pattern: r.trim(),
            action: 'block',
            replacement: '',
          }))
        }
      }

      const res = await fetch('/api/content-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowCreatePolicy(false)
        setPolicyForm({ name: '', description: '', type: 'blocklist', rulesText: '' })
        await fetchPolicies()
      }
    } catch {}
  }

  const handleDeletePolicy = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/content-policies/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchPolicies()
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const handleTogglePolicy = async (id: string, currentActive: boolean) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/content-policies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (res.ok) await fetchPolicies()
    } catch {} finally {
      setActionLoading(null)
    }
  }

  // Stats
  const activeGuardrails = guardrails.filter(g => g.isActive).length
  const violationsToday = violations.filter(v => {
    const created = new Date(v.createdAt)
    const now = new Date()
    return created.toDateString() === now.toDateString()
  }).length
  const blockedActions = violations.filter(v => v.action === 'block').length
  const totalViolations = violations.length
  const resolvedViolations = violations.filter(v => v.isResolved).length
  const complianceScore = totalViolations > 0 ? Math.round((resolvedViolations / totalViolations) * 100) : 100

  // Filtered data
  const filteredGuardrails = guardrails.filter(g => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return g.name.toLowerCase().includes(q) || g.type.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
            Guardrails
          </h2>
          <p className="text-sm text-[#6b7280] mt-1">Safety constraints, output filtering & content policies</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-[#6b7280]">Active Guardrails</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{activeGuardrails}</p>
          <p className="text-[10px] text-[#6b7280] mt-1">of {guardrails.length} total</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span className="text-xs text-[#6b7280]">Violations Today</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{violationsToday}</p>
          <p className="text-[10px] text-[#6b7280] mt-1">{totalViolations} total violations</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Ban className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-[#6b7280]">Blocked Actions</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">{blockedActions}</p>
          <p className="text-[10px] text-[#6b7280] mt-1">actions intercepted</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-[#6b7280]">Compliance Score</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">{complianceScore}%</p>
          <div className="mt-1.5 h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${complianceScore >= 80 ? 'bg-emerald-500' : complianceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${complianceScore}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a1b2e] p-1 rounded-lg border border-[#2d2e3d]">
        {([
          { id: 'guardrails' as TabId, label: 'Guardrails', icon: ShieldAlert },
          { id: 'violations' as TabId, label: 'Violations', icon: AlertOctagon },
          { id: 'policies' as TabId, label: 'Content Policies', icon: Filter },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                : 'text-[#6b7280] hover:text-white hover:bg-[#252636]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.id === 'violations' && violationsToday > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[9px] rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                {violationsToday}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Guardrails Tab */}
      {activeTab === 'guardrails' && (
        <div className="space-y-4">
          {/* Search + Create */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#6b7280] flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search guardrails..."
                className="w-full px-3 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <button
              onClick={() => setShowCreateGuardrail(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Guardrail
            </button>
          </div>

          {/* Guardrail Cards */}
          <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar pr-1">
            {filteredGuardrails.length === 0 ? (
              <div className="text-center py-12 text-[#6b7280]">
                <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No guardrails configured</p>
                <p className="text-xs mt-1">Create a guardrail to enforce safety constraints</p>
              </div>
            ) : (
              filteredGuardrails.map((guardrail, idx) => (
                <motion.div
                  key={guardrail.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`bg-[#1a1b2e] border rounded-xl p-4 transition-colors ${
                    !guardrail.isActive ? 'border-[#2d2e3d] opacity-60' :
                    guardrail.severity === 'critical' ? 'border-red-500/20' :
                    'border-[#2d2e3d]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {/* Type Icon */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          guardrail.type === 'input_filter' ? 'bg-cyan-500/20' :
                          guardrail.type === 'output_filter' ? 'bg-purple-500/20' :
                          guardrail.type === 'rate_limit' ? 'bg-amber-500/20' :
                          guardrail.type === 'content_policy' ? 'bg-rose-500/20' :
                          'bg-blue-500/20'
                        }`}>
                          {guardrail.type === 'input_filter' ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> :
                           guardrail.type === 'output_filter' ? <Filter className="w-3.5 h-3.5 text-purple-400" /> :
                           guardrail.type === 'rate_limit' ? <Clock className="w-3.5 h-3.5 text-amber-400" /> :
                           <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                        </div>
                        <h3 className="text-sm font-semibold text-white truncate">{guardrail.name}</h3>
                        <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${TYPE_COLORS[guardrail.type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                          {guardrail.type.replace('_', ' ')}
                        </span>
                        <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${SEVERITY_COLORS[guardrail.severity] || SEVERITY_COLORS.medium}`}>
                          {guardrail.severity}
                        </span>
                        <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${ACTION_COLORS[guardrail.action] || ACTION_COLORS.block}`}>
                          {guardrail.action}
                        </span>
                        {!guardrail.isActive && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">Inactive</span>
                        )}
                      </div>
                      {guardrail.description && <p className="text-xs text-[#9ca3af] mb-2 line-clamp-1">{guardrail.description}</p>}
                      <div className="flex items-center gap-3 text-[10px] text-[#6b7280]">
                        <span className={`px-1.5 py-0.5 rounded ${CATEGORY_COLORS[guardrail.category] || 'bg-slate-500/10 text-slate-400'}`}>
                          {guardrail.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" />
                          {guardrail.hitCount} hits
                        </span>
                        {guardrail.lastHitAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last: {timeAgo(guardrail.lastHitAt)}
                          </span>
                        )}
                        {guardrail.rateLimitRps && <span>RPS: {guardrail.rateLimitRps}</span>}
                        {guardrail.rateLimitRpm && <span>RPM: {guardrail.rateLimitRpm}</span>}
                        {guardrail.dailyLimit && <span>Daily: {guardrail.dailyLimit}</span>}
                        {guardrail._count && <span>Violations: {guardrail._count.violations}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleToggleGuardrail(guardrail.id, guardrail.isActive)}
                        disabled={actionLoading === guardrail.id}
                        className="p-1.5 hover:bg-[#252636] rounded-lg transition-colors disabled:opacity-50"
                        title={guardrail.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {actionLoading === guardrail.id ? (
                          <Loader2 className="w-4 h-4 text-[#6b7280] animate-spin" />
                        ) : guardrail.isActive ? (
                          <ToggleRight className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-[#6b7280]" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteGuardrail(guardrail.id)}
                        disabled={actionLoading === guardrail.id}
                        className="p-1.5 text-[#6b7280] hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Violations Tab */}
      {activeTab === 'violations' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#6b7280]" />
              <div className="flex gap-1">
                {['all', 'low', 'medium', 'high', 'critical'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverityFilter(s)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all capitalize ${
                      severityFilter === s
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-[#6b7280] hover:text-white hover:bg-[#252636] border border-transparent'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="w-px h-5 bg-[#2d2e3d]" />
              <div className="flex gap-1">
                {['all', 'unresolved', 'resolved'].map(s => (
                  <button
                    key={s}
                    onClick={() => setResolvedFilter(s)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all capitalize ${
                      resolvedFilter === s
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-[#6b7280] hover:text-white hover:bg-[#252636] border border-transparent'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Violation List */}
          <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar pr-1">
            {violations.length === 0 ? (
              <div className="text-center py-12 text-[#6b7280]">
                <AlertOctagon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No violations recorded</p>
                <p className="text-xs mt-1">Violations will appear here when guardrails are triggered</p>
              </div>
            ) : (
              violations.map((violation, idx) => (
                <motion.div
                  key={violation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`bg-[#1a1b2e] border rounded-xl p-4 ${
                    violation.isResolved ? 'border-[#2d2e3d] opacity-60' :
                    violation.severity === 'critical' ? 'border-red-500/30' :
                    'border-[#2d2e3d]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {/* Severity dot */}
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          violation.severity === 'critical' ? 'bg-red-400' :
                          violation.severity === 'high' ? 'bg-orange-400' :
                          violation.severity === 'medium' ? 'bg-yellow-400' :
                          'bg-slate-400'
                        }`} />
                        <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${SEVERITY_COLORS[violation.severity] || SEVERITY_COLORS.medium}`}>
                          {violation.severity}
                        </span>
                        <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${TYPE_COLORS[violation.type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                          {violation.type.replace('_', ' ')}
                        </span>
                        <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${ACTION_COLORS[violation.action] || ACTION_COLORS.block}`}>
                          {violation.action}
                        </span>
                        {violation.isResolved ? (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Resolved</span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Open</span>
                        )}
                      </div>

                      {/* Guardrail name */}
                      {violation.guardrail && (
                        <p className="text-xs text-[#9ca3af] mb-1">
                          Guardrail: <span className="text-white font-medium">{violation.guardrail.name}</span>
                        </p>
                      )}

                      {/* Input/Output */}
                      {violation.input && (
                        <div className="mb-1">
                          <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-0.5">Input</p>
                          <p className="text-xs text-[#9ca3af] bg-[#0f1117] p-2 rounded line-clamp-2">{violation.input}</p>
                        </div>
                      )}
                      {violation.output && (
                        <div className="mb-1">
                          <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-0.5">Output</p>
                          <p className="text-xs text-[#9ca3af] bg-[#0f1117] p-2 rounded line-clamp-2">{violation.output}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-[#6b7280] mt-1.5">
                        {violation.agentId && (
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-purple-500/30 flex items-center justify-center">
                              <span className="text-[6px] text-purple-300">A</span>
                            </div>
                            {violation.agentId.slice(0, 8)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(violation.createdAt)}
                        </span>
                        {violation.resolvedBy && (
                          <span className="text-emerald-400">by {violation.resolvedBy}</span>
                        )}
                      </div>
                    </div>

                    {/* Resolve button */}
                    {!violation.isResolved && (
                      <button
                        onClick={() => handleResolveViolation(violation.id)}
                        disabled={actionLoading === violation.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 flex-shrink-0"
                      >
                        {actionLoading === violation.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        <span className="hidden sm:inline">Resolve</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Content Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6b7280]">Define content filtering rules and policies</p>
            <button
              onClick={() => setShowCreatePolicy(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Policy
            </button>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar pr-1">
            {policies.length === 0 ? (
              <div className="text-center py-12 text-[#6b7280]">
                <Filter className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No content policies configured</p>
                <p className="text-xs mt-1">Create a policy to filter and control agent content</p>
              </div>
            ) : (
              policies.map((policy, idx) => {
                let ruleCount = 0
                try { ruleCount = JSON.parse(policy.rules).length } catch { ruleCount = 0 }

                return (
                  <motion.div
                    key={policy.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-[#1a1b2e] border rounded-xl p-4 ${!policy.isActive ? 'border-[#2d2e3d] opacity-60' : 'border-[#2d2e3d]'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3 className="text-sm font-semibold text-white">{policy.name}</h3>
                          <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${POLICY_TYPE_COLORS[policy.type] || POLICY_TYPE_COLORS.custom}`}>
                            {policy.type.replace('_', ' ')}
                          </span>
                          {!policy.isActive && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">Inactive</span>
                          )}
                        </div>
                        {policy.description && <p className="text-xs text-[#9ca3af] mb-2">{policy.description}</p>}
                        <div className="flex items-center gap-4 text-[10px] text-[#6b7280]">
                          <span className="flex items-center gap-1">
                            <Filter className="w-3 h-3" />
                            {ruleCount} rule{ruleCount !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {policy.violationCount} violations
                          </span>
                          {policy.lastViolationAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last: {timeAgo(policy.lastViolationAt)}
                            </span>
                          )}
                          {policy.agentId ? (
                            <span>Agent: {policy.agentId.slice(0, 8)}</span>
                          ) : (
                            <span className="text-emerald-400">All agents</span>
                          )}
                        </div>

                        {/* Rules Preview */}
                        {ruleCount > 0 && (
                          <div className="mt-2 p-2 bg-[#0f1117] rounded-lg">
                            <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1">Rules</p>
                            <pre className="text-[10px] text-[#9ca3af] max-h-20 overflow-y-auto custom-scrollbar">
                              {(() => {
                                try { return JSON.stringify(JSON.parse(policy.rules), null, 2) }
                                catch { return policy.rules }
                              })()}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleTogglePolicy(policy.id, policy.isActive)}
                          disabled={actionLoading === policy.id}
                          className="p-1.5 hover:bg-[#252636] rounded-lg transition-colors disabled:opacity-50"
                          title={policy.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {actionLoading === policy.id ? (
                            <Loader2 className="w-4 h-4 text-[#6b7280] animate-spin" />
                          ) : policy.isActive ? (
                            <ToggleRight className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-[#6b7280]" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeletePolicy(policy.id)}
                          disabled={actionLoading === policy.id}
                          className="p-1.5 text-[#6b7280] hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Create Guardrail Dialog */}
      <AnimatePresence>
        {showCreateGuardrail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateGuardrail(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                Create Guardrail
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Name</label>
                  <input
                    value={guardrailForm.name}
                    onChange={e => setGuardrailForm({ ...guardrailForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    placeholder="Guardrail name"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Description</label>
                  <textarea
                    value={guardrailForm.description}
                    onChange={e => setGuardrailForm({ ...guardrailForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 h-16 resize-none"
                    placeholder="What this guardrail does"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Type</label>
                    <select
                      value={guardrailForm.type}
                      onChange={e => setGuardrailForm({ ...guardrailForm, type: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="input_filter">Input Filter</option>
                      <option value="output_filter">Output Filter</option>
                      <option value="rate_limit">Rate Limit</option>
                      <option value="content_policy">Content Policy</option>
                      <option value="scope_restriction">Scope Restriction</option>
                      <option value="cost_limit">Cost Limit</option>
                      <option value="time_restriction">Time Restriction</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Category</label>
                    <select
                      value={guardrailForm.category}
                      onChange={e => setGuardrailForm({ ...guardrailForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="safety">Safety</option>
                      <option value="compliance">Compliance</option>
                      <option value="performance">Performance</option>
                      <option value="cost">Cost</option>
                      <option value="privacy">Privacy</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Severity</label>
                    <select
                      value={guardrailForm.severity}
                      onChange={e => setGuardrailForm({ ...guardrailForm, severity: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Action</label>
                    <select
                      value={guardrailForm.action}
                      onChange={e => setGuardrailForm({ ...guardrailForm, action: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="block">Block</option>
                      <option value="warn">Warn</option>
                      <option value="log">Log</option>
                      <option value="redirect">Redirect</option>
                      <option value="sanitize">Sanitize</option>
                    </select>
                  </div>
                </div>

                {/* Conditional fields for rate limit */}
                {(guardrailForm.type === 'rate_limit' || guardrailForm.type === 'cost_limit') && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-[#6b7280] mb-1 block">RPS Limit</label>
                      <input
                        type="number"
                        value={guardrailForm.rateLimitRps}
                        onChange={e => setGuardrailForm({ ...guardrailForm, rateLimitRps: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#6b7280] mb-1 block">RPM Limit</label>
                      <input
                        type="number"
                        value={guardrailForm.rateLimitRpm}
                        onChange={e => setGuardrailForm({ ...guardrailForm, rateLimitRpm: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#6b7280] mb-1 block">Daily Limit</label>
                      <input
                        type="number"
                        value={guardrailForm.dailyLimit}
                        onChange={e => setGuardrailForm({ ...guardrailForm, dailyLimit: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                        placeholder="e.g. 1000"
                      />
                    </div>
                  </div>
                )}

                {/* Redirect target for redirect action */}
                {guardrailForm.action === 'redirect' && (
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Redirect Target</label>
                    <input
                      value={guardrailForm.redirectTarget}
                      onChange={e => setGuardrailForm({ ...guardrailForm, redirectTarget: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                      placeholder="e.g. fallback-agent-id"
                    />
                  </div>
                )}

                {/* Patterns */}
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Patterns (comma-separated or JSON array)</label>
                  <textarea
                    value={guardrailForm.patterns}
                    onChange={e => setGuardrailForm({ ...guardrailForm, patterns: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 h-16 resize-none font-mono"
                    placeholder='e.g. password, secret, api_key or ["password", "secret"]'
                  />
                </div>

                {/* Conditions */}
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Conditions (JSON)</label>
                  <textarea
                    value={guardrailForm.conditions}
                    onChange={e => setGuardrailForm({ ...guardrailForm, conditions: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 h-16 resize-none font-mono"
                    placeholder='e.g. {"time_range": "9am-5pm", "agents": ["agent-1"]}'
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateGuardrail(false)}
                    className="px-4 py-2 text-sm text-[#6b7280] hover:text-white hover:bg-[#252636] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGuardrail}
                    disabled={!guardrailForm.name}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Content Policy Dialog */}
      <AnimatePresence>
        {showCreatePolicy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreatePolicy(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-emerald-400" />
                Create Content Policy
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Policy Name</label>
                  <input
                    value={policyForm.name}
                    onChange={e => setPolicyForm({ ...policyForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    placeholder="e.g. PII Protection Policy"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Description</label>
                  <textarea
                    value={policyForm.description}
                    onChange={e => setPolicyForm({ ...policyForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 h-16 resize-none"
                    placeholder="What this policy enforces"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Policy Type</label>
                  <select
                    value={policyForm.type}
                    onChange={e => setPolicyForm({ ...policyForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="blocklist">Blocklist</option>
                    <option value="allowlist">Allowlist</option>
                    <option value="pii_filter">PII Filter</option>
                    <option value="toxicity">Toxicity Detection</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">
                    Rules (one pattern per line, or JSON array of &#123;pattern, action, replacement&#125;)
                  </label>
                  <textarea
                    value={policyForm.rulesText}
                    onChange={e => setPolicyForm({ ...policyForm, rulesText: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 h-28 resize-none font-mono"
                    placeholder={'e.g.\npassword\napi_key\nsecret\n\nOr JSON:\n[{"pattern":"ssn","action":"block","replacement":"[REDACTED]"}]'}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCreatePolicy(false)}
                    className="px-4 py-2 text-sm text-[#6b7280] hover:text-white hover:bg-[#252636] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePolicy}
                    disabled={!policyForm.name}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
