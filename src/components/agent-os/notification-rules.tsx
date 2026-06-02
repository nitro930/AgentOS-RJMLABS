'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  Zap,
  Clock,
  Filter,
  Mail,
  MessageSquare,
  Globe,
  Volume2,
  VolumeX,
  ToggleLeft,
  ToggleRight,
  Shield,
  Activity,
  Server,
  Users,
  DollarSign,
  Bug,
  GitBranch,
  Settings,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface NotificationRule {
  id: string
  name: string
  description: string
  enabled: boolean
  conditions: RuleCondition[]
  actions: RuleAction[]
  cooldown: number // minutes
  lastTriggered: string | null
  triggerCount: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
}

interface RuleCondition {
  id: string
  field: string
  operator: string
  value: string
}

interface RuleAction {
  id: string
  type: 'push' | 'email' | 'webhook' | 'sound' | 'log'
  config: Record<string, string>
}

// ─── Demo Rules ──────────────────────────────────────────────────

const demoRules: NotificationRule[] = [
  {
    id: 'rule-1',
    name: 'Agent Failure Alert',
    description: 'Notify when any agent encounters an error or crashes during task execution',
    enabled: true,
    conditions: [
      { id: 'c1', field: 'event_type', operator: 'equals', value: 'agent_error' },
      { id: 'c2', field: 'severity', operator: 'in', value: 'high,critical' },
    ],
    actions: [
      { id: 'a1', type: 'push', config: { title: 'Agent Failed', sound: 'alert' } },
      { id: 'a2', type: 'email', config: { to: 'admin@rjmlabs.co.uk', subject: 'Agent Error: {{agent_name}}' } },
    ],
    cooldown: 5,
    lastTriggered: '2 min ago',
    triggerCount: 47,
    priority: 'critical',
    createdAt: '2025-01-15',
  },
  {
    id: 'rule-2',
    name: 'Budget Threshold Warning',
    description: 'Alert when daily agent spend exceeds the configured budget threshold in GBP',
    enabled: true,
    conditions: [
      { id: 'c3', field: 'metric', operator: 'greater_than', value: 'daily_cost' },
      { id: 'c4', field: 'value', operator: 'greater_than', value: '50' },
    ],
    actions: [
      { id: 'a3', type: 'push', config: { title: 'Budget Warning', sound: 'chime' } },
      { id: 'a4', type: 'log', config: { level: 'warning' } },
    ],
    cooldown: 60,
    lastTriggered: '3 hours ago',
    triggerCount: 12,
    priority: 'high',
    createdAt: '2025-01-20',
  },
  {
    id: 'rule-3',
    name: 'Deployment Success',
    description: 'Receive notification when a production deployment completes successfully',
    enabled: true,
    conditions: [
      { id: 'c5', field: 'event_type', operator: 'equals', value: 'deployment_complete' },
      { id: 'c6', field: 'status', operator: 'equals', value: 'success' },
    ],
    actions: [
      { id: 'a5', type: 'push', config: { title: 'Deployed', sound: 'success' } },
      { id: 'a6', type: 'webhook', config: { url: 'https://hooks.slack.com/xxx', method: 'POST' } },
    ],
    cooldown: 0,
    lastTriggered: '1 hour ago',
    triggerCount: 89,
    priority: 'medium',
    createdAt: '2025-02-01',
  },
  {
    id: 'rule-4',
    name: 'Security Intrusion Detection',
    description: 'Immediate alert on suspicious SSH login attempts or unauthorised access patterns',
    enabled: true,
    conditions: [
      { id: 'c7', field: 'event_type', operator: 'equals', value: 'security_breach' },
      { id: 'c8', field: 'severity', operator: 'equals', value: 'critical' },
    ],
    actions: [
      { id: 'a7', type: 'push', config: { title: 'SECURITY ALERT', sound: 'alarm' } },
      { id: 'a8', type: 'email', config: { to: 'security@rjmlabs.co.uk', subject: 'URGENT: Security Breach Detected' } },
      { id: 'a9', type: 'webhook', config: { url: 'https://hooks.slack.com/security', method: 'POST' } },
    ],
    cooldown: 1,
    lastTriggered: '5 days ago',
    triggerCount: 3,
    priority: 'critical',
    createdAt: '2025-01-10',
  },
  {
    id: 'rule-5',
    name: 'Agent Idle Timeout',
    description: 'Notify when an agent has been idle for longer than the configured threshold',
    enabled: false,
    conditions: [
      { id: 'c9', field: 'metric', operator: 'greater_than', value: 'agent_idle_minutes' },
      { id: 'c10', field: 'value', operator: 'greater_than', value: '30' },
    ],
    actions: [
      { id: 'a10', type: 'push', config: { title: 'Agent Idle', sound: 'chime' } },
    ],
    cooldown: 15,
    lastTriggered: null,
    triggerCount: 0,
    priority: 'low',
    createdAt: '2025-03-01',
  },
  {
    id: 'rule-6',
    name: 'Workflow Stalled',
    description: 'Alert when a workflow has been in the same step for longer than expected',
    enabled: true,
    conditions: [
      { id: 'c11', field: 'event_type', operator: 'equals', value: 'workflow_stalled' },
    ],
    actions: [
      { id: 'a11', type: 'push', config: { title: 'Workflow Stalled', sound: 'warning' } },
      { id: 'a12', type: 'log', config: { level: 'warning' } },
    ],
    cooldown: 10,
    lastTriggered: '30 min ago',
    triggerCount: 23,
    priority: 'high',
    createdAt: '2025-02-15',
  },
  {
    id: 'rule-7',
    name: 'Resource Usage Spike',
    description: 'Alert when CPU, memory, or disk usage exceeds 90% on the VPS',
    enabled: true,
    conditions: [
      { id: 'c13', field: 'metric', operator: 'greater_than', value: 'resource_usage_percent' },
      { id: 'c14', field: 'value', operator: 'greater_than', value: '90' },
    ],
    actions: [
      { id: 'a13', type: 'push', config: { title: 'Resource Spike', sound: 'alert' } },
      { id: 'a14', type: 'email', config: { to: 'ops@rjmlabs.co.uk', subject: 'High Resource Usage' } },
    ],
    cooldown: 15,
    lastTriggered: '6 hours ago',
    triggerCount: 31,
    priority: 'high',
    createdAt: '2025-01-25',
  },
]

