'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ArrowRight,
  Activity,
  GitBranch,
  Eye,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Filter,
  Info,
  Users,
  Link2,
  Trophy,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────────────────

type DependencyType = 'data-flow' | 'task-delegation' | 'monitoring' | 'approval' | 'communication'
type AgentStatus = 'idle' | 'running' | 'error'

interface DepAgent {
  id: string
  name: string
  avatar: string
  status: AgentStatus
  taskCount: number
  type: string
  description: string
  uptime: string
  lastActive: string
  tasksCompleted: number
  tasksFailed: number
}

interface Dependency {
  id: string
  source: string
  target: string
  type: DependencyType
  strength: number // 1-5
  label: string
}

interface Activity {
  id: string
  agentId: string
  action: string
  timestamp: string
  detail: string
}

// ─── Dependency Type Config ──────────────────────────────────────────────────

const depTypeConfig: Record<DependencyType, {
  color: string
  gradient: string
  label: string
  Icon: typeof ArrowRight
  description: string
}> = {
  'data-flow': {
    color: '#3b82f6',
    gradient: 'from-blue-500/20 to-blue-600/5',
    label: 'Data Flow',
    Icon: GitBranch,
    description: 'Agent sends data to another',
  },
  'task-delegation': {
    color: '#f59e0b',
    gradient: 'from-amber-500/20 to-amber-600/5',
    label: 'Task Delegation',
    Icon: ArrowRight,
    description: 'One agent delegates tasks',
  },
  'monitoring': {
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    label: 'Monitoring',
    Icon: Eye,
    description: 'Agent monitors another',
  },
  'approval': {
    color: '#ef4444',
    gradient: 'from-red-500/20 to-red-600/5',
    label: 'Approval',
    Icon: ShieldCheck,
    description: 'Requires approval from another',
  },
  'communication': {
    color: '#06b6d4',
    gradient: 'from-cyan-500/20 to-cyan-600/5',
    label: 'Communication',
    Icon: MessageSquare,
    description: 'Agents communicate',
  },
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

const demoAgents: DepAgent[] = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    avatar: '🧠',
    status: 'running',
    taskCount: 12,
    type: 'Core',
    description: 'Central coordination agent that manages task routing and agent lifecycle across the system.',
    uptime: '99.8%',
    lastActive: '2s ago',
    tasksCompleted: 1847,
    tasksFailed: 23,
  },
  {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    avatar: '🔄',
    status: 'running',
    taskCount: 8,
    type: 'Processing',
    description: 'Handles ETL operations, data transformation, and pipeline orchestration between services.',
    uptime: '98.5%',
    lastActive: '5s ago',
    tasksCompleted: 962,
    tasksFailed: 41,
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    avatar: '🔍',
    status: 'running',
    taskCount: 5,
    type: 'Analysis',
    description: 'Automated code review with linting, security scanning, and best practice enforcement.',
    uptime: '97.2%',
    lastActive: '12s ago',
    tasksCompleted: 534,
    tasksFailed: 8,
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner',
    avatar: '🛡️',
    status: 'idle',
    taskCount: 2,
    type: 'Security',
    description: 'Continuous vulnerability scanning, dependency auditing, and threat assessment engine.',
    uptime: '99.9%',
    lastActive: '1m ago',
    tasksCompleted: 312,
    tasksFailed: 3,
  },
  {
    id: 'memory-manager',
    name: 'Memory Manager',
    avatar: '💾',
    status: 'running',
    taskCount: 6,
    type: 'Storage',
    description: 'Manages agent memory persistence, retrieval, and context window optimization.',
    uptime: '99.5%',
    lastActive: '8s ago',
    tasksCompleted: 2103,
    tasksFailed: 15,
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    avatar: '🌐',
    status: 'running',
    taskCount: 15,
    type: 'Infrastructure',
    description: 'Routes external API requests, handles rate limiting, authentication, and load balancing.',
    uptime: '99.99%',
    lastActive: '1s ago',
    tasksCompleted: 15230,
    tasksFailed: 89,
  },
  {
    id: 'notification-hub',
    name: 'Notification Hub',
    avatar: '🔔',
    status: 'idle',
    taskCount: 3,
    type: 'Communication',
    description: 'Central notification dispatch for alerts, webhooks, and multi-channel messaging.',
    uptime: '98.8%',
    lastActive: '30s ago',
    tasksCompleted: 4521,
    tasksFailed: 67,
  },
  {
    id: 'model-router',
    name: 'Model Router',
    avatar: '🧭',
    status: 'error',
    taskCount: 0,
    type: 'AI',
    description: 'Intelligent model selection and routing based on task requirements and cost optimization.',
    uptime: '94.2%',
    lastActive: '5m ago',
    tasksCompleted: 3890,
    tasksFailed: 201,
  },
  {
    id: 'audit-logger',
    name: 'Audit Logger',
    avatar: '📋',
    status: 'running',
    taskCount: 4,
    type: 'Compliance',
    description: 'Comprehensive audit trail logging, compliance reporting, and event archival system.',
    uptime: '99.95%',
    lastActive: '3s ago',
    tasksCompleted: 8921,
    tasksFailed: 2,
  },
  {
    id: 'deploy-agent',
    name: 'Deploy Agent',
    avatar: '🚀',
    status: 'idle',
    taskCount: 1,
    type: 'DevOps',
    description: 'Manages deployment pipelines, rollback procedures, and infrastructure provisioning.',
    uptime: '99.1%',
    lastActive: '2m ago',
    tasksCompleted: 856,
    tasksFailed: 34,
  },
]

