'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Archive, Database, ArrowRight, Zap, Brain, MemoryStick } from 'lucide-react'
import { AgentOutput } from '@/lib/types'

export function LoopSystem() {
  const [outputs, setOutputs] = useState<AgentOutput[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOutputs = useCallback(async () => {
    try {
      const res = await fetch('/api/outputs')
      const data = await res.json()
      setOutputs(data || [])
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOutputs()
  }, [fetchOutputs])

  const handleWriteToMemory = async (outputId: string) => {
    // Create a memory entry from the output
    const output = outputs.find((o) => o.id === outputId)
    if (!output) return

    try {
      const memoryRes = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'output',
          title: output.title,
          content: output.content,
          tags: ['agent-output', output.type],
          source: output.agent?.name || 'unknown',
          agentId: output.agentId,
          path: `vault/outputs/${output.type}`,
        }),
      })
      const memoryData = await memoryRes.json()

      // Update the output with memoryId
      await fetch(`/api/outputs/${outputId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId: memoryData.id }),
      })

      fetchOutputs()
    } catch {
      // Error handling
    }
  }

  const handleArchive = async (id: string) => {
    await fetch(`/api/outputs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: true }),
    })
    fetchOutputs()
  }

  const typeColors: Record<string, string> = {
    text: '#10b981',
    code: '#8b5cf6',
    file: '#f59e0b',
    insight: '#06b6d4',
    action: '#ef4444',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl sm:text-2xl font-bold text-white"
        >
          Loop System
        </motion.h2>
        <p className="text-sm text-[#9ca3af] mt-1">Output routing, memory writeback, and the agent-output-memory loop</p>
      </div>

      {/* Routing Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6"
      >
        <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          Routing Chain Visualization
        </h3>
        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          {/* Agent → Output → Memory → Future Agent */}
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#252636] min-w-[80px]">
            <Zap className="w-6 h-6 text-emerald-400" />
            <span className="text-xs text-white font-medium">Agent</span>
            <span className="text-[10px] text-[#6b7280]">Produces</span>
          </div>
          <ArrowRight className="w-5 h-5 text-[#6b7280] hidden sm:block" />
          <div className="w-5 h-0.5 bg-[#3d3e4d] sm:hidden" />

          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#252636] min-w-[80px]">
            <RefreshCw className="w-6 h-6 text-amber-400" />
            <span className="text-xs text-white font-medium">Output</span>
            <span className="text-[10px] text-[#6b7280]">Routes</span>
          </div>
          <ArrowRight className="w-5 h-5 text-[#6b7280] hidden sm:block" />
          <div className="w-5 h-0.5 bg-[#3d3e4d] sm:hidden" />

          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#252636] min-w-[80px]">
            <Database className="w-6 h-6 text-purple-400" />
            <span className="text-xs text-white font-medium">Memory</span>
            <span className="text-[10px] text-[#6b7280]">Stores</span>
          </div>
          <ArrowRight className="w-5 h-5 text-[#6b7280] hidden sm:block" />
          <div className="w-5 h-0.5 bg-[#3d3e4d] sm:hidden" />

          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#252636] min-w-[80px]">
            <Brain className="w-6 h-6 text-cyan-400" />
            <span className="text-xs text-white font-medium">Future</span>
            <span className="text-[10px] text-[#6b7280]">Consumes</span>
          </div>
        </div>
      </motion.div>

      {/* Output Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3">
          <p className="text-xs text-[#9ca3af]">Total Outputs</p>
          <p className="text-xl font-bold text-white mt-1">{outputs.length}</p>
        </div>
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3">
          <p className="text-xs text-[#9ca3af]">In Memory</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{outputs.filter((o) => o.memoryId).length}</p>
        </div>
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3">
          <p className="text-xs text-[#9ca3af]">Active</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{outputs.filter((o) => !o.isArchived).length}</p>
        </div>
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3">
          <p className="text-xs text-[#9ca3af]">Archived</p>
          <p className="text-xl font-bold text-[#6b7280] mt-1">{outputs.filter((o) => o.isArchived).length}</p>
        </div>
      </div>

      {/* Output List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          Output Routing Status
        </h3>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 animate-pulse">
                <div className="h-4 w-48 bg-[#252636] rounded mb-2" />
                <div className="h-3 w-32 bg-[#252636] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
            {outputs.map((output) => {
              const color = typeColors[output.type] || '#6b7280'
              const routedTo: string[] = (() => {
                try { return JSON.parse(output.routedTo || '[]') } catch { return [] }
              })()

              return (
                <motion.div
                  key={output.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-xl border p-4 transition-colors ${
                    output.isArchived
                      ? 'border-[#2d2e3d] bg-[#1e1f2b]/50 opacity-60'
                      : 'border-[#2d2e3d] bg-[#1e1f2b] hover:border-[#3d3e4d]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {output.type}
                        </span>
                        {output.memoryId && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                            ✓ In Memory
                          </span>
                        )}
                        {output.isArchived && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#252636] text-[#6b7280]">
                            Archived
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1">{output.title}</h4>
                      <p className="text-xs text-[#9ca3af] line-clamp-2">{output.content}</p>

                      {/* Route chain */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] text-[#6b7280]">Agent</span>
                        <ArrowRight className="w-3 h-3 text-[#4b5563]" />
                        <span className="text-[10px] text-white">{output.agent?.name || 'Unknown'}</span>
                        <ArrowRight className="w-3 h-3 text-[#4b5563]" />
                        {routedTo.map((dest, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#252636] text-[#9ca3af]">{dest}</span>
                            {i < routedTo.length - 1 && <ArrowRight className="w-3 h-3 text-[#4b5563]" />}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      {!output.memoryId && !output.isArchived && (
                        <button
                          onClick={() => handleWriteToMemory(output.id)}
                          className="px-3 py-1.5 text-[10px] rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
                        >
                          <Database className="w-3 h-3" />
                          Write to Memory
                        </button>
                      )}
                      {!output.isArchived && (
                        <button
                          onClick={() => handleArchive(output.id)}
                          className="w-7 h-7 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-amber-400 transition-colors"
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
