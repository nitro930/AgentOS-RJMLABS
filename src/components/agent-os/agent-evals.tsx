'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Trophy,
  Play,
  Plus,
  Trash2,
  Loader2,
  BarChart3,
  Clock,
  Target,
  Search,
  Zap,
  Shield,
  Gauge,
  Beaker,
  TrendingUp,
} from 'lucide-react'

// Types
interface EvalSuite {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  agentId: string | null
  passingScore: number
  lastRunAt: string | null
  lastScore: number
  runCount: number
  avgScore: number
  bestScore: number
  worstScore: number
  isBuiltIn: boolean
  icon: string
  createdAt: string
  updatedAt: string
  _count?: { cases: number; runs: number }
}

interface EvalCase {
  id: string
  suiteId: string
  name: string
  description: string | null
  input: string
  expectedOutput: string
  evalCriteria: string
  category: string
  difficulty: string
  isRequired: boolean
  order: number
  createdAt: string
  updatedAt: string
}

interface EvalRun {
  id: string
  suiteId: string
  agentId: string | null
  status: string
  totalCases: number
  passedCases: number
  failedCases: number
  score: number
  duration: number
  config: string
  startedAt: string
  completedAt: string | null
  suite?: { name: string; type: string; icon: string }
  _count?: { results: number }
}

type TabId = 'suites' | 'cases' | 'runs' | 'benchmarks'

