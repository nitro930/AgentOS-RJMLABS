'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, ArrowRight, CheckCircle, XCircle, Clock, AlertCircle,
  Plus, Loader2, Search, RefreshCw, Eye,
  Zap, Shield, FileText, Share2, Handshake, RotateCcw,
  Timer, TrendingUp, Network, ArrowUpRight, AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAgentOSStore } from '@/lib/store'

interface DelegationData {
  id: string
  fromAgentId: string
  toAgentId: string
  taskId: string | null
  type: string
  title: string
  description: string
  input: string
  output: string | null
  priority: string
  status: string
  deadline: string | null
  autoAccept: boolean
  requireAck: boolean
  acknowledgedAt: string | null
  completedAt: string | null
  reason: string | null
  tags: string
  createdAt: string
  updatedAt: string
  history: DelegationHistoryData[]
}

interface DelegationHistoryData {
  id: string
  delegationId: string
  action: string
  agentId: string | null
  details: string
  timestamp: string
}

interface AgentData {
  id: string
  name: string
  type: string
  avatar?: string
  status: string
  color?: string
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  task: { label: 'Task', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  query: { label: 'Query', icon: Search, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  review: { label: 'Review', icon: Eye, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  approval: { label: 'Approval', icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  context_share: { label: 'Context Share', icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; badge: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-400', badge: 'border-yellow-500/30 text-yellow-400' },
  accepted: { label: 'Accepted', icon: CheckCircle, color: 'text-blue-400', badge: 'border-blue-500/30 text-blue-400' },
  in_progress: { label: 'In Progress', icon: Loader2, color: 'text-emerald-400', badge: 'border-emerald-500/30 text-emerald-400' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-400', badge: 'border-green-500/30 text-green-400' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-400', badge: 'border-red-500/30 text-red-400' },
  expired: { label: 'Expired', icon: AlertTriangle, color: 'text-[#6b7280]', badge: 'border-[#2d2e3d] text-[#6b7280]' },
  revoked: { label: 'Revoked', icon: RotateCcw, color: 'text-[#4b5563]', badge: 'border-[#2d2e3d] text-[#4b5563]' },
}

const priorityConfig: Record<string, { label: string; color: string; badge: string }> = {
  low: { label: 'Low', color: 'text-[#6b7280]', badge: 'border-[#2d2e3d] text-[#6b7280]' },
  normal: { label: 'Normal', color: 'text-blue-400', badge: 'border-blue-500/30 text-blue-400' },
  high: { label: 'High', color: 'text-orange-400', badge: 'border-orange-500/30 text-orange-400' },
  urgent: { label: 'Urgent', color: 'text-red-400', badge: 'border-red-500/30 text-red-400' },
}

const historyActionIcons: Record<string, { icon: React.ElementType; color: string }> = {
  created: { icon: Plus, color: 'text-blue-400' },
  acknowledged: { icon: Handshake, color: 'text-purple-400' },
  accepted: { icon: CheckCircle, color: 'text-emerald-400' },
  rejected: { icon: XCircle, color: 'text-red-400' },
  completed: { icon: CheckCircle, color: 'text-green-400' },
  revoked: { icon: RotateCcw, color: 'text-[#6b7280]' },
  escalated: { icon: AlertTriangle, color: 'text-orange-400' },
}

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const now = Date.now()
  const end = new Date(deadline).getTime()
  const diff = end - now

  if (diff <= 0) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-red-400">
        <AlertTriangle className="w-3 h-3" />Overdue
      </span>
    )
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours < 1) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-red-400">
        <Timer className="w-3 h-3" />{minutes}m left
      </span>
    )
  }
  if (hours < 24) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-yellow-400">
        <Timer className="w-3 h-3" />{hours}h {minutes}m
      </span>
    )
  }
  const days = Math.floor(hours / 24)
  return (
    <span className="flex items-center gap-1 text-[10px] text-[#9ca3af]">
      <Timer className="w-3 h-3" />{days}d {hours % 24}h
    </span>
  )
}

