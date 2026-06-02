'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch,
  Plus,
  Play,
  Pause,
  Trash2,
  ChevronRight,
  Zap,
  Clock,
  BarChart3,
  ArrowRight,
  X,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WorkflowStep {
  id: string
  agent: string
  action: string
  type: 'agent' | 'action' | 'output'
}

interface Workflow {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  steps: WorkflowStep[]
  triggerType: string
  runCount: number
  successRate: number
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  draft: { color: 'text-[#9ca3af]', bg: 'bg-[#252636]', border: 'border-[#2d2e3d]', dot: 'bg-[#6b7280]' },
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500 animate-pulse' },
  paused: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  completed: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500' },
}

const stepTypeConfig: Record<string, { color: string; bg: string }> = {
  agent: { color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  action: { color: 'text-amber-400', bg: 'bg-amber-500/15' },
  output: { color: 'text-blue-400', bg: 'bg-blue-500/15' },
}

const triggerIcons: Record<string, string> = {
  manual: '👆',
  webhook: '🔗',
  cron: '⏰',
  event: '📡',
}

export function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTrigger, setNewTrigger] = useState('manual')
  const [newSteps, setNewSteps] = useState<Partial<WorkflowStep>[]>([
    { agent: '', action: '', type: 'agent' },
    { agent: '', action: '', type: 'action' },
    { agent: '', action: '', type: 'output' },
  ])
  const [isCreating, setIsCreating] = useState(false)

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows')
      const data = await res.json()
      // Parse steps from JSON string if needed (DB stores as string)
      const parsed = (Array.isArray(data) ? data : []).map((w: any) => ({
        ...w,
        steps: typeof w.steps === 'string' ? JSON.parse(w.steps) : (Array.isArray(w.steps) ? w.steps : []),
        triggerConfig: typeof w.triggerConfig === 'string' ? JSON.parse(w.triggerConfig) : (w.triggerConfig || {}),
      }))
      setWorkflows(parsed)
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
    const interval = setInterval(fetchWorkflows, 15000)
    return () => clearInterval(interval)
  }, [fetchWorkflows])

  const handleToggleStatus = async (workflow: Workflow) => {
    const newStatus = workflow.status === 'active' ? 'paused' : 'active'
    await fetch(`/api/workflows/${workflow.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchWorkflows()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/workflows/${id}`, { method: 'DELETE' })
    fetchWorkflows()
    if (expandedWorkflow === id) setExpandedWorkflow(null)
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setIsCreating(true)
    try {
      await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          triggerType: newTrigger,
          steps: newSteps.filter((s) => s.agent?.trim()).map((s, i) => ({
            id: `step-${i + 1}`,
            agent: s.agent!,
            action: s.action || 'Process',
            type: s.type || 'action',
          })),
        }),
      })
      setCreateOpen(false)
      setNewName('')
      setNewTrigger('manual')
      setNewSteps([
        { agent: '', action: '', type: 'agent' },
        { agent: '', action: '', type: 'action' },
        { agent: '', action: '', type: 'output' },
      ])
      fetchWorkflows()
    } catch {
      // Error handling
    } finally {
      setIsCreating(false)
    }
  }

  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.status === 'active').length,
    totalRuns: workflows.reduce((sum, w) => sum + w.runCount, 0),
    avgSuccess:
      workflows.length > 0
        ? Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length)
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
            Workflows
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Build and manage automation pipelines
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
              <Plus className="w-4 h-4" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-[#9ca3af] text-xs">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                  placeholder="Workflow name..."
                />
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Trigger Type</Label>
                <select
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
                >
                  <option value="manual">👆 Manual</option>
                  <option value="webhook">🔗 Webhook</option>
                  <option value="cron">⏰ Scheduled (Cron)</option>
                  <option value="event">📡 Event-Driven</option>
                </select>
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Pipeline Steps</Label>
                <div className="space-y-2 mt-2">
                  {newSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          stepTypeConfig[step.type || 'action']?.color || ''
                        } ${stepTypeConfig[step.type || 'action']?.bg || ''}`}
                      >
                        {step.type}
                      </span>
                      <Input
                        value={step.agent || ''}
                        onChange={(e) => {
                          const updated = [...newSteps]
                          updated[i] = { ...updated[i], agent: e.target.value }
                          setNewSteps(updated)
                        }}
                        className="bg-[#252636] border-[#2d2e3d] text-white text-xs h-8 flex-1"
                        placeholder="Agent name"
                      />
                      <Input
                        value={step.action || ''}
                        onChange={(e) => {
                          const updated = [...newSteps]
                          updated[i] = { ...updated[i], action: e.target.value }
                          setNewSteps(updated)
                        }}
                        className="bg-[#252636] border-[#2d2e3d] text-white text-xs h-8 flex-1"
                        placeholder="Action"
                      />
                      {newSteps.length > 1 && (
                        <button
                          onClick={() => setNewSteps(newSteps.filter((_, j) => j !== i))}
                          className="w-7 h-7 rounded flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setNewSteps([
                        ...newSteps,
                        { agent: '', action: '', type: 'action' },
                      ])
                    }
                    className="text-[#9ca3af] hover:text-white gap-1 text-xs"
                  >
                    <Plus className="w-3 h-3" /> Add Step
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isCreating ? 'Creating...' : 'Create Workflow'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Workflows', value: stats.total, icon: GitBranch, color: '#10b981' },
          { label: 'Active', value: stats.active, icon: Play, color: '#22c55e' },
          { label: 'Total Runs', value: stats.totalRuns, icon: BarChart3, color: '#f59e0b' },
          { label: 'Avg Success Rate', value: `${stats.avgSuccess}%`, icon: Zap, color: '#3b82f6' },
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

      {/* Workflow Cards */}
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
      ) : workflows.length === 0 ? (
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-8 sm:p-12 text-center">
          <GitBranch className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
          <p className="text-sm text-[#9ca3af]">No workflows yet</p>
          <p className="text-xs text-[#6b7280] mt-1">Create your first automation pipeline</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {workflows.map((workflow) => {
            const sc = statusConfig[workflow.status] || statusConfig.draft
            const isExpanded = expandedWorkflow === workflow.id
            return (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5 hover:border-[#3d3e4d] transition-colors"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                        {workflow.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${sc.bg} ${sc.border} border ${sc.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {workflow.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#6b7280]">
                      <span className="flex items-center gap-1">
                        {triggerIcons[workflow.triggerType] || '👆'} {workflow.triggerType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {workflow.runCount} runs
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> {workflow.successRate}% success
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {(workflow.status === 'active' || workflow.status === 'paused') && (
                      <button
                        onClick={() => handleToggleStatus(workflow)}
                        className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                        title={workflow.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {workflow.status === 'active' ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-red-500/10 flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Pipeline Steps Preview */}
                <div
                  className="cursor-pointer"
                  onClick={() => setExpandedWorkflow(isExpanded ? null : workflow.id)}
                >
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {(Array.isArray(workflow.steps) ? workflow.steps : []).slice(0, isExpanded ? undefined : 3).map((step, i) => {
                      const stc = stepTypeConfig[step.type] || stepTypeConfig.action
                      return (
                        <div key={step.id || `step-${i}`} className="flex items-center gap-1 flex-shrink-0">
                          {i > 0 && (
                            <ArrowRight className="w-3 h-3 text-[#4b5563] flex-shrink-0" />
                          )}
                          <div
                            className={`px-2 py-1.5 rounded-md text-[11px] font-medium ${stc.bg} ${stc.color} whitespace-nowrap`}
                          >
                            {step.agent}
                          </div>
                        </div>
                      )
                    })}
                    {!isExpanded && Array.isArray(workflow.steps) && workflow.steps.length > 3 && (
                      <span className="text-[11px] text-[#6b7280] ml-1">
                        +{workflow.steps.length - 3} more
                      </span>
                    )}
                    <ChevronRight
                      className={`w-4 h-4 text-[#6b7280] ml-auto transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Pipeline View */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-3 border-t border-[#2d2e3d]">
                        <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-3">
                          Pipeline Diagram
                        </p>
                        <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
                          {(Array.isArray(workflow.steps) ? workflow.steps : []).map((step, i) => {
                            const stc = stepTypeConfig[step.type] || stepTypeConfig.action
                            return (
                              <div key={step.id || `expanded-step-${i}`} className="flex items-stretch flex-shrink-0">
                                {i > 0 && (
                                  <div className="flex items-center px-1">
                                    <div className="w-6 h-0.5 bg-gradient-to-r from-[#4b5563] to-emerald-500/50 relative">
                                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-emerald-500/50" />
                                    </div>
                                  </div>
                                )}
                                <div
                                  className={`rounded-lg border ${stc.bg} border-current/20 p-3 min-w-[120px]`}
                                  style={{ borderColor: `${stc.color}22` }}
                                >
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span
                                      className={`w-2 h-2 rounded-full`}
                                      style={{ backgroundColor: stc.color.replace('text-', '') }}
                                    />
                                    <span className="text-[10px] uppercase tracking-wider text-[#6b7280]">
                                      {step.type}
                                    </span>
                                  </div>
                                  <p className={`text-sm font-medium ${stc.color}`}>{step.agent}</p>
                                  <p className="text-[11px] text-[#9ca3af] mt-0.5">{step.action}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
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