const TYPE_COLORS: Record<string, string> = {
  quality: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  safety: 'bg-red-500/20 text-red-400 border-red-500/30',
  performance: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  accuracy: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  regression: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  benchmark: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  quality: CheckCircle2,
  safety: Shield,
  performance: Gauge,
  accuracy: Target,
  regression: Beaker,
  benchmark: Trophy,
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  edge_case: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  safety: 'bg-red-500/20 text-red-400 border-red-500/30',
  performance: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  running: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const RUN_STATUS_COLORS: Record<string, string> = {
  running: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const BENCHMARK_TEMPLATES = [
  {
    name: 'Agent Quality Benchmark',
    description: 'Comprehensive quality evaluation covering accuracy, relevance, and coherence',
    type: 'benchmark',
    icon: '🏆',
    cases: 12,
  },
  {
    name: 'Safety Compliance Suite',
    description: 'Test agents against safety guardrails and content policies',
    type: 'safety',
    icon: '🛡️',
    cases: 8,
  },
  {
    name: 'Performance Stress Test',
    description: 'Evaluate response times, throughput, and resource efficiency',
    type: 'performance',
    icon: '⚡',
    cases: 6,
  },
  {
    name: 'Regression Detection Suite',
    description: 'Detect regressions in agent behavior across versions',
    type: 'regression',
    icon: '🔬',
    cases: 10,
  },
  {
    name: 'Accuracy Validation Suite',
    description: 'Validate factual accuracy and precision of agent outputs',
    type: 'accuracy',
    icon: '🎯',
    cases: 9,
  },
  {
    name: 'Edge Case Handler',
    description: 'Test how agents handle unusual inputs and boundary conditions',
    type: 'quality',
    icon: '🧪',
    cases: 7,
  },
]

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

function scoreBadge(score: number, passingScore: number) {
  if (score >= passingScore) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  if (score >= passingScore * 0.75) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

export function AgentEvals() {
  const [activeTab, setActiveTab] = useState<TabId>('suites')
  const [suites, setSuites] = useState<EvalSuite[]>([])
  const [cases, setCases] = useState<EvalCase[]>([])
  const [runs, setRuns] = useState<EvalRun[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showCreateSuite, setShowCreateSuite] = useState(false)
  const [showCreateCase, setShowCreateCase] = useState(false)
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [suiteForm, setSuiteForm] = useState({
    name: '',
    description: '',
    type: 'quality',
    passingScore: '0.8',
    icon: '🧪',
  })

  const [caseForm, setCaseForm] = useState({
    name: '',
    description: '',
    input: '',
    expectedOutput: '',
    category: 'general',
    difficulty: 'medium',
  })

  const fetchSuites = useCallback(async () => {
    try {
      const res = await fetch('/api/evals')
      if (res.ok) {
        const data = await res.json()
        setSuites(data)
      }
    } catch {}
  }, [])

  const fetchCases = useCallback(async () => {
    if (!selectedSuiteId) {
      // Fetch cases for all suites
      try {
        const allCases: EvalCase[] = []
        for (const suite of suites) {
          const res = await fetch(`/api/evals/${suite.id}/cases`)
          if (res.ok) {
            const data = await res.json()
            allCases.push(...data)
          }
        }
        setCases(allCases)
      } catch {}
      return
    }
    try {
      const res = await fetch(`/api/evals/${selectedSuiteId}/cases`)
      if (res.ok) {
        const data = await res.json()
        setCases(data)
      }
    } catch {}
  }, [selectedSuiteId, suites])

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/evals/runs')
      if (res.ok) {
        const data = await res.json()
        setRuns(data)
      }
    } catch {}
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchSuites(), fetchRuns()]).finally(() => setLoading(false))
  }, [fetchSuites, fetchRuns])

  useEffect(() => {
    if (suites.length > 0) {
      fetchCases()
    }
  }, [suites, fetchCases])

  const handleCreateSuite = async () => {
    try {
      const res = await fetch('/api/evals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suiteForm.name,
          description: suiteForm.description || null,
          type: suiteForm.type,
          passingScore: parseFloat(suiteForm.passingScore),
          icon: suiteForm.icon,
          status: 'active',
        }),
      })
      if (res.ok) {
        setShowCreateSuite(false)
        setSuiteForm({ name: '', description: '', type: 'quality', passingScore: '0.8', icon: '🧪' })
        await fetchSuites()
      }
    } catch {}
  }

  const handleDeleteSuite = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/evals/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchSuites()
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const handleRunSuite = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/evals/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        await Promise.all([fetchSuites(), fetchRuns()])
      }
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const handleCreateCase = async () => {
    if (!selectedSuiteId) return
    try {
      const res = await fetch(`/api/evals/${selectedSuiteId}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: caseForm.name,
          description: caseForm.description || null,
          input: caseForm.input ? JSON.parse(caseForm.input) : {},
          expectedOutput: caseForm.expectedOutput ? JSON.parse(caseForm.expectedOutput) : {},
          category: caseForm.category,
          difficulty: caseForm.difficulty,
        }),
      })
      if (res.ok) {
        setShowCreateCase(false)
        setCaseForm({ name: '', description: '', input: '', expectedOutput: '', category: 'general', difficulty: 'medium' })
        await fetchCases()
      }
    } catch {}
  }

  const handleInstantiateBenchmark = async (template: typeof BENCHMARK_TEMPLATES[0]) => {
    setActionLoading(template.name)
    try {
      const res = await fetch('/api/evals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          type: template.type,
          icon: template.icon,
          status: 'active',
          isBuiltIn: true,
        }),
      })
      if (res.ok) {
        const suite = await res.json()
        // Create some sample cases
        for (let i = 0; i < Math.min(template.cases, 5); i++) {
          await fetch(`/api/evals/${suite.id}/cases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Test Case ${i + 1}`,
              description: `Sample test case for ${template.name}`,
              input: { query: `Test input ${i + 1}` },
              expectedOutput: { response: `Expected output ${i + 1}` },
              category: i % 2 === 0 ? 'general' : 'edge_case',
              difficulty: ['easy', 'medium', 'hard'][i % 3],
              order: i,
            }),
          })
        }
        await fetchSuites()
      }
    } catch {} finally {
      setActionLoading(null)
    }
  }

  // Stats
  const totalSuites = suites.length
  const avgScore = suites.length > 0 ? suites.reduce((a, s) => a + s.lastScore, 0) / suites.length : 0
  const totalPassRate = runs.length > 0
    ? runs.filter(r => r.status === 'completed').reduce((a, r) => a + (r.totalCases > 0 ? r.passedCases / r.totalCases : 0), 0) / runs.filter(r => r.status === 'completed').length
    : 0
  const lastRun = runs.length > 0 ? runs[0]?.startedAt : null

  // Filtered data
  const filteredSuites = suites.filter(s => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-emerald-400" />
            Agent Evals
          </h2>
          <p className="text-sm text-[#6b7280] mt-1">Test suites, benchmarks & quality scoring</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-[#6b7280]">Total Suites</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{totalSuites}</p>
          <p className="text-[10px] text-[#6b7280] mt-1">{suites.filter(s => s.status === 'active').length} active</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-[#6b7280]">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">{(avgScore * 100).toFixed(0)}%</p>
          <div className="mt-1.5 h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${avgScore >= 0.8 ? 'bg-emerald-500' : avgScore >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${avgScore * 100}%` }}
            />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-[#6b7280]">Pass Rate</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{(totalPassRate * 100).toFixed(0)}%</p>
          <p className="text-[10px] text-[#6b7280] mt-1">{runs.filter(r => r.status === 'completed').length} completed runs</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-[#6b7280]">Last Run</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{lastRun ? timeAgo(lastRun) : 'Never'}</p>
          <p className="text-[10px] text-[#6b7280] mt-1">{runs.length} total runs</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a1b2e] p-1 rounded-lg border border-[#2d2e3d]">
        {([
          { id: 'suites' as TabId, label: 'Suites', icon: FlaskConical },
          { id: 'cases' as TabId, label: 'Test Cases', icon: Target },
          { id: 'runs' as TabId, label: 'Runs', icon: Play },
          { id: 'benchmarks' as TabId, label: 'Benchmarks', icon: Trophy },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                : 'text-[#6b7280] hover:text-white hover:bg-[#252636]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Suites Tab */}
      {activeTab === 'suites' && (
        <div className="space-y-4">
          {/* Search + Create */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#6b7280] flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search suites..."
                className="w-full px-3 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <button
              onClick={() => setShowCreateSuite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              New Suite
            </button>
          </div>

          {/* Suite Cards */}
          <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar pr-1">
            {filteredSuites.length === 0 ? (
              <div className="text-center py-12 text-[#6b7280]">
                <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No eval suites yet</p>
                <p className="text-xs mt-1">Create a suite or instantiate a benchmark template</p>
              </div>
            ) : (
              filteredSuites.map((suite, idx) => {
                const TypeIcon = TYPE_ICONS[suite.type] || FlaskConical
                return (
                  <motion.div
                    key={suite.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4 hover:border-[#3d3e4d] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${TYPE_COLORS[suite.type]?.split(' ')[0] || 'bg-emerald-500/20'}`}>
                            <TypeIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-base">{suite.icon}</span>
                          <h3 className="text-sm font-semibold text-white truncate">{suite.name}</h3>
                          <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${TYPE_COLORS[suite.type] || TYPE_COLORS.quality}`}>
                            {suite.type}
                          </span>
                          <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${STATUS_COLORS[suite.status] || STATUS_COLORS.draft}`}>
                            {suite.status}
                          </span>
                          {suite.isBuiltIn && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">built-in</span>
                          )}
                        </div>
                        {suite.description && <p className="text-xs text-[#9ca3af] mb-2 line-clamp-1">{suite.description}</p>}

                        {/* Score Badge */}
                        {suite.runCount > 0 && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-md border font-bold ${scoreBadge(suite.lastScore, suite.passingScore)}`}>
                              {(suite.lastScore * 100).toFixed(0)}%
                            </span>
                            <span className="text-[10px] text-[#6b7280]">passing: {(suite.passingScore * 100).toFixed(0)}%</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-[#6b7280] flex-wrap">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {suite._count?.cases ?? 0} cases
                          </span>
                          <span className="flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            {suite.runCount} runs
                          </span>
                          {suite.bestScore > 0 && (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <TrendingUp className="w-3 h-3" />
                              Best: {(suite.bestScore * 100).toFixed(0)}%
                            </span>
                          )}
                          {suite.runCount > 0 && (
                            <span className="flex items-center gap-1">
                              Avg: {(suite.avgScore * 100).toFixed(0)}%
                            </span>
                          )}
                          {suite.lastRunAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(suite.lastRunAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleRunSuite(suite.id)}
                          disabled={actionLoading === suite.id || suite.status === 'running'}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                          title="Run suite"
                        >
                          {actionLoading === suite.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">Run</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSuite(suite.id)}
                          disabled={actionLoading === suite.id}
                          className="p-1.5 text-[#6b7280] hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Test Cases Tab */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[#6b7280]">{cases.length} test cases across all suites</p>
            <div className="flex items-center gap-2">
              <select
                value={selectedSuiteId || ''}
                onChange={e => setSelectedSuiteId(e.target.value || null)}
                className="px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">All Suites</option>
                {suites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (suites.length === 0) return
                  if (!selectedSuiteId) setSelectedSuiteId(suites[0]?.id || null)
                  setShowCreateCase(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Case
              </button>
            </div>
          </div>

          {/* Cases Table */}
          <div className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2d2e3d]">
                    <th className="text-left px-4 py-3 text-xs text-[#6b7280] font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-xs text-[#6b7280] font-medium">Category</th>
                    <th className="text-left px-4 py-3 text-xs text-[#6b7280] font-medium">Difficulty</th>
                    <th className="text-left px-4 py-3 text-xs text-[#6b7280] font-medium">Required</th>
                    <th className="text-left px-4 py-3 text-xs text-[#6b7280] font-medium hidden md:table-cell">Input</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[#6b7280]">
                        <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No test cases</p>
                        <p className="text-xs mt-1">Add cases to a suite or run a benchmark</p>
                      </td>
                    </tr>
                  ) : (
                    cases.map((evalCase, idx) => (
                      <motion.tr
                        key={evalCase.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-[#2d2e3d]/50 hover:bg-[#252636] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#6b7280] font-mono">{evalCase.order + 1}</span>
                            <div>
                              <p className="text-white text-xs font-medium">{evalCase.name}</p>
                              {evalCase.description && (
                                <p className="text-[#6b7280] text-[10px] line-clamp-1">{evalCase.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${CATEGORY_COLORS[evalCase.category] || CATEGORY_COLORS.general}`}>
                            {evalCase.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${DIFFICULTY_COLORS[evalCase.difficulty] || DIFFICULTY_COLORS.medium}`}>
                            {evalCase.difficulty}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {evalCase.isRequired ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-[#6b7280]" />
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-[10px] text-[#9ca3af] max-w-[200px] truncate font-mono">
                            {(() => { try { return JSON.stringify(JSON.parse(evalCase.input)) } catch { return evalCase.input } })()}
                          </p>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Runs Tab */}
      {activeTab === 'runs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6b7280]">{runs.length} evaluation runs</p>
            <button
              onClick={() => fetchRuns()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252636] text-[#9ca3af] border border-[#2d2e3d] rounded-lg text-xs font-medium hover:text-white transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar pr-1">
            {runs.length === 0 ? (
              <div className="text-center py-12 text-[#6b7280]">
                <Play className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No eval runs yet</p>
                <p className="text-xs mt-1">Run a suite to see results here</p>
              </div>
            ) : (
              runs.map((run, idx) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-base">{run.suite?.icon || '🧪'}</span>
                        <h3 className="text-sm font-semibold text-white truncate">
                          {run.suite?.name || `Suite ${run.suiteId.slice(0, 8)}`}
                        </h3>
                        <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium ${RUN_STATUS_COLORS[run.status] || RUN_STATUS_COLORS.completed}`}>
                          {run.status}
                        </span>
                        {run.score > 0 && (
                          <span className={`px-1.5 py-0.5 text-[10px] rounded-md border font-bold ${scoreBadge(run.score, 0.8)}`}>
                            {(run.score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-[#6b7280] flex-wrap">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {run.passedCases} passed
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-400" />
                          {run.failedCases} failed
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {run.totalCases} total
                        </span>
                        {run.duration > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {run.duration < 1000 ? `${run.duration}ms` : `${(run.duration / 1000).toFixed(1)}s`}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(run.startedAt)}
                        </span>
                        {run.completedAt && (
                          <span className="text-[#6b7280]">
                            Completed: {new Date(run.completedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {run.totalCases > 0 && (
                        <div className="mt-2 h-1.5 bg-[#0f1117] rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-emerald-500 rounded-l-full transition-all"
                            style={{ width: `${(run.passedCases / run.totalCases) * 100}%` }}
                          />
                          <div
                            className="h-full bg-red-500 rounded-r-full transition-all"
                            style={{ width: `${(run.failedCases / run.totalCases) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Benchmarks Tab */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6b7280]">Pre-built benchmark templates to quickly set up evaluations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BENCHMARK_TEMPLATES.map((template, idx) => {
              const TypeIcon = TYPE_ICONS[template.type] || FlaskConical
              return (
                <motion.div
                  key={template.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4 hover:border-[#3d3e4d] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${TYPE_COLORS[template.type]?.split(' ')[0] || 'bg-emerald-500/20'}`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-base">{template.icon}</span>
                        <h3 className="text-sm font-semibold text-white">{template.name}</h3>
                      </div>
                      <p className="text-xs text-[#9ca3af] mb-2 line-clamp-2">{template.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-[#6b7280]">
                        <span className={`px-1.5 py-0.5 rounded border font-medium ${TYPE_COLORS[template.type] || TYPE_COLORS.quality}`}>
                          {template.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {template.cases} cases
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInstantiateBenchmark(template)}
                      disabled={actionLoading === template.name}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {actionLoading === template.name ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                      <span className="hidden sm:inline">Use</span>
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Create Suite Dialog */}
      <AnimatePresence>
        {showCreateSuite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateSuite(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-400" />
                Create Eval Suite
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Name</label>
                  <input
                    value={suiteForm.name}
                    onChange={e => setSuiteForm({ ...suiteForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    placeholder="Suite name"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Description</label>
                  <textarea
                    value={suiteForm.description}
                    onChange={e => setSuiteForm({ ...suiteForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 h-16 resize-none"
                    placeholder="What this suite evaluates"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Type</label>
                    <select
                      value={suiteForm.type}
                      onChange={e => setSuiteForm({ ...suiteForm, type: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      {['quality', 'safety', 'performance', 'accuracy', 'regression', 'benchmark'].map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Passing Score</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={suiteForm.passingScore}
                      onChange={e => setSuiteForm({ ...suiteForm, passingScore: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {['🧪', '🏆', '🛡️', '⚡', '🎯', '🔬', '📊', '✅'].map(icon => (
                      <button
                        key={icon}
                        onClick={() => setSuiteForm({ ...suiteForm, icon })}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${
                          suiteForm.icon === icon ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-[#0f1117] border border-[#2d2e3d] hover:border-[#3d3e4d]'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateSuite(false)}
                    className="px-4 py-2 text-sm text-[#6b7280] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSuite}
                    disabled={!suiteForm.name}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    Create Suite
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Case Dialog */}
      <AnimatePresence>
        {showCreateCase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateCase(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Add Test Case
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Suite</label>
                  <select
                    value={selectedSuiteId || ''}
                    onChange={e => setSelectedSuiteId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    {suites.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Case Name</label>
                  <input
                    value={caseForm.name}
                    onChange={e => setCaseForm({ ...caseForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    placeholder="Test case name"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Description</label>
                  <textarea
                    value={caseForm.description}
                    onChange={e => setCaseForm({ ...caseForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 h-16 resize-none"
                    placeholder="What this case tests"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Category</label>
                    <select
                      value={caseForm.category}
                      onChange={e => setCaseForm({ ...caseForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      {['general', 'edge_case', 'safety', 'performance'].map(c => (
                        <option key={c} value={c}>{c.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Difficulty</label>
                    <select
                      value={caseForm.difficulty}
                      onChange={e => setCaseForm({ ...caseForm, difficulty: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      {['easy', 'medium', 'hard'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Input (JSON)</label>
                  <textarea
                    value={caseForm.input}
                    onChange={e => setCaseForm({ ...caseForm, input: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 h-16 resize-none font-mono"
                    placeholder='{"query": "test input"}'
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Expected Output (JSON)</label>
                  <textarea
                    value={caseForm.expectedOutput}
                    onChange={e => setCaseForm({ ...caseForm, expectedOutput: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 h-16 resize-none font-mono"
                    placeholder='{"response": "expected output"}'
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateCase(false)}
                    className="px-4 py-2 text-sm text-[#6b7280] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCase}
                    disabled={!caseForm.name || !selectedSuiteId}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    Add Case
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
