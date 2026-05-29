'use client'

import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'

interface GoalCardProps {
  goal: {
    id: string
    title: string
    description: string
    status: string
    progress: number
    priority: string
    dueDate?: string | null
  }
  onProgressChange?: (progress: number) => void
  onDelete?: () => void
}

const priorityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#10b981',
  low: '#6b7280',
}

const statusColors: Record<string, string> = {
  active: '#10b981',
  completed: '#22c55e',
  paused: '#f59e0b',
  archived: '#6b7280',
}

export function GoalCard({ goal, onProgressChange, onDelete }: GoalCardProps) {
  const priorityColor = priorityColors[goal.priority] || '#6b7280'
  const statusColor = statusColors[goal.status] || '#6b7280'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 hover:border-[#3d3e4d] transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: `${priorityColor}20`, color: priorityColor }}
          >
            {goal.priority}
          </span>
          <span
            className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
          >
            {goal.status}
          </span>
        </div>
        <button
          onClick={() => onDelete?.()}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#252636] text-[#6b7280] hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <h4 className="text-sm font-semibold text-white mb-1">{goal.title}</h4>
      <p className="text-xs text-[#9ca3af] line-clamp-2 mb-3">{goal.description}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6b7280]">Progress</span>
          <span className="text-white font-medium">{goal.progress}%</span>
        </div>
        <div className="h-2 bg-[#252636] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: goal.progress >= 100 ? '#22c55e' : '#10b981' }}
          />
        </div>
      </div>

      {goal.dueDate && (
        <div className="mt-2 text-[10px] text-[#6b7280]">
          Due: {new Date(goal.dueDate).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  )
}
