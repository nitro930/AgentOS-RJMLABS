'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bug, Crown, Vote, Users, Plus, Play, Pause, Trash2,
  CheckCircle2, XCircle, Clock, AlertTriangle, ChevronRight,
  Loader2, Search, TreePine, RefreshCw, Circle, Zap,
  ArrowRight, Shield, Eye, Radio, Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAgentOSStore } from '@/lib/store'

interface SwarmMemberData {
  id: string
  swarmId: string
  agentId: string
  role: string
  status: string
  tasksCompleted: number
  tasksFailed: number
  contribution: number
  joinedAt: string
  lastActiveAt?: string
}

interface SwarmTaskData {
  id: string
  swarmId: string
  parentTaskId?: string
  assignedAgentId?: string
  title: string
  description: string
  status: string
  priority: string
  input: string
  output?: string
  error?: string
  decomposition: string
  dependencies: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

interface SwarmDecisionData {
  id: string
  swarmId: string
  type: string
  proposal: string
  votes: string
  result?: string
  status: string
  requiredVotes: number
  deadline?: string
  createdAt: string
  resolvedAt?: string
}

interface SwarmData {
  id: string
  name: string
  description?: string
  status: string
  strategy: string
  queenAgentId?: string
  maxAgents: number
  taskDecomposition: string
  consensusThreshold: number
  sharedMemory: boolean
  autoScale: boolean
  totalTasks: number
  completedTasks: number
  failedTasks: number
  avgTaskDuration: number
  createdAt: string
  updatedAt: string
  members: SwarmMemberData[]
  swarmTasks: SwarmTaskData[]
  decisions: SwarmDecisionData[]
  _count?: { members: number; swarmTasks: number }
}

interface AgentData {
  id: string
  name: string
  type: string
  avatar?: string
  status: string
}

const strategyConfig: Record<string, { label: string; icon: React.ElementType; color: string; desc: string }> = {
  queen: { label: 'Queen', icon: Crown, color: 'text-yellow-400', desc: 'Central lead agent coordinates all tasks' },
  democratic: { label: 'Democratic', icon: Vote, color: 'text-blue-400', desc: 'Majority voting for decisions' },
  consensus: { label: 'Consensus', icon: Shield, color: 'text-purple-400', desc: 'Full agreement required for decisions' },
  'round-robin': { label: 'Round Robin', icon: RefreshCw, color: 'text-emerald-400', desc: 'Tasks distributed in rotation' },
  specialized: { label: 'Specialized', icon: Target, color: 'text-orange-400', desc: 'Tasks routed by expertise' },
}

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  queen: { label: 'Queen', icon: Crown, color: 'text-yellow-400' },
  worker: { label: 'Worker', icon: Users, color: 'text-blue-400' },
  scout: { label: 'Scout', icon: Search, color: 'text-emerald-400' },
  specialist: { label: 'Specialist', icon: Target, color: 'text-purple-400' },
  reviewer: { label: 'Reviewer', icon: Eye, color: 'text-orange-400' },
}

const statusColors: Record<string, string> = {
  idle: 'text-[#6b7280]',
  active: 'text-emerald-400',
  paused: 'text-yellow-400',
  completed: 'text-blue-400',
  error: 'text-red-400',
  busy: 'text-yellow-400',
  offline: 'text-[#4b5563]',
}

const taskStatusColors: Record<string, string> = {
  pending: 'text-[#6b7280]',
  assigned: 'text-blue-400',
  in_progress: 'text-yellow-400',
  review: 'text-purple-400',
  completed: 'text-emerald-400',
  failed: 'text-red-400',
  cancelled: 'text-[#4b5563]',
}

const taskStatusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  assigned: ArrowRight,
  in_progress: Loader2,
  review: Eye,
  completed: CheckCircle2,
  failed: XCircle,
  cancelled: Circle,
}

const priorityColors: Record<string, string> = {
  low: 'border-[#2d2e3d] text-[#6b7280]',
  medium: 'border-blue-500/30 text-blue-400',
  high: 'border-orange-500/30 text-orange-400',
  critical: 'border-red-500/30 text-red-400',
}

