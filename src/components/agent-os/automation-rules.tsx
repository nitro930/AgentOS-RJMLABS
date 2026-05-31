'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Play,
  Pause,
  Trash2,
  Plus,
  Clock,
  Eye,
  ArrowRight,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Settings,
  Webhook,
  Gauge,
  GitBranch,
  Bell,
  Bot,
  FileText,
  RotateCcw,
  Shield,
  ChevronDown,
  Copy,
  Sparkles,
  Activity,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAgentOSStore } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────

interface AutomationRule {
  id: string
  name: string
  description: string | null
  isActive: boolean
  triggerType: string
  triggerConfig: string
  conditions: string
  actions: string
  cooldownMs: number
  maxExecutions: number | null
  executionCount: number
  lastTriggeredAt: string | null
  lastExecutionStatus: string
  priority: number
  tags: string
  createdAt: string
  updatedAt: string
  _count?: { executions: number }
}

interface AutomationExecution {
  id: string
  ruleId: string
  triggerData: string
  actionsData: string
  status: string
  error: string | null
  duration: number
  startedAt: string
  completedAt: string | null
  rule?: { id: string; name: string; triggerType: string }
}

// ─── Constants ───────────────────────────────────────────────────

const triggerTypes = [
  { value: 'event', label: 'Event', icon: Zap, color: '#10b981', description: 'Trigger on system events' },
  { value: 'schedule', label: 'Schedule', icon: Calendar, color: '#3b82f6', description: 'Cron-based scheduling' },
  { value: 'condition', label: 'Condition', icon: GitBranch, color: '#f59e0b', description: 'Conditional logic triggers' },
  { value: 'webhook', label: 'Webhook', icon: Webhook, color: '#8b5cf6', description: 'HTTP webhook triggers' },
  { value: 'threshold', label: 'Threshold', icon: Gauge, color: '#ef4444', description: 'Value threshold alerts' },
]

const actionTypes = [
  { value: 'notify', label: 'Send Notification', icon: Bell },
  { value: 'run_agent', label: 'Run Agent', icon: Bot },
  { value: 'run_workflow', label: 'Run Workflow', icon: GitBranch },
  { value: 'send_webhook', label: 'Send Webhook', icon: Webhook },
  { value: 'log', label: 'Log Event', icon: FileText },
  { value: 'pause_agent', label: 'Pause Agent', icon: Pause },
]

const ruleTemplates = [
  {
    name: 'Alert on Agent Failure',
    description: 'Automatically notify when an agent enters error state',
    triggerType: 'event',
    triggerConfig: { eventType: 'agent.error' },
    conditions: [{ field: 'status', operator: 'equals', value: 'error' }],
    actions: [{ type: 'notify', config: { channel: 'default', message: 'Agent {{agentName}} has entered error state' } }],
    priority: 10,
    cooldownMs: 300000,
    tags: ['alert', 'agent', 'error'],
  },
  {
    name: 'Auto-Restart on Crash',
    description: 'Automatically restart agents that crash unexpectedly',
    triggerType: 'event',
    triggerConfig: { eventType: 'agent.crashed' },
    conditions: [{ field: 'crashCount', operator: 'less_than', value: '3' }],
    actions: [
      { type: 'run_agent', config: { restart: true, delay: 5000 } },
      { type: 'notify', config: { channel: 'default', message: 'Agent {{agentName}} auto-restarted after crash' } },
    ],
    priority: 20,
    cooldownMs: 60000,
    tags: ['recovery', 'agent', 'auto-restart'],
  },
  {
    name: 'Cost Threshold Alert',
    description: 'Alert when daily cost exceeds a threshold',
    triggerType: 'threshold',
    triggerConfig: { metric: 'daily_cost', operator: 'greater_than', threshold: 50 },
    conditions: [],
    actions: [{ type: 'notify', config: { channel: 'default', message: 'Daily cost threshold exceeded: ${{value}}' } }],
    priority: 15,
    cooldownMs: 3600000,
    tags: ['cost', 'alert', 'threshold'],
  },
  {
    name: 'Daily Summary Report',
    description: 'Generate a daily summary of agent activities',
    triggerType: 'schedule',
    triggerConfig: { cron: '0 9 * * *' },
    conditions: [],
    actions: [
      { type: 'log', config: { message: 'Daily summary generated' } },
      { type: 'notify', config: { channel: 'default', message: 'Daily summary report ready' } },
    ],
    priority: 5,
    cooldownMs: 0,
    tags: ['report', 'summary', 'daily'],
  },
  {
    name: 'Webhook Pipeline Trigger',
    description: 'Run a workflow when an external webhook is received',
    triggerType: 'webhook',
    triggerConfig: { path: '/trigger/pipeline', method: 'POST' },
    conditions: [{ field: 'payload.type', operator: 'equals', value: 'pipeline_run' }],
    actions: [{ type: 'run_workflow', config: { workflowId: '{{payload.workflowId}}' } }],
    priority: 8,
    cooldownMs: 0,
    tags: ['webhook', 'pipeline', 'automation'],
  },
  {
    name: 'High CPU Alert',
    description: 'Alert when system CPU usage exceeds threshold',
    triggerType: 'threshold',
    triggerConfig: { metric: 'cpu_usage', operator: 'greater_than', threshold: 85 },
    conditions: [],
    actions: [
      { type: 'pause_agent', config: { agentId: 'all_low_priority' } },
      { type: 'notify', config: { channel: 'default', message: 'High CPU usage detected: {{value}}%' } },
    ],
    priority: 25,
    cooldownMs: 600000,
    tags: ['system', 'performance', 'alert'],
  },
]

