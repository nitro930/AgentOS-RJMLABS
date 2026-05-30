'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  GitBranch,
  Clock,
  AlertTriangle,
  Cpu,
  Zap,
  ChevronRight,
  Eye,
  Plus,
  Trash2,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface Trace {
  id: string
  name: string
  description: string | null
  status: string
  agentId: string | null
  workflowId: string | null
  swarmId: string | null
  totalSpans: number
  errorSpans: number
  totalDuration: number
  tokenUsage: number
  costUsd: number
  rootSpanId: string | null
  metadata: string
  startedAt: string
  completedAt: string | null
  spans?: TraceSpan[]
}

interface TraceSpan {
  id: string
  traceId: string
  parentId: string | null
  name: string
  kind: string
  status: string
  agentId: string | null
  modelId: string | null
  input: string
  output: string | null
  error: string | null
  tokensIn: number
  tokensOut: number
  costUsd: number
  duration: number
  startedAt: string
  completedAt: string | null
}

interface ServiceNode {
  id: string
  name: string
  type: string
  status: string
  requestCount: number
  errorCount: number
  avgLatency: number
  p99Latency: number
  lastActiveAt: string | null
  metadata: string
}

interface ServiceEdgeItem {
  id: string
  sourceId: string
  targetId: string
  callCount: number
  errorCount: number
  avgLatency: number
  dataFlow: string
}

