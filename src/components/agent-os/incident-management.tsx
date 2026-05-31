'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Flame,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  ChevronDown,
  Search,
  X,
  MessageSquare,
  Shield,
  Wrench,
  Megaphone,
  Bug,
  Loader2,
  FileText,
  ToggleLeft,
  ToggleRight,
  Trash2,
  ArrowRight,
  Activity,
  Users,
  Zap,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface Incident {
  id: string
  title: string
  description: string
  severity: string
  status: string
  type: string
  affectedServices: string
  affectedAgentIds: string
  assignedTo: string | null
  rootCause: string | null
  resolution: string | null
  impactLevel: string
  startedAt: string
  detectedAt: string | null
  resolvedAt: string | null
  postMortemId: string | null
  tags: string
  createdAt: string
  updatedAt: string
  timeline?: IncidentTimelineEvent[]
  actions?: IncidentActionItem[]
}

interface IncidentTimelineEvent {
  id: string
  incidentId: string
  eventType: string
  message: string
  source: string
  sourceId: string | null
  metadata: string
  createdAt: string
}

interface IncidentActionItem {
  id: string
  incidentId: string
  type: string
  description: string
  status: string
  assignedTo: string | null
  result: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

interface PostMortem {
  id: string
  incidentId: string
  title: string
  summary: string
  timeline: string
  rootCause: string
  contributingFactors: string
  actionItems: string
  lessonsLearned: string
  isPublished: boolean
  authoredBy: string | null
  createdAt: string
  updatedAt: string
}

const severityConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  critical: { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', icon: <Flame className="w-3.5 h-3.5" /> },
  high: { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  medium: { label: 'MEDIUM', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  low: { label: 'LOW', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: <Clock className="w-3.5 h-3.5" /> },
}

const statusFlow = ['open', 'investigating', 'identified', 'monitoring', 'resolved']

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  open: { label: 'Open', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  investigating: { label: 'Investigating', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  identified: { label: 'Identified', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  monitoring: { label: 'Monitoring', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  resolved: { label: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  operational: { label: 'Operational', icon: <Zap className="w-3 h-3" /> },
  security: { label: 'Security', icon: <Shield className="w-3 h-3" /> },
  performance: { label: 'Performance', icon: <Activity className="w-3 h-3" /> },
  infrastructure: { label: 'Infrastructure', icon: <Wrench className="w-3 h-3" /> },
  dependency: { label: 'Dependency', icon: <Bug className="w-3 h-3" /> },
  communication: { label: 'Communication', icon: <Megaphone className="w-3 h-3" /> },
}

const impactConfig: Record<string, { label: string; color: string }> = {
  none: { label: 'No Impact', color: 'text-emerald-400' },
  partial: { label: 'Partial', color: 'text-yellow-400' },
  major: { label: 'Major', color: 'text-orange-400' },
  full: { label: 'Full Outage', color: 'text-red-400' },
}

const actionTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  mitigation: { label: 'Mitigation', icon: <Shield className="w-3.5 h-3.5" />, color: 'text-cyan-400' },
  investigation: { label: 'Investigation', icon: <Search className="w-3.5 h-3.5" />, color: 'text-yellow-400' },
  communication: { label: 'Communication', icon: <Megaphone className="w-3.5 h-3.5" />, color: 'text-purple-400' },
  fix: { label: 'Fix', icon: <Wrench className="w-3.5 h-3.5" />, color: 'text-emerald-400' },
  prevention: { label: 'Prevention', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-blue-400' },
}

const tabs = [
  { id: 'active', label: 'Active', icon: Flame },
  { id: 'resolved', label: 'Resolved', icon: CheckCircle },
  { id: 'post-mortems', label: 'Post-Mortems', icon: FileText },
]

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export function IncidentManagement() {
  const { addToast } = useAgentOSStore()
  const [activeTab, setActiveTab] = useState('active')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [postMortems, setPostMortems] = useState<PostMortem[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  // Create incident form
  const [showCreateIncident, setShowCreateIncident] = useState(false)
  const [newIncident, setNewIncident] = useState({
    title: '', description: '', severity: 'medium', type: 'operational',
    affectedServices: '', affectedAgentIds: '', impactLevel: 'partial',
  })

  // Timeline event form
  const [newTimelineEvent, setNewTimelineEvent] = useState({ eventType: 'comment', message: '' })
  const [showTimelineForm, setShowTimelineForm] = useState<string | null>(null)

  // Action form
  const [newAction, setNewAction] = useState({ type: 'mitigation', description: '', assignedTo: '' })
  const [showActionForm, setShowActionForm] = useState<string | null>(null)

  // Post-mortem form
  const [showCreatePostMortem, setShowCreatePostMortem] = useState(false)
  const [newPostMortem, setNewPostMortem] = useState({
    incidentId: '', title: '', summary: '', rootCause: '',
    contributingFactors: '', actionItems: '', lessonsLearned: '',
  })
  const [expandedPostMortemId, setExpandedPostMortemId] = useState<string | null>(null)

  // Update incident form
  const [editingIncident, setEditingIncident] = useState<string | null>(null)

  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/incidents')
      if (res.ok) {
        const data = await res.json()
        setIncidents(data.incidents || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  const fetchPostMortems = useCallback(async () => {
    try {
      const res = await fetch('/api/post-mortems')
      if (res.ok) {
        const data = await res.json()
        setPostMortems(data.postMortems || [])
      }
    } catch {}
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [incRes, pmRes] = await Promise.all([
          fetch('/api/incidents'),
          fetch('/api/post-mortems'),
        ])
        if (!cancelled) {
          if (incRes.ok) {
            const incData = await incRes.json()
            setIncidents(incData.incidents || [])
          }
          if (pmRes.ok) {
            const pmData = await pmRes.json()
            setPostMortems(pmData.postMortems || [])
          }
        }
      } catch {} finally {
        if (!cancelled) setLoading(false)
      }
    }
    setLoading(true)
    load()
    return () => { cancelled = true }
  }, [])

  const handleCreateIncident = async () => {
    if (!newIncident.title.trim()) return
    try {
      const services = newIncident.affectedServices.split(',').map(s => s.trim()).filter(Boolean)
      const agents = newIncident.affectedAgentIds.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newIncident,
          affectedServices: services,
          affectedAgentIds: agents,
        }),
      })
      if (res.ok) {
        setNewIncident({ title: '', description: '', severity: 'medium', type: 'operational', affectedServices: '', affectedAgentIds: '', impactLevel: 'partial' })
        setShowCreateIncident(false)
        fetchIncidents()
        addToast('Incident created successfully', 'success')
      }
    } catch {
      addToast('Failed to create incident', 'error')
    }
  }

  const handleUpdateIncidentStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        fetchIncidents()
        addToast(`Incident status updated to ${status}`, 'success')
      }
    } catch {
      addToast('Failed to update status', 'error')
    }
  }

  const handleUpdateIncident = async (id: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        fetchIncidents()
        addToast('Incident updated', 'success')
      }
    } catch {
      addToast('Failed to update incident', 'error')
    }
  }

  const handleDeleteIncident = async (id: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}`, { method: 'DELETE' })
      if (res.ok) {
        if (expandedIncidentId === id) setExpandedIncidentId(null)
        fetchIncidents()
        addToast('Incident deleted', 'success')
      }
    } catch {
      addToast('Failed to delete incident', 'error')
    }
  }

  const handleAddTimelineEvent = async (incidentId: string) => {
    if (!newTimelineEvent.message.trim()) return
    try {
      const res = await fetch(`/api/incidents/${incidentId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTimelineEvent),
      })
      if (res.ok) {
        setNewTimelineEvent({ eventType: 'comment', message: '' })
        setShowTimelineForm(null)
        fetchIncidents()
        addToast('Timeline event added', 'success')
      }
    } catch {
      addToast('Failed to add timeline event', 'error')
    }
  }

  const handleAddAction = async (incidentId: string) => {
    if (!newAction.description.trim()) return
    try {
      const res = await fetch(`/api/incidents/${incidentId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAction,
          assignedTo: newAction.assignedTo || null,
        }),
      })
      if (res.ok) {
        setNewAction({ type: 'mitigation', description: '', assignedTo: '' })
        setShowActionForm(null)
        fetchIncidents()
        addToast('Action added', 'success')
      }
    } catch {
      addToast('Failed to add action', 'error')
    }
  }

  const handleUpdateAction = async (incidentId: string, actionId: string, status: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/actions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, status }),
      })
      if (res.ok) {
        fetchIncidents()
        addToast('Action updated', 'success')
      }
    } catch {
      addToast('Failed to update action', 'error')
    }
  }

  const handleCreatePostMortem = async () => {
    if (!newPostMortem.title.trim() || !newPostMortem.incidentId) return
    try {
      const factors = newPostMortem.contributingFactors.split('\n').filter(Boolean)
      const items = newPostMortem.actionItems.split('\n').filter(Boolean)
      const lessons = newPostMortem.lessonsLearned.split('\n').filter(Boolean)
      const res = await fetch('/api/post-mortems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPostMortem,
          contributingFactors: factors,
          actionItems: items,
          lessonsLearned: lessons,
        }),
      })
      if (res.ok) {
        setNewPostMortem({ incidentId: '', title: '', summary: '', rootCause: '', contributingFactors: '', actionItems: '', lessonsLearned: '' })
        setShowCreatePostMortem(false)
        fetchPostMortems()
        fetchIncidents()
        addToast('Post-mortem created', 'success')
      }
    } catch {
      addToast('Failed to create post-mortem', 'error')
    }
  }

  const handleTogglePublishPostMortem = async (id: string, isPublished: boolean) => {
    try {
      const res = await fetch(`/api/post-mortems/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      })
      if (res.ok) {
        fetchPostMortems()
        addToast(`Post-mortem ${!isPublished ? 'published' : 'unpublished'}`, 'success')
      }
    } catch {
      addToast('Failed to toggle publish', 'error')
    }
  }

  const handleDeletePostMortem = async (id: string) => {
    try {
      const res = await fetch(`/api/post-mortems/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchPostMortems()
        fetchIncidents()
        addToast('Post-mortem deleted', 'success')
      }
    } catch {
      addToast('Failed to delete post-mortem', 'error')
    }
  }

  // Filter logic
  const activeIncidents = incidents.filter(i => i.status !== 'resolved')
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved')

  const filteredIncidents = (activeTab === 'active' ? activeIncidents : resolvedIncidents)
    .filter(i => {
      const matchesSearch = !searchQuery || 
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter
      return matchesSearch && matchesSeverity
    })

  // Stats
  const criticalCount = activeIncidents.filter(i => i.severity === 'critical').length
  const highCount = activeIncidents.filter(i => i.severity === 'high').length
  const totalActive = activeIncidents.length
  const totalResolved = resolvedIncidents.length

  const expandedIncident = incidents.find(i => i.id === expandedIncidentId)
  const expandedPostMortem = postMortems.find(pm => pm.id === expandedPostMortemId)

  const safeParse = (str: string): string[] => {
    try { return JSON.parse(str) } catch { return [] }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <AlertTriangle className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Incident Management</h2>
            <p className="text-[11px] text-[#6b7280]">RJMLABS.CO.UK — Track, manage, and resolve incidents</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateIncident(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Declare Incident
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Incidents', value: totalActive, icon: Flame, color: criticalCount > 0 ? 'text-red-400' : 'text-emerald-400', bg: criticalCount > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10' },
          { label: 'Critical', value: criticalCount, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'High Priority', value: highCount, icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Resolved', value: totalResolved, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(stat => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[11px] text-[#6b7280] uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#1e1f2b] rounded-xl p-1 border border-[#2d2e3d]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setExpandedIncidentId(null); setExpandedPostMortemId(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-[#6b7280] hover:text-white hover:bg-[#252636]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'active' && totalActive > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">{totalActive}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      {activeTab !== 'post-mortems' && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search incidents..."
              className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {/* Active / Resolved Incidents Tab */}
          {(activeTab === 'active' || activeTab === 'resolved') && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="text-center py-16 text-[#6b7280]">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No {activeTab} incidents</p>
                  <p className="text-xs mt-1">
                    {activeTab === 'active' ? 'Declare a new incident to get started' : 'Resolved incidents will appear here'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar pr-1">
                  {filteredIncidents.map(incident => {
                    const sev = severityConfig[incident.severity] || severityConfig.medium
                    const stat = statusConfig[incident.status] || statusConfig.open
                    const services = safeParse(incident.affectedServices)
                    const isExpanded = expandedIncidentId === incident.id

                    return (
                      <div key={incident.id} className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl overflow-hidden">
                        {/* Incident Card Header */}
                        <div
                          className="p-4 cursor-pointer hover:bg-[#252636]/50 transition-colors"
                          onClick={() => setExpandedIncidentId(isExpanded ? null : incident.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg ${sev.bg} border ${sev.border} flex items-center justify-center shrink-0 mt-0.5`}>
                              {sev.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-white">{incident.title}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${sev.bg} ${sev.color} ${sev.border}`}>
                                  {sev.label}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${stat.bg} ${stat.color} ${stat.border}`}>
                                  {stat.label}
                                </span>
                                {typeConfig[incident.type] && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#252636] text-[#9ca3af] border border-[#2d2e3d] flex items-center gap-1">
                                    {typeConfig[incident.type].icon} {typeConfig[incident.type].label}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#9ca3af] mt-1 line-clamp-2">{incident.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-[11px] text-[#6b7280]">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(incident.createdAt)}</span>
                                <span className={`flex items-center gap-1 ${impactConfig[incident.impactLevel]?.color || 'text-[#6b7280]'}`}>
                                  <Activity className="w-3 h-3" />{impactConfig[incident.impactLevel]?.label || incident.impactLevel}
                                </span>
                                {services.length > 0 && (
                                  <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{services.length} service{services.length !== 1 ? 's' : ''}</span>
                                )}
                              </div>
                              {services.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                  {services.slice(0, 4).map((s: string, i: number) => (
                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#0f1117] text-[#9ca3af] border border-[#2d2e3d]">
                                      {s}
                                    </span>
                                  ))}
                                  {services.length > 4 && (
                                    <span className="text-[10px] text-[#6b7280]">+{services.length - 4} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={e => { e.stopPropagation(); handleDeleteIncident(incident.id) }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete incident"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <ChevronDown className={`w-4 h-4 text-[#6b7280] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>

                          {/* Status Flow Quick Actions */}
                          {!isExpanded && incident.status !== 'resolved' && (
                            <div className="flex items-center gap-1.5 mt-3 ml-[52px]">
                              {statusFlow.map((s, idx) => {
                                const currentIdx = statusFlow.indexOf(incident.status)
                                const cfg = statusConfig[s]
                                const isPast = idx <= currentIdx
                                const isNext = idx === currentIdx + 1
                                return (
                                  <button
                                    key={s}
                                    onClick={e => { e.stopPropagation(); if (isNext) handleUpdateIncidentStatus(incident.id, s) }}
                                    className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                                      isPast ? `${cfg.bg} ${cfg.color} ${cfg.border}` :
                                      isNext ? `bg-[#0f1117] ${cfg.color} border-[#2d2e3d] hover:${cfg.border}` :
                                      'bg-[#0f1117] text-[#4b5563] border-[#2d2e3d] opacity-40'
                                    }`}
                                  >
                                    {cfg.label}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Expanded Detail Panel */}
                        <AnimatePresence>
                          {isExpanded && expandedIncident && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-[#2d2e3d] overflow-hidden"
                            >
                              <div className="p-4 space-y-4">
                                {/* Quick Status Update */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-[#6b7280] uppercase tracking-wider">Status:</span>
                                  <div className="flex items-center gap-1">
                                    {statusFlow.map(s => {
                                      const cfg = statusConfig[s]
                                      const isActive = incident.status === s
                                      return (
                                        <button
                                          key={s}
                                          onClick={() => handleUpdateIncidentStatus(incident.id, s)}
                                          className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                                            isActive ? `${cfg.bg} ${cfg.color} ${cfg.border} font-medium` :
                                            'bg-[#0f1117] text-[#6b7280] border-[#2d2e3d] hover:text-white'
                                          }`}
                                        >
                                          {cfg.label}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Edit Fields */}
                                {editingIncident === incident.id && (
                                  <div className="bg-[#0f1117] border border-[#2d2e3d] rounded-lg p-3 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Severity</label>
                                        <select
                                          value={incident.severity}
                                          onChange={e => handleUpdateIncident(incident.id, { severity: e.target.value })}
                                          className="w-full bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white mt-1"
                                        >
                                          {Object.entries(severityConfig).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Impact</label>
                                        <select
                                          value={incident.impactLevel}
                                          onChange={e => handleUpdateIncident(incident.id, { impactLevel: e.target.value })}
                                          className="w-full bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white mt-1"
                                        >
                                          {Object.entries(impactConfig).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Root Cause</label>
                                      <input
                                        value={incident.rootCause || ''}
                                        onChange={e => handleUpdateIncident(incident.id, { rootCause: e.target.value })}
                                        placeholder="Describe the root cause..."
                                        className="w-full bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white placeholder-[#6b7280] mt-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Resolution</label>
                                      <input
                                        value={incident.resolution || ''}
                                        onChange={e => handleUpdateIncident(incident.id, { resolution: e.target.value })}
                                        placeholder="Describe the resolution..."
                                        className="w-full bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white placeholder-[#6b7280] mt-1"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Assigned To</label>
                                      <input
                                        value={incident.assignedTo || ''}
                                        onChange={e => handleUpdateIncident(incident.id, { assignedTo: e.target.value })}
                                        placeholder="Assign to..."
                                        className="w-full bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white placeholder-[#6b7280] mt-1"
                                      />
                                    </div>
                                    <button
                                      onClick={() => setEditingIncident(null)}
                                      className="text-[10px] text-emerald-400 hover:text-emerald-300"
                                    >
                                      Done editing
                                    </button>
                                  </div>
                                )}

                                {editingIncident !== incident.id && (
                                  <button
                                    onClick={() => setEditingIncident(incident.id)}
                                    className="text-[10px] text-[#6b7280] hover:text-emerald-400 transition-colors"
                                  >
                                    Edit details →
                                  </button>
                                )}

                                {/* Timeline Section */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                      Timeline
                                    </h4>
                                    <button
                                      onClick={() => setShowTimelineForm(showTimelineForm === incident.id ? null : incident.id)}
                                      className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" /> Add Event
                                    </button>
                                  </div>

                                  {/* Add Timeline Event Form */}
                                  <AnimatePresence>
                                    {showTimelineForm === incident.id && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-[#0f1117] border border-[#2d2e3d] rounded-lg p-3 mb-2 space-y-2 overflow-hidden"
                                      >
                                        <select
                                          value={newTimelineEvent.eventType}
                                          onChange={e => setNewTimelineEvent(prev => ({ ...prev, eventType: e.target.value }))}
                                          className="w-full bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white"
                                        >
                                          <option value="comment">Comment</option>
                                          <option value="status_change">Status Change</option>
                                          <option value="action">Action Taken</option>
                                          <option value="detection">Detection</option>
                                          <option value="notification">Notification</option>
                                        </select>
                                        <textarea
                                          value={newTimelineEvent.message}
                                          onChange={e => setNewTimelineEvent(prev => ({ ...prev, message: e.target.value }))}
                                          placeholder="Describe the event..."
                                          rows={2}
                                          className="w-full bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white placeholder-[#6b7280] resize-none focus:outline-none focus:border-emerald-500/50"
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleAddTimelineEvent(incident.id)}
                                            className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-medium hover:bg-emerald-600 transition-colors"
                                          >
                                            Add
                                          </button>
                                          <button
                                            onClick={() => setShowTimelineForm(null)}
                                            className="px-3 py-1 rounded-lg bg-[#252636] text-[#9ca3af] text-[10px] font-medium hover:text-white transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Timeline Events */}
                                  <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                    {(expandedIncident.timeline || []).length === 0 ? (
                                      <p className="text-[11px] text-[#6b7280] text-center py-3">No timeline events yet</p>
                                    ) : (
                                      (expandedIncident.timeline || []).map((event, idx) => (
                                        <div key={event.id} className="flex items-start gap-2 py-1.5">
                                          <div className="flex flex-col items-center mt-1">
                                            <div className={`w-2 h-2 rounded-full ${
                                              event.eventType === 'status_change' ? 'bg-yellow-400' :
                                              event.eventType === 'action_added' || event.eventType === 'action_updated' ? 'bg-cyan-400' :
                                              event.eventType === 'created' ? 'bg-emerald-400' :
                                              'bg-[#6b7280]'
                                            }`} />
                                            {idx < (expandedIncident.timeline || []).length - 1 && (
                                              <div className="w-px h-4 bg-[#2d2e3d]" />
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white">{event.message}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className="text-[10px] text-[#6b7280]">{timeAgo(event.createdAt)}</span>
                                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#252636] text-[#9ca3af]">{event.eventType}</span>
                                              <span className="text-[10px] text-[#4b5563]">by {event.source}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Actions Section */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                                      <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                                      Actions
                                    </h4>
                                    <button
                                      onClick={() => setShowActionForm(showActionForm === incident.id ? null : incident.id)}
                                      className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" /> Add Action
                                    </button>
                                  </div>

                                  {/* Add Action Form */}
                                  <AnimatePresence>
                                    {showActionForm === incident.id && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-[#0f1117] border border-[#2d2e3d] rounded-lg p-3 mb-2 space-y-2 overflow-hidden"
                                      >
                                        <div className="grid grid-cols-2 gap-2">
                                          <select
                                            value={newAction.type}
                                            onChange={e => setNewAction(prev => ({ ...prev, type: e.target.value }))}
                                            className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white"
                                          >
                                            {Object.entries(actionTypeConfig).map(([k, v]) => (
                                              <option key={k} value={k}>{v.label}</option>
                                            ))}
                                          </select>
                                          <input
                                            value={newAction.assignedTo}
                                            onChange={e => setNewAction(prev => ({ ...prev, assignedTo: e.target.value }))}
                                            placeholder="Assign to..."
                                            className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white placeholder-[#6b7280]"
                                          />
                                        </div>
                                        <textarea
                                          value={newAction.description}
                                          onChange={e => setNewAction(prev => ({ ...prev, description: e.target.value }))}
                                          placeholder="Describe the action..."
                                          rows={2}
                                          className="w-full bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white placeholder-[#6b7280] resize-none focus:outline-none focus:border-emerald-500/50"
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleAddAction(incident.id)}
                                            className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-medium hover:bg-emerald-600 transition-colors"
                                          >
                                            Add Action
                                          </button>
                                          <button
                                            onClick={() => setShowActionForm(null)}
                                            className="px-3 py-1 rounded-lg bg-[#252636] text-[#9ca3af] text-[10px] font-medium hover:text-white transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Actions List */}
                                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                    {(expandedIncident.actions || []).length === 0 ? (
                                      <p className="text-[11px] text-[#6b7280] text-center py-3">No actions yet</p>
                                    ) : (
                                      (expandedIncident.actions || []).map(action => {
                                        const typeCfg = actionTypeConfig[action.type] || actionTypeConfig.mitigation
                                        return (
                                          <div key={action.id} className="flex items-center gap-2 p-2 rounded-lg bg-[#0f1117] border border-[#2d2e3d]/50">
                                            <div className={`${typeCfg.color}`}>{typeCfg.icon}</div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs text-white truncate">{action.description}</p>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-[#6b7280]">{typeCfg.label}</span>
                                                {action.assignedTo && <span className="text-[10px] text-[#6b7280] flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{action.assignedTo}</span>}
                                              </div>
                                            </div>
                                            <select
                                              value={action.status}
                                              onChange={e => handleUpdateAction(incident.id, action.id, e.target.value)}
                                              className={`text-[10px] px-1.5 py-0.5 rounded border bg-transparent ${
                                                action.status === 'pending' ? 'text-yellow-400 border-yellow-500/30' :
                                                action.status === 'in_progress' ? 'text-cyan-400 border-cyan-500/30' :
                                                action.status === 'completed' ? 'text-emerald-400 border-emerald-500/30' :
                                                'text-red-400 border-red-500/30'
                                              }`}
                                            >
                                              <option value="pending">Pending</option>
                                              <option value="in_progress">In Progress</option>
                                              <option value="completed">Completed</option>
                                              <option value="failed">Failed</option>
                                            </select>
                                          </div>
                                        )
                                      })
                                    )}
                                  </div>
                                </div>

                                {/* Resolution & Root Cause Summary */}
                                {(incident.rootCause || incident.resolution) && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {incident.rootCause && (
                                      <div className="bg-[#0f1117] border border-[#2d2e3d] rounded-lg p-3">
                                        <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1">Root Cause</p>
                                        <p className="text-xs text-white">{incident.rootCause}</p>
                                      </div>
                                    )}
                                    {incident.resolution && (
                                      <div className="bg-[#0f1117] border border-[#2d2e3d] rounded-lg p-3">
                                        <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1">Resolution</p>
                                        <p className="text-xs text-white">{incident.resolution}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Post-Mortems Tab */}
          {activeTab === 'post-mortems' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Post-Mortems</h3>
                <button
                  onClick={() => setShowCreatePostMortem(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Post-Mortem
                </button>
              </div>

              {/* Create Post-Mortem Form */}
              <AnimatePresence>
                {showCreatePostMortem && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-4 space-y-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Linked Incident</label>
                        <select
                          value={newPostMortem.incidentId}
                          onChange={e => setNewPostMortem(prev => ({ ...prev, incidentId: e.target.value }))}
                          className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white mt-1"
                        >
                          <option value="">Select incident...</option>
                          {incidents.map(inc => (
                            <option key={inc.id} value={inc.id}>
                              {inc.title} ({inc.severity})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Title</label>
                        <input
                          value={newPostMortem.title}
                          onChange={e => setNewPostMortem(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Post-mortem title..."
                          className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white placeholder-[#6b7280] mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Summary</label>
                      <textarea
                        value={newPostMortem.summary}
                        onChange={e => setNewPostMortem(prev => ({ ...prev, summary: e.target.value }))}
                        placeholder="Incident summary..."
                        rows={2}
                        className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white placeholder-[#6b7280] resize-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Root Cause</label>
                      <textarea
                        value={newPostMortem.rootCause}
                        onChange={e => setNewPostMortem(prev => ({ ...prev, rootCause: e.target.value }))}
                        placeholder="What caused the incident..."
                        rows={2}
                        className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white placeholder-[#6b7280] resize-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Contributing Factors (one per line)</label>
                      <textarea
                        value={newPostMortem.contributingFactors}
                        onChange={e => setNewPostMortem(prev => ({ ...prev, contributingFactors: e.target.value }))}
                        placeholder="Factor 1&#10;Factor 2"
                        rows={2}
                        className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white placeholder-[#6b7280] resize-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Action Items (one per line)</label>
                      <textarea
                        value={newPostMortem.actionItems}
                        onChange={e => setNewPostMortem(prev => ({ ...prev, actionItems: e.target.value }))}
                        placeholder="Action 1&#10;Action 2"
                        rows={2}
                        className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white placeholder-[#6b7280] resize-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Lessons Learned (one per line)</label>
                      <textarea
                        value={newPostMortem.lessonsLearned}
                        onChange={e => setNewPostMortem(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                        placeholder="Lesson 1&#10;Lesson 2"
                        rows={2}
                        className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-2 py-1.5 text-xs text-white placeholder-[#6b7280] resize-none mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreatePostMortem}
                        className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
                      >
                        Create Post-Mortem
                      </button>
                      <button
                        onClick={() => setShowCreatePostMortem(false)}
                        className="px-4 py-1.5 rounded-lg bg-[#252636] text-[#9ca3af] text-xs font-medium hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Post-Mortems List */}
              {postMortems.length === 0 ? (
                <div className="text-center py-16 text-[#6b7280]">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No post-mortems yet</p>
                  <p className="text-xs mt-1">Create a post-mortem for resolved incidents</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto custom-scrollbar pr-1">
                  {postMortems.map(pm => {
                    const isExpanded = expandedPostMortemId === pm.id
                    const linkedIncident = incidents.find(i => i.id === pm.incidentId)
                    const factors = safeParse(pm.contributingFactors)
                    const items = safeParse(pm.actionItems)
                    const lessons = safeParse(pm.lessonsLearned)

                    return (
                      <div key={pm.id} className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl overflow-hidden">
                        <div
                          className="p-4 cursor-pointer hover:bg-[#252636]/50 transition-colors"
                          onClick={() => setExpandedPostMortemId(isExpanded ? null : pm.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                              <FileText className="w-4.5 h-4.5 text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-white">{pm.title}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                                  pm.isPublished ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                }`}>
                                  {pm.isPublished ? 'Published' : 'Draft'}
                                </span>
                              </div>
                              {linkedIncident && (
                                <p className="text-[11px] text-[#6b7280] mt-1 flex items-center gap-1">
                                  <ArrowRight className="w-3 h-3" /> {linkedIncident.title}
                                </p>
                              )}
                              <p className="text-xs text-[#9ca3af] mt-1 line-clamp-2">{pm.summary}</p>
                              <div className="flex items-center gap-3 mt-2 text-[11px] text-[#6b7280]">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(pm.createdAt)}</span>
                                {items.length > 0 && <span>{items.length} action items</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={e => { e.stopPropagation(); handleTogglePublishPostMortem(pm.id, pm.isPublished) }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                title={pm.isPublished ? 'Unpublish' : 'Publish'}
                              >
                                {pm.isPublished ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); handleDeletePostMortem(pm.id) }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete post-mortem"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <ChevronDown className={`w-4 h-4 text-[#6b7280] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </div>

                        {/* Expanded Post-Mortem Detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-[#2d2e3d] overflow-hidden"
                            >
                              <div className="p-4 space-y-4">
                                {/* Root Cause */}
                                {pm.rootCause && (
                                  <div className="bg-[#0f1117] border border-[#2d2e3d] rounded-lg p-3">
                                    <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 flex items-center gap-1">
                                      <Bug className="w-3 h-3 text-red-400" /> Root Cause
                                    </p>
                                    <p className="text-xs text-white">{pm.rootCause}</p>
                                  </div>
                                )}

                                {/* Contributing Factors */}
                                {factors.length > 0 && (
                                  <div className="bg-[#0f1117] border border-[#2d2e3d] rounded-lg p-3">
                                    <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 text-orange-400" /> Contributing Factors
                                    </p>
                                    <div className="space-y-1">
                                      {factors.map((f: string, i: number) => (
                                        <div key={i} className="flex items-start gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                          <p className="text-xs text-[#9ca3af]">{f}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Action Items */}
                                {items.length > 0 && (
                                  <div className="bg-[#0f1117] border border-[#2d2e3d] rounded-lg p-3">
                                    <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-1">
                                      <Wrench className="w-3 h-3 text-cyan-400" /> Action Items
                                    </p>
                                    <div className="space-y-1">
                                      {items.map((item: string, i: number) => (
                                        <div key={i} className="flex items-start gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                                          <p className="text-xs text-[#9ca3af]">{item}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Lessons Learned */}
                                {lessons.length > 0 && (
                                  <div className="bg-[#0f1117] border border-[#2d2e3d] rounded-lg p-3">
                                    <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3 text-emerald-400" /> Lessons Learned
                                    </p>
                                    <div className="space-y-1">
                                      {lessons.map((l: string, i: number) => (
                                        <div key={i} className="flex items-start gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                          <p className="text-xs text-[#9ca3af]">{l}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Create Incident Modal */}
      <AnimatePresence>
        {showCreateIncident && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCreateIncident(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-[#2d2e3d]">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    Declare Incident
                  </h3>
                  <button
                    onClick={() => setShowCreateIncident(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-white hover:bg-[#252636] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Title *</label>
                    <input
                      value={newIncident.title}
                      onChange={e => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief incident title..."
                      className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] mt-1 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Description</label>
                    <textarea
                      value={newIncident.description}
                      onChange={e => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What's happening? What's the impact?"
                      rows={3}
                      className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] resize-none mt-1 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Severity</label>
                      <select
                        value={newIncident.severity}
                        onChange={e => setNewIncident(prev => ({ ...prev, severity: e.target.value }))}
                        className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white mt-1"
                      >
                        {Object.entries(severityConfig).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Type</label>
                      <select
                        value={newIncident.type}
                        onChange={e => setNewIncident(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white mt-1"
                      >
                        {Object.entries(typeConfig).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Impact Level</label>
                    <select
                      value={newIncident.impactLevel}
                      onChange={e => setNewIncident(prev => ({ ...prev, impactLevel: e.target.value }))}
                      className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white mt-1"
                    >
                      {Object.entries(impactConfig).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Affected Services (comma-separated)</label>
                    <input
                      value={newIncident.affectedServices}
                      onChange={e => setNewIncident(prev => ({ ...prev, affectedServices: e.target.value }))}
                      placeholder="e.g. API, Database, Auth"
                      className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] mt-1 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase tracking-wider">Affected Agent IDs (comma-separated)</label>
                    <input
                      value={newIncident.affectedAgentIds}
                      onChange={e => setNewIncident(prev => ({ ...prev, affectedAgentIds: e.target.value }))}
                      placeholder="e.g. agent-1, agent-2"
                      className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] mt-1 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleCreateIncident}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
                    >
                      Declare Incident
                    </button>
                    <button
                      onClick={() => setShowCreateIncident(false)}
                      className="px-4 py-2 rounded-lg bg-[#252636] text-[#9ca3af] text-xs font-medium hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
