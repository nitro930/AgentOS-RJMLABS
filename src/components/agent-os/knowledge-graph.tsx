'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Circle,
  Square,
  Diamond,
  Hexagon,
  BarChart3,
} from 'lucide-react'

interface GraphNode {
  id: string
  label: string
  type: 'agent' | 'memory' | 'output' | 'goal'
  details?: Record<string, string>
}

interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

const nodeTypeConfig: Record<string, { color: string; bgColor: string; shape: string; label: string; Icon: typeof Circle }> = {
  agent: { color: '#10b981', bgColor: 'rgba(16,185,129,0.15)', shape: 'circle', label: 'Agent', Icon: Circle },
  memory: { color: '#3b82f6', bgColor: 'rgba(59,130,246,0.15)', shape: 'square', label: 'Memory', Icon: Square },
  output: { color: '#f59e0b', bgColor: 'rgba(245,158,11,0.15)', shape: 'diamond', label: 'Output', Icon: Diamond },
  goal: { color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.15)', shape: 'hexagon', label: 'Goal', Icon: Hexagon },
}

function positionNodes(nodes: GraphNode[], width: number, height: number) {
  const typeGroups: Record<string, GraphNode[]> = {}
  nodes.forEach((n) => {
    if (!typeGroups[n.type]) typeGroups[n.type] = []
    typeGroups[n.type].push(n)
  })

  const types = Object.keys(typeGroups)
  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.min(width, height) * 0.38

  const positions: Record<string, { x: number; y: number }> = {}

  types.forEach((type, typeIndex) => {
    const group = typeGroups[type]
    const angleOffset = (typeIndex / types.length) * Math.PI * 2
    const groupRadius = maxRadius * 0.6

    group.forEach((node, nodeIndex) => {
      const angleWithinGroup = (nodeIndex / group.length) * Math.PI * 2
      const spread = group.length > 1 ? 60 : 0

      positions[node.id] = {
        x: centerX + Math.cos(angleOffset) * groupRadius + Math.cos(angleWithinGroup) * spread,
        y: centerY + Math.sin(angleOffset) * groupRadius + Math.sin(angleWithinGroup) * spread,
      }
    })
  })

  return positions
}

function renderNodeShape(type: string, x: number, y: number, size: number, color: string, bgColor: string) {
  switch (type) {
    case 'circle':
      return (
        <g>
          <circle cx={x} cy={y} r={size} fill={bgColor} stroke={color} strokeWidth={2} />
        </g>
      )
    case 'square':
      return (
        <g>
          <rect x={x - size} y={y - size} width={size * 2} height={size * 2} fill={bgColor} stroke={color} strokeWidth={2} rx={4} />
        </g>
      )
    case 'diamond':
      return (
        <g>
          <polygon
            points={`${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`}
            fill={bgColor}
            stroke={color}
            strokeWidth={2}
          />
        </g>
      )
    case 'hexagon': {
      const points = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        return `${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`
      }).join(' ')
      return (
        <g>
          <polygon points={points} fill={bgColor} stroke={color} strokeWidth={2} />
        </g>
      )
    }
    default:
      return <circle cx={x} cy={y} r={size} fill={bgColor} stroke={color} strokeWidth={2} />
  }
}

