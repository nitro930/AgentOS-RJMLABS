'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Timer, BarChart3, GitCompare, TrendingUp, Medal,
  Plus, Trash2, Play, CheckCircle2, XCircle, Clock,
  Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown, Minus,
  ChevronRight, Activity, Zap, Target, Gauge, GaugeCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { useAgentOSStore } from '@/lib/store'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────

interface BenchmarkSuiteData {
  id: string
  name: string
  description?: string | null
  category: string
  testCases: string
  passingScore: number
  maxDurationMs: number
  iterations: number
  status: string
  icon: string
  createdAt: string
  updatedAt: string
  runCount: number
  lastRun: {
    id: string
    status: string
    score: number
    avgDurationMs: number
    startedAt: string
    agentId: string
  } | null
}

interface BenchmarkRunData {
  id: string
  suiteId: string
  agentId: string
  status: string
  totalTests: number
  passedTests: number
  failedTests: number
  score: number
  avgDurationMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  tokenUsage: number
  costUsd: number
  results: string
  startedAt: string
  completedAt: string | null
  suite?: {
    id: string
    name: string
    category: string
    icon: string
    passingScore: number
  }
}

interface AgentData {
  id: string
  name: string
  type: string
  avatar?: string
  status: string
}

// ─── Config Maps ──────────────────────────────────────────────────

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  performance: { label: 'Performance', icon: GaugeCircle, color: 'text-emerald-400' },
  quality: { label: 'Quality', icon: Target, color: 'text-blue-400' },
  reliability: { label: 'Reliability', icon: Gauge, color: 'text-purple-400' },
  latency: { label: 'Latency', icon: Timer, color: 'text-orange-400' },
  accuracy: { label: 'Accuracy', icon: Zap, color: 'text-yellow-400' },
}

const statusColors: Record<string, string> = {
  pending: 'text-yellow-400',
  running: 'text-blue-400',
  completed: 'text-emerald-400',
  failed: 'text-red-400',
  active: 'text-emerald-400',
  archived: 'text-[#6b7280]',
}

const statusBg: Record<string, string> = {
  pending: 'border-yellow-500/30 text-yellow-400',
  running: 'border-blue-500/30 text-blue-400',
  completed: 'border-emerald-500/30 text-emerald-400',
  failed: 'border-red-500/30 text-red-400',
  active: 'border-emerald-500/30 text-emerald-400',
  archived: 'border-[#2d2e3d] text-[#6b7280]',
}

// ─── Mock Data ────────────────────────────────────────────────────

const mockSuites: BenchmarkSuiteData[] = [
  {
    id: 'mock-1', name: 'GPT-4 Reasoning Suite', description: 'Tests logical reasoning and multi-step problem solving',
    category: 'quality', testCases: '[]', passingScore: 0.8, maxDurationMs: 30000, iterations: 3,
    status: 'active', icon: '🧠', createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(), runCount: 12,
    lastRun: { id: 'lr1', status: 'completed', score: 0.87, avgDurationMs: 4200, startedAt: new Date(Date.now() - 86400000).toISOString(), agentId: 'agent-1' },
  },
  {
    id: 'mock-2', name: 'Latency Benchmark', description: 'Measures response time across various prompt lengths',
    category: 'latency', testCases: '[]', passingScore: 0.7, maxDurationMs: 10000, iterations: 5,
    status: 'active', icon: '⚡', createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(), runCount: 24,
    lastRun: { id: 'lr2', status: 'completed', score: 0.92, avgDurationMs: 1800, startedAt: new Date(Date.now() - 3600000).toISOString(), agentId: 'agent-2' },
  },
  {
    id: 'mock-3', name: 'Safety Guardrail Test', description: 'Validates safety constraints and content policies',
    category: 'reliability', testCases: '[]', passingScore: 0.95, maxDurationMs: 15000, iterations: 2,
    status: 'active', icon: '🛡️', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(), runCount: 8,
    lastRun: { id: 'lr3', status: 'failed', score: 0.72, avgDurationMs: 5600, startedAt: new Date(Date.now() - 7200000).toISOString(), agentId: 'agent-1' },
  },
  {
    id: 'mock-4', name: 'Code Generation Suite', description: 'Evaluates code output correctness and style',
    category: 'accuracy', testCases: '[]', passingScore: 0.75, maxDurationMs: 60000, iterations: 1,
    status: 'active', icon: '💻', createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), runCount: 16,
    lastRun: { id: 'lr4', status: 'completed', score: 0.81, avgDurationMs: 8500, startedAt: new Date(Date.now() - 86400000 * 2).toISOString(), agentId: 'agent-3' },
  },
  {
    id: 'mock-5', name: 'Throughput Stress Test', description: 'High-volume concurrent request handling',
    category: 'performance', testCases: '[]', passingScore: 0.6, maxDurationMs: 120000, iterations: 10,
    status: 'active', icon: '🚀', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(), runCount: 6,
    lastRun: { id: 'lr5', status: 'completed', score: 0.65, avgDurationMs: 15000, startedAt: new Date(Date.now() - 43200000).toISOString(), agentId: 'agent-2' },
  },
]

