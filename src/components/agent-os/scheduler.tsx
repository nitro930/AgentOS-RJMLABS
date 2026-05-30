'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ScheduledTask {
  id: string
  name: string
  cronExpression: string
  nextRunAt: string
  runCount: number
  failCount: number
  status: 'active' | 'paused'
  agentId: string | null
  agentName?: string
  taskType: string
  createdAt: string
}

const cronPresets = [
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily at 9:00 AM', value: '0 9 * * *' },
  { label: 'Weekdays at 9:00 AM', value: '0 9 * * 1-5' },
  { label: 'Weekly on Monday', value: '0 9 * * 1' },
]

function cronToHuman(cron: string): string {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return cron

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts

  if (minute === '*/5' && hour === '*') return 'Every 5 minutes'
  if (minute === '*/15' && hour === '*') return 'Every 15 minutes'
  if (minute === '*/30' && hour === '*') return 'Every 30 minutes'
  if (minute === '0' && hour === '*' && dayOfMonth === '*') return 'Every hour'
  if (minute === '0' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Daily at ${formatHour(hour)}`
  }
  if (minute === '0' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '1-5') {
    return `Weekdays at ${formatHour(hour)}`
  }
  if (minute === '0' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '1') {
    return `Weekly on Monday at ${formatHour(hour)}`
  }
  if (minute === '0' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayIndex = parseInt(dayOfWeek)
    if (!isNaN(dayIndex)) return `${days[dayIndex]} at ${formatHour(hour)}`
  }
  return cron
}

function formatHour(h: string): string {
  const hour = parseInt(h)
  if (isNaN(hour)) return h
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:00 ${ampm}`
}

function formatTimeAgo(dateStr: string): string {
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = date.getTime() - now.getTime()
    if (diffMs <= 0) return 'Overdue'
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 60) return `${diffMin}m from now`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h from now`
    const diffDay = Math.floor(diffHr / 24)
    return `${diffDay}d from now`
  } catch {
    return dateStr
  }
}

const taskTypeColors: Record<string, string> = {
  analysis: '#10b981',
  monitoring: '#3b82f6',
  report: '#f59e0b',
  cleanup: '#8b5cf6',
  backup: '#ec4899',
  custom: '#6b7280',
}

export function Scheduler() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCron, setNewCron] = useState('0 9 * * *')
  const [newAgent, setNewAgent] = useState('')
  const [newTaskType, setNewTaskType] = useState('analysis')
  const [isCreating, setIsCreating] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/scheduled-tasks')
      const data = await res.json()
      setTasks(data)
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 15000)
    return () => clearInterval(interval)
  }, [fetchTasks])

  const handleToggle = async (task: ScheduledTask) => {
    const newStatus = task.status === 'active' ? 'paused' : 'active'
    await fetch(`/api/scheduled-tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchTasks()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/scheduled-tasks/${id}`, { method: 'DELETE' })
    fetchTasks()
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setIsCreating(true)
    try {
      await fetch('/api/scheduled-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          cronExpression: newCron,
          agentId: newAgent || null,
          taskType: newTaskType,
        }),
      })
      setCreateOpen(false)
      setNewName('')
      setNewCron('0 9 * * *')
      setNewAgent('')
      setNewTaskType('analysis')
      fetchTasks()
    } catch {
      // Error handling
    } finally {
      setIsCreating(false)
    }
  }

  const stats = {
    total: tasks.length,
    active: tasks.filter((t) => t.status === 'active').length,
    totalRuns: tasks.reduce((sum, t) => sum + t.runCount, 0),
    failed: tasks.reduce((sum, t) => sum + t.failCount, 0),
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
            Scheduler
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Manage cron-based automated tasks
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
              <Plus className="w-4 h-4" />
              Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Scheduled Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-[#9ca3af] text-xs">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                  placeholder="Task name..."
                />
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Agent (optional)</Label>
                <Input
                  value={newAgent}
                  onChange={(e) => setNewAgent(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                  placeholder="Agent ID or name..."
                />
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Task Type</Label>
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
                >
                  <option value="analysis">Analysis</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="report">Report</option>
                  <option value="cleanup">Cleanup</option>
                  <option value="backup">Backup</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Cron Expression</Label>
                <Input
                  value={newCron}
                  onChange={(e) => setNewCron(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1 font-mono text-sm"
                  placeholder="*/5 * * * *"
                />
                <p className="text-[11px] text-emerald-400 mt-1">{cronToHuman(newCron)}</p>
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs mb-2 block">Quick Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {cronPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setNewCron(preset.value)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-lg transition-colors ${
                        newCron === preset.value
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#252636] text-[#9ca3af] border border-[#2d2e3d] hover:bg-[#2d2e3d]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isCreating ? 'Creating...' : 'Create Schedule'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Schedules', value: stats.total, icon: Calendar, color: '#10b981' },
          { label: 'Active', value: stats.active, icon: Play, color: '#22c55e' },
          { label: 'Total Runs', value: stats.totalRuns, icon: Clock, color: '#3b82f6' },
          { label: 'Failed Runs', value: stats.failed, icon: AlertTriangle, color: '#ef4444' },
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

      {/* Task Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-5 animate-pulse">
              <div className="h-4 w-28 bg-[#252636] rounded mb-3" />
              <div className="h-3 w-40 bg-[#252636] rounded mb-2" />
              <div className="h-3 w-20 bg-[#252636] rounded" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-8 sm:p-12 text-center">
          <Clock className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
          <p className="text-sm text-[#9ca3af]">No scheduled tasks</p>
          <p className="text-xs text-[#6b7280] mt-1">Create your first automated schedule</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {tasks.map((task) => {
            const typeColor = taskTypeColors[task.taskType] || taskTypeColors.custom
            const isActive = task.status === 'active'
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5 hover:border-[#3d3e4d] transition-colors"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{task.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: typeColor }}
                      />
                      <span className="text-[11px] text-[#6b7280] capitalize">{task.taskType}</span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    {task.status}
                  </span>
                </div>

                {/* Cron Info */}
                <div className="mb-3 p-2.5 rounded-lg bg-[#252636]">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-[#6b7280]" />
                    <span className="text-[11px] font-mono text-[#9ca3af]">
                      {task.cronExpression}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-400">{cronToHuman(task.cronExpression)}</p>
                </div>

                {/* Next Run & Stats */}
                <div className="flex items-center justify-between text-[11px] text-[#6b7280] mb-3">
                  <span>Next: {formatTimeAgo(task.nextRunAt)}</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {task.runCount}
                  </span>
                  {task.failCount > 0 && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      {task.failCount}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#2d2e3d]">
                  <button
                    onClick={() => handleToggle(task)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Pause className="w-3 h-3" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" /> Resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="w-9 h-9 rounded-lg bg-[#252636] hover:bg-red-500/10 flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