const conditionOperators = ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains', 'matches']

// ─── Helpers ─────────────────────────────────────────────────────

function parseJSON<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    if (diffMs < 60000) return 'Just now'
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.floor(diffHr / 24)
    return `${diffDay}d ago`
  } catch {
    return dateStr
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// ─── Component ───────────────────────────────────────────────────

export function AutomationRules() {
  const { automationTab, setAutomationTab, addToast } = useAgentOSStore()

  // State
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [executions, setExecutions] = useState<AutomationExecution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailRule, setDetailRule] = useState<AutomationRule | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Create form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTriggerType, setFormTriggerType] = useState('event')
  const [formTriggerConfig, setFormTriggerConfig] = useState<Record<string, unknown>>({})
  const [formConditions, setFormConditions] = useState<{ field: string; operator: string; value: string }[]>([])
  const [formActions, setFormActions] = useState<{ type: string; config: Record<string, unknown> }[]>([])
  const [formCooldown, setFormCooldown] = useState(0)
  const [formMaxExecutions, setFormMaxExecutions] = useState<number | ''>('')
  const [formPriority, setFormPriority] = useState(0)

  // Fetch data
  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/automation-rules')
      const data = await res.json()
      setRules(data || [])
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchExecutions = useCallback(async () => {
    try {
      const res = await fetch('/api/automation-executions?limit=50')
      const data = await res.json()
      setExecutions(data || [])
    } catch {
      // Error handling
    }
  }, [])

  useEffect(() => {
    fetchRules()
    fetchExecutions()
    const interval = setInterval(() => {
      fetchRules()
      fetchExecutions()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchRules, fetchExecutions])

  // Handlers
  const handleToggle = async (rule: AutomationRule) => {
    try {
      await fetch(`/api/automation-rules/${rule.id}/toggle`, { method: 'POST' })
      addToast(`Rule "${rule.name}" ${rule.isActive ? 'paused' : 'activated'}`, rule.isActive ? 'info' : 'success')
      fetchRules()
    } catch {
      addToast('Failed to toggle rule', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/automation-rules/${id}`, { method: 'DELETE' })
      addToast('Rule deleted', 'success')
      setDeleteConfirmId(null)
      fetchRules()
    } catch {
      addToast('Failed to delete rule', 'error')
    }
  }

  const handleExecute = async (id: string) => {
    try {
      await fetch(`/api/automation-rules/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerData: { type: 'manual', triggeredBy: 'user' } }),
      })
      addToast('Rule triggered manually', 'success')
      fetchRules()
      fetchExecutions()
    } catch {
      addToast('Failed to execute rule', 'error')
    }
  }

  const handleCreateFromTemplate = (template: typeof ruleTemplates[0]) => {
    setFormName(template.name)
    setFormDescription(template.description)
    setFormTriggerType(template.triggerType)
    setFormTriggerConfig(template.triggerConfig as Record<string, unknown>)
    setFormConditions(template.conditions as { field: string; operator: string; value: string }[])
    setFormActions(template.actions as { type: string; config: Record<string, unknown> }[])
    setFormCooldown(template.cooldownMs)
    setFormMaxExecutions('')
    setFormPriority(template.priority)
    setCreateOpen(true)
  }

  const handleCreate = async () => {
    if (!formName.trim()) return
    setIsCreating(true)
    try {
      await fetch('/api/automation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          triggerType: formTriggerType,
          triggerConfig: formTriggerConfig,
          conditions: formConditions,
          actions: formActions,
          cooldownMs: formCooldown,
          maxExecutions: formMaxExecutions === '' ? null : formMaxExecutions,
          priority: formPriority,
        }),
      })
      addToast(`Rule "${formName}" created`, 'success')
      setCreateOpen(false)
      resetForm()
      fetchRules()
    } catch {
      addToast('Failed to create rule', 'error')
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormTriggerType('event')
    setFormTriggerConfig({})
    setFormConditions([])
    setFormActions([{ type: 'notify', config: {} }])
    setFormCooldown(0)
    setFormMaxExecutions('')
    setFormPriority(0)
  }

  const addCondition = () => {
    setFormConditions([...formConditions, { field: '', operator: 'equals', value: '' }])
  }

  const removeCondition = (index: number) => {
    setFormConditions(formConditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, key: string, value: string) => {
    const updated = [...formConditions]
    updated[index] = { ...updated[index], [key]: value }
    setFormConditions(updated)
  }

  const addAction = () => {
    setFormActions([...formActions, { type: 'notify', config: {} }])
  }

  const removeAction = (index: number) => {
    setFormActions(formActions.filter((_, i) => i !== index))
  }

  const updateActionType = (index: number, type: string) => {
    const updated = [...formActions]
    updated[index] = { type, config: {} }
    setFormActions(updated)
  }

  const updateActionConfig = (index: number, key: string, value: string) => {
    const updated = [...formActions]
    updated[index] = { ...updated[index], config: { ...updated[index].config, [key]: value } }
    setFormActions(updated)
  }

  // Stats
  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.isActive).length,
    totalExecutions: rules.reduce((sum, r) => sum + r.executionCount, 0),
    failed: rules.filter((r) => r.lastExecutionStatus === 'failed').length,
  }

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2"
          >
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            Automation Rules
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            If-This-Then-That automation engine &mdash; <span className="text-emerald-400 font-mono text-[10px]">RJMLABS.CO.UK</span>
          </p>
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
          onClick={() => { resetForm(); setCreateOpen(true) }}
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1e1f2b] border border-[#2d2e3d] w-fit">
        {[
          { id: 'rules', label: 'Rules', icon: Zap },
          { id: 'executions', label: 'Executions', icon: Activity },
          { id: 'templates', label: 'Templates', icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAutomationTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              automationTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#252636]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.id === 'rules' && rules.length > 0 && (
              <span className="text-[10px] bg-[#252636] px-1.5 py-0.5 rounded-full">{rules.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Total Rules', value: stats.total, icon: Zap, color: '#10b981' },
          { label: 'Active', value: stats.active, icon: Play, color: '#22c55e' },
          { label: 'Executions', value: stats.totalExecutions, icon: Activity, color: '#3b82f6' },
          { label: 'Failed', value: stats.failed, icon: AlertTriangle, color: '#ef4444' },
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

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {automationTab === 'rules' && (
          <motion.div
            key="rules"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <RulesList
              rules={rules}
              isLoading={isLoading}
              onToggle={handleToggle}
              onDelete={(id) => setDeleteConfirmId(id)}
              onExecute={handleExecute}
              onViewDetail={(rule) => setDetailRule(rule)}
            />
          </motion.div>
        )}

        {automationTab === 'executions' && (
          <motion.div
            key="executions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ExecutionsList executions={executions} isLoading={isLoading} />
          </motion.div>
        )}

        {automationTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <TemplatesGrid onSelect={handleCreateFromTemplate} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Rule Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              Create Automation Rule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Name & Description */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-[#9ca3af] text-xs">Rule Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                  placeholder="e.g. Alert on Agent Failure"
                />
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Description</Label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                  placeholder="What does this rule do?"
                />
              </div>
            </div>

            {/* Trigger Type */}
            <div>
              <Label className="text-[#9ca3af] text-xs mb-2 block">Trigger Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {triggerTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setFormTriggerType(t.value)
                      setFormTriggerConfig({})
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-colors ${
                      formTriggerType === t.value
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-[#2d2e3d] bg-[#252636] hover:border-[#3d3e4d]'
                    }`}
                  >
                    <t.icon className="w-4 h-4 flex-shrink-0" style={{ color: t.color }} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{t.label}</p>
                      <p className="text-[10px] text-[#6b7280] truncate">{t.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger Config */}
            <div>
              <Label className="text-[#9ca3af] text-xs mb-2 block">
                Trigger Configuration
                <span className="text-emerald-400 ml-1">({triggerTypes.find((t) => t.value === formTriggerType)?.label})</span>
              </Label>
              <div className="rounded-lg border border-[#2d2e3d] bg-[#252636] p-3 space-y-2">
                {formTriggerType === 'event' && (
                  <>
                    <div>
                      <Label className="text-[10px] text-[#6b7280]">Event Type</Label>
                      <Input
                        value={(formTriggerConfig.eventType as string) || ''}
                        onChange={(e) => setFormTriggerConfig({ ...formTriggerConfig, eventType: e.target.value })}
                        className="bg-[#1e1f2b] border-[#2d2e3d] text-white text-xs mt-1"
                        placeholder="agent.error, system.alert, task.completed"
                      />
                    </div>
                  </>
                )}
                {formTriggerType === 'schedule' && (
                  <>
                    <div>
                      <Label className="text-[10px] text-[#6b7280]">Cron Expression</Label>
                      <Input
                        value={(formTriggerConfig.cron as string) || ''}
                        onChange={(e) => setFormTriggerConfig({ ...formTriggerConfig, cron: e.target.value })}
                        className="bg-[#1e1f2b] border-[#2d2e3d] text-white text-xs mt-1 font-mono"
                        placeholder="0 9 * * *"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['*/5 * * * *', '0 * * * *', '0 9 * * *', '0 9 * * 1-5'].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setFormTriggerConfig({ ...formTriggerConfig, cron: preset })}
                          className="text-[10px] px-2 py-1 rounded bg-[#1e1f2b] border border-[#2d2e3d] text-[#9ca3af] hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {formTriggerType === 'condition' && (
                  <div>
                    <Label className="text-[10px] text-[#6b7280]">Condition Expression</Label>
                    <Input
                      value={(formTriggerConfig.expression as string) || ''}
                      onChange={(e) => setFormTriggerConfig({ ...formTriggerConfig, expression: e.target.value })}
                      className="bg-[#1e1f2b] border-[#2d2e3d] text-white text-xs mt-1 font-mono"
                      placeholder="agent.status === 'error' && agent.tasksFailed > 3"
                    />
                  </div>
                )}
                {formTriggerType === 'webhook' && (
                  <>
                    <div>
                      <Label className="text-[10px] text-[#6b7280]">Webhook Path</Label>
                      <Input
                        value={(formTriggerConfig.path as string) || ''}
                        onChange={(e) => setFormTriggerConfig({ ...formTriggerConfig, path: e.target.value })}
                        className="bg-[#1e1f2b] border-[#2d2e3d] text-white text-xs mt-1 font-mono"
                        placeholder="/trigger/my-rule"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-[#6b7280]">HTTP Method</Label>
                      <select
                        value={(formTriggerConfig.method as string) || 'POST'}
                        onChange={(e) => setFormTriggerConfig({ ...formTriggerConfig, method: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 bg-[#1e1f2b] border border-[#2d2e3d] rounded-md text-xs text-white outline-none"
                      >
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                        <option value="PUT">PUT</option>
                      </select>
                    </div>
                  </>
                )}
                {formTriggerType === 'threshold' && (
                  <>
                    <div>
                      <Label className="text-[10px] text-[#6b7280]">Metric</Label>
                      <Input
                        value={(formTriggerConfig.metric as string) || ''}
                        onChange={(e) => setFormTriggerConfig({ ...formTriggerConfig, metric: e.target.value })}
                        className="bg-[#1e1f2b] border-[#2d2e3d] text-white text-xs mt-1"
                        placeholder="cpu_usage, daily_cost, error_rate"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-[#6b7280]">Operator</Label>
                        <select
                          value={(formTriggerConfig.operator as string) || 'greater_than'}
                          onChange={(e) => setFormTriggerConfig({ ...formTriggerConfig, operator: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 bg-[#1e1f2b] border border-[#2d2e3d] rounded-md text-xs text-white outline-none"
                        >
                          <option value="greater_than">Greater than</option>
                          <option value="less_than">Less than</option>
                          <option value="equals">Equals</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-[#6b7280]">Threshold</Label>
                        <Input
                          type="number"
                          value={(formTriggerConfig.threshold as string) || ''}
                          onChange={(e) => setFormTriggerConfig({ ...formTriggerConfig, threshold: e.target.value })}
                          className="bg-[#1e1f2b] border-[#2d2e3d] text-white text-xs mt-1"
                          placeholder="85"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Additional Conditions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[#9ca3af] text-xs">Additional Conditions</Label>
                <button
                  onClick={addCondition}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Condition
                </button>
              </div>
              <div className="space-y-2">
                {formConditions.map((cond, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={cond.field}
                      onChange={(e) => updateCondition(i, 'field', e.target.value)}
                      className="bg-[#252636] border-[#2d2e3d] text-white text-xs flex-1"
                      placeholder="field"
                    />
                    <select
                      value={cond.operator}
                      onChange={(e) => updateCondition(i, 'operator', e.target.value)}
                      className="px-2 py-1.5 bg-[#252636] border border-[#2d2e3d] rounded-md text-xs text-white outline-none"
                    >
                      {conditionOperators.map((op) => (
                        <option key={op} value={op}>{op.replace('_', ' ')}</option>
                      ))}
                    </select>
                    <Input
                      value={cond.value}
                      onChange={(e) => updateCondition(i, 'value', e.target.value)}
                      className="bg-[#252636] border-[#2d2e3d] text-white text-xs flex-1"
                      placeholder="value"
                    />
                    <button
                      onClick={() => removeCondition(i)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {formConditions.length === 0 && (
                  <p className="text-[10px] text-[#4b5563] text-center py-2">No additional conditions. Rule triggers on primary trigger only.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[#9ca3af] text-xs">Actions</Label>
                <button
                  onClick={addAction}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Action
                </button>
              </div>
              <div className="space-y-2">
                {formActions.map((action, i) => {
                  const actionDef = actionTypes.find((a) => a.value === action.type)
                  return (
                    <div key={i} className="rounded-lg border border-[#2d2e3d] bg-[#252636] p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#6b7280]">#{i + 1}</span>
                          <ArrowRight className="w-3 h-3 text-[#4b5563]" />
                          <select
                            value={action.type}
                            onChange={(e) => updateActionType(i, e.target.value)}
                            className="px-2 py-1 bg-[#1e1f2b] border border-[#2d2e3d] rounded-md text-xs text-white outline-none"
                          >
                            {actionTypes.map((a) => (
                              <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                          </select>
                          {actionDef && <actionDef.icon className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <button
                          onClick={() => removeAction(i)}
                          className="w-6 h-6 rounded flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="pl-4">
                        <Input
                          value={(action.config.message as string) || (action.config.channel as string) || ''}
                          onChange={(e) => {
                            const key = action.type === 'notify' ? 'message' : action.type === 'send_webhook' ? 'url' : action.type === 'run_agent' ? 'agentId' : action.type === 'run_workflow' ? 'workflowId' : 'message'
                            updateActionConfig(i, key, e.target.value)
                          }}
                          className="bg-[#1e1f2b] border-[#2d2e3d] text-white text-xs"
                          placeholder={
                            action.type === 'notify' ? 'Notification message...' :
                            action.type === 'send_webhook' ? 'Webhook URL...' :
                            action.type === 'run_agent' ? 'Agent ID...' :
                            action.type === 'run_workflow' ? 'Workflow ID...' :
                            action.type === 'pause_agent' ? 'Agent ID...' :
                            'Log message...'
                          }
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Advanced Settings */}
            <div>
              <Label className="text-[#9ca3af] text-xs mb-2 block flex items-center gap-1">
                <Settings className="w-3 h-3" /> Advanced Settings
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] text-[#6b7280]">Cooldown (ms)</Label>
                  <Input
                    type="number"
                    value={formCooldown}
                    onChange={(e) => setFormCooldown(parseInt(e.target.value) || 0)}
                    className="bg-[#252636] border-[#2d2e3d] text-white text-xs mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-[#6b7280]">Max Executions</Label>
                  <Input
                    type="number"
                    value={formMaxExecutions}
                    onChange={(e) => setFormMaxExecutions(e.target.value ? parseInt(e.target.value) : '')}
                    className="bg-[#252636] border-[#2d2e3d] text-white text-xs mt-1"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-[#6b7280]">Priority</Label>
                  <Input
                    type="number"
                    value={formPriority}
                    onChange={(e) => setFormPriority(parseInt(e.target.value) || 0)}
                    className="bg-[#252636] border-[#2d2e3d] text-white text-xs mt-1"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={handleCreate}
              disabled={!formName.trim() || isCreating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Create Automation Rule
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rule Detail Modal */}
      <Dialog open={!!detailRule} onOpenChange={() => setDetailRule(null)}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-lg max-h-[85vh] overflow-y-auto">
          {detailRule && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-emerald-400" />
                  {detailRule.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {detailRule.description && (
                  <p className="text-sm text-[#9ca3af]">{detailRule.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-[#252636]">
                    <p className="text-[10px] text-[#6b7280]">Status</p>
                    <p className={`text-xs font-medium ${detailRule.isActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {detailRule.isActive ? 'Active' : 'Paused'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#252636]">
                    <p className="text-[10px] text-[#6b7280]">Trigger Type</p>
                    <p className="text-xs font-medium text-white capitalize">{detailRule.triggerType}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#252636]">
                    <p className="text-[10px] text-[#6b7280]">Executions</p>
                    <p className="text-xs font-medium text-white">{detailRule.executionCount}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#252636]">
                    <p className="text-[10px] text-[#6b7280]">Last Triggered</p>
                    <p className="text-xs font-medium text-white">{formatTimeAgo(detailRule.lastTriggeredAt)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#252636]">
                    <p className="text-[10px] text-[#6b7280]">Priority</p>
                    <p className="text-xs font-medium text-white">{detailRule.priority}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#252636]">
                    <p className="text-[10px] text-[#6b7280]">Cooldown</p>
                    <p className="text-xs font-medium text-white">{formatDuration(detailRule.cooldownMs)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#9ca3af] mb-1.5">Trigger Config</p>
                  <pre className="text-[11px] bg-[#252636] rounded-lg p-2.5 text-emerald-400 font-mono overflow-x-auto">
                    {JSON.stringify(parseJSON(detailRule.triggerConfig, {}), null, 2)}
                  </pre>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#9ca3af] mb-1.5">Conditions</p>
                  <pre className="text-[11px] bg-[#252636] rounded-lg p-2.5 text-amber-400 font-mono overflow-x-auto">
                    {JSON.stringify(parseJSON(detailRule.conditions, []), null, 2)}
                  </pre>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#9ca3af] mb-1.5">Actions</p>
                  <pre className="text-[11px] bg-[#252636] rounded-lg p-2.5 text-cyan-400 font-mono overflow-x-auto">
                    {JSON.stringify(parseJSON(detailRule.actions, []), null, 2)}
                  </pre>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => { handleExecute(detailRule.id); setDetailRule(null) }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    <Play className="w-3 h-3 mr-1" /> Execute Now
                  </Button>
                  <Button
                    onClick={() => { handleToggle(detailRule); setDetailRule(null) }}
                    className="flex-1 bg-[#252636] hover:bg-[#2d2e3d] text-white text-xs"
                  >
                    {detailRule.isActive ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                    {detailRule.isActive ? 'Pause' : 'Activate'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Delete Rule?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#9ca3af]">
            This will permanently delete this automation rule and all its execution history. This action cannot be undone.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1 bg-[#252636] hover:bg-[#2d2e3d] text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Sub-Components ──────────────────────────────────────────────

function RulesList({
  rules,
  isLoading,
  onToggle,
  onDelete,
  onExecute,
  onViewDetail,
}: {
  rules: AutomationRule[]
  isLoading: boolean
  onToggle: (rule: AutomationRule) => void
  onDelete: (id: string) => void
  onExecute: (id: string) => void
  onViewDetail: (rule: AutomationRule) => void
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-5 animate-pulse">
            <div className="h-4 w-32 bg-[#252636] rounded mb-3" />
            <div className="h-3 w-48 bg-[#252636] rounded mb-2" />
            <div className="h-3 w-24 bg-[#252636] rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (rules.length === 0) {
    return (
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-8 sm:p-12 text-center">
        <Zap className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
        <p className="text-sm text-[#9ca3af]">No automation rules yet</p>
        <p className="text-xs text-[#6b7280] mt-1">Create your first rule or start from a template</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {rules.map((rule) => {
        const triggerDef = triggerTypes.find((t) => t.value === rule.triggerType)
        const actions = parseJSON<{ type: string }[]>(rule.actions, [])
        const conditions = parseJSON<unknown[]>(rule.conditions, [])

        return (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 hover:border-[#3d3e4d] transition-colors group"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{rule.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  {triggerDef && (
                    <>
                      <triggerDef.icon className="w-3 h-3 flex-shrink-0" style={{ color: triggerDef.color }} />
                      <span className="text-[11px] text-[#6b7280] capitalize">{triggerDef.label}</span>
                    </>
                  )}
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${
                  rule.isActive
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    rule.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {rule.isActive ? 'Active' : 'Paused'}
              </span>
            </div>

            {/* Description */}
            {rule.description && (
              <p className="text-[11px] text-[#9ca3af] line-clamp-2 mb-3">{rule.description}</p>
            )}

            {/* Rule Flow Visualization */}
            <div className="flex items-center gap-1.5 mb-3 p-2 rounded-lg bg-[#252636] overflow-x-auto">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                IF
              </span>
              <span className="text-[10px] text-[#9ca3af] flex-shrink-0 truncate max-w-[80px]">
                {triggerDef?.label || rule.triggerType}
              </span>
              {conditions.length > 0 && (
                <>
                  <span className="text-[10px] text-[#4b5563]">+</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 flex-shrink-0">
                    {conditions.length} cond.
                  </span>
                </>
              )}
              <ArrowRight className="w-3 h-3 text-[#4b5563] flex-shrink-0" />
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 flex-shrink-0">
                THEN
              </span>
              <span className="text-[10px] text-[#9ca3af] flex-shrink-0 truncate max-w-[100px]">
                {actions.map((a) => actionTypes.find((at) => at.value === a.type)?.label || a.type).join(', ')}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-[11px] text-[#6b7280] mb-3">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {rule.executionCount} runs
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(rule.lastTriggeredAt)}
              </span>
              {rule.lastExecutionStatus === 'success' && (
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              )}
              {rule.lastExecutionStatus === 'failed' && (
                <XCircle className="w-3 h-3 text-red-400" />
              )}
            </div>

            {/* Priority & Tags */}
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              {rule.priority > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#252636] text-amber-400 border border-amber-500/20">
                  P{rule.priority}
                </span>
              )}
              {parseJSON<string[]>(rule.tags, []).slice(0, 3).map((tag, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#252636] text-[#6b7280]">
                  {tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-[#2d2e3d]">
              <button
                onClick={() => onToggle(rule)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                  rule.isActive
                    ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                {rule.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {rule.isActive ? 'Pause' : 'Activate'}
              </button>
              <button
                onClick={() => onExecute(rule.id)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium bg-[#252636] text-[#9ca3af] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Run
              </button>
              <button
                onClick={() => onViewDetail(rule)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(rule.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function ExecutionsList({
  executions,
  isLoading,
}: {
  executions: AutomationExecution[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 animate-pulse">
            <div className="h-4 w-48 bg-[#252636] rounded mb-2" />
            <div className="h-3 w-32 bg-[#252636] rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (executions.length === 0) {
    return (
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-8 sm:p-12 text-center">
        <Activity className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
        <p className="text-sm text-[#9ca3af]">No execution history yet</p>
        <p className="text-xs text-[#6b7280] mt-1">Trigger a rule to see execution results here</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
      {executions.map((exec) => {
        const statusColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
          completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2 },
          running: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: RotateCcw },
          failed: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
          skipped: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: AlertTriangle },
        }
        const statusDef = statusColors[exec.status] || statusColors.running

        return (
          <motion.div
            key={exec.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 hover:border-[#3d3e4d] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg ${statusDef.bg} flex items-center justify-center flex-shrink-0`}>
                  <statusDef.icon className={`w-4 h-4 ${statusDef.text} ${exec.status === 'running' ? 'animate-spin' : ''}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {exec.rule?.name || 'Unknown Rule'}
                  </p>
                  <p className="text-[10px] text-[#6b7280]">
                    {exec.rule?.triggerType && (
                      <span className="capitalize">{exec.rule.triggerType}</span>
                    )}
                    {' · '}
                    {formatTimeAgo(exec.startedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {exec.duration > 0 && (
                  <span className="text-[10px] text-[#9ca3af] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(exec.duration)}
                  </span>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusDef.bg} ${statusDef.text} capitalize`}>
                  {exec.status}
                </span>
              </div>
            </div>

            {/* Trigger Data Preview */}
            {exec.triggerData && exec.triggerData !== '{}' && (
              <div className="mt-2 pl-10">
                <p className="text-[10px] text-[#6b7280] font-medium mb-1">Trigger Data</p>
                <pre className="text-[10px] bg-[#252636] rounded-md p-2 text-[#9ca3af] font-mono overflow-x-auto max-h-16">
                  {JSON.stringify(parseJSON(exec.triggerData, {}), null, 2)}
                </pre>
              </div>
            )}

            {/* Error */}
            {exec.error && (
              <div className="mt-2 pl-10">
                <p className="text-[10px] text-red-400 bg-red-500/10 rounded-md p-2">{exec.error}</p>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

function TemplatesGrid({ onSelect }: { onSelect: (template: typeof ruleTemplates[0]) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <p className="text-sm font-medium text-white">Pre-built Rule Templates</p>
      </div>
      <p className="text-xs text-[#9ca3af] -mt-1">Click a template to pre-fill the rule creation form</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ruleTemplates.map((template, i) => {
          const triggerDef = triggerTypes.find((t) => t.value === template.triggerType)
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              onClick={() => onSelect(template)}
              className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 hover:border-emerald-500/30 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {template.name}
                </h3>
                {triggerDef && (
                  <triggerDef.icon className="w-4 h-4 flex-shrink-0" style={{ color: triggerDef.color }} />
                )}
              </div>
              <p className="text-[11px] text-[#9ca3af] mb-3">{template.description}</p>

              {/* Visual Flow */}
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  IF
                </span>
                <span className="text-[10px] text-[#6b7280] capitalize">{template.triggerType}</span>
                <ArrowRight className="w-3 h-3 text-[#4b5563]" />
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                  THEN
                </span>
                <span className="text-[10px] text-[#6b7280] truncate">
                  {template.actions.map((a) => actionTypes.find((at) => at.value === a.type)?.label || a.type).join(', ')}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag, j) => (
                  <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-[#252636] text-[#6b7280]">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Use Template CTA */}
              <div className="mt-3 pt-2 border-t border-[#2d2e3d] flex items-center gap-1.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <Copy className="w-3 h-3" />
                <span className="text-[10px] font-medium">Use Template</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
