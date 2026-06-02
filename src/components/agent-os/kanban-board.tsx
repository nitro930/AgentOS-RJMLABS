'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Kanban, Plus, Search, ChevronLeft, ChevronRight, Trash2,
  Clock, AlertTriangle, Filter, X, Calendar, Tag, Timer,
  ArrowRight, LayoutGrid, BarChart3, CheckCircle2, Circle,
  Users, Zap, TrendingUp
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────
type ColumnId = 'backlog' | 'in-progress' | 'review' | 'done'
type Priority = 'critical' | 'high' | 'medium' | 'low'

interface KanbanCard {
  id: string
  title: string
  description: string
  column: ColumnId
  priority: Priority
  agent: string
  agentAvatar: string
  labels: { name: string; color: string }[]
  dueDate: string
  estimatedHours: number
  actualHours: number
  blockers: number
  createdAt: string
}

interface Column {
  id: ColumnId
  title: string
  icon: React.ReactNode
  color: string
  accent: string
}

// ─── Constants ───────────────────────────────────────────
const COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', icon: <Circle className="w-4 h-4" />, color: '#6b7280', accent: 'from-gray-500/20' },
  { id: 'in-progress', title: 'In Progress', icon: <Zap className="w-4 h-4" />, color: '#3b82f6', accent: 'from-blue-500/20' },
  { id: 'review', title: 'Review', icon: <AlertTriangle className="w-4 h-4" />, color: '#f59e0b', accent: 'from-amber-500/20' },
  { id: 'done', title: 'Done', icon: <CheckCircle2 className="w-4 h-4" />, color: '#10b981', accent: 'from-emerald-500/20' },
]

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  high: { label: 'High', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  medium: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  low: { label: 'Low', color: 'text-gray-400', bg: 'bg-gray-500/15', border: 'border-gray-500/30' },
}

const AGENT_OPTIONS = [
  { name: 'Orchestrator', avatar: '🤖' },
  { name: 'Inspector', avatar: '🔎' },
  { name: 'Deployer', avatar: '🚀' },
  { name: 'Tester', avatar: '🧪' },
  { name: 'Documenter', avatar: '📝' },
  { name: 'Designer', avatar: '🎨' },
  { name: 'Sentinel', avatar: '🛡️' },
]

const COLUMN_ORDER: ColumnId[] = ['backlog', 'in-progress', 'review', 'done']