export function AgentSwarm() {
  const { swarmTab, setSwarmTab } = useAgentOSStore()
  const [swarms, setSwarms] = useState<SwarmData[]>([])
  const [agents, setAgents] = useState<AgentData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSwarm, setSelectedSwarm] = useState<SwarmData | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [taskSearch, setTaskSearch] = useState('')

  const [newSwarm, setNewSwarm] = useState({
    name: '', description: '', strategy: 'queen', maxAgents: 5,
    taskDecomposition: 'auto', consensusThreshold: 0.6, sharedMemory: true, autoScale: false,
  })

  const [newTask, setNewTask] = useState({
    title: '', description: '', priority: 'medium', input: '{}', assignedAgentId: '',
  })

  const [newMember, setNewMember] = useState({ agentId: '', role: 'worker' })

  const fetchSwarms = useCallback(async () => {
    try {
      const res = await fetch('/api/swarm')
      if (res.ok) {
        const data = await res.json()
        setSwarms(data.swarms || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchSwarmDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/swarm/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedSwarm(data.swarm)
      }
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchSwarms(), fetchAgents()])
      setLoading(false)
    }
    loadAll()
  }, [fetchSwarms, fetchAgents])

  const handleCreateSwarm = async () => {
    try {
      const res = await fetch('/api/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSwarm),
      })
      if (res.ok) {
        await fetchSwarms()
        setCreateDialogOpen(false)
        setNewSwarm({ name: '', description: '', strategy: 'queen', maxAgents: 5, taskDecomposition: 'auto', consensusThreshold: 0.6, sharedMemory: true, autoScale: false })
      }
    } catch (e) { console.error(e) }
  }

  const handleDeleteSwarm = async (id: string) => {
    try {
      await fetch(`/api/swarm/${id}`, { method: 'DELETE' })
      await fetchSwarms()
      if (selectedSwarm?.id === id) setSelectedSwarm(null)
    } catch (e) { console.error(e) }
  }

  const handleToggleSwarm = async (swarm: SwarmData) => {
    const newStatus = swarm.status === 'active' ? 'paused' : 'active'
    try {
      await fetch(`/api/swarm/${swarm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      await fetchSwarms()
      if (selectedSwarm?.id === swarm.id) await fetchSwarmDetail(swarm.id)
    } catch (e) { console.error(e) }
  }

  const handleAddTask = async () => {
    if (!selectedSwarm) return
    try {
      const res = await fetch(`/api/swarm/${selectedSwarm.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          assignedAgentId: newTask.assignedAgentId || undefined,
        }),
      })
      if (res.ok) {
        await fetchSwarmDetail(selectedSwarm.id)
        await fetchSwarms()
        setAddTaskDialogOpen(false)
        setNewTask({ title: '', description: '', priority: 'medium', input: '{}', assignedAgentId: '' })
      }
    } catch (e) { console.error(e) }
  }

  const handleAddMember = async () => {
    if (!selectedSwarm) return
    try {
      const res = await fetch(`/api/swarm/${selectedSwarm.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      })
      if (res.ok) {
        await fetchSwarmDetail(selectedSwarm.id)
        await fetchSwarms()
        setAddMemberDialogOpen(false)
        setNewMember({ agentId: '', role: 'worker' })
      }
    } catch (e) { console.error(e) }
  }

  const handleRemoveMember = async (agentId: string) => {
    if (!selectedSwarm) return
    try {
      await fetch(`/api/swarm/${selectedSwarm.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })
      await fetchSwarmDetail(selectedSwarm.id)
      await fetchSwarms()
    } catch (e) { console.error(e) }
  }

  const activeSwarms = swarms.filter(s => s.status === 'active').length
  const totalAgents = swarms.reduce((sum, s) => sum + (s._count?.members || s.members?.length || 0), 0)
  const tasksInProgress = swarms.reduce((sum, s) => {
    const inProgress = s.swarmTasks?.filter(t => t.status === 'in_progress' || t.status === 'assigned').length || 0
    return sum + inProgress
  }, 0)

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent ? `${agent.avatar || '🤖'} ${agent.name}` : agentId
  }

  const buildTaskTree = (tasks: SwarmTaskData[]) => {
    const rootTasks = tasks.filter(t => !t.parentTaskId)
    const childMap = new Map<string, SwarmTaskData[]>()
    tasks.forEach(t => {
      if (t.parentTaskId) {
        const children = childMap.get(t.parentTaskId) || []
        children.push(t)
        childMap.set(t.parentTaskId, children)
      }
    })
    return { rootTasks, childMap }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  // Detail view
  if (selectedSwarm) {
    const { rootTasks, childMap } = buildTaskTree(selectedSwarm.swarmTasks || [])
    const StrategyIcon = strategyConfig[selectedSwarm.strategy]?.icon || Bug
    const strategyColor = strategyConfig[selectedSwarm.strategy]?.color || 'text-[#9ca3af]'
    const completionRate = selectedSwarm.totalTasks > 0
      ? Math.round((selectedSwarm.completedTasks / selectedSwarm.totalTasks) * 100)
      : 0

    const filteredTasks = rootTasks.filter(t =>
      !taskSearch || t.title.toLowerCase().includes(taskSearch.toLowerCase()) || t.description.toLowerCase().includes(taskSearch.toLowerCase())
    )

    return (
      <div className="space-y-6">
        {/* Back button + header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
              onClick={() => setSelectedSwarm(null)}
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Bug className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedSwarm.name}</h2>
                <div className="flex items-center gap-2">
                  <StrategyIcon className={`w-3.5 h-3.5 ${strategyColor}`} />
                  <span className="text-xs text-[#6b7280]">
                    {strategyConfig[selectedSwarm.strategy]?.label} Strategy
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      selectedSwarm.status === 'active'
                        ? 'border-emerald-500/30 text-emerald-400'
                        : selectedSwarm.status === 'paused'
                        ? 'border-yellow-500/30 text-yellow-400'
                        : selectedSwarm.status === 'error'
                        ? 'border-red-500/30 text-red-400'
                        : 'border-[#2d2e3d] text-[#6b7280]'
                    }`}
                  >
                    {selectedSwarm.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className={`border-[#2d2e3d] ${
                selectedSwarm.status === 'active'
                  ? 'text-yellow-400 hover:bg-yellow-500/10'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
              onClick={() => handleToggleSwarm(selectedSwarm)}
            >
              {selectedSwarm.status === 'active' ? (
                <><Pause className="w-3.5 h-3.5 mr-1.5" />Pause</>
              ) : (
                <><Play className="w-3.5 h-3.5 mr-1.5" />Activate</>
              )}
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setAddTaskDialogOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />Add Task
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
              onClick={() => setAddMemberDialogOpen(true)}
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />Add Member
            </Button>
          </div>
        </div>

        {/* Description */}
        {selectedSwarm.description && (
          <p className="text-sm text-[#9ca3af] -mt-2">{selectedSwarm.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Members', value: selectedSwarm.members?.length || 0, icon: Users, color: 'text-blue-400' },
            { label: 'Total Tasks', value: selectedSwarm.totalTasks, icon: TreePine, color: 'text-emerald-400' },
            { label: 'Completed', value: selectedSwarm.completedTasks, icon: CheckCircle2, color: 'text-green-400' },
            { label: 'Failed', value: selectedSwarm.failedTasks, icon: XCircle, color: 'text-red-400' },
            { label: 'Progress', value: `${completionRate}%`, icon: Target, color: 'text-purple-400' },
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

        {/* Progress bar */}
        <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6b7280]">Overall Progress</span>
              <span className="text-xs text-emerald-400 font-mono">{completionRate}%</span>
            </div>
            <div className="w-full h-2 bg-[#0f1117] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-[#4b5563]">
              <span>{selectedSwarm.completedTasks} completed</span>
              <span>{selectedSwarm.totalTasks - selectedSwarm.completedTasks - selectedSwarm.failedTasks} remaining</span>
              <span>{selectedSwarm.failedTasks} failed</span>
            </div>
          </CardContent>
        </Card>

        {/* Detail Tabs */}
        <Tabs value={swarmTab === 'swarms' ? 'members' : swarmTab} onValueChange={setSwarmTab}>
          <TabsList className="bg-[#1e1f2b] border border-[#2d2e3d] w-full justify-start overflow-x-auto">
            <TabsTrigger value="members" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <Users className="w-3.5 h-3.5 mr-1.5" />Members
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <TreePine className="w-3.5 h-3.5 mr-1.5" />Tasks
            </TabsTrigger>
            <TabsTrigger value="decisions" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <Vote className="w-3.5 h-3.5 mr-1.5" />Decisions
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-4">
            {(!selectedSwarm.members || selectedSwarm.members.length === 0) ? (
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-8 text-center">
                  <Users className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280] mb-3">No members in this swarm yet.</p>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAddMemberDialogOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />Add Member
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedSwarm.members.map((member, i) => {
                  const role = roleConfig[member.role] || roleConfig.worker
                  const RoleIcon = role.icon
                  const agent = agents.find(a => a.id === member.agentId)
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#0f1117] flex items-center justify-center text-lg">
                                {agent?.avatar || '🤖'}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-white">{agent?.name || member.agentId}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <RoleIcon className={`w-3 h-3 ${role.color}`} />
                                  <span className="text-[10px] text-[#6b7280]">{role.label}</span>
                                  <Circle className={`w-2 h-2 ${statusColors[member.status] || 'text-[#6b7280]'}`} />
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                              onClick={() => handleRemoveMember(member.agentId)}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="p-1.5 rounded bg-[#0f1117] text-center">
                              <p className="text-xs font-bold text-emerald-400">{member.tasksCompleted}</p>
                              <p className="text-[9px] text-[#6b7280]">done</p>
                            </div>
                            <div className="p-1.5 rounded bg-[#0f1117] text-center">
                              <p className="text-xs font-bold text-red-400">{member.tasksFailed}</p>
                              <p className="text-[9px] text-[#6b7280]">fail</p>
                            </div>
                            <div className="p-1.5 rounded bg-[#0f1117] text-center">
                              <p className="text-xs font-bold text-blue-400">{Math.round(member.contribution * 100)}%</p>
                              <p className="text-[9px] text-[#6b7280]">score</p>
                            </div>
                          </div>
                          {/* Contribution bar */}
                          <div className="mt-2">
                            <div className="w-full h-1 bg-[#0f1117] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${member.contribution * 100}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                  <Input
                    value={taskSearch}
                    onChange={e => setTaskSearch(e.target.value)}
                    placeholder="Search tasks..."
                    className="pl-10 bg-[#1e1f2b] border-[#2d2e3d] text-white text-sm"
                  />
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                  <CardContent className="p-8 text-center">
                    <TreePine className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                    <p className="text-sm text-[#6b7280] mb-3">No tasks yet. Create a task to get started.</p>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAddTaskDialogOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" />Add Task
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {filteredTasks.map((task, i) => {
                    const children = childMap.get(task.id) || []
                    const TaskIcon = taskStatusIcons[task.status] || Clock
                    const isDecomposed = (() => {
                      try { return JSON.parse(task.decomposition || '[]').length > 0 } catch { return false }
                    })()
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                <TaskIcon className={`w-4 h-4 ${taskStatusColors[task.status] || 'text-[#6b7280]'} ${task.status === 'in_progress' ? 'animate-spin' : ''}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-medium text-white">{task.title}</h4>
                                  <Badge variant="outline" className={`text-[9px] ${priorityColors[task.priority] || ''}`}>
                                    {task.priority}
                                  </Badge>
                                  <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#6b7280]">
                                    {task.status.replace('_', ' ')}
                                  </Badge>
                                  {isDecomposed && (
                                    <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">
                                      <TreePine className="w-2.5 h-2.5 mr-0.5" />decomposed
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-[#9ca3af] mt-0.5 line-clamp-1">{task.description}</p>
                                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#6b7280]">
                                  {task.assignedAgentId && (
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />{getAgentName(task.assignedAgentId)}
                                    </span>
                                  )}
                                  {task.error && (
                                    <span className="flex items-center gap-1 text-red-400">
                                      <AlertTriangle className="w-3 h-3" />{task.error}
                                    </span>
                                  )}
                                </div>
                                {/* Subtasks */}
                                {children.length > 0 && (
                                  <div className="mt-3 ml-2 pl-3 border-l-2 border-[#2d2e3d] space-y-1.5">
                                    {children.map((child) => {
                                      const ChildIcon = taskStatusIcons[child.status] || Clock
                                      return (
                                        <div key={child.id} className="flex items-center gap-2">
                                          <ChildIcon className={`w-3 h-3 ${taskStatusColors[child.status]}`} />
                                          <span className="text-xs text-[#9ca3af]">{child.title}</span>
                                          <Badge variant="outline" className={`text-[8px] ${priorityColors[child.priority]}`}>
                                            {child.priority}
                                          </Badge>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
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

          {/* Decisions Tab */}
          <TabsContent value="decisions" className="mt-4">
            {(!selectedSwarm.decisions || selectedSwarm.decisions.length === 0) ? (
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-8 text-center">
                  <Vote className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280]">No decisions yet. Decisions will appear here when the swarm needs to vote on task assignments or resolve conflicts.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {selectedSwarm.decisions.map((decision, i) => {
                  const votes = (() => { try { return JSON.parse(decision.votes || '[]') } catch { return [] } })()
                  const proposal = (() => { try { return JSON.parse(decision.proposal || '{}') } catch { return {} } })()
                  const approveVotes = votes.filter((v: any) => v.vote === 'approve').length
                  const rejectVotes = votes.filter((v: any) => v.vote === 'reject').length
                  return (
                    <motion.div
                      key={decision.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-400">
                                  {decision.type.replace('_', ' ')}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] ${
                                    decision.status === 'approved'
                                      ? 'border-emerald-500/30 text-emerald-400'
                                      : decision.status === 'rejected'
                                      ? 'border-red-500/30 text-red-400'
                                      : decision.status === 'voting'
                                      ? 'border-yellow-500/30 text-yellow-400'
                                      : 'border-[#2d2e3d] text-[#6b7280]'
                                  }`}
                                >
                                  {decision.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#9ca3af] mt-1.5">
                                {typeof proposal === 'object' ? JSON.stringify(proposal) : decision.proposal}
                              </p>
                              {votes.length > 0 && (
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />{approveVotes} approve
                                  </span>
                                  <span className="text-[10px] text-red-400 flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />{rejectVotes} reject
                                  </span>
                                  <span className="text-[10px] text-[#6b7280]">
                                    {decision.requiredVotes} required
                                  </span>
                                </div>
                              )}
                              <p className="text-[10px] text-[#4b5563] mt-1">
                                {new Date(decision.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Task Dialog */}
        <Dialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen}>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Add Task to Swarm</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Title</label>
                <Input
                  value={newTask.title}
                  onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Build authentication system"
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
                <Input
                  value={newTask.description}
                  onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                  placeholder="Task details..."
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Priority</label>
                  <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v }))}>
                    <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Assign to Agent</label>
                  <Select value={newTask.assignedAgentId || 'none'} onValueChange={v => setNewTask(p => ({ ...p, assignedAgentId: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                      <SelectValue placeholder="Auto-assign" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                      <SelectItem value="none">Auto-assign</SelectItem>
                      {agents.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.avatar} {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Input (JSON)</label>
                <Input
                  value={newTask.input}
                  onChange={e => setNewTask(p => ({ ...p, input: e.target.value }))}
                  placeholder="{}"
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm font-mono"
                />
              </div>
              <Button
                onClick={handleAddTask}
                disabled={!newTask.title}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Add Member to Swarm</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Agent</label>
                <Select value={newMember.agentId} onValueChange={v => setNewMember(p => ({ ...p, agentId: v }))}>
                  <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                    <SelectValue placeholder="Select agent..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                    {agents.filter(a => !selectedSwarm.members?.some(m => m.agentId === a.id)).map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.avatar} {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Role</label>
                <Select value={newMember.role} onValueChange={v => setNewMember(p => ({ ...p, role: v }))}>
                  <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                    {Object.entries(roleConfig).map(([key, cfg]) => (
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
              <Button
                onClick={handleAddMember}
                disabled={!newMember.agentId}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />Add Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Bug className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Agent Swarm</h2>
              <p className="text-sm text-[#6b7280]">Multi-agent orchestration with queen/drone architecture</p>
            </div>
          </div>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Swarm
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Create Swarm</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Swarm Name</label>
                <Input
                  value={newSwarm.name}
                  onChange={e => setNewSwarm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Research Squad, Dev Team Alpha"
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
                <Input
                  value={newSwarm.description}
                  onChange={e => setNewSwarm(p => ({ ...p, description: e.target.value }))}
                  placeholder="What this swarm does..."
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Strategy</label>
                  <Select value={newSwarm.strategy} onValueChange={v => setNewSwarm(p => ({ ...p, strategy: v }))}>
                    <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                      {Object.entries(strategyConfig).map(([key, cfg]) => (
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
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Max Agents</label>
                  <Input
                    type="number"
                    value={newSwarm.maxAgents}
                    onChange={e => setNewSwarm(p => ({ ...p, maxAgents: parseInt(e.target.value) || 5 }))}
                    min={1}
                    max={20}
                    className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Task Decomposition</label>
                  <Select value={newSwarm.taskDecomposition} onValueChange={v => setNewSwarm(p => ({ ...p, taskDecomposition: v }))}>
                    <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Consensus Threshold</label>
                  <Input
                    type="number"
                    step={0.1}
                    min={0}
                    max={1}
                    value={newSwarm.consensusThreshold}
                    onChange={e => setNewSwarm(p => ({ ...p, consensusThreshold: parseFloat(e.target.value) || 0.6 }))}
                    className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSwarm.sharedMemory}
                    onChange={e => setNewSwarm(p => ({ ...p, sharedMemory: e.target.checked }))}
                    className="rounded border-[#2d2e3d] bg-[#0f1117] text-emerald-500 focus:ring-emerald-500/30"
                  />
                  <span className="text-xs text-[#9ca3af]">Shared Memory</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSwarm.autoScale}
                    onChange={e => setNewSwarm(p => ({ ...p, autoScale: e.target.checked }))}
                    className="rounded border-[#2d2e3d] bg-[#0f1117] text-emerald-500 focus:ring-emerald-500/30"
                  />
                  <span className="text-xs text-[#9ca3af]">Auto Scale</span>
                </label>
              </div>
              {/* Strategy description */}
              <div className="p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                <div className="flex items-center gap-2">
                  {(() => {
                    const cfg = strategyConfig[newSwarm.strategy]
                    const Icon = cfg.icon
                    return <Icon className={`w-4 h-4 ${cfg.color}`} />
                  })()}
                  <span className="text-xs text-[#9ca3af]">{strategyConfig[newSwarm.strategy]?.desc}</span>
                </div>
              </div>
              <Button
                onClick={handleCreateSwarm}
                disabled={!newSwarm.name}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Bug className="w-4 h-4 mr-2" />Create Swarm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Swarms', value: activeSwarms, icon: Radio, color: 'text-emerald-400' },
          { label: 'Total Agents', value: totalAgents, icon: Users, color: 'text-blue-400' },
          { label: 'Tasks In Progress', value: tasksInProgress, icon: Loader2, color: 'text-yellow-400' },
          { label: 'Total Swarms', value: swarms.length, icon: Bug, color: 'text-purple-400' },
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

      {/* Swarm Cards */}
      {swarms.length === 0 ? (
        <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
          <CardContent className="p-12 text-center">
            <Bug className="w-12 h-12 text-[#2d2e3d] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Swarms Yet</h3>
            <p className="text-sm text-[#6b7280] mb-4">Create your first agent swarm to start orchestrating multi-agent tasks with queen/drone architecture.</p>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Create Swarm
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {swarms.map((swarm, i) => {
            const StrategyIcon = strategyConfig[swarm.strategy]?.icon || Bug
            const strategyColor = strategyConfig[swarm.strategy]?.color || 'text-[#9ca3af]'
            const memberCount = swarm._count?.members || swarm.members?.length || 0
            const taskCount = swarm._count?.swarmTasks || swarm.swarmTasks?.length || 0
            const completionRate = swarm.totalTasks > 0
              ? Math.round((swarm.completedTasks / swarm.totalTasks) * 100)
              : 0
            return (
              <motion.div
                key={swarm.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                          <StrategyIcon className={`w-4 h-4 ${strategyColor}`} />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-medium text-white truncate">{swarm.name}</CardTitle>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                swarm.status === 'active'
                                  ? 'border-emerald-500/30 text-emerald-400'
                                  : swarm.status === 'paused'
                                  ? 'border-yellow-500/30 text-yellow-400'
                                  : swarm.status === 'error'
                                  ? 'border-red-500/30 text-red-400'
                                  : swarm.status === 'completed'
                                  ? 'border-blue-500/30 text-blue-400'
                                  : 'border-[#2d2e3d] text-[#6b7280]'
                              }`}
                            >
                              {swarm.status}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#6b7280]">
                              {strategyConfig[swarm.strategy]?.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 flex flex-col">
                    {swarm.description && (
                      <p className="text-xs text-[#9ca3af] line-clamp-2">{swarm.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] border-[#2d2e3d] text-[#6b7280]">
                        <Users className="w-3 h-3 mr-1" />{memberCount} members
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-[#2d2e3d] text-[#6b7280]">
                        <TreePine className="w-3 h-3 mr-1" />{taskCount} tasks
                      </Badge>
                      {swarm.sharedMemory && (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                          <Zap className="w-3 h-3 mr-1" />shared
                        </Badge>
                      )}
                      {swarm.autoScale && (
                        <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                          auto-scale
                        </Badge>
                      )}
                    </div>
                    {/* Progress */}
                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[#6b7280]">Progress</span>
                        <span className="text-[10px] text-emerald-400 font-mono">{completionRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[9px] text-[#4b5563]">
                        <span>{swarm.completedTasks} done</span>
                        <span>{swarm.failedTasks} failed</span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => fetchSwarmDetail(swarm.id)}
                      >
                        View Details
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`text-xs ${swarm.status === 'active' ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}
                        onClick={() => handleToggleSwarm(swarm)}
                      >
                        {swarm.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDeleteSwarm(swarm.id)}
                      >
                        <Trash2 className="w-3 h-3" />
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
  )
}
