'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitCommit, GitCompare, History, RotateCcw, Clock,
  Plus, Trash2, Search, Loader2, ChevronRight,
  ArrowLeftRight, FileText, User, Bot, Settings,
  CheckCircle2, AlertTriangle, Eye, Download,
  ChevronDown, ChevronUp, GitBranch, Tag
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAgentOSStore } from '@/lib/store'

interface AgentVersionData {
  id: string
  agentId: string
  version: number
  config: string
  changeSummary: string
  changeType: string
  diffFrom: string
  author: string
  isCurrent: boolean
  createdAt: string
}

interface AgentData {
  id: string
  name: string
  avatar?: string
  type: string
}

interface DiffEntry {
  path: string
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  valueA?: unknown
  valueB?: unknown
}

const changeTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  create: { label: 'Created', icon: Plus, color: 'text-emerald-400', bg: 'bg-emerald-500/10 text-emerald-400' },
  update: { label: 'Updated', icon: Settings, color: 'text-blue-400', bg: 'bg-blue-500/10 text-blue-400' },
  config_change: { label: 'Config Change', icon: Settings, color: 'text-purple-400', bg: 'bg-purple-500/10 text-purple-400' },
  model_change: { label: 'Model Change', icon: Bot, color: 'text-orange-400', bg: 'bg-orange-500/10 text-orange-400' },
  restore: { label: 'Restored', icon: RotateCcw, color: 'text-yellow-400', bg: 'bg-yellow-500/10 text-yellow-400' },
}

const authorConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  user: { label: 'User', icon: User, color: 'text-emerald-400' },
  agent: { label: 'Agent', icon: Bot, color: 'text-blue-400' },
  system: { label: 'System', icon: Settings, color: 'text-[#9ca3af]' },
}

