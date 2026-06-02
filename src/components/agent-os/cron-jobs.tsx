'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Play, CheckCircle, XCircle, AlertTriangle, Loader2, Zap,
  Settings, RefreshCw, Activity, Database, Globe, Server, Shield,
  Wrench, Rocket, ChevronDown, ChevronUp, Trash2, ExternalLink,
  Timer, ArrowRight, BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAgentOSStore } from '@/lib/store'

interface TestResult {
  name: string
  category: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  duration: number
  details?: string
}

interface FixResult {
  name: string
  status: 'fixed' | 'already_ok' | 'failed' | 'skipped'
  message: string
  details?: string
}

interface DeployStep {
  name: string
  status: 'success' | 'failed' | 'skipped'
  message: string
  duration: number
}

interface RecentRun {
  id: string
  action: string
  severity: string
  createdAt: string
  details: Record<string, unknown>
}

type JobTab = 'overview' | 'test' | 'fix' | 'deploy' | 'pipeline' | 'history'

const JOB_TYPES = [
  {
    id: 'test_suite',
    name: 'Full Test Suite',
    description: 'Test all API routes, database, providers, system health, and frontend rendering',
    icon: Activity,
    color: '#3b82f6',
    estimatedTime: '~30s',
  },
  {
    id: 'auto_fix',
    name: 'Auto-Fix Issues',
    description: 'Sync database schema, clean stale data, fix provider keys, verify dependencies',
    icon: Wrench,
    color: '#f59e0b',
    estimatedTime: '~60s',
  },
  {
    id: 'auto_deploy',
    name: 'Auto-Deploy',
    description: 'Pull latest code, install deps, migrate DB, build, and restart the server',
    icon: Rocket,
    color: '#10b981',
    estimatedTime: '~3-5min',
  },
  {
    id: 'full_pipeline',
    name: 'Full Pipeline',
    description: 'Run tests → auto-fix issues → deploy if tests pass — complete CI/CD cycle',
    icon: Zap,
    color: '#8b5cf6',
    estimatedTime: '~5-8min',
  },
]

