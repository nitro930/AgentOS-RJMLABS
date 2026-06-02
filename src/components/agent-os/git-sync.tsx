'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAgentOSStore } from '@/lib/store'
import {
  GitBranch,
  Download,
  Upload,
  History,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Tag,
  Play,
  Clock,
  User,
  FileText,
  ChevronRight,
  Loader2,
  GitCommit,
  GitPullRequest,
  Rocket,
  Package,
  ExternalLink,
  Shield,
} from 'lucide-react'

interface GitStatus {
  branch: string
  upstream: string
  ahead: number
  behind: number
  changed: { path: string; status: string; staged: boolean }[]
  commit: { hash: string; message: string; date: string; author: string }
  remoteUrl: string
  version: string
  clean: boolean
}

interface GitCommit {
  hash: string
  shortHash: string
  author: string
  email: string
  date: string
  message: string
}

interface GitTag {
  name: string
  date: string
  message: string
  hash?: string
  isPseudo?: boolean
}

interface GitBranch {
  name: string
  upstream: string
  isCurrent: boolean
  isRemote: boolean
}

interface BuildStep {
  step: string
  output: string
  success: boolean
}

const tabs = [
  { id: 'status' as const, label: 'Status', icon: GitBranch },
  { id: 'pull' as const, label: 'Pull & Push', icon: Download },
  { id: 'history' as const, label: 'History', icon: History },
  { id: 'config' as const, label: 'Config', icon: Settings },
]