const fieldOptions = ['event_type', 'severity', 'metric', 'value', 'agent_id', 'workflow_id', 'user_id', 'source']
const operatorOptions = ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in']
const actionTypes: { value: RuleAction['type']; label: string; icon: React.ElementType }[] = [
  { value: 'push', label: 'Push Notification', icon: Bell },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'webhook', label: 'Webhook', icon: Globe },
  { value: 'sound', label: 'Sound Alert', icon: Volume2 },
  { value: 'log', label: 'Log Entry', icon: Activity },
]

const priorityColors: Record<string, string> = {
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
}

const priorityIcons: Record<string, React.ElementType> = {
  low: Info,
  medium: AlertTriangle,
  high: AlertTriangle,
  critical: Shield,
}

const actionTypeIcons: Record<string, React.ElementType> = {
  push: Bell,
  email: Mail,
  webhook: Globe,
  sound: Volume2,
  log: Activity,
}

export function NotificationRules() {
  const { addToast } = useAgentOSStore()
  const [rules, setRules] = useState<NotificationRule[]>(demoRules)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null)
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [newRule, setNewRule] = useState<Partial<NotificationRule>>({
    name: '',
    description: '',
    enabled: true,
    priority: 'medium',
    cooldown: 5,
    conditions: [{ id: 'new-c1', field: 'event_type', operator: 'equals', value: '' }],
    actions: [{ id: 'new-a1', type: 'push', config: { title: '', sound: 'chime' } }],
  })

  const toggleRule = useCallback((id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
    addToast('Rule updated', 'success')
  }, [addToast])

  const deleteRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id))
    addToast('Rule deleted', 'success')
  }, [addToast])

  const createRule = useCallback(() => {
    if (!newRule.name?.trim()) return
    const rule: NotificationRule = {
      id: `rule-${Date.now()}`,
      name: newRule.name,
      description: newRule.description || '',
      enabled: newRule.enabled ?? true,
      conditions: (newRule.conditions || []) as RuleCondition[],
      actions: (newRule.actions || []) as RuleAction[],
      cooldown: newRule.cooldown || 5,
      lastTriggered: null,
      triggerCount: 0,
      priority: (newRule.priority || 'medium') as NotificationRule['priority'],
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setRules(prev => [...prev, rule])
    setShowCreateDialog(false)
    setNewRule({
      name: '',
      description: '',
      enabled: true,
      priority: 'medium',
      cooldown: 5,
      conditions: [{ id: `c-${Date.now()}`, field: 'event_type', operator: 'equals', value: '' }],
      actions: [{ id: `a-${Date.now()}`, type: 'push', config: { title: '', sound: 'chime' } }],
    })
    addToast('Notification rule created', 'success')
  }, [newRule, addToast])

  const filteredRules = rules.filter(r => {
    const matchesPriority = filterPriority === 'all' || r.priority === filterPriority
    const matchesSearch = !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesPriority && matchesSearch
  })

  const activeRuleCount = rules.filter(r => r.enabled).length
  const totalTriggers = rules.reduce((sum, r) => sum + r.triggerCount, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            Notification Rules
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Custom rules engine for agent and system event notifications</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Rules', value: rules.length, icon: Settings, color: 'text-[#9ca3af]' },
          { label: 'Active', value: activeRuleCount, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Disabled', value: rules.length - activeRuleCount, icon: VolumeX, color: 'text-[#6b7280]' },
          { label: 'Total Triggers', value: totalTriggers, icon: Zap, color: 'text-yellow-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-[#6b7280]">{stat.label}</span>
            </div>
            <p className="text-lg font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#6b7280]" />
          <span className="text-xs text-[#6b7280]">Priority:</span>
        </div>
        {['all', 'critical', 'high', 'medium', 'low'].map(p => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors capitalize ${
              filterPriority === p
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-[#1e1f2b] text-[#6b7280] border-[#2d2e3d] hover:text-white'
            }`}
          >
            {p}
          </button>
        ))}
        <div className="ml-auto relative">
          <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4b5563]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg text-xs text-white outline-none focus:border-emerald-500/50 w-52 placeholder-[#4b5563]"
            placeholder="Search rules..."
          />
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        {filteredRules.map(rule => {
          const PriorityIcon = priorityIcons[rule.priority]
          return (
            <motion.div
              key={rule.id}
              layout
              className={`bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-4 transition-all ${
                !rule.enabled ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityIcon className={`w-4 h-4 ${priorityColors[rule.priority].split(' ')[0]}`} />
                    <h3 className="text-sm font-semibold text-white">{rule.name}</h3>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full border ${priorityColors[rule.priority]}`}>
                      {rule.priority}
                    </span>
                    {!rule.enabled && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#6b7280]/10 text-[#6b7280] border border-[#6b7280]/30">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6b7280] line-clamp-2">{rule.description}</p>

                  {/* Conditions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-[#4b5563]">When:</span>
                    {rule.conditions.map(c => (
                      <span key={c.id} className="px-2 py-0.5 text-[10px] bg-[#0f1117] text-[#9ca3af] rounded border border-[#2d2e3d] font-mono">
                        {c.field} {c.operator.replace('_', ' ')} <span className="text-emerald-400">{c.value}</span>
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[10px] text-[#4b5563]">Do:</span>
                    {rule.actions.map(a => {
                      const ActionIcon = actionTypeIcons[a.type] || Bell
                      return (
                        <span key={a.id} className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#0f1117] text-[#9ca3af] rounded border border-[#2d2e3d]">
                          <ActionIcon className="w-3 h-3" />
                          {a.type}
                        </span>
                      )
                    })}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[#4b5563]">
                    {rule.cooldown > 0 && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{rule.cooldown}min cooldown</span>
                    )}
                    {rule.lastTriggered && (
                      <span>Last: {rule.lastTriggered}</span>
                    )}
                    <span>{rule.triggerCount} triggers</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      rule.enabled
                        ? 'text-emerald-400 hover:bg-emerald-500/10'
                        : 'text-[#6b7280] hover:bg-[#252636]'
                    }`}
                    title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  >
                    {rule.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1.5 rounded-lg text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}

        {filteredRules.length === 0 && (
          <div className="py-12 text-center text-[#4b5563]">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No notification rules found</p>
            <p className="text-xs mt-1">Create a rule to get started</p>
          </div>
        )}
      </div>

      {/* Create Rule Dialog */}
      <AnimatePresence>
        {showCreateDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">New Notification Rule</h3>
                <button onClick={() => setShowCreateDialog(false)} className="text-[#6b7280] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Rule Name</label>
                  <input
                    value={newRule.name || ''}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                    placeholder="e.g. Agent Error Alert"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
                  <textarea
                    value={newRule.description || ''}
                    onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500 resize-none h-16"
                    placeholder="When this happens, do that..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Priority</label>
                    <select
                      value={newRule.priority || 'medium'}
                      onChange={(e) => setNewRule(prev => ({ ...prev, priority: e.target.value as NotificationRule['priority'] }))}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Cooldown (minutes)</label>
                    <input
                      type="number"
                      value={newRule.cooldown || 5}
                      onChange={(e) => setNewRule(prev => ({ ...prev, cooldown: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500 font-mono"
                      min={0}
                    />
                  </div>
                </div>

                {/* Conditions */}
                <div>
                  <label className="text-xs text-[#9ca3af] mb-2 block">Conditions (When)</label>
                  {(newRule.conditions || []).map((cond, idx) => (
                    <div key={cond.id} className="flex items-center gap-2 mb-2">
                      <select
                        value={cond.field}
                        onChange={(e) => {
                          const conditions = [...(newRule.conditions || [])]
                          conditions[idx] = { ...conditions[idx], field: e.target.value }
                          setNewRule(prev => ({ ...prev, conditions }))
                        }}
                        className="flex-1 px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-white text-xs outline-none focus:border-emerald-500"
                      >
                        {fieldOptions.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <select
                        value={cond.operator}
                        onChange={(e) => {
                          const conditions = [...(newRule.conditions || [])]
                          conditions[idx] = { ...conditions[idx], operator: e.target.value }
                          setNewRule(prev => ({ ...prev, conditions }))
                        }}
                        className="flex-1 px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-white text-xs outline-none focus:border-emerald-500"
                      >
                        {operatorOptions.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                      </select>
                      <input
                        value={cond.value}
                        onChange={(e) => {
                          const conditions = [...(newRule.conditions || [])]
                          conditions[idx] = { ...conditions[idx], value: e.target.value }
                          setNewRule(prev => ({ ...prev, conditions }))
                        }}
                        className="flex-1 px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-white text-xs outline-none focus:border-emerald-500 font-mono"
                        placeholder="value"
                      />
                      <button
                        onClick={() => {
                          const conditions = (newRule.conditions || []).filter((_, i) => i !== idx)
                          setNewRule(prev => ({ ...prev, conditions }))
                        }}
                        className="p-1 text-[#6b7280] hover:text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const conditions = [...(newRule.conditions || []), { id: `c-${Date.now()}`, field: 'event_type', operator: 'equals', value: '' }]
                      setNewRule(prev => ({ ...prev, conditions }))
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add condition
                  </button>
                </div>

                {/* Actions */}
                <div>
                  <label className="text-xs text-[#9ca3af] mb-2 block">Actions (Do)</label>
                  {(newRule.actions || []).map((action, idx) => (
                    <div key={action.id} className="flex items-center gap-2 mb-2">
                      <select
                        value={action.type}
                        onChange={(e) => {
                          const actions = [...(newRule.actions || [])]
                          actions[idx] = { ...actions[idx], type: e.target.value as RuleAction['type'] }
                          setNewRule(prev => ({ ...prev, actions }))
                        }}
                        className="flex-1 px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-white text-xs outline-none focus:border-emerald-500"
                      >
                        {actionTypes.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                      <button
                        onClick={() => {
                          const actions = (newRule.actions || []).filter((_, i) => i !== idx)
                          setNewRule(prev => ({ ...prev, actions }))
                        }}
                        className="p-1 text-[#6b7280] hover:text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const actions = [...(newRule.actions || []), { id: `a-${Date.now()}`, type: 'push', config: { title: '', sound: 'chime' } }]
                      setNewRule(prev => ({ ...prev, actions }))
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add action
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createRule}
                  disabled={!newRule.name?.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  Create Rule
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