const demoDependencies: Dependency[] = [
  { id: 'd1', source: 'orchestrator', target: 'data-pipeline', type: 'task-delegation', strength: 5, label: 'Pipeline Jobs' },
  { id: 'd2', source: 'orchestrator', target: 'code-reviewer', type: 'task-delegation', strength: 4, label: 'Review Tasks' },
  { id: 'd3', source: 'orchestrator', target: 'model-router', type: 'data-flow', strength: 5, label: 'Model Requests' },
  { id: 'd4', source: 'orchestrator', target: 'notification-hub', type: 'communication', strength: 3, label: 'Alert Dispatch' },
  { id: 'd5', source: 'data-pipeline', target: 'memory-manager', type: 'data-flow', strength: 4, label: 'State Sync' },
  { id: 'd6', source: 'code-reviewer', target: 'security-scanner', type: 'task-delegation', strength: 3, label: 'Security Scan' },
  { id: 'd7', source: 'security-scanner', target: 'audit-logger', type: 'data-flow', strength: 2, label: 'Scan Results' },
  { id: 'd8', source: 'api-gateway', target: 'orchestrator', type: 'data-flow', strength: 5, label: 'Incoming Requests' },
  { id: 'd9', source: 'api-gateway', target: 'model-router', type: 'data-flow', strength: 4, label: 'AI Requests' },
  { id: 'd10', source: 'model-router', target: 'memory-manager', type: 'data-flow', strength: 3, label: 'Context Load' },
  { id: 'd11', source: 'orchestrator', target: 'security-scanner', type: 'monitoring', strength: 2, label: 'Health Checks' },
  { id: 'd12', source: 'deploy-agent', target: 'orchestrator', type: 'approval', strength: 4, label: 'Deploy Approval' },
  { id: 'd13', source: 'deploy-agent', target: 'security-scanner', type: 'approval', strength: 3, label: 'Security Gate' },
  { id: 'd14', source: 'audit-logger', target: 'notification-hub', type: 'communication', strength: 2, label: 'Audit Alerts' },
  { id: 'd15', source: 'orchestrator', target: 'audit-logger', type: 'monitoring', strength: 3, label: 'Activity Tracking' },
]

