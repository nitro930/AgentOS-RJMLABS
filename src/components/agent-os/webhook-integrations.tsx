'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Webhook,
  Plus,
  Trash2,
  ChevronDown,
  Link2,
  Send,
  Activity,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Zap,
  BarChart3,
  Clock,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WebhookEvent {
  id: string
  webhookId: string
  status: 'success' | 'failed'
  payload: string
  timestamp: string
}

interface WebhookItem {
  id: string
  name: string
  url: string
  sourceType: 'incoming' | 'outgoing'
  status: 'active' | 'inactive'
  agentId?: string
  workflowId?: string
  triggerCount: number
  failCount: number
  createdAt: string
  updatedAt: string
}

const sourceTypeConfig: Record<string, { color: string; bg: string; border: string }> = {
  incoming: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  outgoing: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
}

export function WebhookIntegrations() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null)
  const [events, setEvents] = useState<Record<string, WebhookEvent[]>>({})
  const [createOpen, setCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newSourceType, setNewSourceType] = useState<'incoming' | 'outgoing'>('incoming')
  const [newAgentId, setNewAgentId] = useState('')
  const [newWorkflowId, setNewWorkflowId] = useState('')
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([])
  const [workflows, setWorkflows] = useState<{ id: string; name: string }[]>([])

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch('/api/webhooks')
      const data = await res.json()
      setWebhooks(data)
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchAgentsAndWorkflows = useCallback(async () => {
    try {
      const [agentsRes, workflowsRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/workflows'),
      ])
      const agentsData = await agentsRes.json()
      const workflowsData = await workflowsRes.json()
      setAgents(agentsData.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })))
      setWorkflows(workflowsData.map((w: { id: string; name: string }) => ({ id: w.id, name: w.name })))
    } catch {
      // Error handling
    }
  }, [])

  const fetchEvents = useCallback(async (webhookId: string) => {
    try {
      const res = await fetch(`/api/webhooks/${webhookId}/events`)
      const data = await res.json()
      setEvents((prev) => ({ ...prev, [webhookId]: data.slice(0, 5) }))
    } catch {
      // Error handling
    }
  }, [])

  useEffect(() => {
    fetchWebhooks()
    const interval = setInterval(fetchWebhooks, 15000)
    return () => clearInterval(interval)
  }, [fetchWebhooks])

  useEffect(() => {
    if (createOpen) fetchAgentsAndWorkflows()
  }, [createOpen, fetchAgentsAndWorkflows])

  const handleToggle = async (webhook: WebhookItem) => {
    const newStatus = webhook.status === 'active' ? 'inactive' : 'active'
    await fetch(`/api/webhooks/${webhook.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchWebhooks()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
    fetchWebhooks()
    if (expandedWebhook === id) setExpandedWebhook(null)
  }

  const handleCreate = async () => {
    if (!newName.trim() || !newUrl.trim()) return
    setIsCreating(true)
    try {
      await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          url: newUrl,
          sourceType: newSourceType,
          agentId: newAgentId || undefined,
          workflowId: newWorkflowId || undefined,
        }),
      })
      setCreateOpen(false)
      setNewName('')
      setNewUrl('')
      setNewSourceType('incoming')
      setNewAgentId('')
      setNewWorkflowId('')
      fetchWebhooks()
    } catch {
      // Error handling
    } finally {
      setIsCreating(false)
    }
  }

  const handleExpand = (webhookId: string) => {
    if (expandedWebhook === webhookId) {
      setExpandedWebhook(null)
    } else {
      setExpandedWebhook(webhookId)
      if (!events[webhookId]) fetchEvents(webhookId)
    }
  }

  const stats = {
    total: webhooks.length,
    active: webhooks.filter((w) => w.status === 'active').length,
    totalTriggers: webhooks.reduce((sum, w) => sum + w.triggerCount, 0),
    failRate:
      webhooks.reduce((sum, w) => sum + w.triggerCount, 0) > 0
        ? Math.round(
            (webhooks.reduce((sum, w) => sum + w.failCount, 0) /
              webhooks.reduce((sum, w) => sum + w.triggerCount, 0)) *
              100
          )
        : 0,
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg sm:text-2xl font-bold text-white"
          >
            Webhooks
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Manage incoming and outgoing webhook integrations
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
              <Plus className="w-4 h-4" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-[#9ca3af] text-xs">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                  placeholder="Webhook name..."
                />
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">URL</Label>
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Source Type</Label>
                <select
                  value={newSourceType}
                  onChange={(e) => setNewSourceType(e.target.value as 'incoming' | 'outgoing')}
                  className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
                >
                  <option value="incoming">📥 Incoming</option>
                  <option value="outgoing">📤 Outgoing</option>
                </select>
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Link to Agent (optional)</Label>
                <select
                  value={newAgentId}
                  onChange={(e) => setNewAgentId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
                >
                  <option value="">None</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Link to Workflow (optional)</Label>
                <select
                  value={newWorkflowId}
                  onChange={(e) => setNewWorkflowId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
                >
                  <option value="">None</option>
                  {workflows.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || !newUrl.trim() || isCreating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isCreating ? 'Creating...' : 'Create Webhook'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Webhooks', value: stats.total, icon: Webhook, color: '#10b981' },
          { label: 'Active', value: stats.active, icon: Zap, color: '#22c55e' },
          { label: 'Total Triggers', value: stats.totalTriggers, icon: Activity, color: '#f59e0b' },
          { label: 'Fail Rate', value: `${stats.failRate}%`, icon: AlertTriangle, color: '#ef4444' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-4 hover:border-[#3d3e4d] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[#9ca3af]">{stat.label}</p>
                <p className="text-lg sm:text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Webhook Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-5 animate-pulse">
              <div className="h-4 w-32 bg-[#252636] rounded mb-3" />
              <div className="h-3 w-48 bg-[#252636] rounded mb-2" />
              <div className="h-3 w-24 bg-[#252636] rounded" />
            </div>
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-8 sm:p-12 text-center">
          <Webhook className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
          <p className="text-sm text-[#9ca3af]">No webhooks configured</p>
          <p className="text-xs text-[#6b7280] mt-1">Create your first webhook integration</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {webhooks.map((webhook) => {
            const stc = sourceTypeConfig[webhook.sourceType]
            const isExpanded = expandedWebhook === webhook.id
            return (
              <motion.div
                key={webhook.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5 hover:border-[#3d3e4d] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                        {webhook.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${stc.bg} ${stc.border} border ${stc.color}`}
                      >
                        {webhook.sourceType === 'incoming' ? (
                          <Link2 className="w-3 h-3" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        {webhook.sourceType}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                          webhook.status === 'active'
                            ? 'bg-emerald-500/10 border-emerald-500/30 border text-emerald-400'
                            : 'bg-[#252636] border-[#2d2e3d] border text-[#6b7280]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            webhook.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-[#6b7280]'
                          }`}
                        />
                        {webhook.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6b7280] truncate">{webhook.url}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#6b7280] mt-1">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {webhook.triggerCount} triggers
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {webhook.failCount} fails
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(webhook)}
                      className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                      title={webhook.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {webhook.status === 'active' ? (
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
                      className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-red-500/10 flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expandable Event Log */}
                <div
                  className="cursor-pointer flex items-center gap-1 text-[11px] text-[#9ca3af] hover:text-white transition-colors"
                  onClick={() => handleExpand(webhook.id)}
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>Event Log</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-[#2d2e3d] space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {events[webhook.id]?.length ? (
                          events[webhook.id].map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center gap-2 text-[11px] p-2 rounded-lg bg-[#252636]"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  event.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                              />
                              <span
                                className={
                                  event.status === 'success' ? 'text-emerald-400' : 'text-red-400'
                                }
                              >
                                {event.status}
                              </span>
                              <span className="text-[#6b7280] truncate flex-1">
                                {event.payload?.substring(0, 60) || 'No payload'}
                              </span>
                              <span className="text-[#6b7280] flex items-center gap-1 flex-shrink-0">
                                <Clock className="w-3 h-3" />
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-[#6b7280] text-center py-2">No events yet</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
