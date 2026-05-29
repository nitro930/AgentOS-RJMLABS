'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ChevronDown, ChevronUp, X } from 'lucide-react'
import { AgentCard } from './agent-card'
import { CreateAgentDialog } from './create-agent-dialog'
import { Agent, AgentTask } from '@/lib/types'
import { useAgentOSStore } from '@/lib/store'

export function AgentGrid() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedAgent, setExpandedAgent] = useState<Agent | null>(null)
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([])
  const { selectedAgentId, setSelectedAgentId } = useAgentOSStore()

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()
      setAgents(data)
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 15000)
    return () => clearInterval(interval)
  }, [fetchAgents])

  const handleAgentClick = async (agent: Agent) => {
    if (expandedAgent?.id === agent.id) {
      setExpandedAgent(null)
      setAgentTasks([])
      setSelectedAgentId(null)
    } else {
      setExpandedAgent(agent)
      setSelectedAgentId(agent.id)
      try {
        const res = await fetch(`/api/agents/${agent.id}/tasks`)
        const data = await res.json()
        setAgentTasks(data)
      } catch {
        setAgentTasks([])
      }
    }
  }

  const handleStatusChange = async (agentId: string, status: string) => {
    await fetch(`/api/agents/${agentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, lastActiveAt: new Date().toISOString() }),
    })
    fetchAgents()
    if (expandedAgent?.id === agentId) {
      setExpandedAgent({ ...expandedAgent, status })
    }
  }

  const statusCounts = {
    running: agents.filter((a) => a.status === 'running').length,
    idle: agents.filter((a) => a.status === 'idle').length,
    paused: agents.filter((a) => a.status === 'paused').length,
    error: agents.filter((a) => a.status === 'error').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl sm:text-2xl font-bold text-white"
          >
            Agents
          </motion.h2>
          <p className="text-sm text-[#9ca3af] mt-1">Manage and monitor your AI agents</p>
        </div>
        <CreateAgentDialog onCreated={fetchAgents} />
      </div>

      {/* Status Summary */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400">{statusCounts.running} Running</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#252636] border border-[#2d2e3d]">
          <div className="w-2 h-2 rounded-full bg-[#6b7280]" />
          <span className="text-xs text-[#9ca3af]">{statusCounts.idle} Idle</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs text-amber-400">{statusCounts.paused} Paused</span>
        </div>
        {statusCounts.error > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-red-400">{statusCounts.error} Error</span>
          </div>
        )}
      </div>

      {/* Agent Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-[#252636]" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-[#252636] rounded mb-1" />
                  <div className="h-3 w-16 bg-[#252636] rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-[#252636] rounded mb-2" />
              <div className="h-3 w-3/4 bg-[#252636] rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selectedAgentId === agent.id}
              onClick={() => handleAgentClick(agent)}
              onStatusChange={(status) => handleStatusChange(agent.id, status)}
            />
          ))}
        </div>
      )}

      {/* Expanded Agent Details */}
      <AnimatePresence>
        {expandedAgent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${expandedAgent.color || '#10b981'}20` }}
                  >
                    {expandedAgent.avatar || '🤖'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{expandedAgent.name}</h3>
                    <p className="text-xs text-[#6b7280]">{expandedAgent.type} agent</p>
                  </div>
                </div>
                <button
                  onClick={() => { setExpandedAgent(null); setSelectedAgentId(null) }}
                  className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-[#9ca3af] mb-4">{expandedAgent.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="text-center p-2 rounded-lg bg-[#252636]">
                  <p className="text-lg font-bold text-white">{expandedAgent.tasksCompleted}</p>
                  <p className="text-[10px] text-[#6b7280]">Completed</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#252636]">
                  <p className="text-lg font-bold text-red-400">{expandedAgent.tasksFailed}</p>
                  <p className="text-[10px] text-[#6b7280]">Failed</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#252636]">
                  <p className="text-lg font-bold text-emerald-400">
                    {expandedAgent.tasksCompleted + expandedAgent.tasksFailed > 0
                      ? Math.round((expandedAgent.tasksCompleted / (expandedAgent.tasksCompleted + expandedAgent.tasksFailed)) * 100)
                      : 0}%
                  </p>
                  <p className="text-[10px] text-[#6b7280]">Success Rate</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#252636]">
                  <p className="text-xs font-medium text-white capitalize">{expandedAgent.status}</p>
                  <p className="text-[10px] text-[#6b7280]">Status</p>
                </div>
              </div>

              {/* Tasks */}
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Agent Tasks
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {agentTasks.length === 0 ? (
                  <p className="text-xs text-[#6b7280] text-center py-4">No tasks assigned</p>
                ) : (
                  agentTasks.map((task) => {
                    const statusColors: Record<string, string> = {
                      pending: '#6b7280',
                      running: '#10b981',
                      completed: '#22c55e',
                      failed: '#ef4444',
                    }
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] transition-colors"
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: statusColors[task.status] || '#6b7280' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{task.title}</p>
                          <p className="text-[11px] text-[#6b7280] truncate">{task.description}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e1f2b] text-[#9ca3af] capitalize flex-shrink-0">
                          {task.priority}
                        </span>
                        <span className="text-[10px] capitalize flex-shrink-0" style={{ color: statusColors[task.status] }}>
                          {task.status}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