export function GitSync() {
  const { gitSyncTab, setGitSyncTab, addToast } = useAgentOSStore()
  const [status, setStatus] = useState<GitStatus | null>(null)
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [tags, setTags] = useState<GitTag[]>([])
  const [branches, setBranches] = useState<GitBranch[]>([])
  const [loading, setLoading] = useState(false)
  const [pullLoading, setPullLoading] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [buildLoading, setBuildLoading] = useState(false)
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([])
  const [pullOutput, setPullOutput] = useState<string>('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagMessage, setNewTagMessage] = useState('')
  const [checkoutRef, setCheckoutRef] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/git/status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error: any) {
      addToast('Failed to fetch git status', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  const fetchLog = useCallback(async () => {
    try {
      const res = await fetch('/api/git/log?count=30')
      if (res.ok) {
        const data = await res.json()
        setCommits(data.commits || [])
        setBranches(data.branches || [])
      }
    } catch {}
  }, [])

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/git/tags')
      if (res.ok) {
        const data = await res.json()
        setTags(data.tags || [])
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchLog()
    fetchTags()
  }, [fetchStatus, fetchLog, fetchTags])

  const handlePull = async (branch?: string) => {
    setPullLoading(true)
    setPullOutput('')
    try {
      const res = await fetch('/api/git/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch }),
      })
      const data = await res.json()
      if (data.success) {
        setPullOutput(data.output || 'Already up to date.')
        if (data.warning) {
          addToast(data.warning, 'error')
        } else {
          addToast('Pull successful — updated to ' + (data.newCommitHash || 'latest'), 'success')
        }
        fetchStatus()
        fetchLog()
      } else {
        setPullOutput(data.error || 'Pull failed')
        addToast('Pull failed: ' + (data.error || 'Unknown error'), 'error')
      }
    } catch (error: any) {
      addToast('Pull failed: ' + error.message, 'error')
    } finally {
      setPullLoading(false)
    }
  }

  const handlePush = async (pushTags = false, branch?: string) => {
    setPushLoading(true)
    try {
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: pushTags, branch }),
      })
      const data = await res.json()
      if (data.success) {
        addToast(pushTags ? 'Tags pushed successfully' : 'Pushed to origin successfully', 'success')
        fetchStatus()
      } else {
        addToast('Push failed: ' + (data.error || 'Unknown error'), 'error')
      }
    } catch (error: any) {
      addToast('Push failed: ' + error.message, 'error')
    } finally {
      setPushLoading(false)
    }
  }

  const handleBuild = async () => {
    setBuildLoading(true)
    setBuildSteps([])
    try {
      const res = await fetch('/api/git/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ install: true, migrate: true }),
      })
      const data = await res.json()
      setBuildSteps(data.steps || [])
      if (data.success) {
        addToast('Build completed successfully — restart the server to apply', 'success')
      } else {
        addToast('Build completed with errors', 'error')
      }
    } catch (error: any) {
      addToast('Build failed: ' + error.message, 'error')
    } finally {
      setBuildLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (!checkoutRef.trim()) return
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/git/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: checkoutRef.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        addToast(`Checked out ${checkoutRef} successfully`, 'success')
        setCheckoutRef('')
        fetchStatus()
        fetchLog()
      } else {
        addToast('Checkout failed: ' + (data.error || 'Unknown error'), 'error')
      }
    } catch (error: any) {
      addToast('Checkout failed: ' + error.message, 'error')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    try {
      const res = await fetch('/api/git/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), message: newTagMessage.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        addToast(`Tag ${newTagName} created successfully`, 'success')
        setNewTagName('')
        setNewTagMessage('')
        fetchTags()
        fetchStatus()
      } else {
        addToast('Failed to create tag: ' + (data.error || 'Unknown error'), 'error')
      }
    } catch (error: any) {
      addToast('Failed to create tag: ' + error.message, 'error')
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'modified': return 'text-yellow-400'
      case 'added': return 'text-emerald-400'
      case 'deleted': return 'text-red-400'
      case 'renamed': return 'text-blue-400'
      case 'untracked': return 'text-[#6b7280]'
      default: return 'text-[#9ca3af]'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-emerald-400" />
            Git Sync & Version Manager
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">
            Pull updates from GitHub, manage versions, and rebuild your AgentOS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchStatus(); fetchLog(); fetchTags() }}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1e1f2b] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d] transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Status Bar */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Branch</span>
            </div>
            <p className="text-sm font-bold text-white truncate">{status.branch}</p>
          </div>
          <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3">
            <div className="flex items-center gap-2 mb-1">
              <GitCommit className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Commit</span>
            </div>
            <p className="text-sm font-bold text-white font-mono">{status.commit.hash}</p>
          </div>
          <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Version</span>
            </div>
            <p className="text-sm font-bold text-white">v{status.version}</p>
          </div>
          <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3">
            <div className="flex items-center gap-2 mb-1">
              {status.clean ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
              )}
              <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Status</span>
            </div>
            <p className={`text-sm font-bold ${status.clean ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {status.clean ? 'Clean' : `${status.changed.length} changes`}
            </p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1e1f2b] rounded-xl p-1 border border-[#2d2e3d]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setGitSyncTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              gitSyncTab === tab.id
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#252636]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {gitSyncTab === 'status' && (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Current Commit */}
            {status && (
              <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-emerald-400" />
                  Current Commit
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Hash</span>
                    <p className="text-sm font-mono text-white">{status.commit.hash}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Author</span>
                    <p className="text-sm text-white">{status.commit.author}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Message</span>
                    <p className="text-sm text-white">{status.commit.message}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Date</span>
                    <p className="text-sm text-[#9ca3af]">{formatDate(status.commit.date)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Upstream</span>
                    <p className="text-sm text-[#9ca3af]">{status.upstream || 'No upstream set'}</p>
                  </div>
                </div>

                {/* Ahead/Behind */}
                {(status.ahead > 0 || status.behind > 0) && (
                  <div className="flex gap-3 mt-4 pt-3 border-t border-[#2d2e3d]">
                    {status.ahead > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-medium text-blue-400">{status.ahead} ahead</span>
                      </div>
                    )}
                    {status.behind > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <ArrowDown className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-xs font-medium text-orange-400">{status.behind} behind</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Remote URL */}
                {status.remoteUrl && (
                  <div className="mt-4 pt-3 border-t border-[#2d2e3d]">
                    <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Remote</span>
                    <div className="flex items-center gap-2 mt-1">
                      <ExternalLink className="w-3.5 h-3.5 text-[#6b7280]" />
                      <a
                        href={status.remoteUrl.replace('.git', '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-400 hover:underline"
                      >
                        {status.remoteUrl.replace('https://github.com/', '').replace('.git', '')}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Changed Files */}
            {status && status.changed.length > 0 && (
              <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-yellow-400" />
                  Changed Files ({status.changed.length})
                </h3>
                <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                  {status.changed.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0f1117] border border-[#2d2e3d]"
                    >
                      <span className="text-sm text-white font-mono truncate flex-1 mr-2">{file.path}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {file.staged && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">staged</span>
                        )}
                        <span className={`text-xs font-medium capitalize ${getStatusColor(file.status)}`}>
                          {file.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Branches */}
            {branches.length > 0 && (
              <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                  Branches
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {branches.map((b, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                        b.isCurrent
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : 'bg-[#0f1117] border-[#2d2e3d]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {b.isCurrent && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                        <span className={`text-sm font-mono ${b.isCurrent ? 'text-emerald-400' : 'text-white'}`}>
                          {b.name}
                        </span>
                      </div>
                      {b.isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">current</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {gitSyncTab === 'pull' && (
          <motion.div
            key="pull"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Pull Section */}
            <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-emerald-400" />
                Pull Changes from GitHub
              </h3>
              <p className="text-sm text-[#9ca3af] mb-4">
                Pull the latest changes from the remote repository. Local changes will be automatically stashed and restored after pulling. This is the safest way to update your AgentOS.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handlePull()}
                  disabled={pullLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {pullLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {pullLoading ? 'Pulling...' : 'Pull Latest Changes'}
                </button>
                {status && status.behind > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                    <ArrowDown className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-orange-400 font-medium">{status.behind} commits behind</span>
                  </div>
                )}
              </div>
              {pullOutput && (
                <div className="mt-4 p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                  <pre className="text-xs text-[#9ca3af] whitespace-pre-wrap font-mono">{pullOutput}</pre>
                </div>
              )}
            </div>

            {/* Push Section */}
            <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                Push Changes to GitHub
              </h3>
              <p className="text-sm text-[#9ca3af] mb-4">
                Push local commits and tags to the remote repository. Make sure you have the correct permissions configured.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handlePush(false)}
                  disabled={pushLoading || (status?.ahead === 0 && true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {pushLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Push Commits
                </button>
                <button
                  onClick={() => handlePush(true)}
                  disabled={pushLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d] transition-colors disabled:opacity-50"
                >
                  <Tag className="w-4 h-4" />
                  Push Tags
                </button>
              </div>
              {status && status.ahead > 0 && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <ArrowUp className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400 font-medium">{status.ahead} commits ready to push</span>
                </div>
              )}
            </div>

            {/* Rebuild Section */}
            <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-purple-400" />
                Rebuild Application
              </h3>
              <p className="text-sm text-[#9ca3af] mb-4">
                After pulling new changes, run the build process to compile the updated code. This will install dependencies, apply database migrations, and build the Next.js application.
              </p>
              <button
                onClick={handleBuild}
                disabled={buildLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors disabled:opacity-50 w-full sm:w-auto"
              >
                {buildLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {buildLoading ? 'Building...' : 'Rebuild Application'}
              </button>

              {/* Build Steps */}
              {buildSteps.length > 0 && (
                <div className="mt-4 space-y-2">
                  {buildSteps.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        step.success
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-red-500/5 border-red-500/20'
                      }`}
                    >
                      {step.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${step.success ? 'text-emerald-400' : 'text-red-400'}`}>
                          {step.step}
                        </p>
                        {step.output && (
                          <pre className="text-xs text-[#6b7280] mt-1 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                            {step.output}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {gitSyncTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Version Tags */}
            <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" />
                Version Tags
              </h3>
              {tags.length > 0 ? (
                <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                  {tags.map((tag, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0f1117] border border-[#2d2e3d] hover:border-[#3d3e4d] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#a855f715' }}>
                          <Tag className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{tag.name}</p>
                          {tag.message && <p className="text-xs text-[#6b7280] truncate max-w-[200px]">{tag.message}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tag.isPseudo && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#252636] text-[#6b7280]">auto</span>
                        )}
                        <span className="text-xs text-[#6b7280]">{formatDate(tag.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6b7280]">No version tags found. Create one below.</p>
              )}

              {/* Create Tag */}
              <div className="mt-4 pt-4 border-t border-[#2d2e3d]">
                <h4 className="text-xs font-semibold text-[#9ca3af] mb-2 uppercase tracking-wider">Create New Tag</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="v1.0.0"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0f1117] border border-[#2d2e3d] text-white text-sm placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                  />
                  <input
                    type="text"
                    value={newTagMessage}
                    onChange={(e) => setNewTagMessage(e.target.value)}
                    placeholder="Release message (optional)"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0f1117] border border-[#2d2e3d] text-white text-sm placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim()}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>

            {/* Commit History */}
            <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                Commit History
              </h3>
              <div className="space-y-1.5 max-h-96 overflow-y-auto custom-scrollbar">
                {commits.map((commit, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[#0f1117] border border-[#2d2e3d] hover:border-[#3d3e4d] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#3b82f615' }}>
                      <GitCommit className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{commit.message}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-mono text-[#6b7280]">{commit.shortHash}</span>
                        <span className="text-xs text-[#6b7280] flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {commit.author}
                        </span>
                        <span className="text-xs text-[#6b7280] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(commit.date)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#4b5563] group-hover:text-[#9ca3af] transition-colors flex-shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {gitSyncTab === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Checkout Branch/Tag */}
            <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                Switch Branch / Tag / Commit
              </h3>
              <p className="text-sm text-[#9ca3af] mb-4">
                Switch to a different branch, tag, or commit hash. This will change the active version of your AgentOS source code. You will need to rebuild after switching.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={checkoutRef}
                  onChange={(e) => setCheckoutRef(e.target.value)}
                  placeholder="e.g. main, v1.0.0, abc1234"
                  className="flex-1 px-3 py-2.5 rounded-lg bg-[#0f1117] border border-[#2d2e3d] text-white text-sm font-mono placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading || !checkoutRef.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                  Switch
                </button>
              </div>

              {/* Quick branch buttons */}
              {branches.filter(b => !b.isRemote && !b.isCurrent).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-[#6b7280] self-center mr-1">Quick switch:</span>
                  {branches.filter(b => !b.isRemote && !b.isCurrent).map((b, i) => (
                    <button
                      key={i}
                      onClick={() => { setCheckoutRef(b.name) }}
                      className="px-2.5 py-1 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] hover:text-white hover:border-[#3d3e4d] transition-colors font-mono"
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Repository Info */}
            {status && (
              <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#9ca3af]" />
                  Repository Configuration
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                    <div>
                      <p className="text-xs text-[#6b7280]">Remote URL</p>
                      <p className="text-sm text-white font-mono">{status.remoteUrl || 'Not configured'}</p>
                    </div>
                    {status.remoteUrl && (
                      <a
                        href={status.remoteUrl.replace('.git', '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                    <div>
                      <p className="text-xs text-[#6b7280]">Current Branch</p>
                      <p className="text-sm text-white font-mono">{status.branch}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                    <div>
                      <p className="text-xs text-[#6b7280]">Application Version</p>
                      <p className="text-sm text-white">v{status.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                    <div>
                      <p className="text-xs text-[#6b7280]">Working Directory</p>
                      <p className="text-sm text-white">Clean</p>
                    </div>
                    <Shield className={`w-4 h-4 ${status.clean ? 'text-emerald-400' : 'text-yellow-400'}`} />
                  </div>
                </div>
              </div>
            )}

            {/* Update Workflow Guide */}
            <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-emerald-400" />
                Update Workflow
              </h3>
              <div className="space-y-3">
                {[
                  { step: 1, title: 'Pull Changes', desc: 'Fetch the latest code from GitHub using the Pull & Push tab. Local changes are automatically stashed and restored.', color: '#10b981' },
                  { step: 2, title: 'Review Changes', desc: 'Check the Status tab to see what files changed and review the commit history for details on what was updated.', color: '#3b82f6' },
                  { step: 3, title: 'Rebuild Application', desc: 'Run the rebuild process from the Pull & Push tab. This installs dependencies, applies migrations, and compiles the code.', color: '#a855f7' },
                  { step: 4, title: 'Restart Server', desc: 'After a successful rebuild, restart the AgentOS server (pm2 restart AgentOS or systemctl restart agentos) to apply changes.', color: '#f59e0b' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                      <span className="text-sm font-bold" style={{ color: item.color }}>{item.step}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-[#9ca3af] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