const mockAgents: AgentData[] = [
  { id: 'agent-1', name: 'Hermes', type: 'hermes', avatar: '🤖', status: 'idle' },
  { id: 'agent-2', name: 'Claude Code', type: 'claude-code', avatar: '🧠', status: 'running' },
  { id: 'agent-3', name: 'OpenClaw', type: 'openclaw', avatar: '🦅', status: 'idle' },
  { id: 'agent-4', name: 'Custom Agent', type: 'custom', avatar: '⚙️', status: 'error' },
]

const mockRuns: BenchmarkRunData[] = [
  {
    id: 'run-1', suiteId: 'mock-1', agentId: 'agent-1', status: 'completed', totalTests: 15, passedTests: 13, failedTests: 2,
    score: 0.87, avgDurationMs: 4200, p50LatencyMs: 3800, p95LatencyMs: 7100, p99LatencyMs: 8900,
    tokenUsage: 3450, costUsd: 0.103, results: '[]', startedAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date(Date.now() - 86400000 + 63000).toISOString(),
    suite: { id: 'mock-1', name: 'GPT-4 Reasoning Suite', category: 'quality', icon: '🧠', passingScore: 0.8 },
  },
  {
    id: 'run-2', suiteId: 'mock-2', agentId: 'agent-2', status: 'completed', totalTests: 25, passedTests: 23, failedTests: 2,
    score: 0.92, avgDurationMs: 1800, p50LatencyMs: 1600, p95LatencyMs: 3200, p99LatencyMs: 4100,
    tokenUsage: 2100, costUsd: 0.063, results: '[]', startedAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3600000 + 45000).toISOString(),
    suite: { id: 'mock-2', name: 'Latency Benchmark', category: 'latency', icon: '⚡', passingScore: 0.7 },
  },
  {
    id: 'run-3', suiteId: 'mock-3', agentId: 'agent-1', status: 'failed', totalTests: 10, passedTests: 7, failedTests: 3,
    score: 0.72, avgDurationMs: 5600, p50LatencyMs: 5100, p95LatencyMs: 9200, p99LatencyMs: 10800,
    tokenUsage: 4200, costUsd: 0.126, results: '[]', startedAt: new Date(Date.now() - 7200000).toISOString(), completedAt: new Date(Date.now() - 7200000 + 56000).toISOString(),
    suite: { id: 'mock-3', name: 'Safety Guardrail Test', category: 'reliability', icon: '🛡️', passingScore: 0.95 },
  },
  {
    id: 'run-4', suiteId: 'mock-4', agentId: 'agent-3', status: 'completed', totalTests: 5, passedTests: 4, failedTests: 1,
    score: 0.81, avgDurationMs: 8500, p50LatencyMs: 7800, p95LatencyMs: 14200, p99LatencyMs: 15800,
    tokenUsage: 5600, costUsd: 0.168, results: '[]', startedAt: new Date(Date.now() - 86400000 * 2).toISOString(), completedAt: new Date(Date.now() - 86400000 * 2 + 42500).toISOString(),
    suite: { id: 'mock-4', name: 'Code Generation Suite', category: 'accuracy', icon: '💻', passingScore: 0.75 },
  },
  {
    id: 'run-5', suiteId: 'mock-5', agentId: 'agent-2', status: 'completed', totalTests: 50, passedTests: 32, failedTests: 18,
    score: 0.65, avgDurationMs: 15000, p50LatencyMs: 13200, p95LatencyMs: 28000, p99LatencyMs: 35000,
    tokenUsage: 12500, costUsd: 0.375, results: '[]', startedAt: new Date(Date.now() - 43200000).toISOString(), completedAt: new Date(Date.now() - 43200000 + 750000).toISOString(),
    suite: { id: 'mock-5', name: 'Throughput Stress Test', category: 'performance', icon: '🚀', passingScore: 0.6 },
  },
  {
    id: 'run-6', suiteId: 'mock-1', agentId: 'agent-2', status: 'completed', totalTests: 15, passedTests: 14, failedTests: 1,
    score: 0.93, avgDurationMs: 3600, p50LatencyMs: 3200, p95LatencyMs: 6100, p99LatencyMs: 7800,
    tokenUsage: 3100, costUsd: 0.093, results: '[]', startedAt: new Date(Date.now() - 86400000 * 3).toISOString(), completedAt: new Date(Date.now() - 86400000 * 3 + 54000).toISOString(),
    suite: { id: 'mock-1', name: 'GPT-4 Reasoning Suite', category: 'quality', icon: '🧠', passingScore: 0.8 },
  },
  {
    id: 'run-7', suiteId: 'mock-1', agentId: 'agent-3', status: 'completed', totalTests: 15, passedTests: 11, failedTests: 4,
    score: 0.74, avgDurationMs: 5100, p50LatencyMs: 4600, p95LatencyMs: 8900, p99LatencyMs: 10200,
    tokenUsage: 3800, costUsd: 0.114, results: '[]', startedAt: new Date(Date.now() - 86400000 * 5).toISOString(), completedAt: new Date(Date.now() - 86400000 * 5 + 76500).toISOString(),
    suite: { id: 'mock-1', name: 'GPT-4 Reasoning Suite', category: 'quality', icon: '🧠', passingScore: 0.8 },
  },
  {
    id: 'run-8', suiteId: 'mock-4', agentId: 'agent-1', status: 'completed', totalTests: 5, passedTests: 5, failedTests: 0,
    score: 0.96, avgDurationMs: 7200, p50LatencyMs: 6500, p95LatencyMs: 12100, p99LatencyMs: 13500,
    tokenUsage: 4800, costUsd: 0.144, results: '[]', startedAt: new Date(Date.now() - 86400000 * 4).toISOString(), completedAt: new Date(Date.now() - 86400000 * 4 + 36000).toISOString(),
    suite: { id: 'mock-4', name: 'Code Generation Suite', category: 'accuracy', icon: '💻', passingScore: 0.75 },
  },
]