export function AgentVersioning() {
  const { versioningTab, setVersioningTab } = useAgentOSStore()
  const [versions, setVersions] = useState<AgentVersionData[]>([])
  const [agents, setAgents] = useState<AgentData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVersion, setSelectedVersion] = useState<AgentVersionData | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null)

  // Compare state
  const [compareVersionA, setCompareVersionA] = useState<string>('')
  const [compareVersionB, setCompareVersionB] = useState<string>('')
  const [compareResult, setCompareResult] = useState<{
    versionA: { id: string; version: number; changeSummary: string; changeType: string; author: string; createdAt: string }
    versionB: { id: string; version: number; changeSummary: string; changeType: string; author: string; createdAt: string }
    agent: AgentData | null
    diff: DiffEntry[]
    stats: { totalKeys: number; added: number; removed: number; modified: number; unchanged: number }
    configA: Record<string, unknown>
    configB: Record<string, unknown>
  } | null>(null)
  const [comparing, setComparing] = useState(false)

  const fetchVersions = useCallback(async (agentId?: string | null) => {
    try {
      const params = new URLSearchParams()
      if (agentId) params.set('agentId', agentId)
      const res = await fetch(`/api/agent-versions?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data.versions || [])
        if (data.agents) setAgents(data.agents || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchVersions(selectedAgentId), fetchAgents()])
      setLoading(false)
    }
    loadAll()
  }, [selectedAgentId, fetchVersions, fetchAgents])

  const handleRestore = async (versionId: string) => {
    setRestoringVersionId(versionId)
    try {
      const res = await fetch(`/api/agent-versions/${versionId}/restore`, {
        method: 'POST',
      })
      if (res.ok) {
        await fetchVersions(selectedAgentId)
      }
    } catch (e) { console.error(e) }
    setRestoringVersionId(null)
  }

  const handleDelete = async (versionId: string) => {
    try {
      await fetch(`/api/agent-versions/${versionId}`, { method: 'DELETE' })
      await fetchVersions(selectedAgentId)
      if (selectedVersion?.id === versionId) {
        setSelectedVersion(null)
        setDetailDialogOpen(false)
      }
    } catch (e) { console.error(e) }
  }

  const handleCompare = async () => {
    if (!compareVersionA || !compareVersionB) return
    setComparing(true)
    try {
      const res = await fetch('/api/agent-versions/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionA: compareVersionA, versionB: compareVersionB }),
      })
      if (res.ok) {
        const data = await res.json()
        setCompareResult(data)
      }
    } catch (e) { console.error(e) }
    setComparing(false)
  }

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
  }

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent ? `${agent.avatar || '🤖'} ${agent.name}` : 'Unknown Agent'
  }

  const filteredVersions = versions.filter(v => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        v.changeSummary.toLowerCase().includes(q) ||
        v.changeType.toLowerCase().includes(q) ||
        v.author.toLowerCase().includes(q) ||
        String(v.version).includes(q) ||
        getAgentName(v.agentId).toLowerCase().includes(q)
      )
    }
    return true
  })

  // Group versions by agent for the versions tab
  const versionsByAgent = filteredVersions.reduce<Record<string, AgentVersionData[]>>((acc, v) => {
    if (!acc[v.agentId]) acc[v.agentId] = []
    acc[v.agentId].push(v)
    return acc
  }, {})

  const currentVersions = selectedAgentId
    ? filteredVersions
    : filteredVersions

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <GitCommit className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Agent Versioning</h2>
            <p className="text-xs text-[#6b7280]">Track, compare, and restore agent configurations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedAgentId || 'all'}
            onValueChange={v => setSelectedAgentId(v === 'all' ? null : v)}
          >
            <SelectTrigger className="bg-[#1e1f2b] border-[#2d2e3d] text-white text-xs w-[180px]">
              <SelectValue placeholder="Filter by agent..." />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  {a.avatar} {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="w-4 h-4 text-[#6b7280] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search versions..."
              className="bg-[#1e1f2b] border-[#2d2e3d] text-white text-xs pl-8 w-[180px]"
            />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Versions', value: versions.length, icon: GitCommit, color: 'text-emerald-400' },
          { label: 'Active Agents', value: Object.keys(versionsByAgent).length, icon: Bot, color: 'text-blue-400' },
          { label: 'Current Versions', value: versions.filter(v => v.isCurrent).length, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Restores', value: versions.filter(v => v.changeType === 'restore').length, icon: RotateCcw, color: 'text-yellow-400' },
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

      {/* Tabs */}
      <Tabs value={versioningTab} onValueChange={setVersioningTab} className="space-y-4">
        <TabsList className="bg-[#1e1f2b] border border-[#2d2e3d] h-9 p-0.5">
          <TabsTrigger
            value="versions"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[#6b7280] text-xs px-3 h-8 rounded-md"
          >
            <GitCommit className="w-3.5 h-3.5 mr-1.5" />
            Versions
          </TabsTrigger>
          <TabsTrigger
            value="compare"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[#6b7280] text-xs px-3 h-8 rounded-md"
          >
            <GitCompare className="w-3.5 h-3.5 mr-1.5" />
            Compare
          </TabsTrigger>
          <TabsTrigger
            value="changelog"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[#6b7280] text-xs px-3 h-8 rounded-md"
          >
            <History className="w-3.5 h-3.5 mr-1.5" />
            Changelog
          </TabsTrigger>
        </TabsList>

        {/* ===================== VERSIONS TAB ===================== */}
        <TabsContent value="versions" className="space-y-4">
          {currentVersions.length === 0 ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <GitCommit className="w-12 h-12 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280] mb-1">No versions found</p>
                <p className="text-xs text-[#4b5563]">
                  {selectedAgentId
                    ? 'This agent has no version history yet.'
                    : 'Select an agent or create a version to get started.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar pr-1">
              {Object.entries(versionsByAgent).map(([agentId, agentVersions]) => (
                <div key={agentId}>
                  {!selectedAgentId && (
                    <div className="flex items-center gap-2 mb-2 mt-3 first:mt-0">
                      <Bot className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-white">{getAgentName(agentId)}</span>
                      <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#6b7280]">
                        {agentVersions.length} versions
                      </Badge>
                    </div>
                  )}
                  <div className="space-y-2">
                    {agentVersions
                      .sort((a, b) => b.version - a.version)
                      .map((version, i) => {
                        const typeConf = changeTypeConfig[version.changeType] || changeTypeConfig.update
                        const authorConf = authorConfig[version.author] || authorConfig.user
                        const TypeIcon = typeConf.icon
                        const AuthorIcon = authorConf.icon

                        // Parse diff to count changes
                        let changeCount = 0
                        try {
                          const diff = JSON.parse(version.diffFrom || '{}')
                          changeCount = Object.keys(diff).length
                        } catch { changeCount = 0 }

                        return (
                          <motion.div
                            key={version.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <Card
                              className={`bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-all cursor-pointer ${
                                version.isCurrent ? 'border-emerald-500/30' : ''
                              }`}
                              onClick={() => {
                                setSelectedVersion(version)
                                setDetailDialogOpen(true)
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  {/* Version timeline dot */}
                                  <div className="flex flex-col items-center pt-0.5">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                      version.isCurrent
                                        ? 'bg-emerald-500/20 border border-emerald-500/40'
                                        : 'bg-[#0f1117] border border-[#2d2e3d]'
                                    }`}>
                                      <TypeIcon className={`w-4 h-4 ${version.isCurrent ? 'text-emerald-400' : typeConf.color}`} />
                                    </div>
                                    {i < agentVersions.length - 1 && (
                                      <div className="w-px h-6 bg-[#2d2e3d] mt-1" />
                                    )}
                                  </div>

                                  {/* Version info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-semibold text-white flex items-center gap-1">
                                        <Tag className="w-3 h-3 text-[#6b7280]" />
                                        v{version.version}
                                      </span>
                                      <Badge variant="outline" className={`text-[9px] ${typeConf.bg} border-current/20`}>
                                        {typeConf.label}
                                      </Badge>
                                      {version.isCurrent && (
                                        <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
                                          Current
                                        </Badge>
                                      )}
                                      <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                                        <AuthorIcon className={`w-3 h-3 ${authorConf.color}`} />
                                        {authorConf.label}
                                      </span>
                                    </div>
                                    <p className="text-xs text-[#9ca3af] mt-1 line-clamp-1">
                                      {version.changeSummary || 'No change summary'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#6b7280]">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTimeAgo(version.createdAt)}
                                      </span>
                                      {changeCount > 0 && (
                                        <span className="flex items-center gap-1">
                                          <ArrowLeftRight className="w-3 h-3" />
                                          {changeCount} change{changeCount !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                    {!version.isCurrent && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-emerald-400 hover:bg-emerald-500/10 h-7 w-7 p-0"
                                          onClick={() => handleRestore(version.id)}
                                          disabled={restoringVersionId === version.id}
                                          title="Restore this version"
                                        >
                                          {restoringVersionId === version.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <RotateCcw className="w-3.5 h-3.5" />
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                                          onClick={() => handleDelete(version.id)}
                                          title="Delete this version"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-[#6b7280] hover:text-white hover:bg-[#1e1f2b] h-7 w-7 p-0"
                                      onClick={() => {
                                        setSelectedVersion(version)
                                        setDetailDialogOpen(true)
                                      }}
                                      title="View details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===================== COMPARE TAB ===================== */}
        <TabsContent value="compare" className="space-y-4">
          <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#9ca3af] flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-emerald-400" />
                Compare Versions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-[#9ca3af] flex items-center gap-1">
                    <ChevronDown className="w-3 h-3" /> Version A (Older)
                  </label>
                  <Select value={compareVersionA} onValueChange={setCompareVersionA}>
                    <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-xs">
                      <SelectValue placeholder="Select version..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d] max-h-60">
                      {versions.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          <span className="flex items-center gap-2">
                            <Tag className="w-3 h-3 text-[#6b7280]" />
                            v{v.version} — {getAgentName(v.agentId)}
                            {v.isCurrent && <span className="text-emerald-400">(current)</span>}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-[#9ca3af] flex items-center gap-1">
                    <ChevronUp className="w-3 h-3" /> Version B (Newer)
                  </label>
                  <Select value={compareVersionB} onValueChange={setCompareVersionB}>
                    <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-xs">
                      <SelectValue placeholder="Select version..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d] max-h-60">
                      {versions.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          <span className="flex items-center gap-2">
                            <Tag className="w-3 h-3 text-[#6b7280]" />
                            v{v.version} — {getAgentName(v.agentId)}
                            {v.isCurrent && <span className="text-emerald-400">(current)</span>}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleCompare}
                disabled={!compareVersionA || !compareVersionB || comparing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {comparing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <GitCompare className="w-4 h-4 mr-2" />
                )}
                Compare
              </Button>
            </CardContent>
          </Card>

          {/* Compare Result */}
          <AnimatePresence>
            {compareResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Comparison Header */}
                <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 mb-1">
                          Version A
                        </Badge>
                        <p className="text-lg font-bold text-white">v{compareResult.versionA.version}</p>
                        <p className="text-[10px] text-[#6b7280]">{compareResult.versionA.changeSummary || 'No summary'}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <ArrowLeftRight className="w-6 h-6 text-emerald-400" />
                        {compareResult.agent && (
                          <span className="text-[10px] text-[#9ca3af]">{compareResult.agent.avatar} {compareResult.agent.name}</span>
                        )}
                      </div>
                      <div className="text-center">
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 mb-1">
                          Version B
                        </Badge>
                        <p className="text-lg font-bold text-white">v{compareResult.versionB.version}</p>
                        <p className="text-[10px] text-[#6b7280]">{compareResult.versionB.changeSummary || 'No summary'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Diff Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: 'Added', value: compareResult.stats.added, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Removed', value: compareResult.stats.removed, color: 'text-red-400', bg: 'bg-red-500/10' },
                    { label: 'Modified', value: compareResult.stats.modified, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                    { label: 'Unchanged', value: compareResult.stats.unchanged, color: 'text-[#6b7280]', bg: 'bg-[#2d2e3d]/50' },
                    { label: 'Total Keys', value: compareResult.stats.totalKeys, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-lg p-3 text-center`}>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] text-[#6b7280]">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Side-by-side diff */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-blue-400 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        v{compareResult.versionA.version} Config
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-[11px] font-mono text-[#9ca3af] bg-[#0f1117] rounded-lg p-3 max-h-80 overflow-auto custom-scrollbar whitespace-pre-wrap">
                        {JSON.stringify(compareResult.configA, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-emerald-400 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        v{compareResult.versionB.version} Config
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-[11px] font-mono text-[#9ca3af] bg-[#0f1117] rounded-lg p-3 max-h-80 overflow-auto custom-scrollbar whitespace-pre-wrap">
                        {JSON.stringify(compareResult.configB, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>

                {/* Diff detail list */}
                {compareResult.diff.length > 0 && (
                  <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-[#9ca3af] flex items-center gap-2">
                        <GitBranch className="w-3.5 h-3.5" />
                        Diff Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
                        {compareResult.diff
                          .filter(d => d.type !== 'unchanged')
                          .map((entry, i) => (
                            <div
                              key={i}
                              className={`flex items-start gap-2 p-2 rounded text-xs font-mono ${
                                entry.type === 'added'
                                  ? 'bg-emerald-500/5 border-l-2 border-emerald-500'
                                  : entry.type === 'removed'
                                  ? 'bg-red-500/5 border-l-2 border-red-500'
                                  : 'bg-yellow-500/5 border-l-2 border-yellow-500'
                              }`}
                            >
                              <Badge variant="outline" className={`text-[8px] min-w-[60px] justify-center ${
                                entry.type === 'added'
                                  ? 'border-emerald-500/30 text-emerald-400'
                                  : entry.type === 'removed'
                                  ? 'border-red-500/30 text-red-400'
                                  : 'border-yellow-500/30 text-yellow-400'
                              }`}>
                                {entry.type === 'added' ? '+ ADD' : entry.type === 'removed' ? '- REM' : '~ MOD'}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <span className="text-white">{entry.path}</span>
                                {entry.type === 'modified' && (
                                  <div className="text-[10px] mt-0.5">
                                    <span className="text-red-400 line-through">
                                      {JSON.stringify(entry.valueA)}
                                    </span>
                                    {' → '}
                                    <span className="text-emerald-400">
                                      {JSON.stringify(entry.valueB)}
                                    </span>
                                  </div>
                                )}
                                {entry.type === 'added' && (
                                  <div className="text-[10px] text-emerald-400 mt-0.5">
                                    {JSON.stringify(entry.valueB)}
                                  </div>
                                )}
                                {entry.type === 'removed' && (
                                  <div className="text-[10px] text-red-400 mt-0.5">
                                    {JSON.stringify(entry.valueA)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        {compareResult.diff.filter(d => d.type !== 'unchanged').length === 0 && (
                          <p className="text-xs text-[#6b7280] text-center py-4">No differences found between versions.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!compareResult && versions.length === 0 && (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <GitCompare className="w-12 h-12 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280]">No versions available to compare.</p>
                <p className="text-xs text-[#4b5563]">Create versions by updating agent configurations.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===================== CHANGELOG TAB ===================== */}
        <TabsContent value="changelog" className="space-y-4">
          {currentVersions.length === 0 ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <History className="w-12 h-12 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280]">No changelog entries yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar pr-1">
              {Object.entries(versionsByAgent)
                .sort(([a], [b]) => getAgentName(a).localeCompare(getAgentName(b)))
                .map(([agentId, agentVersions]) => {
                  const sorted = [...agentVersions].sort((a, b) => b.version - a.version)
                  const agent = agents.find(a => a.id === agentId)

                  return (
                    <Card key={agentId} className="bg-[#1e1f2b] border-[#2d2e3d]">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-sm">
                            {agent?.avatar || '🤖'}
                          </div>
                          <div>
                            <CardTitle className="text-sm text-white">{agent?.name || 'Unknown Agent'}</CardTitle>
                            <p className="text-[10px] text-[#6b7280]">
                              {agent?.type} • {agentVersions.length} versions
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="relative pl-6 border-l-2 border-[#2d2e3d] space-y-4">
                          {sorted.map((version, i) => {
                            const typeConf = changeTypeConfig[version.changeType] || changeTypeConfig.update
                            const authorConf = authorConfig[version.author] || authorConfig.user
                            const TypeIcon = typeConf.icon

                            return (
                              <motion.div
                                key={version.id}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="relative"
                              >
                                {/* Timeline dot */}
                                <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 ${
                                  version.isCurrent
                                    ? 'bg-emerald-500 border-emerald-400'
                                    : 'bg-[#0f1117] border-[#2d2e3d]'
                                }`} />

                                <div className="bg-[#0f1117] rounded-lg p-3 border border-[#2d2e3d]">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-white">v{version.version}</span>
                                    <Badge variant="outline" className={`text-[9px] ${typeConf.bg} border-current/20`}>
                                      <TypeIcon className="w-2.5 h-2.5 mr-1" />
                                      {typeConf.label}
                                    </Badge>
                                    {version.isCurrent && (
                                      <Badge className="text-[8px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
                                        Current
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#9ca3af]">
                                    {version.changeSummary || 'No change summary provided'}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[#6b7280]">
                                    <span className="flex items-center gap-1">
                                      <authorConf.icon className={`w-3 h-3 ${authorConf.color}`} />
                                      {authorConf.label}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(version.createdAt).toLocaleString()}
                                    </span>
                                  </div>

                                  {/* Show diff preview if available */}
                                  {(() => {
                                    try {
                                      const diff = JSON.parse(version.diffFrom || '{}')
                                      const keys = Object.keys(diff)
                                      if (keys.length > 0) {
                                        return (
                                          <div className="mt-2 p-2 rounded bg-[#1e1f2b] text-[10px] font-mono">
                                            {keys.slice(0, 5).map(key => (
                                              <div key={key} className="flex items-center gap-1">
                                                <span className="text-yellow-400">~</span>
                                                <span className="text-[#9ca3af]">{key}</span>
                                              </div>
                                            ))}
                                            {keys.length > 5 && (
                                              <span className="text-[#4b5563]">+{keys.length - 5} more changes</span>
                                            )}
                                          </div>
                                        )
                                      }
                                    } catch { /* no diff */ }
                                    return null
                                  })()}
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Version Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-emerald-400" />
              Version Details
            </DialogTitle>
          </DialogHeader>
          {selectedVersion && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#0f1117]">
                  <p className="text-[10px] text-[#6b7280] mb-1">Version</p>
                  <p className="text-sm font-bold text-white">v{selectedVersion.version}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#0f1117]">
                  <p className="text-[10px] text-[#6b7280] mb-1">Change Type</p>
                  <Badge variant="outline" className={`text-[10px] ${changeTypeConfig[selectedVersion.changeType]?.bg || 'bg-[#2d2e3d] text-[#6b7280]'} border-current/20`}>
                    {changeTypeConfig[selectedVersion.changeType]?.label || selectedVersion.changeType}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-[#0f1117]">
                  <p className="text-[10px] text-[#6b7280] mb-1">Author</p>
                  <p className="text-sm text-white flex items-center gap-1">
                    {(() => {
                      const ac = authorConfig[selectedVersion.author] || authorConfig.user
                      const AcIcon = ac.icon
                      return <><AcIcon className={`w-3.5 h-3.5 ${ac.color}`} /> {ac.label}</>
                    })()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#0f1117]">
                  <p className="text-[10px] text-[#6b7280] mb-1">Created</p>
                  <p className="text-sm text-white">{new Date(selectedVersion.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0f1117]">
                <p className="text-[10px] text-[#6b7280] mb-1">Change Summary</p>
                <p className="text-sm text-[#9ca3af]">
                  {selectedVersion.changeSummary || 'No summary provided'}
                </p>
              </div>

              {/* Diff from previous */}
              {(() => {
                try {
                  const diff = JSON.parse(selectedVersion.diffFrom || '{}')
                  const keys = Object.keys(diff)
                  if (keys.length > 0) {
                    return (
                      <div className="p-3 rounded-lg bg-[#0f1117]">
                        <p className="text-[10px] text-[#6b7280] mb-2 flex items-center gap-1">
                          <ArrowLeftRight className="w-3 h-3" /> Diff from Previous Version
                        </p>
                        <div className="space-y-1">
                          {keys.map(key => {
                            const change = diff[key] as { from?: unknown; to?: unknown }
                            return (
                              <div key={key} className="p-2 rounded bg-yellow-500/5 border-l-2 border-yellow-500 text-xs font-mono">
                                <span className="text-white">{key}</span>
                                <div className="text-[10px] mt-0.5">
                                  {change.from !== undefined && (
                                    <span className="text-red-400 line-through mr-1">
                                      {JSON.stringify(change.from)}
                                    </span>
                                  )}
                                  {change.to !== undefined && (
                                    <span className="text-emerald-400">
                                      → {JSON.stringify(change.to)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }
                } catch { /* no diff */ }
                return null
              })()}

              {/* Full config */}
              <div className="p-3 rounded-lg bg-[#0f1117]">
                <p className="text-[10px] text-[#6b7280] mb-2 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Full Configuration
                </p>
                <pre className="text-[11px] font-mono text-[#9ca3af] bg-[#1e1f2b] rounded-lg p-3 max-h-64 overflow-auto custom-scrollbar whitespace-pre-wrap">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedVersion.config), null, 2)
                    } catch {
                      return selectedVersion.config
                    }
                  })()}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {!selectedVersion.isCurrent && (
                  <Button
                    onClick={() => {
                      handleRestore(selectedVersion.id)
                      setDetailDialogOpen(false)
                    }}
                    disabled={restoringVersionId === selectedVersion.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {restoringVersionId === selectedVersion.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4 mr-2" />
                    )}
                    Restore This Version
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompareVersionA(selectedVersion.id)
                    setVersioningTab('compare')
                    setDetailDialogOpen(false)
                  }}
                  className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Use in Compare
                </Button>
                {!selectedVersion.isCurrent && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleDelete(selectedVersion.id)
                      setDetailDialogOpen(false)
                    }}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