const demoActivities: Activity[] = [
  { id: 'a1', agentId: 'orchestrator', action: 'Routed task', timestamp: '2s ago', detail: 'Delegated analysis to Code Reviewer' },
  { id: 'a2', agentId: 'data-pipeline', action: 'Completed ETL', timestamp: '5s ago', detail: 'Processed 2.4k records from source' },
  { id: 'a3', agentId: 'api-gateway', action: 'Rate limit hit', timestamp: '8s ago', detail: 'Client X exceeded 1000 req/min' },
  { id: 'a4', agentId: 'model-router', action: 'Fallback triggered', timestamp: '1m ago', detail: 'Primary model unavailable, routed to backup' },
  { id: 'a5', agentId: 'security-scanner', action: 'Scan completed', timestamp: '1m ago', detail: 'No critical vulnerabilities found' },
  { id: 'a6', agentId: 'memory-manager', action: 'Context pruned', timestamp: '15s ago', detail: 'Freed 12MB from expired contexts' },
  { id: 'a7', agentId: 'code-reviewer', action: 'Review submitted', timestamp: '12s ago', detail: 'Approved PR #847 with 2 suggestions' },
  { id: 'a8', agentId: 'audit-logger', action: 'Log archived', timestamp: '30s ago', detail: 'Compressed 50k events to cold storage' },
  { id: 'a9', agentId: 'deploy-agent', action: 'Approval pending', timestamp: '2m ago', detail: 'Waiting for orchestrator sign-off' },
  { id: 'a10', agentId: 'notification-hub', action: 'Webhook fired', timestamp: '30s ago', detail: 'Sent deployment notification to Slack' },
]

// ─── Node Position Calculator ────────────────────────────────────────────────

function computeNodePositions(agents: DepAgent[], width: number, height: number): Record<string, { x: number; y: number }> {
  const centerX = width / 2
  const centerY = height / 2
  const positions: Record<string, { x: number; y: number }> = {}

  // Find orchestrator or first agent as the center node
  const centerAgent = agents.find(a => a.id === 'orchestrator') || agents[0]
  const otherAgents = agents.filter(a => a.id !== centerAgent.id)

  // Place center node
  positions[centerAgent.id] = { x: centerX, y: centerY }

  // Place remaining nodes in concentric rings
  const ring1Count = Math.min(4, otherAgents.length)
  const ring1Agents = otherAgents.slice(0, ring1Count)
  const ring2Agents = otherAgents.slice(ring1Count)

  const ring1Radius = Math.min(width, height) * 0.25
  const ring2Radius = Math.min(width, height) * 0.42

  ring1Agents.forEach((agent, i) => {
    const angle = (i / ring1Count) * Math.PI * 2 - Math.PI / 2
    positions[agent.id] = {
      x: centerX + Math.cos(angle) * ring1Radius,
      y: centerY + Math.sin(angle) * ring1Radius,
    }
  })

  ring2Agents.forEach((agent, i) => {
    const angle = (i / ring2Agents.length) * Math.PI * 2 - Math.PI / 4
    positions[agent.id] = {
      x: centerX + Math.cos(angle) * ring2Radius,
      y: centerY + Math.sin(angle) * ring2Radius,
    }
  })

  return positions
}

// ─── Status Helpers ──────────────────────────────────────────────────────────