// ─── Component ────────────────────────────────────────────────────

export function AgentBenchmarking() {
  const { benchmarkingTab, setBenchmarkingTab } = useAgentOSStore()
  const [suites, setSuites] = useState<BenchmarkSuiteData[]>([])
  const [runs, setRuns] = useState<BenchmarkRunData[]>([])
  const [agents, setAgents] = useState<AgentData[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [runDialogOpen, setRunDialogOpen] = useState(false)
  const [selectedSuite, setSelectedSuite] = useState<BenchmarkSuiteData | null>(null)
  const [runAgentId, setRunAgentId] = useState<string>('')
  const [runningSuiteId, setRunningSuiteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [runSortBy, setRunSortBy] = useState<string>('startedAt')
  const [runSortOrder, setRunSortOrder] = useState<'asc' | 'desc'>('desc')
  const [compareAgent1, setCompareAgent1] = useState<string>('')
  const [compareAgent2, setCompareAgent2] = useState<string>('')

  // Create form
  const [newSuite, setNewSuite] = useState({
    name: '',
    description: '',
    category: 'performance',
    passingScore: 0.8,
    maxDurationMs: 60000,
    iterations: 1,
    icon: '🏆',
  })

  // ─── Data Fetching ───────────────────────────────────────────

  const fetchSuites = useCallback(async () => {
    try {
      const res = await fetch('/api/benchmarks')
      if (res.ok) {
        const data = await res.json()
        const apiSuites = data.suites || []
        // Merge with mock data if API is empty
        if (apiSuites.length === 0) {
          setSuites(mockSuites)
        } else {
          setSuites([...apiSuites, ...mockSuites.filter(m => !apiSuites.some((a: BenchmarkSuiteData) => a.name === m.name))])
        }
      } else {
        setSuites(mockSuites)
      }
    } catch {
      setSuites(mockSuites)
    }
  }, [])

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/benchmarks/runs')
      if (res.ok) {
        const data = await res.json()
        const apiRuns = data.runs || []
        if (apiRuns.length === 0) {
          setRuns(mockRuns)
        } else {
          setRuns([...apiRuns, ...mockRuns.filter(m => !apiRuns.some((a: BenchmarkRunData) => a.id === m.id))])
        }
      } else {
        setRuns(mockRuns)
      }
    } catch {
      setRuns(mockRuns)
    }
  }, [])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      if (res.ok) {
        const data = await res.json()
        const apiAgents = data.agents || []
        if (apiAgents.length === 0) {
          setAgents(mockAgents)
        } else {
          setAgents(apiAgents)
        }
      } else {
        setAgents(mockAgents)
      }
    } catch {
      setAgents(mockAgents)
    }
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchSuites(), fetchRuns(), fetchAgents()])
      setLoading(false)
    }
    loadAll()
  }, [fetchSuites, fetchRuns, fetchAgents])

  // ─── Handlers ────────────────────────────────────────────────

  const handleCreateSuite = async () => {
    try {
      const res = await fetch('/api/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSuite),
      })
      if (res.ok) {
        await fetchSuites()
        setCreateDialogOpen(false)
        setNewSuite({ name: '', description: '', category: 'performance', passingScore: 0.8, maxDurationMs: 60000, iterations: 1, icon: '🏆' })
      }
    } catch (e) { console.error(e) }
  }

  const handleDeleteSuite = async (id: string) => {
    try {
      await fetch(`/api/benchmarks/${id}`, { method: 'DELETE' })
      await fetchSuites()
      await fetchRuns()
    } catch (e) { console.error(e) }
  }

  const handleRunBenchmark = async (suiteId: string, agentId: string) => {
    setRunningSuiteId(suiteId)
    try {
      const res = await fetch(`/api/benchmarks/${suiteId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })
      if (res.ok) {
        await fetchSuites()
        await fetchRuns()
      }
    } catch (e) { console.error(e) }
    setRunningSuiteId(null)
    setRunDialogOpen(false)
  }

  // ─── Helpers ──────────────────────────────────────────────────

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent ? `${agent.avatar || '🤖'} ${agent.name}` : agentId.slice(0, 8)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  const getPassRate = (suite: BenchmarkSuiteData) => {
    if (!suite.lastRun) return null
    return suite.lastRun.score
  }

  // ─── Filtering & Sorting ──────────────────────────────────────

  const filteredSuites = suites.filter(s => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(s.description || '').toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const sortedRuns = [...runs].sort((a, b) => {
    const order = runSortOrder === 'asc' ? 1 : -1
    if (runSortBy === 'startedAt') return order * (new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    if (runSortBy === 'score') return order * (a.score - b.score)
    if (runSortBy === 'avgDurationMs') return order * (a.avgDurationMs - b.avgDurationMs)
    if (runSortBy === 'totalTests') return order * (a.totalTests - b.totalTests)
    return 0
  })

  // ─── Compare Data ──────────────────────────────────────────────

  const getCompareData = () => {
    if (!compareAgent1 || !compareAgent2) return []

    const agent1Runs = runs.filter(r => r.agentId === compareAgent1 && r.status === 'completed')
    const agent2Runs = runs.filter(r => r.agentId === compareAgent2 && r.status === 'completed')

    // Group by suite
    const suiteMap = new Map<string, { suite: BenchmarkRunData['suite']; agent1Score: number; agent2Score: number; agent1Duration: number; agent2Duration: number }>()

    agent1Runs.forEach(r => {
      if (!r.suite) return
      const existing = suiteMap.get(r.suite.name) || { suite: r.suite, agent1Score: 0, agent2Score: 0, agent1Duration: 0, agent2Duration: 0 }
      existing.agent1Score = Math.max(existing.agent1Score, r.score)
      existing.agent1Duration = r.avgDurationMs
      suiteMap.set(r.suite.name, existing)
    })

    agent2Runs.forEach(r => {
      if (!r.suite) return
      const existing = suiteMap.get(r.suite.name) || { suite: r.suite, agent1Score: 0, agent2Score: 0, agent1Duration: 0, agent2Duration: 0 }
      existing.agent2Score = Math.max(existing.agent2Score, r.score)
      existing.agent2Duration = r.avgDurationMs
      suiteMap.set(r.suite.name, existing)
    })

    return Array.from(suiteMap.entries()).map(([name, data]) => ({
      name,
      [getAgentName(compareAgent1)]: Math.round(data.agent1Score * 100),
      [getAgentName(compareAgent2)]: Math.round(data.agent2Score * 100),
      agent1Duration: data.agent1Duration,
      agent2Duration: data.agent2Duration,
    }))
  }

  // ─── Leaderboard Data ──────────────────────────────────────────

  const getLeaderboard = () => {
    const agentScores = new Map<string, { totalScore: number; runCount: number; bestScore: number; avgDuration: number; passed: number; failed: number }>()

    runs.filter(r => r.status === 'completed').forEach(r => {
      const existing = agentScores.get(r.agentId) || { totalScore: 0, runCount: 0, bestScore: 0, avgDuration: 0, passed: 0, failed: 0 }
      existing.totalScore += r.score
      existing.runCount += 1
      existing.bestScore = Math.max(existing.bestScore, r.score)
      existing.avgDuration = existing.avgDuration === 0 ? r.avgDurationMs : Math.round((existing.avgDuration + r.avgDurationMs) / 2)
      existing.passed += r.passedTests
      existing.failed += r.failedTests
      agentScores.set(r.agentId, existing)
    })

    return Array.from(agentScores.entries())
      .map(([agentId, data]) => ({
        agentId,
        agentName: getAgentName(agentId),
        avgScore: data.runCount > 0 ? data.totalScore / data.runCount : 0,
        bestScore: data.bestScore,
        runCount: data.runCount,
        avgDuration: data.avgDuration,
        passRate: data.passed + data.failed > 0 ? data.passed / (data.passed + data.failed) : 0,
        trend: data.bestScore > 0.85 ? 'up' as const : data.bestScore > 0.6 ? 'stable' as const : 'down' as const,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
  }

  // ─── Stats ────────────────────────────────────────────────────

  const totalSuites = suites.length
  const totalRuns = runs.length
  const completedRuns = runs.filter(r => r.status === 'completed').length
  const avgScore = completedRuns > 0 ? runs.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.score, 0) / completedRuns : 0

  // ─── Loading ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Agent Benchmarking</h2>
            <p className="text-xs text-[#6b7280]">Performance suites, comparisons & leaderboards</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6b7280] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search suites..."
              className="bg-[#1e1f2b] border-[#2d2e3d] text-white text-xs h-8 pl-8 w-40"
            />
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />New Suite
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Benchmark Suites', value: totalSuites, icon: Trophy, color: 'text-emerald-400' },
          { label: 'Total Runs', value: totalRuns, icon: Activity, color: 'text-blue-400' },
          { label: 'Completed', value: completedRuns, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Avg Score', value: `${Math.round(avgScore * 100)}%`, icon: BarChart3, color: 'text-purple-400' },
        ].map(stat => (
          <Card key={stat.label} className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6b7280]">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={benchmarkingTab} onValueChange={setBenchmarkingTab}>
        <TabsList className="bg-[#1e1f2b] border border-[#2d2e3d] w-full justify-start overflow-x-auto">
          <TabsTrigger value="benchmarks" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Trophy className="w-3.5 h-3.5 mr-1.5" />Benchmarks
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Clock className="w-3.5 h-3.5 mr-1.5" />Run History
          </TabsTrigger>
          <TabsTrigger value="compare" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <GitCompare className="w-3.5 h-3.5 mr-1.5" />Compare
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Medal className="w-3.5 h-3.5 mr-1.5" />Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* ─── BENCHMARKS TAB ─────────────────────────────────── */}
        <TabsContent value="benchmarks" className="mt-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-[#6b7280]">Category:</span>
            {['all', 'performance', 'quality', 'reliability', 'latency', 'accuracy'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#1e1f2b] text-[#6b7280] border border-[#2d2e3d] hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All' : categoryConfig[cat]?.label || cat}
              </button>
            ))}
          </div>

          {filteredSuites.length === 0 ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <Trophy className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280] mb-3">No benchmark suites found.</p>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />Create Suite
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSuites.map((suite, i) => {
                const catCfg = categoryConfig[suite.category] || categoryConfig.performance
                const CatIcon = catCfg.icon
                const passRate = getPassRate(suite)
                const isRunning = runningSuiteId === suite.id

                return (
                  <motion.div
                    key={suite.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#0f1117] flex items-center justify-center text-lg flex-shrink-0">
                            {suite.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-medium text-white">{suite.name}</h4>
                              <Badge variant="outline" className={`text-[9px] ${statusBg[suite.status] || 'border-[#2d2e3d] text-[#6b7280]'}`}>
                                {suite.status}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#9ca3af]">
                                <CatIcon className={`w-2.5 h-2.5 mr-0.5 ${catCfg.color}`} />
                                {catCfg.label}
                              </Badge>
                            </div>
                            {suite.description && (
                              <p className="text-xs text-[#9ca3af] mt-0.5 line-clamp-1">{suite.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-[#6b7280]">
                              {suite.lastRun && (
                                <>
                                  <span className="flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    {getAgentName(suite.lastRun.agentId)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <BarChart3 className="w-3 h-3" />
                                    Score: {Math.round(suite.lastRun.score * 100)}%
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {formatDuration(suite.lastRun.avgDurationMs)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTimeAgo(suite.lastRun.startedAt)}
                                  </span>
                                </>
                              )}
                              {!suite.lastRun && (
                                <span className="text-[#4b5563]">No runs yet</span>
                              )}
                            </div>
                            {/* Pass rate bar */}
                            {passRate !== null && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] text-[#6b7280]">Pass Rate</span>
                                  <span className={`text-[10px] font-medium ${passRate >= suite.passingScore ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {Math.round(passRate * 100)}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${passRate * 100}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${passRate >= suite.passingScore ? 'bg-emerald-500' : 'bg-red-500'}`}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[10px] px-2"
                              onClick={() => { setSelectedSuite(suite); setRunDialogOpen(true) }}
                              disabled={isRunning}
                            >
                              {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-500/10 h-7 px-2"
                              onClick={() => handleDeleteSuite(suite.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── RUN HISTORY TAB ────────────────────────────────── */}
        <TabsContent value="history" className="mt-4">
          <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[#2d2e3d] text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">
                <div className="col-span-2 flex items-center gap-1 cursor-pointer" onClick={() => { setRunSortBy('startedAt'); setRunSortOrder(runSortBy === 'startedAt' && runSortOrder === 'desc' ? 'asc' : 'desc') }}>
                  Date <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
                <div className="col-span-3">Suite</div>
                <div className="col-span-2">Agent</div>
                <div className="col-span-1 flex items-center gap-1 cursor-pointer" onClick={() => { setRunSortBy('score'); setRunSortOrder(runSortBy === 'score' && runSortOrder === 'desc' ? 'asc' : 'desc') }}>
                  Score <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
                <div className="col-span-2 flex items-center gap-1 cursor-pointer" onClick={() => { setRunSortBy('avgDurationMs'); setRunSortOrder(runSortBy === 'avgDurationMs' && runSortOrder === 'desc' ? 'asc' : 'desc') }}>
                  Duration <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
                <div className="col-span-2">Status</div>
              </div>
              {/* Table Body */}
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {sortedRuns.length === 0 ? (
                  <div className="p-8 text-center">
                    <Clock className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                    <p className="text-sm text-[#6b7280]">No benchmark runs yet.</p>
                  </div>
                ) : (
                  sortedRuns.map((run, i) => (
                    <motion.div
                      key={run.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[#2d2e3d]/50 hover:bg-[#0f1117] transition-colors items-center"
                    >
                      <div className="col-span-2 text-xs text-[#9ca3af]">
                        {new Date(run.startedAt).toLocaleDateString()} {new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="col-span-3 text-xs text-white truncate flex items-center gap-1.5">
                        <span>{run.suite?.icon || '🏆'}</span>
                        <span className="truncate">{run.suite?.name || run.suiteId.slice(0, 8)}</span>
                      </div>
                      <div className="col-span-2 text-xs text-[#9ca3af] truncate">
                        {getAgentName(run.agentId)}
                      </div>
                      <div className="col-span-1">
                        <span className={`text-xs font-bold ${run.score >= (run.suite?.passingScore || 0.8) ? 'text-emerald-400' : 'text-red-400'}`}>
                          {Math.round(run.score * 100)}%
                        </span>
                      </div>
                      <div className="col-span-2 text-xs text-[#9ca3af] flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {formatDuration(run.avgDurationMs)}
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className={`text-[9px] ${statusBg[run.status] || 'border-[#2d2e3d] text-[#6b7280]'}`}>
                          {run.status === 'completed' ? (
                            <><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Pass</>
                          ) : run.status === 'failed' ? (
                            <><XCircle className="w-2.5 h-2.5 mr-0.5" />Fail</>
                          ) : run.status === 'running' ? (
                            <><Loader2 className="w-2.5 h-2.5 mr-0.5 animate-spin" />Running</>
                          ) : (
                            <>{run.status}</>
                          )}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── COMPARE TAB ────────────────────────────────────── */}
        <TabsContent value="compare" className="mt-4">
          <div className="space-y-4">
            {/* Agent Selectors */}
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-[#9ca3af] mb-1 block">Agent A</label>
                    <Select value={compareAgent1} onValueChange={setCompareAgent1}>
                      <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                        <SelectValue placeholder="Select agent..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                        {agents.map(a => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.avatar} {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center pt-5">
                    <GitCompare className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-[#9ca3af] mb-1 block">Agent B</label>
                    <Select value={compareAgent2} onValueChange={setCompareAgent2}>
                      <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                        <SelectValue placeholder="Select agent..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                        {agents.map(a => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.avatar} {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparison Chart */}
            {!compareAgent1 || !compareAgent2 ? (
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-8 text-center">
                  <GitCompare className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280]">Select two agents to compare their benchmark scores.</p>
                </CardContent>
              </Card>
            ) : getCompareData().length === 0 ? (
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-8 text-center">
                  <BarChart3 className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280]">No overlapping benchmark data between these agents.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Score Comparison */}
                <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-[#9ca3af] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />Score Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getCompareData()} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2d2e3d" />
                          <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e1f2b', border: '1px solid #2d2e3d', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey={getAgentName(compareAgent1)} fill="#34d399" radius={[4, 4, 0, 0]} />
                          <Bar dataKey={getAgentName(compareAgent2)} fill="#60a5fa" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Latency Comparison */}
                <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-[#9ca3af] flex items-center gap-2">
                      <Timer className="w-4 h-4 text-orange-400" />Avg Duration (ms)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getCompareData().map(d => ({
                          name: d.name,
                          [getAgentName(compareAgent1)]: d.agent1Duration,
                          [getAgentName(compareAgent2)]: d.agent2Duration,
                        }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2d2e3d" />
                          <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e1f2b', border: '1px solid #2d2e3d', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey={getAgentName(compareAgent1)} fill="#34d399" radius={[4, 4, 0, 0]} />
                          <Bar dataKey={getAgentName(compareAgent2)} fill="#60a5fa" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Comparison Table */}
                <Card className="bg-[#1e1f2b] border-[#2d2e3d] lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-[#9ca3af] flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-400" />Suite-by-Suite Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getCompareData().map((data, i) => {
                        const agent1Pct = data[getAgentName(compareAgent1)] as number
                        const agent2Pct = data[getAgentName(compareAgent2)] as number
                        const winner = agent1Pct > agent2Pct ? 'agent1' : agent2Pct > agent1Pct ? 'agent2' : 'tie'
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#0f1117]">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white font-medium truncate">{data.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-2 bg-[#1e1f2b] rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${agent1Pct}%` }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="h-full bg-emerald-500 rounded-full"
                                  />
                                </div>
                                <span className={`text-[10px] font-mono ${winner === 'agent1' ? 'text-emerald-400' : 'text-[#9ca3af]'}`}>
                                  {agent1Pct}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-2 bg-[#1e1f2b] rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${agent2Pct}%` }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="h-full bg-blue-500 rounded-full"
                                  />
                                </div>
                                <span className={`text-[10px] font-mono ${winner === 'agent2' ? 'text-blue-400' : 'text-[#9ca3af]'}`}>
                                  {agent2Pct}%
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {winner === 'agent1' ? (
                                <Trophy className="w-4 h-4 text-emerald-400" />
                              ) : winner === 'agent2' ? (
                                <Trophy className="w-4 h-4 text-blue-400" />
                              ) : (
                                <Minus className="w-4 h-4 text-[#6b7280]" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── LEADERBOARD TAB ────────────────────────────────── */}
        <TabsContent value="leaderboard" className="mt-4">
          <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#9ca3af] flex items-center gap-2">
                <Medal className="w-4 h-4 text-yellow-400" />Agent Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getLeaderboard().length === 0 ? (
                <div className="p-8 text-center">
                  <Medal className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280]">No completed benchmark runs to rank agents.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getLeaderboard().map((entry, i) => {
                    const rank = i + 1
                    const isTop = rank === 1
                    const TrendIcon = entry.trend === 'up' ? TrendingUp : entry.trend === 'down' ? ArrowDown : Minus
                    const trendColor = entry.trend === 'up' ? 'text-emerald-400' : entry.trend === 'down' ? 'text-red-400' : 'text-[#6b7280]'

                    return (
                      <motion.div
                        key={entry.agentId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                      >
                        <div className={`flex items-center gap-4 p-4 rounded-lg ${isTop ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-[#0f1117]'} hover:border-emerald-500/10 transition-colors`}>
                          {/* Rank */}
                          <div className="flex-shrink-0">
                            {rank === 1 ? (
                              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <span className="text-lg">🥇</span>
                              </div>
                            ) : rank === 2 ? (
                              <div className="w-10 h-10 rounded-full bg-gray-500/10 flex items-center justify-center">
                                <span className="text-lg">🥈</span>
                              </div>
                            ) : rank === 3 ? (
                              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <span className="text-lg">🥉</span>
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#1e1f2b] flex items-center justify-center">
                                <span className="text-sm font-bold text-[#6b7280]">#{rank}</span>
                              </div>
                            )}
                          </div>

                          {/* Agent Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{entry.agentName}</span>
                              <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-[#6b7280]">
                              <span>{entry.runCount} run{entry.runCount !== 1 ? 's' : ''}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                Avg: {formatDuration(entry.avgDuration)}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Pass: {Math.round(entry.passRate * 100)}%
                              </span>
                            </div>
                          </div>

                          {/* Score */}
                          <div className="flex-shrink-0 text-right">
                            <div className="text-xl font-bold text-white">{Math.round(entry.avgScore * 100)}%</div>
                            <div className="text-[10px] text-[#6b7280]">avg score</div>
                          </div>

                          {/* Score Bar */}
                          <div className="flex-shrink-0 w-24 hidden sm:block">
                            <Progress
                              value={entry.avgScore * 100}
                              className="h-2 bg-[#1e1f2b]"
                            />
                            <div className="text-[9px] text-[#6b7280] mt-0.5 text-right">
                              Best: {Math.round(entry.bestScore * 100)}%
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard Chart */}
          {getLeaderboard().length > 1 && (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d] mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#9ca3af] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />Score Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getLeaderboard().map(e => ({
                      name: e.agentName.replace(/[^\w\s]/g, '').trim(),
                      score: Math.round(e.avgScore * 100),
                      best: Math.round(e.bestScore * 100),
                    }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2e3d" />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e1f2b', border: '1px solid #2d2e3d', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="score" fill="#34d399" name="Avg Score" radius={[4, 4, 0, 0]}>
                        {getLeaderboard().map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#34d399' : index === 1 ? '#60a5fa' : index === 2 ? '#a78bfa' : '#6b7280'} />
                        ))}
                      </Bar>
                      <Bar dataKey="best" fill="#34d399" fillOpacity={0.3} name="Best Score" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── CREATE SUITE DIALOG ──────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-400" />Create Benchmark Suite
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Suite Name</label>
              <Input
                value={newSuite.name}
                onChange={e => setNewSuite(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. GPT-4 Reasoning Suite"
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
              <Textarea
                value={newSuite.description}
                onChange={e => setNewSuite(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe the benchmark suite..."
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm min-h-[60px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Category</label>
                <Select value={newSuite.category} onValueChange={v => setNewSuite(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                    {Object.entries(categoryConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className={cfg.color}>{cfg.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Icon</label>
                <Input
                  value={newSuite.icon}
                  onChange={e => setNewSuite(p => ({ ...p, icon: e.target.value }))}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Pass Score</label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={newSuite.passingScore}
                  onChange={e => setNewSuite(p => ({ ...p, passingScore: parseFloat(e.target.value) || 0.8 }))}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Max Duration (ms)</label>
                <Input
                  type="number"
                  value={newSuite.maxDurationMs}
                  onChange={e => setNewSuite(p => ({ ...p, maxDurationMs: parseInt(e.target.value) || 60000 }))}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Iterations</label>
                <Input
                  type="number"
                  min="1"
                  value={newSuite.iterations}
                  onChange={e => setNewSuite(p => ({ ...p, iterations: parseInt(e.target.value) || 1 }))}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
            </div>
            <Button
              onClick={handleCreateSuite}
              disabled={!newSuite.name}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />Create Suite
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── RUN BENCHMARK DIALOG ──────────────────────────────── */}
      <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400" />Run Benchmark
            </DialogTitle>
          </DialogHeader>
          {selectedSuite && (
            <div className="space-y-4 mt-2">
              <div className="p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedSuite.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{selectedSuite.name}</p>
                    <p className="text-[10px] text-[#6b7280]">
                      Pass Score: {Math.round(selectedSuite.passingScore * 100)}% •
                      Max Duration: {formatDuration(selectedSuite.maxDurationMs)} •
                      Iterations: {selectedSuite.iterations}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Select Agent</label>
                <Select value={runAgentId} onValueChange={setRunAgentId}>
                  <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                    <SelectValue placeholder="Choose an agent to benchmark..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                    {agents.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.avatar} {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => runAgentId && handleRunBenchmark(selectedSuite.id, runAgentId)}
                disabled={!runAgentId || runningSuiteId === selectedSuite.id}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {runningSuiteId === selectedSuite.id ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running...</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" />Run Benchmark</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