export function CronJobs() {
  const [activeTab, setActiveTab] = useState<JobTab>('overview')
  const [isRunning, setIsRunning] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testSummary, setTestSummary] = useState<{ total: number; passed: number; failed: number; warned: number; duration: number } | null>(null)
  const [fixResults, setFixResults] = useState<FixResult[]>([])
  const [fixSummary, setFixSummary] = useState<{ total: number; fixed: number; failed: number; ok: number } | null>(null)
  const [deploySteps, setDeploySteps] = useState<DeployStep[]>([])
  const [deployOk, setDeployOk] = useState<boolean | null>(null)
  const [pipelineResults, setPipelineResults] = useState<Record<string, unknown> | null>(null)
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([])
  const [expandedResult, setExpandedResult] = useState<string | null>(null)
  const { addToast } = useAgentOSStore()

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/cron')
      const data = await res.json()
      setRecentRuns(data.recentRuns || [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const runTestSuite = async () => {
    setIsRunning('test_suite')
    setTestResults([])
    setTestSummary(null)
    try {
      const res = await fetch('/api/system/test-suite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: ['all'] }),
      })
      const data = await res.json()
      setTestResults(data.results || [])
      setTestSummary(data.summary || null)
      addToast(`Test Suite Complete: ${data.summary?.passed} passed, ${data.summary?.failed} failed`, data.ok ? 'success' : 'error')
    } catch (err: unknown) {
      addToast(`Test Suite Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setIsRunning(null)
      fetchHistory()
    }
  }

  const runAutoFix = async () => {
    setIsRunning('auto_fix')
    setFixResults([])
    setFixSummary(null)
    try {
      const res = await fetch('/api/system/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixes: ['all'] }),
      })
      const data = await res.json()
      setFixResults(data.results || [])
      setFixSummary(data.summary || null)
      addToast(`Auto-Fix Complete: ${data.summary?.fixed} fixed, ${data.summary?.failed} failed`, data.ok ? 'success' : 'error')
    } catch (err: unknown) {
      addToast(`Auto-Fix Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setIsRunning(null)
      fetchHistory()
    }
  }

  const runAutoDeploy = async () => {
    setIsRunning('auto_deploy')
    setDeploySteps([])
    setDeployOk(null)
    try {
      const res = await fetch('/api/system/auto-deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: ['all'] }),
      })
      const data = await res.json()
      setDeploySteps(data.steps || [])
      setDeployOk(data.ok)
      addToast(data.ok ? 'Deploy Complete: All steps succeeded' : 'Deploy Complete: Had failures', data.ok ? 'success' : 'error')
    } catch (err: unknown) {
      addToast(`Deploy Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setIsRunning(null)
      fetchHistory()
    }
  }

  const runFullPipeline = async () => {
    setIsRunning('full_pipeline')
    setPipelineResults(null)
    try {
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', jobType: 'full_pipeline' }),
      })
      const data = await res.json()
      setPipelineResults((data.result as Record<string, unknown>) || null)
      addToast('Pipeline Complete: Full test → fix → deploy pipeline finished', 'success')
    } catch (err: unknown) {
      addToast(`Pipeline Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setIsRunning(null)
      fetchHistory()
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pass':
      case 'success':
      case 'fixed':
      case 'already_ok':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'fail':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'warn':
      case 'skipped':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />
      default:
        return <div className="w-4 h-4 rounded-full bg-[#252636]" />
    }
  }

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'database': return <Database className="w-3.5 h-3.5 text-blue-400" />
      case 'api': return <Globe className="w-3.5 h-3.5 text-cyan-400" />
      case 'providers': return <Server className="w-3.5 h-3.5 text-purple-400" />
      case 'system': return <Settings className="w-3.5 h-3.5 text-amber-400" />
      case 'frontend': return <Activity className="w-3.5 h-3.5 text-emerald-400" />
      default: return <Zap className="w-3.5 h-3.5 text-gray-400" />
    }
  }

  const tabs: { id: JobTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'test', label: 'Test Suite', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'fix', label: 'Auto-Fix', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'deploy', label: 'Deploy', icon: <Rocket className="w-3.5 h-3.5" /> },
    { id: 'pipeline', label: 'Pipeline', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'history', label: 'History', icon: <Clock className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2"
        >
          <Clock className="w-6 h-6 text-emerald-400" />
          Cron Jobs & Automation
        </motion.h2>
        <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
          Automated testing, fixing, and deployment — run manually or on a schedule
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#252636] text-[#9ca3af] hover:text-white hover:bg-[#2d2e3d] border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ============================================ */}
        {/* TAB: OVERVIEW */}
        {/* ============================================ */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {JOB_TYPES.map((job) => {
                const Icon = job.icon
                const running = isRunning === job.id
                return (
                  <motion.div
                    key={job.id}
                    whileHover={{ y: -2 }}
                    className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${job.color}20` }}>
                          <Icon className="w-5 h-5" style={{ color: job.color }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{job.name}</h3>
                          <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                            <Timer className="w-3 h-3" />{job.estimatedTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[#9ca3af] mb-3">{job.description}</p>
                    <Button
                      onClick={() => {
                        if (job.id === 'test_suite') runTestSuite()
                        else if (job.id === 'auto_fix') runAutoFix()
                        else if (job.id === 'auto_deploy') runAutoDeploy()
                        else if (job.id === 'full_pipeline') runFullPipeline()
                      }}
                      disabled={isRunning !== null}
                      className="w-full text-xs h-8"
                      style={{ backgroundColor: `${job.color}20`, color: job.color, borderColor: `${job.color}40` }}
                    >
                      {running ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                      {running ? 'Running...' : 'Run Now'}
                    </Button>
                  </motion.div>
                )
              })}
            </div>

            {/* Quick Stats */}
            {testSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <p className="text-lg font-bold text-emerald-400">{testSummary.passed}</p>
                  <p className="text-[10px] text-[#9ca3af]">Passed</p>
                </div>
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
                  <p className="text-lg font-bold text-red-400">{testSummary.failed}</p>
                  <p className="text-[10px] text-[#9ca3af]">Failed</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                  <p className="text-lg font-bold text-amber-400">{testSummary.warned}</p>
                  <p className="text-[10px] text-[#9ca3af]">Warnings</p>
                </div>
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                  <p className="text-lg font-bold text-blue-400">{(testSummary.duration / 1000).toFixed(1)}s</p>
                  <p className="text-[10px] text-[#9ca3af]">Duration</p>
                </div>
              </div>
            )}

            {/* Recent History */}
            {recentRuns.length > 0 && (
              <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" /> Recent Runs
                </h3>
                <div className="space-y-2">
                  {recentRuns.slice(0, 5).map((run) => (
                    <div key={run.id} className="flex items-center justify-between p-2 rounded-lg bg-[#252636] text-xs">
                      <div className="flex items-center gap-2">
                        {run.severity === 'info' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> :
                         run.severity === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> :
                         <XCircle className="w-3.5 h-3.5 text-red-400" />}
                        <span className="text-white font-medium">{run.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </div>
                      <span className="text-[#6b7280]">{new Date(run.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================ */}
        {/* TAB: TEST SUITE */}
        {/* ============================================ */}
        {activeTab === 'test' && (
          <motion.div key="test" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" /> Full Test Suite
              </h3>
              <Button
                onClick={runTestSuite}
                disabled={isRunning !== null}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
              >
                {isRunning === 'test_suite' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                Run Tests
              </Button>
            </div>

            {testSummary && (
              <div className="flex items-center gap-4 p-3 rounded-lg bg-[#252636] text-xs">
                <span className="text-emerald-400 font-medium">{testSummary.passed} passed</span>
                <span className="text-red-400 font-medium">{testSummary.failed} failed</span>
                <span className="text-amber-400 font-medium">{testSummary.warned} warnings</span>
                <span className="text-[#6b7280] ml-auto">{(testSummary.duration / 1000).toFixed(1)}s</span>
              </div>
            )}

            <div className="space-y-1.5">
              {testResults.map((result) => (
                <div key={result.name} className="rounded-lg border border-[#2d2e3d] bg-[#1e1f2b] p-3">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedResult(expandedResult === result.name ? null : result.name)}
                  >
                    <div className="flex items-center gap-2">
                      {statusIcon(result.status)}
                      {categoryIcon(result.category)}
                      <span className="text-xs text-white font-medium">{result.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#6b7280]">{result.duration}ms</span>
                      {expandedResult === result.name ? <ChevronUp className="w-3 h-3 text-[#6b7280]" /> : <ChevronDown className="w-3 h-3 text-[#6b7280]" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#9ca3af] mt-1 ml-8">{result.message}</p>
                  {expandedResult === result.name && result.details && (
                    <div className="mt-2 ml-8 p-2 rounded bg-[#0f1117] text-[10px] text-[#6b7280] font-mono">
                      {result.details}
                    </div>
                  )}
                </div>
              ))}
              {testResults.length === 0 && !isRunning && (
                <div className="text-center py-8 text-[#6b7280]">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Click &quot;Run Tests&quot; to start the full test suite</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ============================================ */}
        {/* TAB: AUTO-FIX */}
        {/* ============================================ */}
        {activeTab === 'fix' && (
          <motion.div key="fix" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" /> Auto-Fix Issues
              </h3>
              <Button
                onClick={runAutoFix}
                disabled={isRunning !== null}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8"
              >
                {isRunning === 'auto_fix' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Wrench className="w-3.5 h-3.5 mr-1" />}
                Run Auto-Fix
              </Button>
            </div>

            {fixSummary && (
              <div className="flex items-center gap-4 p-3 rounded-lg bg-[#252636] text-xs">
                <span className="text-emerald-400 font-medium">{fixSummary.fixed} fixed</span>
                <span className="text-red-400 font-medium">{fixSummary.failed} failed</span>
                <span className="text-blue-400 font-medium">{fixSummary.ok} already OK</span>
              </div>
            )}

            <div className="space-y-1.5">
              {fixResults.map((result) => (
                <div key={result.name} className="flex items-center justify-between p-3 rounded-lg border border-[#2d2e3d] bg-[#1e1f2b]">
                  <div className="flex items-center gap-2">
                    {statusIcon(result.status)}
                    <span className="text-xs text-white font-medium">{result.name}</span>
                  </div>
                  <span className="text-[11px] text-[#9ca3af]">{result.message}</span>
                </div>
              ))}
              {fixResults.length === 0 && !isRunning && (
                <div className="text-center py-8 text-[#6b7280]">
                  <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Click &quot;Run Auto-Fix&quot; to check and repair issues</p>
                  <p className="text-[10px] mt-1">Fixes: DB schema sync, stale data cleanup, provider key repair, dependency check</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ============================================ */}
        {/* TAB: DEPLOY */}
        {/* ============================================ */}
        {activeTab === 'deploy' && (
          <motion.div key="deploy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Rocket className="w-4 h-4 text-emerald-400" /> Auto-Deploy
              </h3>
              <Button
                onClick={runAutoDeploy}
                disabled={isRunning !== null}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
              >
                {isRunning === 'auto_deploy' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Rocket className="w-3.5 h-3.5 mr-1" />}
                Deploy Now
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>This will pull the latest code from GitHub, install dependencies, migrate the database, and restart the server.</span>
            </div>

            {/* Deploy Steps Progress */}
            <div className="space-y-1.5">
              {deploySteps.map((step, i) => (
                <div key={step.name} className="flex items-center gap-3 p-3 rounded-lg border border-[#2d2e3d] bg-[#1e1f2b]">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[10px] text-[#6b7280] font-mono w-5">{i + 1}.</span>
                    {statusIcon(step.status)}
                    <span className="text-xs text-white font-medium">{step.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#9ca3af]">{step.message}</span>
                    <span className="text-[10px] text-[#6b7280]">{step.duration}ms</span>
                  </div>
                </div>
              ))}
              {isRunning === 'auto_deploy' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deploy in progress — this may take several minutes...</span>
                </div>
              )}
              {deploySteps.length === 0 && isRunning !== 'auto_deploy' && (
                <div className="text-center py-8 text-[#6b7280]">
                  <Rocket className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Click &quot;Deploy Now&quot; to pull and rebuild</p>
                  <p className="text-[10px] mt-1">Steps: Git Pull → NPM Install → DB Migrate → Build → Health Check</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ============================================ */}
        {/* TAB: FULL PIPELINE */}
        {/* ============================================ */}
        {activeTab === 'pipeline' && (
          <motion.div key="pipeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" /> Full CI/CD Pipeline
              </h3>
              <Button
                onClick={runFullPipeline}
                disabled={isRunning !== null}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
              >
                {isRunning === 'full_pipeline' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Zap className="w-3.5 h-3.5 mr-1" />}
                Run Pipeline
              </Button>
            </div>

            {/* Pipeline Flow */}
            <div className="flex items-center justify-center gap-2 py-4">
              {[
                { label: 'Test', icon: Activity, color: '#3b82f6' },
                { label: 'Fix', icon: Wrench, color: '#f59e0b' },
                { label: 'Deploy', icon: Rocket, color: '#10b981' },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center border" style={{ borderColor: `${step.color}40`, backgroundColor: `${step.color}10` }}>
                      <step.icon className="w-5 h-5" style={{ color: step.color }} />
                    </div>
                    <span className="text-[10px] text-[#9ca3af]">{step.label}</span>
                  </div>
                  {i < 2 && <ArrowRight className="w-4 h-4 text-[#6b7280]" />}
                </div>
              ))}
            </div>

            {/* Pipeline Results */}
            {pipelineResults && (
              <div className="space-y-3">
                {(['test', 'fix', 'deploy'] as const).map((phase) => {
                  const data = pipelineResults[phase] as Record<string, unknown> | undefined
                  if (!data) return null
                  const ok = data.ok !== false
                  const skipped = data.skipped
                  return (
                    <div key={phase} className={`p-3 rounded-lg border ${ok ? 'border-emerald-500/20 bg-emerald-500/5' : skipped ? 'border-amber-500/20 bg-amber-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                      <div className="flex items-center gap-2 text-xs">
                        {ok ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : skipped ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                        <span className="text-white font-medium capitalize">{phase}</span>
                        <span className={`ml-auto ${ok ? 'text-emerald-400' : skipped ? 'text-amber-400' : 'text-red-400'}`}>
                          {skipped ? 'Skipped' : ok ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                      {data.reason && <p className="text-[10px] text-amber-400 mt-1 ml-6">{String(data.reason)}</p>}
                      {data.summary && (
                        <p className="text-[10px] text-[#9ca3af] mt-1 ml-6">
                          {JSON.stringify(data.summary)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {isRunning === 'full_pipeline' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 text-purple-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running full pipeline — this may take 5-8 minutes...</span>
              </div>
            )}

            {!pipelineResults && isRunning !== 'full_pipeline' && (
              <div className="text-center py-6 text-[#6b7280]">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">The full pipeline runs: Test Suite → Auto-Fix → Deploy</p>
                <p className="text-[10px] mt-1">Deploy only runs if tests pass — failed tests stop the pipeline</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================ */}
        {/* TAB: HISTORY */}
        {/* ============================================ */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" /> Run History
              </h3>
              <Button onClick={fetchHistory} variant="outline" size="sm" className="border-[#2d2e3d] text-[#9ca3af] hover:text-white text-xs h-7">
                <RefreshCw className="w-3 h-3 mr-1" /> Refresh
              </Button>
            </div>

            {recentRuns.length === 0 ? (
              <div className="text-center py-8 text-[#6b7280]">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No runs yet</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentRuns.map((run) => (
                  <div key={run.id} className="flex items-center justify-between p-3 rounded-lg border border-[#2d2e3d] bg-[#1e1f2b]">
                    <div className="flex items-center gap-2">
                      {run.severity === 'info' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                       run.severity === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                       <XCircle className="w-4 h-4 text-red-400" />}
                      <span className="text-xs text-white font-medium">
                        {run.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6b7280]">{new Date(run.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