const statusColors: Record<string, string> = {
  running: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  timeout: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ok: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const serviceTypeIcons: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  agent: { icon: <Cpu className="w-4 h-4" />, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  model: { icon: <Zap className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  tool: { icon: <Activity className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  mcp_server: { icon: <GitBranch className="w-4 h-4" />, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  workflow: { icon: <ArrowRight className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  external: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/20' },
}

const serviceStatusColors: Record<string, string> = {
  healthy: 'border-emerald-500/40',
  degraded: 'border-yellow-500/40',
  down: 'border-red-500/40',
  unknown: 'border-gray-500/40',
}

const tabs = [
  { id: 'traces', label: 'Traces', icon: GitBranch },
  { id: 'service-graph', label: 'Service Graph', icon: Activity },
  { id: 'span-details', label: 'Span Details', icon: Eye },
]

export function Observability() {
  const { observabilityTab, setObservabilityTab } = useAgentOSStore()
  const [traces, setTraces] = useState<Trace[]>([])
  const [serviceNodes, setServiceNodes] = useState<ServiceNode[]>([])
  const [serviceEdges, setServiceEdges] = useState<ServiceEdgeItem[]>([])
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null)
  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [showCreateTrace, setShowCreateTrace] = useState(false)
  const [newTraceName, setNewTraceName] = useState('')
  const [newTraceDesc, setNewTraceDesc] = useState('')

  const fetchTraces = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/traces')
      if (res.ok) {
        const data = await res.json()
        setTraces(data.traces || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  const fetchServiceGraph = useCallback(async () => {
    try {
      const res = await fetch('/api/service-graph')
      if (res.ok) {
        const data = await res.json()
        setServiceNodes(data.nodes || [])
        setServiceEdges(data.edges || [])
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchTraces()
    fetchServiceGraph()
  }, [fetchTraces, fetchServiceGraph])

  const handleCreateTrace = async () => {
    if (!newTraceName.trim()) return
    try {
      const res = await fetch('/api/traces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTraceName, description: newTraceDesc || undefined }),
      })
      if (res.ok) {
        setNewTraceName('')
        setNewTraceDesc('')
        setShowCreateTrace(false)
        fetchTraces()
      }
    } catch {}
  }

  const handleDeleteTrace = async (id: string) => {
    try {
      await fetch(`/api/traces/${id}`, { method: 'DELETE' })
      if (selectedTraceId === id) setSelectedTraceId(null)
      fetchTraces()
    } catch {}
  }

  const handleCompleteTrace = async (id: string) => {
    try {
      await fetch(`/api/traces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', completedAt: new Date().toISOString() }),
      })
      fetchTraces()
    } catch {}
  }

  const toggleExpanded = (traceId: string) => {
    setExpandedTraces(prev => {
      const next = new Set(prev)
      if (next.has(traceId)) next.delete(traceId)
      else next.add(traceId)
      return next
    })
  }

  // Stats
  const totalTraces = traces.length
  const activeTraces = traces.filter(t => t.status === 'running').length
  const avgDuration = totalTraces > 0 ? Math.round(traces.reduce((s, t) => s + t.totalDuration, 0) / totalTraces) : 0
  const errorRate = totalTraces > 0 ? Math.round((traces.filter(t => t.status === 'error').length / totalTraces) * 100) : 0

  const selectedTrace = traces.find(t => t.id === selectedTraceId)

  // Build span tree for waterfall
  const buildSpanTree = (spans: TraceSpan[], parentId: string | null = null, depth = 0): (TraceSpan & { depth: number })[] => {
    const result: (TraceSpan & { depth: number })[] = []
    const children = spans.filter(s => s.parentId === parentId)
    for (const child of children) {
      result.push({ ...child, depth })
      result.push(...buildSpanTree(spans, child.id, depth + 1))
    }
    return result
  }

  const spanTree = selectedTrace?.spans ? buildSpanTree(selectedTrace.spans, null) : []
  const maxDuration = spanTree.length > 0 ? Math.max(...spanTree.map(s => s.duration || 1), 1) : 1

  // Service graph layout
  const nodePositions = new Map<string, { x: number; y: number }>()
  const cols = Math.ceil(Math.sqrt(serviceNodes.length || 1))
  serviceNodes.forEach((node, i) => {
    nodePositions.set(node.id, {
      x: (i % cols) * 220 + 40,
      y: Math.floor(i / cols) * 160 + 40,
    })
  })

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Traces', value: totalTraces, icon: GitBranch, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Active Traces', value: activeTraces, icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Avg Duration', value: `${avgDuration}ms`, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Error Rate', value: `${errorRate}%`, icon: AlertTriangle, color: errorRate > 10 ? 'text-red-400' : 'text-emerald-400', bg: errorRate > 10 ? 'bg-red-500/10' : 'bg-emerald-500/10' },
        ].map(stat => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[11px] text-[#6b7280] uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#1a1b2e] rounded-xl p-1 border border-[#2d2e3d]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setObservabilityTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              observabilityTab === tab.id
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-[#6b7280] hover:text-white hover:bg-[#252636]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={observabilityTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {/* Traces Tab */}
          {observabilityTab === 'traces' && (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Traces</h3>
                <button
                  onClick={() => setShowCreateTrace(!showCreateTrace)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Trace
                </button>
              </div>

              {/* Create Trace Form */}
              <AnimatePresence>
                {showCreateTrace && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4 space-y-3 overflow-hidden"
                  >
                    <input
                      value={newTraceName}
                      onChange={e => setNewTraceName(e.target.value)}
                      placeholder="Trace name..."
                      className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    />
                    <input
                      value={newTraceDesc}
                      onChange={e => setNewTraceDesc(e.target.value)}
                      placeholder="Description (optional)..."
                      className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateTrace}
                        className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => setShowCreateTrace(false)}
                        className="px-4 py-1.5 rounded-lg bg-[#252636] text-[#9ca3af] text-xs font-medium hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Traces List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
              ) : traces.length === 0 ? (
                <div className="text-center py-12 text-[#6b7280]">
                  <GitBranch className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No traces yet. Create one to start observability.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
                  {traces.map(trace => (
                    <div key={trace.id} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl overflow-hidden">
                      {/* Trace Header */}
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#252636] transition-colors"
                        onClick={() => {
                          toggleExpanded(trace.id)
                          setSelectedTraceId(selectedTraceId === trace.id ? null : trace.id)
                        }}
                      >
                        <ChevronRight className={`w-4 h-4 text-[#6b7280] transition-transform ${expandedTraces.has(trace.id) ? 'rotate-90' : ''}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">{trace.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusColors[trace.status] || statusColors.running}`}>
                              {trace.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-[#6b7280]">
                            <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{trace.totalSpans} spans</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{trace.totalDuration}ms</span>
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{trace.tokenUsage} tokens</span>
                            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />${trace.costUsd.toFixed(4)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {trace.status === 'running' && (
                            <button
                              onClick={e => { e.stopPropagation(); handleCompleteTrace(trace.id) }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Complete trace"
                            >
                              <Activity className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteTrace(trace.id) }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete trace"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Spans */}
                      <AnimatePresence>
                        {expandedTraces.has(trace.id) && trace.spans && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-[#2d2e3d] overflow-hidden"
                          >
                            <div className="p-3 space-y-1">
                              {trace.spans.length === 0 ? (
                                <p className="text-xs text-[#6b7280] text-center py-2">No spans</p>
                              ) : (
                                trace.spans.map(span => (
                                  <div key={span.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#252636]">
                                    <div className={`w-1.5 h-1.5 rounded-full ${span.status === 'ok' ? 'bg-emerald-400' : span.status === 'error' ? 'bg-red-400' : 'bg-gray-400'}`} />
                                    <span className="text-xs text-white flex-1 truncate">{span.name}</span>
                                    <span className="text-[10px] text-[#6b7280]">{span.kind}</span>
                                    <span className="text-[10px] text-[#6b7280]">{span.duration}ms</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusColors[span.status] || statusColors.ok}`}>
                                      {span.status}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Service Graph Tab */}
          {observabilityTab === 'service-graph' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Service Dependency Graph</h3>
                <div className="flex items-center gap-2 text-[10px] text-[#6b7280]">
                  {Object.entries(serviceTypeIcons).map(([type, cfg]) => (
                    <span key={type} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${cfg.bg}`} />
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {serviceNodes.length === 0 ? (
                <div className="text-center py-12 text-[#6b7280]">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No service nodes discovered yet.</p>
                  <p className="text-xs mt-1">Services will appear as agents and tools are used.</p>
                </div>
              ) : (
                <div className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl overflow-auto">
                  <div className="relative" style={{ minHeight: Math.max(serviceNodes.length * 80, 300) }}>
                    {/* SVG Edges */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                      {serviceEdges.map(edge => {
                        const sourcePos = nodePositions.get(edge.sourceId)
                        const targetPos = nodePositions.get(edge.targetId)
                        if (!sourcePos || !targetPos) return null
                        const sx = sourcePos.x + 80
                        const sy = sourcePos.y + 50
                        const tx = targetPos.x + 80
                        const ty = targetPos.y + 50
                        const midX = (sx + tx) / 2
                        const errorPct = edge.callCount > 0 ? Math.round((edge.errorCount / edge.callCount) * 100) : 0
                        const edgeColor = errorPct > 10 ? '#ef4444' : errorPct > 5 ? '#eab308' : '#10b981'
                        return (
                          <g key={edge.id}>
                            <path
                              d={`M ${sx} ${sy} Q ${midX} ${sy} ${tx} ${ty}`}
                              fill="none"
                              stroke={edgeColor}
                              strokeWidth={Math.min(Math.max(edge.callCount / 10, 1), 4)}
                              strokeOpacity={0.5}
                              strokeDasharray={errorPct > 10 ? '4 4' : 'none'}
                            />
                            <circle cx={tx} cy={ty} r={3} fill={edgeColor} />
                            <text
                              x={midX}
                              y={(sy + ty) / 2 - 6}
                              fill="#6b7280"
                              fontSize={9}
                              textAnchor="middle"
                            >
                              {edge.callCount} calls · {edge.avgLatency}ms
                            </text>
                          </g>
                        )
                      })}
                    </svg>

                    {/* Node Cards */}
                    <div className="relative" style={{ zIndex: 2 }}>
                      {serviceNodes.map(node => {
                        const pos = nodePositions.get(node.id)!
                        const typeConfig = serviceTypeIcons[node.type] || serviceTypeIcons.external
                        return (
                          <div
                            key={node.id}
                            className={`absolute w-[160px] bg-[#0f1117] border rounded-lg p-3 ${serviceStatusColors[node.status] || serviceStatusColors.unknown}`}
                            style={{ left: pos.x, top: pos.y }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-7 h-7 rounded-lg ${typeConfig.bg} flex items-center justify-center ${typeConfig.color}`}>
                                {typeConfig.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-white truncate">{node.name}</p>
                                <p className="text-[10px] text-[#6b7280]">{node.type}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                              <div className="text-[#6b7280]">Requests</div>
                              <div className="text-white text-right">{node.requestCount}</div>
                              <div className="text-[#6b7280]">Errors</div>
                              <div className={`text-right ${node.errorCount > 0 ? 'text-red-400' : 'text-white'}`}>{node.errorCount}</div>
                              <div className="text-[#6b7280]">Avg Latency</div>
                              <div className="text-white text-right">{node.avgLatency}ms</div>
                            </div>
                            <div className="mt-2 flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                node.status === 'healthy' ? 'bg-emerald-400' :
                                node.status === 'degraded' ? 'bg-yellow-400' :
                                node.status === 'down' ? 'bg-red-400' : 'bg-gray-400'
                              }`} />
                              <span className="text-[9px] text-[#6b7280]">{node.status}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Span Details / Waterfall Tab */}
          {observabilityTab === 'span-details' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Span Waterfall</h3>
                {selectedTrace && (
                  <span className="text-xs text-[#6b7280]">Trace: {selectedTrace.name}</span>
                )}
              </div>

              {!selectedTrace ? (
                <div className="text-center py-12 text-[#6b7280]">
                  <Eye className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a trace to view span waterfall.</p>
                  <p className="text-xs mt-1">Click on a trace in the Traces tab first.</p>
                </div>
              ) : spanTree.length === 0 ? (
                <div className="text-center py-12 text-[#6b7280]">
                  <GitBranch className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No spans in this trace.</p>
                </div>
              ) : (
                <div className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-4 px-4 py-2 border-b border-[#2d2e3d] text-[10px] text-[#6b7280] uppercase tracking-wider">
                    <span className="w-48">Name</span>
                    <span className="w-16">Kind</span>
                    <span className="w-16">Status</span>
                    <span className="w-20">Tokens</span>
                    <span className="flex-1">Duration Timeline</span>
                    <span className="w-16 text-right">Time</span>
                  </div>
                  {/* Rows */}
                  <div className="max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                    {spanTree.map(span => {
                      const barWidth = Math.max((span.duration / maxDuration) * 100, 2)
                      const barColor = span.status === 'ok' ? 'bg-emerald-500/60' : span.status === 'error' ? 'bg-red-500/60' : 'bg-gray-500/60'
                      return (
                        <div key={span.id} className="flex items-center gap-4 px-4 py-2 hover:bg-[#252636] border-b border-[#2d2e3d]/50">
                          <span
                            className="w-48 text-xs text-white truncate"
                            style={{ paddingLeft: `${span.depth * 16}px` }}
                          >
                            {span.depth > 0 && <span className="text-[#6b7280] mr-1">└</span>}
                            {span.name}
                          </span>
                          <span className="w-16 text-[10px] text-[#6b7280]">{span.kind}</span>
                          <span className="w-16">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusColors[span.status] || statusColors.ok}`}>
                              {span.status}
                            </span>
                          </span>
                          <span className="w-20 text-[10px] text-[#6b7280]">
                            {span.tokensIn + span.tokensOut > 0 ? `${span.tokensIn}/${span.tokensOut}` : '-'}
                          </span>
                          <div className="flex-1 h-4 bg-[#0f1117] rounded overflow-hidden">
                            <div
                              className={`h-full rounded ${barColor}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="w-16 text-[10px] text-[#6b7280] text-right">{span.duration}ms</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quick Select Trace */}
              {!selectedTrace && traces.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-[#6b7280]">Quick select a trace:</p>
                  <div className="flex flex-wrap gap-2">
                    {traces.slice(0, 10).map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTraceId(t.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#1a1b2e] border border-[#2d2e3d] text-xs text-white hover:border-emerald-500/50 transition-colors"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