export function KnowledgeGraph() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const svgWidth = 800
  const svgHeight = 500

  const fetchGraphData = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge-graph')
      const data = await res.json()
      setGraphData(data)
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGraphData()
    const interval = setInterval(fetchGraphData, 30000)
    return () => clearInterval(interval)
  }, [fetchGraphData])

  const nodePositions = useMemo(
    () => positionNodes(graphData.nodes, svgWidth, svgHeight),
    [graphData.nodes]
  )

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.3))
  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true)
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
  }

  const handleMouseUp = () => setIsPanning(false)

  const nodeTypeBreakdown = graphData.nodes.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1
    return acc
  }, {})

  const stats = {
    totalNodes: graphData.nodes.length,
    totalEdges: graphData.edges.length,
    typeBreakdown: nodeTypeBreakdown,
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg sm:text-2xl font-bold text-white"
        >
          Knowledge Graph
        </motion.h2>
        <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
          Visualize relationships between agents, memories, and outputs
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Nodes', value: stats.totalNodes, icon: Network, color: '#10b981' },
          { label: 'Total Edges', value: stats.totalEdges, icon: BarChart3, color: '#3b82f6' },
          ...Object.entries(nodeTypeConfig).map(([key, cfg]) => ({
            label: cfg.label + 's',
            value: nodeTypeBreakdown[key] || 0,
            icon: cfg.Icon,
            color: cfg.color,
          })),
        ]
          .slice(0, 4)
          .map((stat) => (
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

      {/* Graph + Legend */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Graph Area */}
        <div className="flex-1 rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] overflow-hidden relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-[400px] sm:h-[500px]">
              <div className="animate-pulse text-[#6b7280]">Loading graph...</div>
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="flex items-center justify-center h-[400px] sm:h-[500px]">
              <div className="text-center">
                <Network className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
                <p className="text-sm text-[#9ca3af]">No graph data available</p>
                <p className="text-xs text-[#6b7280] mt-1">Add agents and memories to see the graph</p>
              </div>
            </div>
          ) : (
            <>
              <svg
                width="100%"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-[400px] sm:h-[500px]"
                style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <defs>
                  {Object.entries(nodeTypeConfig).map(([key, cfg]) => (
                    <radialGradient key={key} id={`gradient-${key}`}>
                      <stop offset="0%" stopColor={cfg.color} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={cfg.color} stopOpacity="0.05" />
                    </radialGradient>
                  ))}
                </defs>

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Edges */}
                  {graphData.edges.map((edge) => {
                    const source = nodePositions[edge.source]
                    const target = nodePositions[edge.target]
                    if (!source || !target) return null
                    const midX = (source.x + target.x) / 2
                    const midY = (source.y + target.y) / 2 - 20
                    return (
                      <g key={edge.id}>
                        <path
                          d={`M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`}
                          fill="none"
                          stroke="#4b5563"
                          strokeWidth={1.5}
                          strokeOpacity={0.5}
                        />
                        {edge.label && (
                          <text
                            x={midX}
                            y={midY - 5}
                            textAnchor="middle"
                            fill="#6b7280"
                            fontSize={9}
                          >
                            {edge.label}
                          </text>
                        )}
                      </g>
                    )
                  })}

                  {/* Nodes */}
                  {graphData.nodes.map((node) => {
                    const pos = nodePositions[node.id]
                    if (!pos) return null
                    const cfg = nodeTypeConfig[node.type] || nodeTypeConfig.agent
                    const isSelected = selectedNode?.id === node.id
                    const size = isSelected ? 24 : 18
                    return (
                      <g
                        key={node.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedNode(isSelected ? null : node)
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {renderNodeShape(cfg.shape, pos.x, pos.y, size, cfg.color, cfg.bgColor)}
                        {isSelected && (
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={size + 6}
                            fill="none"
                            stroke={cfg.color}
                            strokeWidth={1.5}
                            strokeDasharray="4 2"
                            opacity={0.6}
                          />
                        )}
                        <text
                          x={pos.x}
                          y={pos.y + size + 14}
                          textAnchor="middle"
                          fill="#d1d5db"
                          fontSize={10}
                          fontWeight={500}
                        >
                          {node.label}
                        </text>
                      </g>
                    )
                  })}
                </g>
              </svg>

              {/* Zoom Controls */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1">
                <button
                  onClick={handleZoomIn}
                  className="w-8 h-8 rounded-lg bg-[#252636] border border-[#2d2e3d] flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#2d2e3d] transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="w-8 h-8 rounded-lg bg-[#252636] border border-[#2d2e3d] flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#2d2e3d] transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetView}
                  className="w-8 h-8 rounded-lg bg-[#252636] border border-[#2d2e3d] flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#2d2e3d] transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Side: Legend + Details */}
        <div className="w-full lg:w-64 space-y-3">
          {/* Legend */}
          <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4">
            <p className="text-xs text-[#9ca3af] uppercase tracking-wider mb-3">Legend</p>
            <div className="space-y-2">
              {Object.entries(nodeTypeConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    {renderNodeShape(cfg.shape, 10, 10, 7, cfg.color, cfg.bgColor)}
                  </svg>
                  <span className="text-xs text-[#9ca3af]">{cfg.label}</span>
                  <span className="text-[10px] text-[#6b7280] ml-auto">
                    {nodeTypeBreakdown[key] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Node Details */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-[#9ca3af] uppercase tracking-wider">Node Details</p>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="w-6 h-6 rounded flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-[#6b7280]">Name</p>
                    <p className="text-sm text-white font-medium">{selectedNode.label}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6b7280]">Type</p>
                    <span
                      className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border"
                      style={{
                        color: nodeTypeConfig[selectedNode.type]?.color,
                        backgroundColor: nodeTypeConfig[selectedNode.type]?.bgColor,
                        borderColor: `${nodeTypeConfig[selectedNode.type]?.color}40`,
                      }}
                    >
                      {nodeTypeConfig[selectedNode.type]?.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6b7280]">ID</p>
                    <p className="text-[11px] text-[#9ca3af] font-mono">{selectedNode.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6b7280] mb-1">Connections</p>
                    <p className="text-sm text-white">
                      {graphData.edges.filter(
                        (e) => e.source === selectedNode.id || e.target === selectedNode.id
                      ).length}
                    </p>
                  </div>
                  {selectedNode.details && Object.entries(selectedNode.details).map(([key, val]) => (
                    <div key={key}>
                      <p className="text-[10px] text-[#6b7280]">{key}</p>
                      <p className="text-[11px] text-[#9ca3af]">{val}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
