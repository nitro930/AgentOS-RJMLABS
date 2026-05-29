'use client'

import { motion } from 'framer-motion'
import { Agent } from '@/lib/types'

interface AgentCardProps {
  agent: Agent
  isSelected?: boolean
  onClick?: () => void
  onStatusChange?: (status: string) => void
}

const statusColors: Record<string, string> = {
  running: '#10b981',
  idle: '#6b7280',
  error: '#ef4444',
  paused: '#f59e0b',
}

const statusLabels: Record<string, string> = {
  running: 'Running',
  idle: 'Idle',
  error: 'Error',
  paused: 'Paused',
}

export function AgentCard({ agent, isSelected, onClick, onStatusChange }: AgentCardProps) {
  const statusColor = statusColors[agent.status] || '#6b7280'
  const totalTasks = (agent.tasksCompleted || 0) + (agent.tasksFailed || 0)
  const successRate = totalTasks > 0 ? Math.round(((agent.tasksCompleted || 0) / totalTasks) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-emerald-500/50 bg-[#1e1f2b] shadow-lg shadow-emerald-500/10' 
          : 'border-[#2d2e3d] bg-[#1e1f2b] hover:border-[#3d3e4d] active:bg-[#252636]'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
          style={{ backgroundColor: `${agent.color || '#10b981'}20` }}
        >
          {agent.avatar || '🤖'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-white truncate">{agent.name}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <div
                className={`w-2 h-2 rounded-full ${agent.status === 'running' ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: statusColor }}
              />
              <span className="text-xs" style={{ color: statusColor }}>
                {statusLabels[agent.status] || agent.status}
              </span>
            </div>
          </div>
          <p className="text-xs text-[#6b7280] mt-0.5 truncate">{agent.type}</p>
        </div>
      </div>

      <p className="text-xs text-[#9ca3af] line-clamp-2 mb-3">{agent.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="text-[#6b7280]">Tasks:</span>{' '}
            <span className="text-white font-medium">{agent.tasksCompleted || 0}</span>
          </div>
          <div className="text-xs">
            <span className="text-[#6b7280]">Rate:</span>{' '}
            <span className="text-white font-medium">{successRate}%</span>
          </div>
        </div>
        <div className="flex gap-1">
          {agent.status === 'running' ? (
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange?.('paused') }}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-md bg-[#252636] hover:bg-[#2d2e3d] active:bg-[#3d3e4d] flex items-center justify-center text-amber-400 transition-colors"
              title="Pause agent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange?.('running') }}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-md bg-[#252636] hover:bg-[#2d2e3d] active:bg-[#3d3e4d] flex items-center justify-center text-emerald-400 transition-colors"
              title="Start agent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
          )}
          {agent.status !== 'error' && (
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange?.('idle') }}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-md bg-[#252636] hover:bg-[#2d2e3d] active:bg-[#3d3e4d] flex items-center justify-center text-[#6b7280] transition-colors"
              title="Stop agent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