// ─── Demo Data ───────────────────────────────────────────
const DEMO_CARDS: KanbanCard[] = [
  {
    id: 'k1',
    title: 'Implement RAG pipeline v2',
    description: 'Refactor retrieval-augmented generation with hybrid search and reranking',
    column: 'backlog',
    priority: 'high',
    agent: 'Orchestrator',
    agentAvatar: '🤖',
    labels: [{ name: 'core', color: '#10b981' }, { name: 'v2', color: '#8b5cf6' }],
    dueDate: '2026-06-15',
    estimatedHours: 24,
    actualHours: 0,
    blockers: 0,
    createdAt: '2026-06-01',
  },
  {
    id: 'k2',
    title: 'Design agent memory schema',
    description: 'Create persistent memory architecture with episodic and semantic layers',
    column: 'backlog',
    priority: 'medium',
    agent: 'Designer',
    agentAvatar: '🎨',
    labels: [{ name: 'architecture', color: '#f59e0b' }, { name: 'memory', color: '#06b6d4' }],
    dueDate: '2026-06-20',
    estimatedHours: 16,
    actualHours: 0,
    blockers: 0,
    createdAt: '2026-06-01',
  },
  {
    id: 'k3',
    title: 'Write API documentation',
    description: 'Document all agent endpoints, request/response schemas, and auth flows',
    column: 'backlog',
    priority: 'low',
    agent: 'Documenter',
    agentAvatar: '📝',
    labels: [{ name: 'docs', color: '#6b7280' }],
    dueDate: '2026-06-25',
    estimatedHours: 8,
    actualHours: 0,
    blockers: 0,
    createdAt: '2026-05-30',
  },
  {
    id: 'k4',
    title: 'Build tool-use executor',
    description: 'Implement function calling with parallel execution and retry logic',
    column: 'in-progress',
    priority: 'critical',
    agent: 'Orchestrator',
    agentAvatar: '🤖',
    labels: [{ name: 'core', color: '#10b981' }, { name: 'tools', color: '#ec4899' }],
    dueDate: '2026-06-08',
    estimatedHours: 32,
    actualHours: 18,
    blockers: 1,
    createdAt: '2026-05-28',
  },
  {
    id: 'k5',
    title: 'Deploy monitoring stack',
    description: 'Set up Prometheus + Grafana with custom agent metrics dashboards',
    column: 'in-progress',
    priority: 'high',
    agent: 'Deployer',
    agentAvatar: '🚀',
    labels: [{ name: 'infra', color: '#f97316' }, { name: 'monitoring', color: '#06b6d4' }],
    dueDate: '2026-06-10',
    estimatedHours: 20,
    actualHours: 12,
    blockers: 0,
    createdAt: '2026-05-29',
  },
  {
    id: 'k6',
    title: 'Security audit for auth flow',
    description: 'Review JWT handling, session management, and RBAC permission checks',
    column: 'in-progress',
    priority: 'critical',
    agent: 'Sentinel',
    agentAvatar: '🛡️',
    labels: [{ name: 'security', color: '#ef4444' }, { name: 'audit', color: '#8b5cf6' }],
    dueDate: '2026-06-07',
    estimatedHours: 16,
    actualHours: 8,
    blockers: 2,
    createdAt: '2026-05-27',
  },
  {
    id: 'k7',
    title: 'Integration test suite',
    description: 'End-to-end test coverage for agent lifecycle, tool execution, and error recovery',
    column: 'review',
    priority: 'high',
    agent: 'Tester',
    agentAvatar: '🧪',
    labels: [{ name: 'testing', color: '#3b82f6' }, { name: 'ci', color: '#f59e0b' }],
    dueDate: '2026-06-09',
    estimatedHours: 14,
    actualHours: 16,
    blockers: 0,
    createdAt: '2026-05-25',
  },
  {
    id: 'k8',
    title: 'Inspect vector DB performance',
    description: 'Benchmark Pinecone vs Weaviate for 1M+ document retrieval at scale',
    column: 'review',
    priority: 'medium',
    agent: 'Inspector',
    agentAvatar: '🔎',
    labels: [{ name: 'performance', color: '#f97316' }, { name: 'research', color: '#8b5cf6' }],
    dueDate: '2026-06-12',
    estimatedHours: 10,
    actualHours: 11,
    blockers: 0,
    createdAt: '2026-05-26',
  },
  {
    id: 'k9',
    title: 'Migrate to streaming responses',
    description: 'Replace batch responses with SSE streaming for all LLM endpoints',
    column: 'done',
    priority: 'high',
    agent: 'Deployer',
    agentAvatar: '🚀',
    labels: [{ name: 'core', color: '#10b981' }, { name: 'performance', color: '#f97316' }],
    dueDate: '2026-06-05',
    estimatedHours: 18,
    actualHours: 20,
    blockers: 0,
    createdAt: '2026-05-20',
  },
  {
    id: 'k10',
    title: 'Setup CI/CD pipeline',
    description: 'GitHub Actions workflow with build, test, lint, and auto-deploy stages',
    column: 'done',
    priority: 'medium',
    agent: 'Deployer',
    agentAvatar: '🚀',
    labels: [{ name: 'infra', color: '#f97316' }, { name: 'ci', color: '#f59e0b' }],
    dueDate: '2026-06-03',
    estimatedHours: 12,
    actualHours: 10,
    blockers: 0,
    createdAt: '2026-05-18',
  },
  {
    id: 'k11',
    title: 'Implement rate limiting',
    description: 'Token bucket algorithm with per-agent and per-user quotas',
    column: 'done',
    priority: 'critical',
    agent: 'Sentinel',
    agentAvatar: '🛡️',
    labels: [{ name: 'security', color: '#ef4444' }, { name: 'core', color: '#10b981' }],
    dueDate: '2026-06-04',
    estimatedHours: 8,
    actualHours: 9,
    blockers: 0,
    createdAt: '2026-05-19',
  },
  {
    id: 'k12',
    title: 'Design UI component library',
    description: 'Create reusable component set with dark cyberpunk theme tokens',
    column: 'review',
    priority: 'low',
    agent: 'Designer',
    agentAvatar: '🎨',
    labels: [{ name: 'ui', color: '#ec4899' }, { name: 'design-system', color: '#8b5cf6' }],
    dueDate: '2026-06-14',
    estimatedHours: 20,
    actualHours: 22,
    blockers: 0,
    createdAt: '2026-05-22',
  },
]

