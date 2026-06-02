'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpCircle,
  Plus,
  Filter,
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

// Types
interface ApprovalRequest {
  id: string
  title: string
  description: string
  type: string
  priority: string
  status: string
  agentId: string | null
  workflowId: string | null
  actionData: string
  riskLevel: string
  autoApprove: boolean
  autoReject: boolean
  expiresAt: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNotes: string | null
  rejectionReason: string | null
  escalationLevel: number
  createdAt: string
  updatedAt: string
}

interface ReviewGate {
  id: string
  name: string
  description: string | null
  triggerType: string
  triggerConfig: string
  actionTypes: string
  riskThreshold: number
  costThreshold: number
  requireApproval: boolean
  autoExpireHours: number
  escalationChain: string
  isActive: boolean
  agentId: string | null
  createdAt: string
  updatedAt: string
}

interface EscalationPolicy {
  id: string
  name: string
  description: string | null
  level: number
  triggerAfterMinutes: number
  notifyChannel: string | null
  notifyUsers: string
  autoAction: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type TabId = 'approvals' | 'gates' | 'policies'

const TYPE_COLORS: Record<string, string> = {
  action: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  deployment: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  data_access: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  config_change: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  expense: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  escalation: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const RISK_COLORS: Record<string, { bg: string; dot: string; label: string }> = {
  low: { bg: 'bg-emerald-500/10', dot: 'bg-emerald-400', label: 'text-emerald-400' },
  medium: { bg: 'bg-yellow-500/10', dot: 'bg-yellow-400', label: 'text-yellow-400' },
  high: { bg: 'bg-orange-500/10', dot: 'bg-orange-400', label: 'text-orange-400' },
  critical: { bg: 'bg-red-500/10', dot: 'bg-red-400', label: 'text-red-400' },
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  expired: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  escalated: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
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

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`
  const hr = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${hr}h ${m}m` : `${hr}h`
}

export function HumanInLoop() {
  const [activeTab, setActiveTab] = useState<TabId>('approvals')
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [gates, setGates] = useState<ReviewGate[]>([])
  const [policies, setPolicies] = useState<EscalationPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreateGate, setShowCreateGate] = useState(false)
  const [showCreatePolicy, setShowCreatePolicy] = useState(false)
  const [showCreateApproval, setShowCreateApproval] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Form state for new review gate
  const [gateForm, setGateForm] = useState({
    name: '',
    description: '',
    triggerType: 'always',
    riskThreshold: 0.5,
    costThreshold: 100,
    requireApproval: true,
    autoExpireHours: 24,
  })

  // Form state for new escalation policy
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    level: 1,
    triggerAfterMinutes: 30,
    autoAction: 'none',
  })

  // Form state for new approval request
  const [approvalForm, setApprovalForm] = useState({
    title: '',
    description: '',
    type: 'action',
    priority: 'medium',
    riskLevel: 'medium',
  })

  const fetchApprovals = useCallback(async () => {
    try {
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const res = await fetch(`/api/approvals${query}`)
      if (res.ok) {
        const data = await res.json()
        setApprovals(data)
      }
    } catch {}
  }, [statusFilter])

  const fetchGates = useCallback(async () => {
    try {
      const res = await fetch('/api/review-gates')
      if (res.ok) {
        const data = await res.json()
        setGates(data)
      }
    } catch {}
  }, [])

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await fetch('/api/escalation-policies')
      if (res.ok) {
        const data = await res.json()
        setPolicies(data)
      }
    } catch {}
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchApprovals(), fetchGates(), fetchPolicies()]).finally(() => setLoading(false))
  }, [fetchApprovals, fetchGates, fetchPolicies])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', reviewedBy: 'operator' }),
      })
      if (res.ok) {
        await fetchApprovals()
      }
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', reviewedBy: 'operator', rejectionReason: 'Rejected by operator' }),
      })
      if (res.ok) {
        await fetchApprovals()
      }
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const handleEscalate = async (id: string, currentLevel: number) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'escalated', escalationLevel: currentLevel + 1 }),
      })
      if (res.ok) {
        await fetchApprovals()
      }
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/approvals/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchApprovals()
      }
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const handleCreateGate = async () => {
    try {
      const res = await fetch('/api/review-gates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gateForm),
      })
      if (res.ok) {
        setShowCreateGate(false)
        setGateForm({ name: '', description: '', triggerType: 'always', riskThreshold: 0.5, costThreshold: 100, requireApproval: true, autoExpireHours: 24 })
        await fetchGates()
      }
    } catch {}
  }

  const handleDeleteGate = async (id: string) => {
    try {
      const res = await fetch(`/api/review-gates/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchGates()
    } catch {}
  }

  const handleCreatePolicy = async () => {
    try {
      const res = await fetch('/api/escalation-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policyForm),
      })
      if (res.ok) {
        setShowCreatePolicy(false)
        setPolicyForm({ name: '', description: '', level: 1, triggerAfterMinutes: 30, autoAction: 'none' })
        await fetchPolicies()
      }
    } catch {}
  }

  const handleDeletePolicy = async (id: string) => {
    try {
      const res = await fetch(`/api/escalation-policies/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchPolicies()
    } catch {}
  }

  const handleCreateApproval = async () => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalForm),
      })
      if (res.ok) {
        setShowCreateApproval(false)
        setApprovalForm({ title: '', description: '', type: 'action', priority: 'medium', riskLevel: 'medium' })
        await fetchApprovals()
      }
    } catch {}
  }

  // Stats
  const pendingCount = approvals.filter(a => a.status === 'pending').length
  const approvedToday = approvals.filter(a => {
    if (a.status !== 'approved' || !a.reviewedAt) return false
    const reviewed = new Date(a.reviewedAt)
    const now = new Date()
    return reviewed.toDateString() === now.toDateString()
  }).length
  const rejectedCount = approvals.filter(a => a.status === 'rejected').length
  const avgResponseMin = (() => {
    const reviewed = approvals.filter(a => a.reviewedAt && a.createdAt)
    if (reviewed.length === 0) return 0
    const total = reviewed.reduce((sum, a) => {
      return sum + (new Date(a.reviewedAt!).getTime() - new Date(a.createdAt).getTime())
    }, 0)
    return Math.round(total / reviewed.length / 60000)
  })()

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
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Human-in-the-Loop
          </h2>
          <p className="text-sm text-[#6b7280] mt-1">Approval queues, review gates & escalation workflows</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-[#6b7280]">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-[#6b7280]">Approved Today</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{approvedToday}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-[#6b7280]">Rejected</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{rejectedCount}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-[#6b7280]">Avg Response</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">{avgResponseMin > 0 ? `${avgResponseMin}m` : '--'}</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a1b2e] p-1 rounded-lg border border-[#2d2e3d]">
        {([
          { id: 'approvals' as TabId, label: 'Approvals', icon: ShieldCheck },
          { id: 'gates' as TabId, label: 'Review Gates', icon: Eye },
          { id: 'policies' as TabId, label: 'Escalation Policies', icon: ArrowUpCircle },
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
          </button>
        ))}
      </div>

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {/* Filter + Create */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#6b7280]" />
              <div className="flex gap-1">
                {['all', 'pending', 'approved', 'rejected', 'escalated'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all capitalize ${
                      statusFilter === s
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-[#6b7280] hover:text-white hover:bg-[#252636] border border-transparent'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowCreateApproval(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Request
            </button>
          </div>

          {/* Approval List */}
          <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar pr-1">
            {approvals.length === 0 ? (
              <div className="text-center py-12 text-[#6b7280]">
                <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No approval requests found</p>
              </div>
            ) : (
              approvals.map((approval, idx) => {
                const risk = RISK_COLORS[approval.riskLevel] || RISK_COLORS.medium
                const isExpanded = expandedId === approval.id
                const isActing = actionLoading === approval.id

                return (
                  <motion.div
                    key={approval.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`bg-[#1a1b2e] border rounded-xl overflow-hidden transition-colors ${
                      approval.status === 'pending' ? 'border-yellow-500/20' :
                      approval.status === 'escalated' ? 'border-orange-500/30' :
                      'border-[#2d2e3d]'
                    }`}
                  >
                    {/* Main Row */}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Risk Indicator */}
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${risk.dot}`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-sm font-semibold text-white truncate">{approval.title}</h3>
                            <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${TYPE_COLORS[approval.type] || TYPE_COLORS.action}`}>
                              {approval.type.replace('_', ' ')}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${PRIORITY_COLORS[approval.priority] || PRIORITY_COLORS.medium}`}>
                              {approval.priority}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${STATUS_COLORS[approval.status] || STATUS_COLORS.pending}`}>
                              {approval.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#9ca3af] line-clamp-1 mb-1.5">{approval.description}</p>
                          <div className="flex items-center gap-3 text-[10px] text-[#6b7280]">
                            {approval.agentId && (
                              <span className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-purple-500/30 flex items-center justify-center">
                                  <span className="text-[6px] text-purple-300">A</span>
                                </div>
                                {approval.agentId.slice(0, 8)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(approval.createdAt)}
                            </span>
                            {approval.escalationLevel > 0 && (
                              <span className="flex items-center gap-1 text-orange-400">
                                <ArrowUpCircle className="w-3 h-3" />
                                L{approval.escalationLevel}
                              </span>
                            )}
                            {approval.autoApprove && (
                              <span className="text-emerald-400">Auto-approve</span>
                            )}
                            {approval.autoReject && (
                              <span className="text-red-400">Auto-reject</span>
                            )}
                            {approval.expiresAt && (
                              <span className={new Date(approval.expiresAt) < new Date() ? 'text-red-400' : ''}>
                                Exp: {timeAgo(approval.expiresAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {approval.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(approval.id)}
                                disabled={isActing}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                              >
                                {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                <span className="hidden sm:inline">Approve</span>
                              </button>
                              <button
                                onClick={() => handleReject(approval.id)}
                                disabled={isActing}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-3 h-3" />
                                <span className="hidden sm:inline">Reject</span>
                              </button>
                            </>
                          )}
                          {approval.status === 'pending' && (
                            <button
                              onClick={() => handleEscalate(approval.id, approval.escalationLevel)}
                              disabled={isActing}
                              className="p-1.5 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Escalate"
                            >
                              <ArrowUpCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(approval.status === 'pending' || approval.status === 'escalated') && (
                            <button
                              onClick={() => handleCancel(approval.id)}
                              disabled={isActing}
                              className="p-1.5 text-[#6b7280] hover:text-white hover:bg-[#252636] rounded-lg transition-colors disabled:opacity-50"
                              title="Cancel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : approval.id)}
                            className="p-1.5 text-[#6b7280] hover:text-white hover:bg-[#252636] rounded-lg transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0 border-t border-[#2d2e3d]">
                            <div className="pt-3 space-y-3">
                              {/* Action Data */}
                              <div>
                                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Action Data</p>
                                <pre className="text-xs text-[#9ca3af] bg-[#0f1117] p-3 rounded-lg overflow-x-auto max-h-40 custom-scrollbar">
                                  {(() => {
                                    try { return JSON.stringify(JSON.parse(approval.actionData), null, 2) }
                                    catch { return approval.actionData }
                                  })()}
                                </pre>
                              </div>

                              {/* Risk Level Detail */}
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Risk Level</p>
                                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${risk.bg}`}>
                                    <div className={`w-2 h-2 rounded-full ${risk.dot}`} />
                                    <span className={`text-xs font-medium capitalize ${risk.label}`}>{approval.riskLevel}</span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Escalation Level</p>
                                  <span className="text-xs text-[#9ca3af]">{approval.escalationLevel === 0 ? 'Direct' : `Level ${approval.escalationLevel}`}</span>
                                </div>
                              </div>

                              {/* Review Info */}
                              {approval.reviewedBy && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Reviewed By</p>
                                    <p className="text-xs text-[#9ca3af]">{approval.reviewedBy}</p>
                                  </div>
                                  {approval.reviewedAt && (
                                    <div>
                                      <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Reviewed At</p>
                                      <p className="text-xs text-[#9ca3af]">{new Date(approval.reviewedAt).toLocaleString()}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              {approval.rejectionReason && (
                                <div>
                                  <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Rejection Reason</p>
                                  <p className="text-xs text-red-400">{approval.rejectionReason}</p>
                                </div>
                              )}
                              {approval.reviewNotes && (
                                <div>
                                  <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Review Notes</p>
                                  <p className="text-xs text-[#9ca3af]">{approval.reviewNotes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Review Gates Tab */}
      {activeTab === 'gates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6b7280]">Configure when agent actions require human review</p>
            <button
              onClick={() => setShowCreateGate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Gate
            </button>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar pr-1">
            {gates.length === 0 ? (
              <div className="text-center py-12 text-[#6b7280]">
                <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No review gates configured</p>
                <p className="text-xs mt-1">Create a gate to control when approvals are required</p>
              </div>
            ) : (
              gates.map((gate, idx) => (
                <motion.div
                  key={gate.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white">{gate.name}</h3>
                        {gate.isActive ? (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">Inactive</span>
                        )}
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 capitalize">
                          {gate.triggerType.replace('_', ' ')}
                        </span>
                      </div>
                      {gate.description && <p className="text-xs text-[#9ca3af] mb-2">{gate.description}</p>}
                      <div className="flex items-center gap-4 text-[10px] text-[#6b7280]">
                        <span>Risk Threshold: <span className="text-yellow-400">{((Number(gate.riskThreshold)||0) * 100).toFixed(0)}%</span></span>
                        <span>Cost Threshold: <span className="text-orange-400">£{gate.costThreshold}</span></span>
                        <span>Expire: <span className="text-[#9ca3af]">{gate.autoExpireHours}h</span></span>
                        {gate.requireApproval ? (
                          <span className="text-emerald-400">Approval Required</span>
                        ) : (
                          <span className="text-yellow-400">Notification Only</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteGate(gate.id)}
                      className="p-1.5 text-[#6b7280] hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete gate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Escalation Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6b7280]">Define how unreviewed requests get escalated</p>
            <button
              onClick={() => setShowCreatePolicy(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Policy
            </button>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar pr-1">
            {policies.length === 0 ? (
              <div className="text-center py-12 text-[#6b7280]">
                <ArrowUpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No escalation policies configured</p>
                <p className="text-xs mt-1">Create policies to auto-escalate overdue requests</p>
              </div>
            ) : (
              policies.map((policy, idx) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">L{policy.level}</span>
                        <h3 className="text-sm font-semibold text-white">{policy.name}</h3>
                        {policy.isActive ? (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">Inactive</span>
                        )}
                      </div>
                      {policy.description && <p className="text-xs text-[#9ca3af] mb-2">{policy.description}</p>}
                      <div className="flex items-center gap-4 text-[10px] text-[#6b7280]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          After {formatDuration(policy.triggerAfterMinutes)}
                        </span>
                        <span>
                          Auto-action: <span className={policy.autoAction === 'none' ? 'text-[#9ca3af]' : policy.autoAction === 'approve' ? 'text-emerald-400' : policy.autoAction === 'reject' ? 'text-red-400' : 'text-orange-400'}>
                            {policy.autoAction.replace('_', ' ')}
                          </span>
                        </span>
                        {policy.notifyChannel && (
                          <span className="text-cyan-400">Channel: {policy.notifyChannel.slice(0, 8)}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePolicy(policy.id)}
                      className="p-1.5 text-[#6b7280] hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete policy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Approval Dialog */}
      <AnimatePresence>
        {showCreateApproval && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateApproval(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Create Approval Request
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Title</label>
                  <input
                    value={approvalForm.title}
                    onChange={e => setApprovalForm({ ...approvalForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    placeholder="Approval request title"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Description</label>
                  <textarea
                    value={approvalForm.description}
                    onChange={e => setApprovalForm({ ...approvalForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 h-20 resize-none"
                    placeholder="Describe the action requiring approval"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Type</label>
                    <select
                      value={approvalForm.type}
                      onChange={e => setApprovalForm({ ...approvalForm, type: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="action">Action</option>
                      <option value="deployment">Deployment</option>
                      <option value="data_access">Data Access</option>
                      <option value="config_change">Config Change</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Priority</label>
                    <select
                      value={approvalForm.priority}
                      onChange={e => setApprovalForm({ ...approvalForm, priority: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Risk Level</label>
                    <select
                      value={approvalForm.riskLevel}
                      onChange={e => setApprovalForm({ ...approvalForm, riskLevel: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateApproval(false)}
                    className="px-4 py-2 text-sm text-[#6b7280] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateApproval}
                    disabled={!approvalForm.title}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    Create Request
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Review Gate Dialog */}
      <AnimatePresence>
        {showCreateGate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateGate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                Create Review Gate
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Name</label>
                  <input
                    value={gateForm.name}
                    onChange={e => setGateForm({ ...gateForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    placeholder="Review gate name"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Description</label>
                  <textarea
                    value={gateForm.description}
                    onChange={e => setGateForm({ ...gateForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 h-16 resize-none"
                    placeholder="When this gate triggers..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Trigger Type</label>
                    <select
                      value={gateForm.triggerType}
                      onChange={e => setGateForm({ ...gateForm, triggerType: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="always">Always</option>
                      <option value="risk_based">Risk Based</option>
                      <option value="cost_based">Cost Based</option>
                      <option value="action_type">Action Type</option>
                      <option value="schedule">Schedule</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Require Approval</label>
                    <button
                      onClick={() => setGateForm({ ...gateForm, requireApproval: !gateForm.requireApproval })}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white"
                    >
                      {gateForm.requireApproval ? (
                        <><ToggleRight className="w-5 h-5 text-emerald-400" /> Required</>
                      ) : (
                        <><ToggleLeft className="w-5 h-5 text-[#6b7280]" /> Notify Only</>
                      )}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Risk Threshold</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={gateForm.riskThreshold}
                      onChange={e => setGateForm({ ...gateForm, riskThreshold: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Cost Threshold</label>
                    <input
                      type="number"
                      value={gateForm.costThreshold}
                      onChange={e => setGateForm({ ...gateForm, costThreshold: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Auto Expire (h)</label>
                    <input
                      type="number"
                      value={gateForm.autoExpireHours}
                      onChange={e => setGateForm({ ...gateForm, autoExpireHours: parseInt(e.target.value) || 24 })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateGate(false)}
                    className="px-4 py-2 text-sm text-[#6b7280] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGate}
                    disabled={!gateForm.name}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    Create Gate
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Escalation Policy Dialog */}
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
                <ArrowUpCircle className="w-5 h-5 text-orange-400" />
                Create Escalation Policy
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Name</label>
                  <input
                    value={policyForm.name}
                    onChange={e => setPolicyForm({ ...policyForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    placeholder="Escalation policy name"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Description</label>
                  <textarea
                    value={policyForm.description}
                    onChange={e => setPolicyForm({ ...policyForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 h-16 resize-none"
                    placeholder="When and how this policy escalates..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Level</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={policyForm.level}
                      onChange={e => setPolicyForm({ ...policyForm, level: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Trigger After (min)</label>
                    <input
                      type="number"
                      value={policyForm.triggerAfterMinutes}
                      onChange={e => setPolicyForm({ ...policyForm, triggerAfterMinutes: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Auto Action</label>
                    <select
                      value={policyForm.autoAction}
                      onChange={e => setPolicyForm({ ...policyForm, autoAction: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="none">None</option>
                      <option value="approve">Auto-Approve</option>
                      <option value="reject">Auto-Reject</option>
                      <option value="pause_agent">Pause Agent</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCreatePolicy(false)}
                    className="px-4 py-2 text-sm text-[#6b7280] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePolicy}
                    disabled={!policyForm.name}
                    className="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-sm font-medium hover:bg-orange-500/30 transition-colors disabled:opacity-50"
                  >
                    Create Policy
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
