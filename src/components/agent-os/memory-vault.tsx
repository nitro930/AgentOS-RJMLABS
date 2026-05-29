'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Pin, Database, FolderOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { MemoryCard } from './memory-card'
import { CreateMemoryDialog } from './create-memory-dialog'
import { useAgentOSStore } from '@/lib/store'
import { MemoryEntry } from '@/lib/types'

const memoryTypes = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'conversation', label: 'Chat', icon: '💬' },
  { value: 'output', label: 'Output', icon: '📤' },
  { value: 'insight', label: 'Insight', icon: '💡' },
  { value: 'task', label: 'Task', icon: '✅' },
  { value: 'reference', label: 'Ref', icon: '📚' },
]

const vaultPaths = [
  { value: '', label: 'All', icon: '📁' },
  { value: 'vault/strategy', label: 'Strategy', icon: '🎯' },
  { value: 'vault/insights', label: 'Insights', icon: '💡' },
  { value: 'vault/outputs', label: 'Outputs', icon: '📤' },
  { value: 'vault/tasks', label: 'Tasks', icon: '✅' },
  { value: 'vault/reference', label: 'Reference', icon: '📚' },
  { value: 'vault/conversations', label: 'Chat', icon: '💬' },
]

export function MemoryVault() {
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [stats, setStats] = useState<{ total: number; byType: Record<string, number>; pinned: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { memorySearchQuery, setMemorySearchQuery, memoryTypeFilter, setMemoryTypeFilter, memoryPathFilter, setMemoryPathFilter } = useAgentOSStore()

  const fetchMemories = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (memorySearchQuery) params.set('search', memorySearchQuery)
      if (memoryTypeFilter !== 'all') params.set('type', memoryTypeFilter)
      if (memoryPathFilter) params.set('path', memoryPathFilter)
      
      const res = await fetch(`/api/memory?${params.toString()}`)
      const data = await res.json()
      setMemories(data.memories || [])
      setStats(data.stats || null)
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [memorySearchQuery, memoryTypeFilter, memoryPathFilter])

  useEffect(() => {
    fetchMemories()
  }, [fetchMemories])

  const handlePin = async (id: string, pinned: boolean) => {
    await fetch(`/api/memory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !pinned }),
    })
    fetchMemories()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/memory/${id}`, { method: 'DELETE' })
    fetchMemories()
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
            Memory Vault
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">Searchable persistent memory with Obsidian-style navigation</p>
        </div>
        <CreateMemoryDialog onCreated={fetchMemories} />
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] sm:text-xs text-[#9ca3af]">Total</span>
          </div>
          <p className="text-xl font-bold text-white mt-1">{stats?.total ?? 0}</p>
        </div>
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] sm:text-xs text-[#9ca3af]">Pinned</span>
          </div>
          <p className="text-xl font-bold text-white mt-1">{stats?.pinned ?? 0}</p>
        </div>
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">💡</span>
            <span className="text-[10px] sm:text-xs text-[#9ca3af]">Insights</span>
          </div>
          <p className="text-xl font-bold text-white mt-1">{stats?.byType?.insight ?? 0}</p>
        </div>
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">💬</span>
            <span className="text-[10px] sm:text-xs text-[#9ca3af]">Conversations</span>
          </div>
          <p className="text-xl font-bold text-white mt-1">{stats?.byType?.conversation ?? 0}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <Input
            value={memorySearchQuery}
            onChange={(e) => setMemorySearchQuery(e.target.value)}
            className="pl-10 bg-[#1e1f2b] border-[#2d2e3d] text-white h-11 text-sm"
            placeholder="Search memories..."
          />
        </div>

        {/* Scrollable filter rows for mobile */}
        <div className="space-y-2">
          {/* Type Filter - horizontally scrollable on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-[#6b7280] flex-shrink-0" />
            {memoryTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setMemoryTypeFilter(type.value)}
                className={`text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  memoryTypeFilter === type.value
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-[#252636] text-[#9ca3af] hover:bg-[#2d2e3d] active:bg-[#3d3e4d]'
                }`}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>

          {/* Path Filter - horizontally scrollable on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <FolderOpen className="w-3.5 h-3.5 text-[#6b7280] flex-shrink-0" />
            {vaultPaths.map((path) => (
              <button
                key={path.value}
                onClick={() => setMemoryPathFilter(path.value)}
                className={`text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  memoryPathFilter === path.value
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-[#252636] text-[#9ca3af] hover:bg-[#2d2e3d] active:bg-[#3d3e4d]'
                }`}
              >
                <span>{path.icon}</span>
                <span>{path.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Memory Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 animate-pulse">
              <div className="h-4 w-24 bg-[#252636] rounded mb-3" />
              <div className="h-4 w-full bg-[#252636] rounded mb-2" />
              <div className="h-3 w-3/4 bg-[#252636] rounded" />
            </div>
          ))}
        </div>
      ) : memories.length === 0 ? (
        <div className="text-center py-12 sm:py-16 text-[#6b7280]">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No memories found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onPin={() => handlePin(memory.id, memory.pinned)}
              onDelete={() => handleDelete(memory.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