const statusConfig: Record<AgentStatus, { color: string; bgColor: string; label: string; Icon: typeof CheckCircle2 }> = {
  running: { color: '#10b981', bgColor: 'rgba(16,185,129,0.15)', label: 'Running', Icon: Loader2 },
  idle: { color: '#6b7280', bgColor: 'rgba(107,114,128,0.15)', label: 'Idle', Icon: Clock },
  error: { color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)', label: 'Error', Icon: AlertCircle },
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AgentDependencyGraph() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<Set<DependencyType>>(new Set())
  const [zoom, setZoom] = useState(1)
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)

  const graphWidth = 900
  const graphHeight = 620

  const nodePositions = useMemo(
    () => computeNodePositions(demoAgents, graphWidth, graphHeight),
    []
  )

  const selectedAgent = useMemo(
    () => demoAgents.find(a => a.id === selectedAgentId) || null,
    [selectedAgentId]
  )

  const filteredDependencies = useMemo(() => {
    if (activeFilters.size === 0) return demoDependencies
    return demoDependencies.filter(d => activeFilters.has(d.type))
  }, [activeFilters])

  const toggleFilter = useCallback((type: DependencyType) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.15, 2.0))
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.15, 0.5))
  const handleResetView = () => setZoom(1)

  // Stats
  const connectionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    demoAgents.forEach(a => { counts[a.id] = 0 })
    demoDependencies.forEach(d => {
      counts[d.source] = (counts[d.source] || 0) + 1
      counts[d.target] = (counts[d.target] || 0) + 1
    })
    return counts
  }, [])

  const mostConnectedAgent = useMemo(() => {
    let maxId = demoAgents[0].id
    let maxCount = 0
    Object.entries(connectionCounts).forEach(([id, count]) => {
      if (count > maxCount) {
        maxCount = count
        maxId = id
      }
    })
    return demoAgents.find(a => a.id === maxId)!
  }, [connectionCounts])

  // Selected agent dependencies
  const incomingDeps = useMemo(
    () => filteredDependencies.filter(d => d.target === selectedAgentId),
    [filteredDependencies, selectedAgentId]
  )
  const outgoingDeps = useMemo(
    () => filteredDependencies.filter(d => d.source === selectedAgentId),
    [filteredDependencies, selectedAgentId]
  )
  const agentActivities = useMemo(
    () => demoActivities.filter(a => a.agentId === selectedAgentId),
    [selectedAgentId]
  )

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
            Agent Dependency Graph
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Visualize how agents are connected and depend on each other
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Agents', value: demoAgents.length, icon: Users, color: '#10b981' },
          { label: 'Connections', value: demoDependencies.length, icon: Link2, color: '#3b82f6' },
          { label: 'Running', value: demoAgents.filter(a => a.status === 'running').length, icon: Activity, color: '#f59e0b' },
          {
            label: 'Most Connected',
            value: mostConnectedAgent.name,
            icon: Trophy,
            color: '#8b5cf6',
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-4 hover:border-[#3d3e4d] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-[#9ca3af]">{stat.label}</p>
                <p className="text-base sm:text-lg font-bold text-white truncate">{stat.value}</p>
              </div>
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Layout: Graph + Detail Panel */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Graph Visualization */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] overflow-hidden relative">
            {/* Subtle grid background */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />

            {/* SVG Graph */}
            <div className="relative" style={{ height: graphHeight * zoom, minHeight: 400 }}>
              <svg
                width="100%"
                viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                className="w-full"
                style={{ minHeight: 400, height: '100%' }}
              >
                <defs>
                  {/* Arrow markers for each dependency type */}
                  {Object.entries(depTypeConfig).map(([type, cfg]) => (
                    <marker
                      key={type}
                      id={`arrow-${type}`}
                      viewBox="0 0 10 7"
                      refX="10"
                      refY="3.5"
                      markerWidth="8"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill={cfg.color}
                        fillOpacity={0.8}
                      />
                    </marker>
                  ))}

                  {/* Glow filter for running nodes */}
                  <filter id="glow-running" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feFlood floodColor="#10b981" floodOpacity="0.3" />
                    <feComposite in2="blur" operator="in" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Glow filter for error nodes */}
                  <filter id="glow-error" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feFlood floodColor="#ef4444" floodOpacity="0.3" />
                    <feComposite in2="blur" operator="in" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Connection Lines */}
                {filteredDependencies.map((dep) => {
                  const sourcePos = nodePositions[dep.source]
                  const targetPos = nodePositions[dep.target]
                  if (!sourcePos || !targetPos) return null

                  const cfg = depTypeConfig[dep.type]
                  // Calculate control point for curved line
                  const midX = (sourcePos.x + targetPos.x) / 2
                  const midY = (sourcePos.y + targetPos.y) / 2
                  // Offset control point perpendicular to the line
                  const dx = targetPos.x - sourcePos.x
                  const dy = targetPos.y - sourcePos.y
                  const dist = Math.sqrt(dx * dx + dy * dy)
                  const curveOffset = Math.min(dist * 0.15, 30)
                  const cx = midX + (-dy / dist) * curveOffset
                  const cy = midY + (dx / dist) * curveOffset

                  // Shorten the line so it doesn't overlap the node cards
                  const nodeRadius = 48
                  const angleSrc = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x)
                  const angleTgt = Math.atan2(sourcePos.y - targetPos.y, sourcePos.x - targetPos.x)
                  const startX = sourcePos.x + Math.cos(angleSrc) * nodeRadius
                  const startY = sourcePos.y + Math.sin(angleSrc) * nodeRadius
                  const endX = targetPos.x + Math.cos(angleTgt) * nodeRadius
                  const endY = targetPos.y + Math.sin(angleTgt) * nodeRadius

                  const strokeWidth = 1 + dep.strength * 0.6
                  const isSelected = selectedAgentId === dep.source || selectedAgentId === dep.target
                  const opacity = selectedAgentId ? (isSelected ? 0.9 : 0.15) : 0.55

                  return (
                    <g key={dep.id}>
                      <motion.path
                        d={`M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`}
                        fill="none"
                        stroke={cfg.color}
                        strokeWidth={strokeWidth}
                        strokeOpacity={opacity}
                        markerEnd={`url(#arrow-${dep.type})`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: 'easeInOut' }}
                      />
                      {/* Label on hover area */}
                      <path
                        d={`M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={12}
                        style={{ cursor: 'pointer' }}
                      >
                        <title>{`${cfg.label}: ${dep.label} (strength: ${dep.strength}/5)`}</title>
                      </path>
                    </g>
                  )
                })}

                {/* Agent Nodes */}
                {demoAgents.map((agent) => {
                  const pos = nodePositions[agent.id]
                  if (!pos) return null

                  const statusCfg = statusConfig[agent.status]
                  const isSelected = selectedAgentId === agent.id
                  const isConnected = selectedAgentId
                    ? filteredDependencies.some(
                        d => (d.source === selectedAgentId && d.target === agent.id) ||
                             (d.target === selectedAgentId && d.source === agent.id)
                      ) || agent.id === selectedAgentId
                    : true
                  const nodeOpacity = selectedAgentId ? (isConnected ? 1 : 0.3) : 1
                  const filterId = agent.status === 'running' ? 'url(#glow-running)' : agent.status === 'error' ? 'url(#glow-error)' : undefined

                  return (
                    <g
                      key={agent.id}
                      style={{ cursor: 'pointer', opacity: nodeOpacity }}
                      onClick={() => setSelectedAgentId(isSelected ? null : agent.id)}
                      filter={filterId}
                    >
                      <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: demoAgents.indexOf(agent) * 0.05 }}
                      >
                        {/* Node background card */}
                        <rect
                          x={pos.x - 42}
                          y={pos.y - 28}
                          width={84}
                          height={56}
                          rx={12}
                          fill="#1e1f2b"
                          stroke={isSelected ? statusCfg.color : '#2d2e3d'}
                          strokeWidth={isSelected ? 2 : 1}
                        />
                        {/* Selected ring */}
                        {isSelected && (
                          <rect
                            x={pos.x - 46}
                            y={pos.y - 32}
                            width={92}
                            height={64}
                            rx={14}
                            fill="none"
                            stroke={statusCfg.color}
                            strokeWidth={1}
                            strokeDasharray="4 3"
                            opacity={0.5}
                          />
                        )}
                        {/* Avatar */}
                        <text
                          x={pos.x}
                          y={pos.y - 6}
                          textAnchor="middle"
                          fontSize={20}
                          dominantBaseline="middle"
                        >
                          {agent.avatar}
                        </text>
                        {/* Name */}
                        <text
                          x={pos.x}
                          y={pos.y + 16}
                          textAnchor="middle"
                          fill="#d1d5db"
                          fontSize={9}
                          fontWeight={600}
                        >
                          {agent.name.length > 12 ? agent.name.slice(0, 11) + '…' : agent.name}
                        </text>
                        {/* Status dot */}
                        <circle
                          cx={pos.x + 34}
                          cy={pos.y - 18}
                          r={4}
                          fill={statusCfg.color}
                        />
                        {/* Task count badge */}
                        {agent.taskCount > 0 && (
                          <>
                            <circle
                              cx={pos.x + 34}
                              cy={pos.y + 2}
                              r={7}
                              fill="#ef4444"
                            />
                            <text
                              x={pos.x + 34}
                              y={pos.y + 5}
                              textAnchor="middle"
                              fill="white"
                              fontSize={8}
                              fontWeight={700}
                            >
                              {agent.taskCount > 9 ? '9+' : agent.taskCount}
                            </text>
                          </>
                        )}
                      </motion.g>
                    </g>
                  )
                })}
              </svg>
            </div>

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

            {/* Filter Controls */}
            <div className="absolute top-3 right-3">
              <div className="relative">
                <button
                  onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    activeFilters.size > 0
                      ? 'bg-[#252636] border-[#3d3e4d] text-white'
                      : 'bg-[#252636] border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d]'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filter
                  {activeFilters.size > 0 && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-bold text-white flex items-center justify-center">
                      {activeFilters.size}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {filterMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] shadow-xl z-20 overflow-hidden"
                    >
                      <div className="p-3 border-b border-[#2d2e3d]">
                        <p className="text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">
                          Dependency Types
                        </p>
                      </div>
                      <div className="p-2 space-y-0.5">
                        {(Object.entries(depTypeConfig) as [DependencyType, typeof depTypeConfig[DependencyType]][]).map(([type, cfg]) => {
                          const isActive = activeFilters.has(type)
                          return (
                            <button
                              key={type}
                              onClick={() => toggleFilter(type)}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                                isActive
                                  ? 'bg-[#252636] text-white'
                                  : 'text-[#9ca3af] hover:bg-[#252636] hover:text-white'
                              }`}
                            >
                              <div
                                className="w-3 h-3 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: cfg.color, opacity: isActive ? 1 : 0.4 }}
                              />
                              <cfg.Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isActive ? cfg.color : '#6b7280' }} />
                              <span className="flex-1 text-left">{cfg.label}</span>
                              {isActive && (
                                <span className="text-[9px] text-emerald-400 font-medium">ON</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                      {activeFilters.size > 0 && (
                        <div className="p-2 border-t border-[#2d2e3d]">
                          <button
                            onClick={() => setActiveFilters(new Set())}
                            className="w-full text-[10px] text-[#6b7280] hover:text-white py-1.5 rounded-lg hover:bg-[#252636] transition-colors"
                          >
                            Clear all filters
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4">
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-3 font-medium">Connection Types</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {Object.entries(depTypeConfig).map(([type, cfg]) => (
                <div key={type} className="flex items-center gap-2">
                  <svg width="28" height="12" viewBox="0 0 28 12">
                    <line x1="0" y1="6" x2="20" y2="6" stroke={cfg.color} strokeWidth={2} />
                    <polygon points="20,3 28,6 20,9" fill={cfg.color} />
                  </svg>
                  <span className="text-[11px] text-[#9ca3af]">{cfg.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#2d2e3d]">
                <svg width="28" height="12" viewBox="0 0 28 12">
                  <line x1="0" y1="6" x2="20" y2="6" stroke="#6b7280" strokeWidth={1} />
                  <line x1="0" y1="6" x2="20" y2="6" stroke="#9ca3af" strokeWidth={4} opacity={0.5} />
                  <polygon points="20,3 28,6 20,9" fill="#6b7280" />
                </svg>
                <span className="text-[11px] text-[#9ca3af]">Thicker = stronger</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Selected Agent Detail Panel */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <AnimatePresence mode="wait">
            {selectedAgent ? (
              <motion.div
                key={selectedAgent.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] overflow-hidden"
              >
                {/* Agent Header */}
                <div className="p-4 border-b border-[#2d2e3d]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${statusConfig[selectedAgent.status].color}15` }}
                      >
                        {selectedAgent.avatar}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{selectedAgent.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: statusConfig[selectedAgent.status].color }}
                          />
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: statusConfig[selectedAgent.status].color }}
                          >
                            {statusConfig[selectedAgent.status].label}
                          </span>
                          <span className="text-[10px] text-[#6b7280]">•</span>
                          <span className="text-[10px] text-[#6b7280]">{selectedAgent.type}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAgentId(null)}
                      className="w-7 h-7 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#9ca3af] mt-3 leading-relaxed">
                    {selectedAgent.description}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-px bg-[#2d2e3d]">
                  {[
                    { label: 'Uptime', value: selectedAgent.uptime },
                    { label: 'Completed', value: selectedAgent.tasksCompleted.toLocaleString() },
                    {
                      label: 'Success',
                      value: `${
                        selectedAgent.tasksCompleted + selectedAgent.tasksFailed > 0
                          ? Math.round(
                              (selectedAgent.tasksCompleted /
                                (selectedAgent.tasksCompleted + selectedAgent.tasksFailed)) *
                                100
                            )
                          : 0
                      }%`,
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#1e1f2b] p-3 text-center">
                      <p className="text-sm font-bold text-white">{stat.value}</p>
                      <p className="text-[9px] text-[#6b7280] mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Connection Stats */}
                <div className="grid grid-cols-2 gap-px bg-[#2d2e3d]">
                  <div className="bg-[#1e1f2b] p-3 text-center">
                    <p className="text-sm font-bold text-blue-400">{incomingDeps.length}</p>
                    <p className="text-[9px] text-[#6b7280] mt-0.5">Incoming</p>
                  </div>
                  <div className="bg-[#1e1f2b] p-3 text-center">
                    <p className="text-sm font-bold text-amber-400">{outgoingDeps.length}</p>
                    <p className="text-[9px] text-[#6b7280] mt-0.5">Outgoing</p>
                  </div>
                </div>

                {/* Incoming Dependencies */}
                <div className="p-4 border-t border-[#2d2e3d]">
                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2 font-medium flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-blue-400" />
                    Incoming Dependencies
                  </p>
                  {incomingDeps.length === 0 ? (
                    <p className="text-[10px] text-[#6b7280] py-1">No incoming dependencies</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                      {incomingDeps.map((dep) => {
                        const sourceAgent = demoAgents.find(a => a.id === dep.source)
                        const cfg = depTypeConfig[dep.type]
                        return (
                          <div
                            key={dep.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] transition-colors"
                          >
                            <span className="text-xs">{sourceAgent?.avatar}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-white font-medium truncate">
                                {sourceAgent?.name}
                              </p>
                              <p className="text-[9px] text-[#6b7280] truncate">{dep.label}</p>
                            </div>
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cfg.color }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Outgoing Dependencies */}
                <div className="px-4 pb-3 border-t border-[#2d2e3d] pt-4">
                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2 font-medium flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3 text-amber-400" />
                    Outgoing Dependencies
                  </p>
                  {outgoingDeps.length === 0 ? (
                    <p className="text-[10px] text-[#6b7280] py-1">No outgoing dependencies</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                      {outgoingDeps.map((dep) => {
                        const targetAgent = demoAgents.find(a => a.id === dep.target)
                        const cfg = depTypeConfig[dep.type]
                        return (
                          <div
                            key={dep.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] transition-colors"
                          >
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cfg.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-white font-medium truncate">
                                {targetAgent?.name}
                              </p>
                              <p className="text-[9px] text-[#6b7280] truncate">{dep.label}</p>
                            </div>
                            <span className="text-xs">{targetAgent?.avatar}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Activities */}
                <div className="px-4 pb-4 border-t border-[#2d2e3d] pt-4">
                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2 font-medium flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    Recent Activity
                  </p>
                  {agentActivities.length === 0 ? (
                    <p className="text-[10px] text-[#6b7280] py-1">No recent activity</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                      {agentActivities.map((act) => (
                        <div
                          key={act.id}
                          className="p-2 rounded-lg bg-[#252636]"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-white font-medium">{act.action}</p>
                            <span className="text-[9px] text-[#6b7280]">{act.timestamp}</span>
                          </div>
                          <p className="text-[9px] text-[#9ca3af] mt-0.5">{act.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-6 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-[#252636] flex items-center justify-center mx-auto mb-3">
                  <Info className="w-6 h-6 text-[#6b7280]" />
                </div>
                <p className="text-sm text-[#9ca3af] font-medium">Select an Agent</p>
                <p className="text-[11px] text-[#6b7280] mt-1 leading-relaxed">
                  Click on any agent node in the graph to view its dependency details, connections, and recent activity.
                </p>
                <div className="mt-4 pt-4 border-t border-[#2d2e3d] space-y-2">
                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Quick Stats</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-[#252636]">
                      <p className="text-lg font-bold text-white">{demoAgents.filter(a => a.status === 'running').length}</p>
                      <p className="text-[9px] text-[#6b7280]">Running</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#252636]">
                      <p className="text-lg font-bold text-white">{demoAgents.filter(a => a.status === 'idle').length}</p>
                      <p className="text-[9px] text-[#6b7280]">Idle</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#252636]">
                      <p className="text-lg font-bold text-red-400">{demoAgents.filter(a => a.status === 'error').length}</p>
                      <p className="text-[9px] text-[#6b7280]">Errors</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[#252636]">
                      <p className="text-lg font-bold text-emerald-400">{demoDependencies.length}</p>
                      <p className="text-[9px] text-[#6b7280]">Connections</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