// ─── Main Component ──────────────────────────────────────
export function KanbanBoard() {
  const { addToast } = useAgentOSStore()
  const [cards, setCards] = useState<KanbanCard[]>(DEMO_CARDS)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addForm, setAddForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    agent: 'Orchestrator',
    column: 'backlog' as ColumnId,
  })

  // Filtered cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch =
        !searchQuery ||
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.agent.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesAgent = filterAgent === 'all' || card.agent === filterAgent
      const matchesPriority = filterPriority === 'all' || card.priority === filterPriority
      return matchesSearch && matchesAgent && matchesPriority
    })
  }, [cards, searchQuery, filterAgent, filterPriority])

  // Stats
  const stats = useMemo(() => {
    const total = cards.length
    const columnCounts = COLUMNS.reduce((acc, col) => {
      acc[col.id] = cards.filter((c) => c.column === col.id).length
      return acc
    }, {} as Record<ColumnId, number>)
    const doneCount = columnCounts['done']
    const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0
    const totalEstimated = cards.reduce((sum, c) => sum + c.estimatedHours, 0)
    const totalActual = cards.reduce((sum, c) => sum + c.actualHours, 0)
    const avgTime = total > 0 ? (totalActual / total).toFixed(1) : '0'
    const totalBlockers = cards.reduce((sum, c) => sum + c.blockers, 0)
    return { total, columnCounts, completionRate, totalEstimated, totalActual, avgTime, totalBlockers }
  }, [cards])

  // Move card
  const moveCard = (cardId: string, direction: 'left' | 'right') => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card
        const currentIndex = COLUMN_ORDER.indexOf(card.column)
        const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1
        if (newIndex < 0 || newIndex >= COLUMN_ORDER.length) return card
        return { ...card, column: COLUMN_ORDER[newIndex] }
      })
    )
  }

  // Delete card
  const deleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId))
    addToast('Card deleted', 'info')
  }

  // Add card
  const handleAddCard = () => {
    if (!addForm.title.trim()) return
    const agentInfo = AGENT_OPTIONS.find((a) => a.name === addForm.agent)
    const newCard: KanbanCard = {
      id: `k${Date.now()}`,
      title: addForm.title.trim(),
      description: addForm.description.trim(),
      column: addForm.column,
      priority: addForm.priority,
      agent: addForm.agent,
      agentAvatar: agentInfo?.avatar || '🤖',
      labels: [{ name: 'new', color: '#10b981' }],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedHours: 8,
      actualHours: 0,
      blockers: 0,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setCards((prev) => [...prev, newCard])
    setShowAddDialog(false)
    setAddForm({ title: '', description: '', priority: 'medium', agent: 'Orchestrator', column: 'backlog' })
    addToast('Card added successfully', 'success')
  }

  const getColumnIndex = (columnId: ColumnId) => COLUMN_ORDER.indexOf(columnId)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
            <Kanban className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">Kanban Board</h1>
            <p className="text-xs sm:text-sm text-[#9ca3af]">Track and manage agent tasks across workflows</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-9 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showFilters
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#1e1f2b] text-[#9ca3af] border border-[#2d2e3d] hover:bg-[#252636] hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="h-9 px-3 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Card
          </button>
        </div>
      </motion.div>

      {/* ── Stats Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3"
      >
        <StatChip icon={<LayoutGrid className="w-3.5 h-3.5" />} label="Total" value={stats.total} color="#9ca3af" />
        {COLUMNS.map((col) => (
          <StatChip key={col.id} icon={col.icon} label={col.title} value={stats.columnCounts[col.id]} color={col.color} />
        ))}
        <StatChip icon={<TrendingUp className="w-3.5 h-3.5" />} label="Complete" value={`${stats.completionRate}%`} color="#10b981" />
        <StatChip icon={<Clock className="w-3.5 h-3.5" />} label="Avg Time" value={`${stats.avgTime}h`} color="#3b82f6" />
      </motion.div>

      {/* ── Search & Filters ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-xl bg-[#1e1f2b] border border-[#2d2e3d]">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b7280]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks, agents..."
                  className="w-full h-8 pl-8 pr-3 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="h-8 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
              >
                <option value="all">All Agents</option>
                {AGENT_OPTIONS.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.avatar} {a.name}
                  </option>
                ))}
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="h-8 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Kanban Columns ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {COLUMNS.map((column) => {
          const columnCards = filteredCards.filter((c) => c.column === column.id)
          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + COLUMNS.indexOf(column) * 0.08 }}
              className="flex flex-col"
            >
              {/* Column Header */}
              <div
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r ${column.accent} to-transparent border border-[#2d2e3d] mb-3`}
              >
                <div className="flex items-center justify-center" style={{ color: column.color }}>
                  {column.icon}
                </div>
                <h2 className="text-sm font-semibold text-white flex-1">{column.title}</h2>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: `${column.color}20`, color: column.color }}
                >
                  {columnCards.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-2 min-h-[120px] max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar pr-0.5">
                <AnimatePresence mode="popLayout">
                  {columnCards.map((card) => (
                    <KanbanCardItem
                      key={card.id}
                      card={card}
                      columnIndex={getColumnIndex(card.column)}
                      maxColumnIndex={COLUMN_ORDER.length - 1}
                      onMoveLeft={() => moveCard(card.id, 'left')}
                      onMoveRight={() => moveCard(card.id, 'right')}
                      onDelete={() => deleteCard(card.id)}
                    />
                  ))}
                </AnimatePresence>
                {columnCards.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-[#4b5563]"
                  >
                    <LayoutGrid className="w-6 h-6 mb-1.5 opacity-50" />
                    <span className="text-xs">No tasks</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── Add Card Dialog ── */}
      <AnimatePresence>
        {showAddDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="w-full max-w-md bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white">Add New Card</h3>
                  <button
                    onClick={() => setShowAddDialog(false)}
                    className="w-7 h-7 rounded-md bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Title *</label>
                    <input
                      type="text"
                      value={addForm.title}
                      onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Enter task title..."
                      className="w-full h-9 px-3 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
                    <textarea
                      value={addForm.description}
                      onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe the task..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Priority</label>
                      <select
                        value={addForm.priority}
                        onChange={(e) => setAddForm((f) => ({ ...f, priority: e.target.value as Priority }))}
                        className="w-full h-9 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Agent</label>
                      <select
                        value={addForm.agent}
                        onChange={(e) => setAddForm((f) => ({ ...f, agent: e.target.value }))}
                        className="w-full h-9 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                      >
                        {AGENT_OPTIONS.map((a) => (
                          <option key={a.name} value={a.name}>
                            {a.avatar} {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Column</label>
                    <select
                      value={addForm.column}
                      onChange={(e) => setAddForm((f) => ({ ...f, column: e.target.value as ColumnId }))}
                      className="w-full h-9 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                    >
                      {COLUMNS.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowAddDialog(false)}
                      className="flex-1 h-9 rounded-md bg-[#252636] hover:bg-[#2d2e3d] text-xs text-[#9ca3af] hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCard}
                      disabled={!addForm.title.trim()}
                      className="flex-1 h-9 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-500/30"
                    >
                      Add Card
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Bottom Info Bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#1e1f2b]/50 border border-[#2d2e3d]/50"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-[#6b7280]">
            <Timer className="w-3 h-3" />
            <span>Est: {stats.totalEstimated}h</span>
            <span className="text-[#4b5563]">/</span>
            <span>Act: {stats.totalActual}h</span>
          </div>
          {stats.totalBlockers > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-red-400">
              <AlertTriangle className="w-3 h-3" />
              <span>{stats.totalBlockers} blocker{stats.totalBlockers > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <div className="text-[10px] text-[#4b5563]">
          {filteredCards.length} of {cards.length} cards shown
        </div>
      </motion.div>
    </div>
  )
}

// ─── Stat Chip ───────────────────────────────────────────
function StatChip({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#1e1f2b] border border-[#2d2e3d]">
      <div className="flex items-center justify-center" style={{ color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-[#6b7280] truncate">{label}</div>
        <div className="text-sm font-semibold text-white leading-tight">{value}</div>
      </div>
    </div>
  )
}

// ─── Kanban Card ─────────────────────────────────────────
function KanbanCardItem({
  card,
  columnIndex,
  maxColumnIndex,
  onMoveLeft,
  onMoveRight,
  onDelete,
}: {
  card: KanbanCard
  columnIndex: number
  maxColumnIndex: number
  onMoveLeft: () => void
  onMoveRight: () => void
  onDelete: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const priorityConfig = PRIORITY_CONFIG[card.priority]

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && card.column !== 'done'
  const timePercent = card.estimatedHours > 0 ? Math.min((card.actualHours / card.estimatedHours) * 100, 100) : 0
  const isOverBudget = card.actualHours > card.estimatedHours && card.estimatedHours > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: -20 }}
      transition={{ duration: 0.25 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-lg bg-[#1e1f2b] border border-[#2d2e3d] hover:border-[#3d3e4d] transition-all duration-200 overflow-hidden"
    >
      {/* Priority indicator bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background:
            card.priority === 'critical'
              ? '#ef4444'
              : card.priority === 'high'
              ? '#f59e0b'
              : card.priority === 'medium'
              ? '#3b82f6'
              : '#6b7280',
        }}
      />

      <div className="p-3 pt-3.5">
        {/* Top row: Agent + Priority + Delete */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm flex-shrink-0">{card.agentAvatar}</span>
            <span className="text-xs text-[#9ca3af] truncate">{card.agent}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${priorityConfig.bg} ${priorityConfig.color} ${priorityConfig.border} border`}
            >
              {priorityConfig.label}
            </span>
            <button
              onClick={onDelete}
              className="w-5 h-5 rounded flex items-center justify-center text-[#4b5563] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
              title="Delete card"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-white mb-1 leading-snug line-clamp-2">{card.title}</h3>

        {/* Description */}
        <p className="text-xs text-[#6b7280] line-clamp-2 mb-2.5 leading-relaxed">{card.description}</p>

        {/* Labels */}
        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
          {card.labels.map((label, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
              <span className="text-[10px] text-[#6b7280]">{label.name}</span>
            </div>
          ))}
        </div>

        {/* Time tracking bar */}
        {card.estimatedHours > 0 && (
          <div className="mb-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-[10px] text-[#6b7280]">
                <Timer className="w-2.5 h-2.5" />
                <span>
                  {card.actualHours}h / {card.estimatedHours}h
                </span>
              </div>
              {isOverBudget && (
                <span className="text-[10px] text-red-400 font-medium">Over</span>
              )}
            </div>
            <div className="h-1 rounded-full bg-[#0f1117] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${timePercent}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`h-full rounded-full ${
                  isOverBudget
                    ? 'bg-red-500'
                    : timePercent > 75
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
            </div>
          </div>
        )}

        {/* Bottom row: Due date + Blockers + Move */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {/* Due date */}
            {card.dueDate && (
              <div
                className={`flex items-center gap-1 text-[10px] ${
                  isOverdue ? 'text-red-400' : 'text-[#6b7280]'
                }`}
              >
                <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">
                  {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            {/* Blockers */}
            {card.blockers > 0 && (
              <div className="flex items-center gap-0.5 text-[10px] text-red-400">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>{card.blockers}</span>
              </div>
            )}
          </div>

          {/* Move buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={onMoveLeft}
              disabled={columnIndex === 0}
              className="w-6 h-6 rounded flex items-center justify-center text-[#4b5563] hover:text-white hover:bg-[#252636] disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              title="Move left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveRight}
              disabled={columnIndex === maxColumnIndex}
              className="w-6 h-6 rounded flex items-center justify-center text-[#4b5563] hover:text-white hover:bg-[#252636] disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              title="Move right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hover glow effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-lg pointer-events-none border border-emerald-500/20"
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
