'use client'

import { motion } from 'framer-motion'
import { Pin, Trash2, ExternalLink } from 'lucide-react'

interface MemoryCardProps {
  memory: {
    id: string
    type: string
    title: string
    content: string
    tags: string
    source?: string | null
    path?: string | null
    pinned: boolean
    createdAt: string
    agent?: { name: string; avatar: string | null } | null
  }
  onPin?: () => void
  onDelete?: () => void
  onClick?: () => void
}

const typeColors: Record<string, string> = {
  conversation: '#8b5cf6',
  output: '#3b82f6',
  insight: '#f59e0b',
  task: '#10b981',
  reference: '#ec4899',
}

const typeIcons: Record<string, string> = {
  conversation: '💬',
  output: '📤',
  insight: '💡',
  task: '✅',
  reference: '📚',
}

export function MemoryCard({ memory, onPin, onDelete, onClick }: MemoryCardProps) {
  const tags: string[] = (() => {
    try { return JSON.parse(memory.tags || '[]') } catch { return [] }
  })()
  const color = typeColors[memory.type] || '#6b7280'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      onClick={onClick}
      className={`rounded-xl border p-4 cursor-pointer transition-colors ${
        memory.pinned 
          ? 'border-amber-500/30 bg-[#1e1f2b]' 
          : 'border-[#2d2e3d] bg-[#1e1f2b] hover:border-[#3d3e4d]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">{typeIcons[memory.type] || '📝'}</span>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {memory.type}
          </span>
          {memory.pinned && (
            <Pin className="w-3 h-3 text-amber-400 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onPin?.() }}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#252636] text-[#6b7280] hover:text-amber-400 transition-colors"
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.() }}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#252636] text-[#6b7280] hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-white mb-1 truncate">{memory.title}</h4>
      <p className="text-xs text-[#9ca3af] line-clamp-2 mb-2">{memory.content}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 flex-wrap">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[#252636] text-[#9ca3af]">
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-[#6b7280]">+{tags.length - 3}</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#6b7280] flex-shrink-0">
          {memory.agent && <span>{memory.agent.avatar || '🤖'}</span>}
          {memory.source && <span>{memory.source}</span>}
        </div>
      </div>

      {memory.path && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-[#6b7280]">
          <ExternalLink className="w-2.5 h-2.5" />
          <span className="truncate">{memory.path}</span>
        </div>
      )}
    </motion.div>
  )
}