export function AgentDelegation() {
  const { delegationTab, setDelegationTab } = useAgentOSStore()
  const [delegations, setDelegations] = useState<DelegationData[]>([])
  const [agents, setAgents] = useState<AgentData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDelegation, setSelectedDelegation] = useState<DelegationData | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Create form state
  const [createForm, setCreateForm] = useState({
    fromAgentId: '',
    toAgentId: '',
    type: 'task',
    title: '',
    description: '',
    input: '{}',
    priority: 'normal',
    deadline: '',
    autoAccept: false,
    requireAck: true,
    reason: '',
  })

  const fetchDelegations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/delegations?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setDelegations(data.delegations || [])
      }
    } catch (e) {
      console.error(e)
    }
  }, [statusFilter])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || [])
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchDelegationDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/delegations/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedDelegation(data.delegation)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchDelegations(), fetchAgents()])
      setLoading(false)
    }
    loadAll()
  }, [fetchDelegations, fetchAgents])

  const handleCreateDelegation = async () => {
    try {
      const res = await fetch('/api/delegations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          deadline: createForm.deadline || undefined,
          autoAccept: createForm.autoAccept,
          requireAck: createForm.requireAck,
          reason: createForm.reason || undefined,
        }),
      })
      if (res.ok) {
        await fetchDelegations()
        setCreateForm({
          fromAgentId: '', toAgentId: '', type: 'task', title: '',
          description: '', input: '{}', priority: 'normal', deadline: '',
          autoAccept: false, requireAck: true, reason: '',
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelegationAction = async (id: string, action: string, extra?: Record<string, any>) => {
    try {
      const res = await fetch(`/api/delegations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      if (res.ok) {
        await fetchDelegations()
        if (selectedDelegation?.id === id) {
          await fetchDelegationDetail(id)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleViewDetail = async (delegation: DelegationData) => {
    setSelectedDelegation(delegation)
    setDetailDialogOpen(true)
    await fetchDelegationDetail(delegation.id)
  }

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent ? `${agent.avatar || '🤖'} ${agent.name}` : agentId.slice(0, 8)
  }

  const getAgentColor = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent?.color || '#6366f1'
  }

  const activeDelegations = delegations.filter(d =>
    ['pending', 'accepted', 'in_progress'].includes(d.status)
  )

  const completedDelegations = delegations.filter(d =>
    ['completed', 'rejected', 'expired', 'revoked'].includes(d.status)
  )

  const filteredActive = activeDelegations.filter(d =>
    !searchQuery ||
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCompleted = completedDelegations.filter(d =>
    !statusFilter || statusFilter === 'all' || d.status === statusFilter
  ).filter(d =>
    !searchQuery ||
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getDuration = (d: DelegationData) => {
    if (!d.completedAt) return null
    const start = new Date(d.createdAt).getTime()
    const end = new Date(d.completedAt).getTime()
    const diffMin = Math.round((end - start) / 60000)
    if (diffMin < 60) return `${diffMin}m`
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`
    return `${Math.floor(diffMin / 1440)}d ${Math.floor((diffMin % 1440) / 60)}h`
  }

  // Build flow data for Flow tab
  const flowNodes = agents.filter(a =>
    delegations.some(d => d.fromAgentId === a.id || d.toAgentId === a.id)
  )

  const flowEdges = delegations.reduce((acc, d) => {
    const key = `${d.fromAgentId}->${d.toAgentId}`
    if (!acc[key]) {
      acc[key] = {
        from: d.fromAgentId,
        to: d.toAgentId,
        count: 0,
        active: 0,
        types: new Set<string>(),
      }
    }
    acc[key].count++
    if (['pending', 'accepted', 'in_progress'].includes(d.status)) acc[key].active++
    acc[key].types.add(d.type)
    return acc
  }, {} as Record<string, { from: string; to: string; count: number; active: number; types: Set<string> }>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  // Stats
  const totalActive = activeDelegations.length
  const pendingCount = delegations.filter(d => d.status === 'pending').length
  const completedCount = delegations.filter(d => d.status === 'completed').length
  const urgentCount = delegations.filter(d => d.priority === 'urgent' && ['pending', 'in_progress'].includes(d.status)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Send className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Agent Delegation</h2>
            <p className="text-xs text-[#6b7280]">Inter-agent task delegation & context routing</p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setDelegationTab('create')}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />New Delegation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active', value: totalActive, icon: Send, color: 'text-emerald-400' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-yellow-400' },
          { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Urgent', value: urgentCount, icon: AlertTriangle, color: 'text-red-400' },
        ].map(stat => (
          <Card key={stat.label} className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6b7280]">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={delegationTab} onValueChange={setDelegationTab}>
        <TabsList className="bg-[#1e1f2b] border border-[#2d2e3d] w-full justify-start overflow-x-auto">
          <TabsTrigger value="active" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Send className="w-3.5 h-3.5 mr-1.5" />Active
            {totalActive > 0 && (
              <Badge variant="outline" className="ml-1.5 text-[9px] border-emerald-500/30 text-emerald-400 h-4 px-1">
                {totalActive}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />Completed
          </TabsTrigger>
          <TabsTrigger value="create" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Plus className="w-3.5 h-3.5 mr-1.5" />Create
          </TabsTrigger>
          <TabsTrigger value="flow" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Network className="w-3.5 h-3.5 mr-1.5" />Flow
          </TabsTrigger>
        </TabsList>

        {/* Active Tab */}
        <TabsContent value="active" className="mt-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search delegations..."
                  className="pl-10 bg-[#1e1f2b] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
                onClick={() => fetchDelegations()}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>

            {filteredActive.length === 0 ? (
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-8 text-center">
                  <Send className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280] mb-3">No active delegations</p>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setDelegationTab('create')}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />Create Delegation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                {filteredActive.map((delegation, i) => {
                  const typeCfg = typeConfig[delegation.type] || typeConfig.task
                  const statusCfg = statusConfig[delegation.status] || statusConfig.pending
                  const priorityCfg = priorityConfig[delegation.priority] || priorityConfig.normal
                  const TypeIcon = typeCfg.icon
                  const StatusIcon = statusCfg.icon

                  return (
                    <motion.div
                      key={delegation.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-lg ${typeCfg.bg} flex items-center justify-center flex-shrink-0`}>
                              <TypeIcon className={`w-4 h-4 ${typeCfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-medium text-white">{delegation.title}</h4>
                                <Badge variant="outline" className={`text-[9px] ${priorityCfg.badge}`}>
                                  {priorityCfg.label}
                                </Badge>
                                <Badge variant="outline" className={`text-[9px] ${statusCfg.badge}`}>
                                  <StatusIcon className={`w-2.5 h-2.5 mr-0.5 ${delegation.status === 'in_progress' ? 'animate-spin' : ''}`} />
                                  {statusCfg.label}
                                </Badge>
                              </div>
                              {delegation.description && (
                                <p className="text-xs text-[#9ca3af] mt-0.5 line-clamp-1">{delegation.description}</p>
                              )}
                              {/* Agent Flow */}
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0f1117]">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getAgentColor(delegation.fromAgentId) }} />
                                  <span className="text-[10px] text-white font-medium">{getAgentName(delegation.fromAgentId)}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0f1117]">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getAgentColor(delegation.toAgentId) }} />
                                  <span className="text-[10px] text-white font-medium">{getAgentName(delegation.toAgentId)}</span>
                                </div>
                                {delegation.deadline && <DeadlineCountdown deadline={delegation.deadline} />}
                                {delegation.requireAck && !delegation.acknowledgedAt && (
                                  <Badge variant="outline" className="text-[8px] border-purple-500/30 text-purple-400">
                                    ACK REQ
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {delegation.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-emerald-400 hover:bg-emerald-500/10 h-7 w-7 p-0"
                                    onClick={() => handleDelegationAction(delegation.id, 'accept', { agentId: delegation.toAgentId })}
                                    title="Accept"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                                    onClick={() => handleDelegationAction(delegation.id, 'reject', { agentId: delegation.toAgentId })}
                                    title="Reject"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}
                              {delegation.status === 'pending' && delegation.requireAck && !delegation.acknowledgedAt && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-purple-400 hover:bg-purple-500/10 h-7 w-7 p-0"
                                  onClick={() => handleDelegationAction(delegation.id, 'acknowledge', { agentId: delegation.toAgentId })}
                                  title="Acknowledge"
                                >
                                  <Handshake className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {delegation.status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-400 hover:bg-green-500/10 h-7 w-7 p-0"
                                  onClick={() => handleDelegationAction(delegation.id, 'complete', { agentId: delegation.toAgentId })}
                                  title="Complete"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {['pending', 'accepted', 'in_progress'].includes(delegation.status) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-[#6b7280] hover:bg-[#1e1f2b] h-7 w-7 p-0"
                                  onClick={() => handleDelegationAction(delegation.id, 'revoke', { agentId: delegation.fromAgentId })}
                                  title="Revoke"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-[#9ca3af] hover:bg-[#1e1f2b] h-7 w-7 p-0"
                                onClick={() => handleViewDetail(delegation)}
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search completed delegations..."
                  className="pl-10 bg-[#1e1f2b] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-[#1e1f2b] border-[#2d2e3d] text-white text-sm">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredCompleted.length === 0 ? (
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280]">No completed delegations yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                {filteredCompleted.map((delegation, i) => {
                  const typeCfg = typeConfig[delegation.type] || typeConfig.task
                  const statusCfg = statusConfig[delegation.status] || statusConfig.completed
                  const priorityCfg = priorityConfig[delegation.priority] || priorityConfig.normal
                  const TypeIcon = typeCfg.icon
                  const StatusIcon = statusCfg.icon
                  const duration = getDuration(delegation)

                  return (
                    <motion.div
                      key={delegation.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors opacity-80">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-lg ${typeCfg.bg} flex items-center justify-center flex-shrink-0`}>
                              <TypeIcon className={`w-4 h-4 ${typeCfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-medium text-white">{delegation.title}</h4>
                                <Badge variant="outline" className={`text-[9px] ${statusCfg.badge}`}>
                                  <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                                  {statusCfg.label}
                                </Badge>
                                <Badge variant="outline" className={`text-[9px] ${priorityCfg.badge}`}>
                                  {priorityCfg.label}
                                </Badge>
                              </div>
                              {delegation.description && (
                                <p className="text-xs text-[#9ca3af] mt-0.5 line-clamp-1">{delegation.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0f1117]">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getAgentColor(delegation.fromAgentId) }} />
                                  <span className="text-[10px] text-white">{getAgentName(delegation.fromAgentId)}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-[#4b5563] flex-shrink-0" />
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0f1117]">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getAgentColor(delegation.toAgentId) }} />
                                  <span className="text-[10px] text-white">{getAgentName(delegation.toAgentId)}</span>
                                </div>
                                {duration && (
                                  <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />{duration}
                                  </span>
                                )}
                                {delegation.completedAt && (
                                  <span className="text-[10px] text-[#6b7280]">
                                    {new Date(delegation.completedAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              {delegation.output && (() => {
                                try {
                                  const output = JSON.parse(delegation.output)
                                  return (
                                    <div className="mt-2 p-2 rounded bg-[#0f1117] border border-[#2d2e3d]">
                                      <p className="text-[10px] text-[#6b7280] mb-0.5">Output</p>
                                      <p className="text-[10px] text-emerald-400 font-mono line-clamp-2">
                                        {JSON.stringify(output, null, 2).slice(0, 200)}
                                      </p>
                                    </div>
                                  )
                                } catch {
                                  return null
                                }
                              })()}
                              {delegation.reason && (
                                <p className="text-[10px] text-[#9ca3af] mt-1 italic">Reason: {delegation.reason}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[#9ca3af] hover:bg-[#1e1f2b] h-7 w-7 p-0"
                              onClick={() => handleViewDetail(delegation)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create" className="mt-4">
          <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                New Delegation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* From Agent */}
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">From Agent *</label>
                  <Select value={createForm.fromAgentId} onValueChange={v => setCreateForm(p => ({ ...p, fromAgentId: v }))}>
                    <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                      <SelectValue placeholder="Select delegating agent..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                      {agents.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.avatar} {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* To Agent */}
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">To Agent *</label>
                  <Select value={createForm.toAgentId} onValueChange={v => setCreateForm(p => ({ ...p, toAgentId: v }))}>
                    <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                      <SelectValue placeholder="Select receiving agent..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                      {agents.filter(a => a.id !== createForm.fromAgentId).map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.avatar} {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Flow preview */}
              {createForm.fromAgentId && createForm.toAgentId && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getAgentColor(createForm.fromAgentId) }} />
                    <span className="text-xs text-white font-medium">{getAgentName(createForm.fromAgentId)}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getAgentColor(createForm.toAgentId) }} />
                    <span className="text-xs text-white font-medium">{getAgentName(createForm.toAgentId)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Type</label>
                  <Select value={createForm.type} onValueChange={v => setCreateForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                      {Object.entries(typeConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            {cfg.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Priority */}
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Priority</label>
                  <Select value={createForm.priority} onValueChange={v => setCreateForm(p => ({ ...p, priority: v }))}>
                    <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                      {Object.entries(priorityConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Title *</label>
                <Input
                  value={createForm.title}
                  onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Review authentication code"
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
                <Textarea
                  value={createForm.description}
                  onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the delegation context and requirements..."
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm min-h-[80px]"
                />
              </div>

              {/* Input Context */}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Input Context (JSON)</label>
                <Textarea
                  value={createForm.input}
                  onChange={e => setCreateForm(p => ({ ...p, input: e.target.value }))}
                  placeholder='{"key": "value"}'
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm font-mono min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Deadline */}
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Deadline</label>
                  <Input
                    type="datetime-local"
                    value={createForm.deadline}
                    onChange={e => setCreateForm(p => ({ ...p, deadline: e.target.value }))}
                    className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                  />
                </div>
                {/* Reason */}
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Reason</label>
                  <Input
                    value={createForm.reason}
                    onChange={e => setCreateForm(p => ({ ...p, reason: e.target.value }))}
                    placeholder="Reason for delegation..."
                    className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.autoAccept}
                    onChange={e => setCreateForm(p => ({ ...p, autoAccept: e.target.checked }))}
                    className="w-4 h-4 rounded border-[#2d2e3d] bg-[#0f1117] accent-emerald-500"
                  />
                  <span className="text-xs text-[#9ca3af]">Auto-accept</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.requireAck}
                    onChange={e => setCreateForm(p => ({ ...p, requireAck: e.target.checked }))}
                    className="w-4 h-4 rounded border-[#2d2e3d] bg-[#0f1117] accent-emerald-500"
                  />
                  <span className="text-xs text-[#9ca3af]">Require acknowledgment</span>
                </label>
              </div>

              <Button
                onClick={handleCreateDelegation}
                disabled={!createForm.fromAgentId || !createForm.toAgentId || !createForm.title}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />Create Delegation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flow Tab */}
        <TabsContent value="flow" className="mt-4">
          {flowNodes.length === 0 ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <Network className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280] mb-3">No delegation flows yet. Create delegations to see the flow diagram.</p>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setDelegationTab('create')}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />Create Delegation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Flow Visualization */}
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Network className="w-4 h-4 text-emerald-400" />
                    Delegation Flow Diagram
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative min-h-[300px] bg-[#0f1117] rounded-lg border border-[#2d2e3d] p-6 overflow-auto">
                    {/* Agent Nodes */}
                    <div className="flex flex-wrap gap-6 justify-center">
                      {flowNodes.map((agent, i) => {
                        const outCount = Object.values(flowEdges).filter(e => e.from === agent.id).length
                        const inCount = Object.values(flowEdges).filter(e => e.to === agent.id).length
                        const hasActive = Object.values(flowEdges).some(e =>
                          (e.from === agent.id || e.to === agent.id) && e.active > 0
                        )

                        return (
                          <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
                              hasActive
                                ? 'border-emerald-500/40 bg-emerald-500/5'
                                : 'border-[#2d2e3d] bg-[#1e1f2b]'
                            }`}
                          >
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                              style={{ backgroundColor: `${agent.color || '#6366f1'}20` }}
                            >
                              {agent.avatar || '🤖'}
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-medium text-white">{agent.name}</p>
                              <p className="text-[9px] text-[#6b7280]">
                                {outCount} out · {inCount} in
                              </p>
                            </div>
                            {hasActive && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* Edges */}
                    <div className="mt-6 space-y-2">
                      {Object.entries(flowEdges).map(([key, edge], i) => {
                        const fromAgent = agents.find(a => a.id === edge.from)
                        const toAgent = agents.find(a => a.id === edge.to)
                        const typesArray = Array.from(edge.types)

                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                              edge.active > 0
                                ? 'border-emerald-500/30 bg-emerald-500/5'
                                : 'border-[#2d2e3d] bg-[#1e1f2b]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fromAgent?.color || '#6366f1' }} />
                              <span className="text-[10px] text-white">{fromAgent?.name || edge.from.slice(0, 8)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {edge.active > 0 && (
                                <motion.div
                                  animate={{ x: [0, 4, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                                </motion.div>
                              )}
                              {edge.active === 0 && (
                                <ArrowRight className="w-3.5 h-3.5 text-[#4b5563]" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: toAgent?.color || '#6366f1' }} />
                              <span className="text-[10px] text-white">{toAgent?.name || edge.to.slice(0, 8)}</span>
                            </div>
                            <div className="flex-1" />
                            <div className="flex items-center gap-1.5">
                              {typesArray.map(t => {
                                const cfg = typeConfig[t]
                                return cfg ? (
                                  <Badge key={t} variant="outline" className={`text-[8px] ${cfg.badge || 'border-[#2d2e3d] text-[#6b7280]'}`}>
                                    <cfg.icon className="w-2.5 h-2.5 mr-0.5" />{cfg.label}
                                  </Badge>
                                ) : null
                              })}
                              <Badge variant="outline" className="text-[8px] border-[#2d2e3d] text-[#9ca3af]">
                                {edge.count} total
                              </Badge>
                              {edge.active > 0 && (
                                <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-400">
                                  {edge.active} active
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Flows', value: Object.keys(flowEdges).length, icon: Network, color: 'text-blue-400' },
                  { label: 'Active Flows', value: Object.values(flowEdges).filter(e => e.active > 0).length, icon: Send, color: 'text-emerald-400' },
                  { label: 'Agent Nodes', value: flowNodes.length, icon: FileText, color: 'text-purple-400' },
                  { label: 'Total Delegations', value: delegations.length, icon: TrendingUp, color: 'text-yellow-400' },
                ].map(stat => (
                  <Card key={stat.label} className="bg-[#1e1f2b] border-[#2d2e3d]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[#6b7280]">{stat.label}</p>
                          <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                        <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {selectedDelegation && (() => {
                const cfg = typeConfig[selectedDelegation.type] || typeConfig.task
                const Icon = cfg.icon
                return <><Icon className={`w-4 h-4 ${cfg.color}`} />{selectedDelegation.title}</>
              })()}
            </DialogTitle>
          </DialogHeader>
          {selectedDelegation && (
            <div className="space-y-4 mt-2">
              {/* Status & Type */}
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const statusCfg = statusConfig[selectedDelegation.status] || statusConfig.pending
                  const StatusIcon = statusCfg.icon
                  return (
                    <Badge variant="outline" className={`text-[9px] ${statusCfg.badge}`}>
                      <StatusIcon className={`w-2.5 h-2.5 mr-0.5 ${selectedDelegation.status === 'in_progress' ? 'animate-spin' : ''}`} />
                      {statusCfg.label}
                    </Badge>
                  )
                })()}
                {(() => {
                  const priorityCfg = priorityConfig[selectedDelegation.priority] || priorityConfig.normal
                  return (
                    <Badge variant="outline" className={`text-[9px] ${priorityCfg.badge}`}>
                      {priorityCfg.label}
                    </Badge>
                  )
                })()}
              </div>

              {/* Agent Flow */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getAgentColor(selectedDelegation.fromAgentId) }} />
                  <span className="text-xs text-white font-medium">{getAgentName(selectedDelegation.fromAgentId)}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getAgentColor(selectedDelegation.toAgentId) }} />
                  <span className="text-xs text-white font-medium">{getAgentName(selectedDelegation.toAgentId)}</span>
                </div>
              </div>

              {/* Description */}
              {selectedDelegation.description && (
                <div>
                  <p className="text-xs text-[#6b7280] mb-1">Description</p>
                  <p className="text-sm text-[#9ca3af]">{selectedDelegation.description}</p>
                </div>
              )}

              {/* Input/Output */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedDelegation.input && selectedDelegation.input !== '{}' && (
                  <div>
                    <p className="text-xs text-[#6b7280] mb-1">Input</p>
                    <div className="p-2 rounded bg-[#0f1117] border border-[#2d2e3d]">
                      <pre className="text-[10px] text-blue-400 font-mono overflow-x-auto whitespace-pre-wrap">
                        {(() => { try { return JSON.stringify(JSON.parse(selectedDelegation.input), null, 2) } catch { return selectedDelegation.input } })()}
                      </pre>
                    </div>
                  </div>
                )}
                {selectedDelegation.output && (
                  <div>
                    <p className="text-xs text-[#6b7280] mb-1">Output</p>
                    <div className="p-2 rounded bg-[#0f1117] border border-[#2d2e3d]">
                      <pre className="text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">
                        {(() => { try { return JSON.stringify(JSON.parse(selectedDelegation.output!), null, 2) } catch { return selectedDelegation.output } })()}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-[10px] text-[#6b7280]">
                <div>Created: {new Date(selectedDelegation.createdAt).toLocaleString()}</div>
                {selectedDelegation.completedAt && <div>Completed: {new Date(selectedDelegation.completedAt).toLocaleString()}</div>}
                {selectedDelegation.deadline && <div>Deadline: {new Date(selectedDelegation.deadline).toLocaleString()}</div>}
                {selectedDelegation.acknowledgedAt && <div>Acknowledged: {new Date(selectedDelegation.acknowledgedAt).toLocaleString()}</div>}
                {selectedDelegation.autoAccept && <div>Auto-accept: Yes</div>}
                {selectedDelegation.requireAck && <div>Requires acknowledgment: Yes</div>}
              </div>

              {/* History */}
              {selectedDelegation.history && selectedDelegation.history.length > 0 && (
                <div>
                  <p className="text-xs text-[#6b7280] mb-2">History</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {selectedDelegation.history.map((entry, i) => {
                      const actionCfg = historyActionIcons[entry.action] || { icon: Clock, color: 'text-[#6b7280]' }
                      const ActionIcon = actionCfg.icon
                      return (
                        <div key={entry.id || i} className="flex items-start gap-2 p-2 rounded bg-[#0f1117] border border-[#2d2e3d]">
                          <ActionIcon className={`w-3 h-3 mt-0.5 ${actionCfg.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white font-medium capitalize">{entry.action.replace('_', ' ')}</span>
                              {entry.agentId && (
                                <span className="text-[9px] text-[#6b7280]">by {getAgentName(entry.agentId)}</span>
                              )}
                            </div>
                            {entry.details && entry.details !== '{}' && (
                              <p className="text-[9px] text-[#4b5563] mt-0.5 font-mono line-clamp-2">
                                {(() => { try { return JSON.stringify(JSON.parse(entry.details), null, 2).slice(0, 150) } catch { return entry.details } })()}
                              </p>
                            )}
                            <p className="text-[9px] text-[#4b5563] mt-0.5">{new Date(entry.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              {['pending', 'accepted', 'in_progress'].includes(selectedDelegation.status) && (
                <div className="flex items-center gap-2 pt-2 border-t border-[#2d2e3d]">
                  {selectedDelegation.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => {
                          handleDelegationAction(selectedDelegation.id, 'accept', { agentId: selectedDelegation.toAgentId })
                          setDetailDialogOpen(false)
                        }}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => {
                          handleDelegationAction(selectedDelegation.id, 'reject', { agentId: selectedDelegation.toAgentId })
                          setDetailDialogOpen(false)
                        }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />Reject
                      </Button>
                    </>
                  )}
                  {selectedDelegation.status === 'in_progress' && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        handleDelegationAction(selectedDelegation.id, 'complete', { agentId: selectedDelegation.toAgentId })
                        setDetailDialogOpen(false)
                      }}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />Complete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#2d2e3d] text-[#6b7280] hover:bg-[#1e1f2b]"
                    onClick={() => {
                      handleDelegationAction(selectedDelegation.id, 'revoke', { agentId: selectedDelegation.fromAgentId })
                      setDetailDialogOpen(false)
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Revoke
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
