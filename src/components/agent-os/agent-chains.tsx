'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, GitBranch, Play, RotateCcw, Zap,
  Plus, Trash2, CheckCircle2, XCircle, Clock, AlertTriangle,
  ChevronRight, Loader2, Search, Settings, Activity,
  Timer, Hash, Eye, Layers, Workflow, ChevronDown, ChevronUp
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

interface ChainStep {
  agentId: string
  inputMapping?: string
  outputKey?: string
  condition?: string
  maxRetries?: number
  timeout?: number
}

interface ChainRunData {
  id: string
  chainId: string
  status: string
  input: string
  output?: string | null
  error?: string | null
  stepResults: string
  currentStep: number
  totalSteps: number
  tokensUsed: number
  duration: number
  startedAt: string
  completedAt?: string | null
}

interface ChainData {
  id: string
  name: string
  description?: string | null
  status: string
  chainType: string
  steps: string
  connections: string
  inputSchema: string
  outputSchema: string
  errorStrategy: string
  maxRetries: number
  timeout: number
  lastRunAt?: string | null
  runCount: number
  successCount: number
  avgDuration: number
  createdAt: string
  updatedAt: string
  runs?: ChainRunData[]
}

interface AgentData {
  id: string
  name: string
  type: string
  avatar?: string
  status: string
}

const chainTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string; desc: string }> = {
  sequential: { label: 'Sequential', icon: ArrowRight, color: 'text-emerald-400', desc: 'Steps execute one after another in order' },
  parallel: { label: 'Parallel', icon: Layers, color: 'text-blue-400', desc: 'Steps execute simultaneously' },
  conditional: { label: 'Conditional', icon: GitBranch, color: 'text-purple-400', desc: 'Branching based on conditions' },
  loop: { label: 'Loop', icon: RotateCcw, color: 'text-orange-400', desc: 'Repeat steps until condition met' },
}

const statusColors: Record<string, string> = {
  draft: 'text-[#6b7280]',
  active: 'text-emerald-400',
  running: 'text-yellow-400',
  completed: 'text-blue-400',
  error: 'text-red-400',
  paused: 'text-orange-400',
}

const statusBgColors: Record<string, string> = {
  draft: 'bg-[#6b7280]/10 text-[#6b7280]',
  active: 'bg-emerald-500/10 text-emerald-400',
  running: 'bg-yellow-500/10 text-yellow-400',
  completed: 'bg-blue-500/10 text-blue-400',
  error: 'bg-red-500/10 text-red-400',
  paused: 'bg-orange-500/10 text-orange-400',
  failed: 'bg-red-500/10 text-red-400',
  cancelled: 'bg-[#4b5563]/10 text-[#4b5563]',
  timeout: 'bg-orange-500/10 text-orange-400',
}

const errorStrategyConfig: Record<string, { label: string; color: string; desc: string }> = {
  stop: { label: 'Stop', color: 'text-red-400', desc: 'Halt chain on any error' },
  skip: { label: 'Skip', color: 'text-yellow-400', desc: 'Skip failed step and continue' },
  retry: { label: 'Retry', color: 'text-blue-400', desc: 'Retry failed step up to max retries' },
  fallback: { label: 'Fallback', color: 'text-purple-400', desc: 'Use fallback agent on failure' },
}

export function AgentChains() {
  const { chainsTab, setChainsTab } = useAgentOSStore()
  const [chains, setChains] = useState<ChainData[]>([])
  const [agents, setAgents] = useState<AgentData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [chainRuns, setChainRuns] = useState<ChainRunData[]>([])
  const [selectedRun, setSelectedRun] = useState<ChainRunData | null>(null)
  const [runningChainId, setRunningChainId] = useState<string | null>(null)

  // Builder state
  const [builderSteps, setBuilderSteps] = useState<ChainStep[]>([])
  const [builderChainId, setBuilderChainId] = useState<string | null>(null)

  const [newChain, setNewChain] = useState({
    name: '',
    description: '',
    chainType: 'sequential',
    errorStrategy: 'stop',
    maxRetries: 1,
    timeout: 300000,
  })

  const fetchChains = useCallback(async () => {
    try {
      const res = await fetch('/api/chains')
      if (res.ok) {
        const data = await res.json()
        setChains(data.chains || [])
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

  const fetchChainDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chains/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedChain(data.chain)
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchChainRuns = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chains/${id}/runs`)
      if (res.ok) {
        const data = await res.json()
        setChainRuns(data.runs || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchChains(), fetchAgents()])
      setLoading(false)
    }
    loadAll()
  }, [fetchChains, fetchAgents])

  // Auto-load runs when on Runs tab
  useEffect(() => {
    if (chainsTab === 'runs' && selectedChain) {
      let cancelled = false
      const load = async () => {
        try {
          const res = await fetch(`/api/chains/${selectedChain.id}/runs`)
          if (res.ok && !cancelled) {
            const data = await res.json()
            setChainRuns(data.runs || [])
          }
        } catch (e) { if (!cancelled) console.error(e) }
      }
      load()
      return () => { cancelled = true }
    }
  }, [chainsTab, selectedChain])

  const handleCreateChain = async () => {
    try {
      const res = await fetch('/api/chains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChain),
      })
      if (res.ok) {
        await fetchChains()
        setCreateDialogOpen(false)
        setNewChain({ name: '', description: '', chainType: 'sequential', errorStrategy: 'stop', maxRetries: 1, timeout: 300000 })
      }
    } catch (e) { console.error(e) }
  }

  const handleDeleteChain = async (id: string) => {
    try {
      await fetch(`/api/chains/${id}`, { method: 'DELETE' })
      await fetchChains()
      if (selectedChain?.id === id) setSelectedChain(null)
    } catch (e) { console.error(e) }
  }

  const handleUpdateChain = async (id: string, data: Record<string, unknown>) => {
    try {
      await fetch(`/api/chains/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      await fetchChains()
      if (selectedChain?.id === id) await fetchChainDetail(id)
    } catch (e) { console.error(e) }
  }

  const handleRunChain = async (id: string) => {
    setRunningChainId(id)
    try {
      const res = await fetch(`/api/chains/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: {} }),
      })
      if (res.ok) {
        await fetchChains()
        if (selectedChain?.id === id) await fetchChainDetail(id)
        if (chainsTab === 'runs') await fetchChainRuns(id)
      }
    } catch (e) { console.error(e) }
    setRunningChainId(null)
  }

  const handleOpenBuilder = (chain: ChainData) => {
    setBuilderChainId(chain.id)
    try {
      const steps = JSON.parse(chain.steps || '[]')
      setBuilderSteps(steps.length > 0 ? steps : [{ agentId: '', inputMapping: '', outputKey: '' }])
    } catch {
      setBuilderSteps([{ agentId: '', inputMapping: '', outputKey: '' }])
    }
    setSelectedChain(chain)
    setChainsTab('builder')
  }

  const handleSaveBuilderSteps = async () => {
    if (!builderChainId) return
    try {
      await fetch(`/api/chains/${builderChainId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: builderSteps }),
      })
      await fetchChains()
      await fetchChainDetail(builderChainId)
    } catch (e) { console.error(e) }
  }

  const addBuilderStep = () => {
    setBuilderSteps([...builderSteps, { agentId: '', inputMapping: '', outputKey: '' }])
  }

  const removeBuilderStep = (index: number) => {
    setBuilderSteps(builderSteps.filter((_, i) => i !== index))
  }

  const updateBuilderStep = (index: number, field: keyof ChainStep, value: string | number) => {
    const updated = [...builderSteps]
    updated[index] = { ...updated[index], [field]: value }
    setBuilderSteps(updated)
  }

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent ? `${agent.avatar || '🤖'} ${agent.name}` : agentId.slice(0, 8)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const getSuccessRate = (chain: ChainData) => {
    if (chain.runCount === 0) return 0
    return Math.round((chain.successCount / chain.runCount) * 100)
  }

  const filteredChains = chains.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeChains = chains.filter(c => c.status === 'active' || c.status === 'running').length
  const totalRuns = chains.reduce((sum, c) => sum + c.runCount, 0)
  const avgSuccessRate = chains.length > 0
    ? Math.round(chains.reduce((sum, c) => sum + getSuccessRate(c), 0) / chains.length)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  // ===================== BUILDER TAB =====================
  if (chainsTab === 'builder' && selectedChain) {
    const chain = selectedChain
    const TypeIcon = chainTypeConfig[chain.chainType]?.icon || Workflow

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
              onClick={() => setChainsTab('chains')}
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TypeIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Builder: {chain.name}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${chainTypeConfig[chain.chainType]?.color || 'text-[#9ca3af]'} border-current/30`}>
                    {chainTypeConfig[chain.chainType]?.label || chain.chainType}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${statusBgColors[chain.status] || 'border-[#2d2e3d] text-[#6b7280]'}`}>
                    {chain.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
              onClick={() => handleOpenBuilder(chain)}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Refresh
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSaveBuilderSteps}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Save Steps
            </Button>
          </div>
        </div>

        {/* Chain Configuration */}
        <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#9ca3af] flex items-center gap-2">
              <Settings className="w-4 h-4" />Chain Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-[#0f1117]">
                <p className="text-[10px] text-[#6b7280] mb-1">Error Strategy</p>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${errorStrategyConfig[chain.errorStrategy]?.color || 'text-white'}`}>
                    {errorStrategyConfig[chain.errorStrategy]?.label || chain.errorStrategy}
                  </span>
                </div>
                <p className="text-[9px] text-[#4b5563] mt-1">{errorStrategyConfig[chain.errorStrategy]?.desc}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0f1117]">
                <p className="text-[10px] text-[#6b7280] mb-1">Max Retries</p>
                <p className="text-sm font-bold text-white">{chain.maxRetries}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0f1117]">
                <p className="text-[10px] text-[#6b7280] mb-1">Timeout</p>
                <p className="text-sm font-bold text-white">{formatDuration(chain.timeout)}</p>
              </div>
            </div>

            {/* Edit config buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b] text-xs"
                onClick={() => setEditDialogOpen(true)}
              >
                <Settings className="w-3 h-3 mr-1" />Edit Config
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step Pipeline Builder */}
        <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-[#9ca3af] flex items-center gap-2">
                <Workflow className="w-4 h-4" />Step Pipeline
              </CardTitle>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7" onClick={addBuilderStep}>
                <Plus className="w-3 h-3 mr-1" />Add Step
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {builderSteps.length === 0 ? (
              <div className="text-center py-8">
                <Workflow className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280] mb-3">No steps configured. Add steps to build your chain.</p>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={addBuilderStep}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />Add Step
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {builderSteps.map((step, index) => {
                  const agent = agents.find(a => a.id === step.agentId)
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Arrow connector */}
                      {index > 0 && (
                        <div className="flex justify-center py-1">
                          <ArrowRight className="w-4 h-4 text-emerald-400 rotate-90" />
                        </div>
                      )}
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-[#0f1117] border border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-sm font-bold text-emerald-400">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] text-[#6b7280] mb-1 block">Agent</label>
                            <Select
                              value={step.agentId || 'none'}
                              onValueChange={v => updateBuilderStep(index, 'agentId', v === 'none' ? '' : v)}
                            >
                              <SelectTrigger className="bg-[#1e1f2b] border-[#2d2e3d] text-white text-xs h-8">
                                <SelectValue placeholder="Select agent..." />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                                <SelectItem value="none">None</SelectItem>
                                {agents.map(a => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {a.avatar} {a.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[10px] text-[#6b7280] mb-1 block">Input Mapping</label>
                            <Input
                              value={step.inputMapping || ''}
                              onChange={e => updateBuilderStep(index, 'inputMapping', e.target.value)}
                              placeholder="e.g. $.prev.output"
                              className="bg-[#1e1f2b] border-[#2d2e3d] text-white text-xs h-8 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#6b7280] mb-1 block">Output Key</label>
                            <Input
                              value={step.outputKey || ''}
                              onChange={e => updateBuilderStep(index, 'outputKey', e.target.value)}
                              placeholder="e.g. result"
                              className="bg-[#1e1f2b] border-[#2d2e3d] text-white text-xs h-8 font-mono"
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 flex-shrink-0"
                          onClick={() => removeBuilderStep(index)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Visual Pipeline Preview */}
            {builderSteps.length > 0 && (
              <div className="mt-6 p-4 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                <p className="text-xs text-[#6b7280] mb-3">Pipeline Preview</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {builderSteps.map((step, index) => {
                    const agent = agents.find(a => a.id === step.agentId)
                    return (
                      <div key={index} className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#1e1f2b] border border-emerald-500/20 min-w-[80px]">
                          <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-xs">
                            {agent?.avatar || '🤖'}
                          </div>
                          <span className="text-[9px] text-white font-medium truncate max-w-[70px]">
                            {agent?.name || 'Unset'}
                          </span>
                          {step.outputKey && (
                            <Badge variant="outline" className="text-[8px] border-emerald-500/20 text-emerald-400">
                              {step.outputKey}
                            </Badge>
                          )}
                        </div>
                        {index < builderSteps.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Config Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Chain Config</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Name</label>
                <Input
                  defaultValue={chain.name}
                  onBlur={e => handleUpdateChain(chain.id, { name: e.target.value })}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Error Strategy</label>
                <Select
                  value={chain.errorStrategy}
                  onValueChange={v => handleUpdateChain(chain.id, { errorStrategy: v })}
                >
                  <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                    {Object.entries(errorStrategyConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className={cfg.color}>{cfg.label}</span> - {cfg.desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Max Retries</label>
                  <Input
                    type="number"
                    defaultValue={chain.maxRetries}
                    onBlur={e => handleUpdateChain(chain.id, { maxRetries: parseInt(e.target.value) || 1 })}
                    className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Timeout (ms)</label>
                  <Input
                    type="number"
                    defaultValue={chain.timeout}
                    onBlur={e => handleUpdateChain(chain.id, { timeout: parseInt(e.target.value) || 300000 })}
                    className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                  />
                </div>
              </div>
              <Button
                onClick={() => setEditDialogOpen(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ===================== RUNS TAB =====================
  if (chainsTab === 'runs') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
              onClick={() => setChainsTab('chains')}
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back
            </Button>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Chain Runs
            </h2>
          </div>
          {selectedChain && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                {selectedChain.name}
              </Badge>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleRunChain(selectedChain.id)}
                disabled={runningChainId === selectedChain.id}
              >
                {runningChainId === selectedChain.id ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                )}
                Run Chain
              </Button>
            </div>
          )}
        </div>

        {/* Chain selector if none selected */}
        {!selectedChain && (
          <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardContent className="p-6 text-center">
              <Activity className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
              <p className="text-sm text-[#6b7280] mb-4">Select a chain to view its runs.</p>
              <Select onValueChange={async (id) => {
                const chain = chains.find(c => c.id === id)
                if (chain) {
                  setSelectedChain(chain)
                  await fetchChainRuns(id)
                }
              }}>
                <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm max-w-xs mx-auto">
                  <SelectValue placeholder="Select a chain..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                  {chains.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Runs list */}
        {selectedChain && chainRuns.length === 0 && (
          <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardContent className="p-8 text-center">
              <Activity className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
              <p className="text-sm text-[#6b7280]">No runs yet. Execute the chain to see results.</p>
            </CardContent>
          </Card>
        )}

        {selectedChain && chainRuns.length > 0 && (
          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
            {chainRuns.map((run, i) => {
              const stepResults = (() => {
                try { return JSON.parse(run.stepResults || '[]') } catch { return [] }
              })()
              const completedSteps = stepResults.filter((s: { status: string }) => s.status === 'completed').length
              const failedSteps = stepResults.filter((s: { status: string }) => s.status === 'failed').length
              const isExpanded = selectedRun?.id === run.id

              return (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                    <CardContent className="p-4">
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setSelectedRun(isExpanded ? null : run)}
                      >
                        <div className="flex-shrink-0">
                          {run.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : run.status === 'failed' ? (
                            <XCircle className="w-5 h-5 text-red-400" />
                          ) : run.status === 'running' ? (
                            <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                          ) : (
                            <Clock className="w-5 h-5 text-[#6b7280]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-white">Run #{run.id.slice(-6)}</span>
                            <Badge variant="outline" className={`text-[9px] ${statusBgColors[run.status] || 'border-[#2d2e3d] text-[#6b7280]'}`}>
                              {run.status}
                            </Badge>
                            <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                              <Timer className="w-3 h-3" />{formatDuration(run.duration)}
                            </span>
                            <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                              <Hash className="w-3 h-3" />{run.tokensUsed} tokens
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-[#6b7280]">
                            <span>Steps: {completedSteps}/{run.totalSteps}</span>
                            {failedSteps > 0 && <span className="text-red-400">{failedSteps} failed</span>}
                            <span>{new Date(run.startedAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-[#6b7280]" /> : <ChevronDown className="w-4 h-4 text-[#6b7280]" />}
                        </div>
                      </div>

                      {/* Expanded step results */}
                      <AnimatePresence>
                        {isExpanded && stepResults.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-[#2d2e3d] space-y-2">
                              {stepResults.map((step: { stepIndex: number; agentId: string; duration: number; status: string; output: string; input: string }, si: number) => (
                                <div key={si} className="flex items-center gap-3 p-2 rounded bg-[#0f1117]">
                                  <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                                    {step.stepIndex + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-white">{getAgentName(step.agentId)}</span>
                                      <Badge variant="outline" className={`text-[8px] ${step.status === 'completed' ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}>
                                        {step.status}
                                      </Badge>
                                    </div>
                                    <div className="text-[10px] text-[#6b7280] mt-0.5">
                                      Duration: {formatDuration(step.duration)}
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {step.status === 'completed' ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-400" />
                                    )}
                                  </div>
                                </div>
                              ))}
                              {run.error && (
                                <div className="p-2 rounded bg-red-500/5 border border-red-500/10">
                                  <p className="text-xs text-red-400 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />{run.error}
                                  </p>
                                </div>
                              )}
                              {/* Re-run button for failed */}
                              {run.status === 'failed' && selectedChain && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs mt-1"
                                  onClick={() => handleRunChain(selectedChain.id)}
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />Re-run Chain
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ===================== MONITORING TAB =====================
  if (chainsTab === 'monitoring') {
    const runningChains = chains.filter(c => c.status === 'running')
    const recentChains = chains.filter(c => c.lastRunAt).sort((a, b) => new Date(b.lastRunAt!).getTime() - new Date(a.lastRunAt!).getTime()).slice(0, 10)
    const totalTokensUsed = chains.reduce((sum, c) => sum + (c.avgDuration * c.runCount * 0.3), 0) // simulated
    const avgDur = chains.length > 0 ? Math.round(chains.reduce((sum, c) => sum + c.avgDuration, 0) / chains.length) : 0

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-400" />
            Chain Monitoring
          </h2>
        </div>

        {/* Monitoring Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Running', value: runningChains.length, icon: Play, color: 'text-yellow-400' },
            { label: 'Total Runs', value: totalRuns, icon: Activity, color: 'text-emerald-400' },
            { label: 'Avg Duration', value: formatDuration(avgDur), icon: Timer, color: 'text-blue-400' },
            { label: 'Success Rate', value: `${avgSuccessRate}%`, icon: CheckCircle2, color: 'text-green-400' },
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

        {/* Active Chains */}
        {runningChains.length > 0 && (
          <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#9ca3af] flex items-center gap-2">
                <Play className="w-4 h-4 text-yellow-400" />Active Executions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {runningChains.map(chain => (
                <div key={chain.id} className="flex items-center gap-3 p-3 rounded bg-[#0f1117]">
                  <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{chain.name}</p>
                    <p className="text-[10px] text-[#6b7280]">{chain.chainType} | Run #{chain.runCount}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-yellow-500/30 text-yellow-400">
                    running
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#9ca3af] flex items-center gap-2">
              <Clock className="w-4 h-4" />Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentChains.length === 0 ? (
              <p className="text-sm text-[#6b7280] text-center py-4">No chain activity yet.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                {recentChains.map(chain => {
                  const successRate = getSuccessRate(chain)
                  return (
                    <div key={chain.id} className="flex items-center gap-3 p-3 rounded bg-[#0f1117] hover:bg-[#0f1117]/80 transition-colors cursor-pointer" onClick={() => {
                      setSelectedChain(chain)
                      setChainsTab('runs')
                      fetchChainRuns(chain.id)
                    }}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusBgColors[chain.status] || 'bg-[#2d2e3d]'}`}>
                        {chain.status === 'completed' || chain.status === 'active' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : chain.status === 'error' ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{chain.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-[#6b7280]">
                          <span>{chain.lastRunAt ? new Date(chain.lastRunAt).toLocaleString() : 'Never'}</span>
                          <span>|</span>
                          <span>Duration: {formatDuration(chain.avgDuration)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <div className="w-full h-1.5 bg-[#1e1f2b] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${successRate >= 80 ? 'bg-emerald-500' : successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                          <p className="text-[8px] text-[#6b7280] text-center mt-0.5">{successRate}%</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token Usage (simulated) */}
        <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#9ca3af] flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />Token Usage Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chains.filter(c => c.runCount > 0).slice(0, 5).map(chain => {
                const estTokens = Math.round(chain.avgDuration * chain.runCount * 0.3)
                const maxTokens = Math.max(...chains.filter(c => c.runCount > 0).map(c => c.avgDuration * c.runCount * 0.3), 1)
                const pct = Math.round((estTokens / maxTokens) * 100)
                return (
                  <div key={chain.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white">{chain.name}</span>
                      <span className="text-[10px] text-[#6b7280]">~{estTokens.toLocaleString()} tokens</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      />
                    </div>
                  </div>
                )
              })}
              {chains.filter(c => c.runCount > 0).length === 0 && (
                <p className="text-sm text-[#6b7280] text-center py-4">No token usage data yet. Run a chain to see usage.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===================== CHAINS TAB (DEFAULT) =====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Agent Chains</h2>
              <p className="text-xs text-[#6b7280]">Build sequential & parallel agent pipelines</p>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />Create Chain
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Chains', value: chains.length, icon: GitBranch, color: 'text-emerald-400' },
          { label: 'Active', value: activeChains, icon: Play, color: 'text-yellow-400' },
          { label: 'Total Runs', value: totalRuns, icon: Activity, color: 'text-blue-400' },
          { label: 'Avg Success', value: `${avgSuccessRate}%`, icon: CheckCircle2, color: 'text-green-400' },
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search chains..."
          className="pl-10 bg-[#1e1f2b] border-[#2d2e3d] text-white text-sm"
        />
      </div>

      {/* Chain Tabs */}
      <Tabs value={chainsTab} onValueChange={setChainsTab}>
        <TabsList className="bg-[#1e1f2b] border border-[#2d2e3d] w-full justify-start overflow-x-auto">
          <TabsTrigger value="chains" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <GitBranch className="w-3.5 h-3.5 mr-1.5" />Chains
          </TabsTrigger>
          <TabsTrigger value="runs" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Activity className="w-3.5 h-3.5 mr-1.5" />Runs
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Eye className="w-3.5 h-3.5 mr-1.5" />Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chains" className="mt-4">
          {filteredChains.length === 0 ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <GitBranch className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280] mb-3">No chains yet. Create your first agent chain.</p>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />Create Chain
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredChains.map((chain, i) => {
                const TypeIcon = chainTypeConfig[chain.chainType]?.icon || Workflow
                const successRate = getSuccessRate(chain)
                const stepsCount = (() => {
                  try { return JSON.parse(chain.steps || '[]').length } catch { return 0 }
                })()

                return (
                  <motion.div
                    key={chain.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center`}>
                              <TypeIcon className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-white">{chain.name}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="outline" className={`text-[9px] ${chainTypeConfig[chain.chainType]?.color || 'text-[#9ca3af]'} border-current/30`}>
                                  {chainTypeConfig[chain.chainType]?.label || chain.chainType}
                                </Badge>
                                <Badge variant="outline" className={`text-[9px] ${statusBgColors[chain.status] || 'border-[#2d2e3d] text-[#6b7280]'}`}>
                                  {chain.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-emerald-400 hover:bg-emerald-500/10 h-7 w-7 p-0"
                              onClick={() => handleRunChain(chain.id)}
                              disabled={runningChainId === chain.id}
                              title="Run chain"
                            >
                              {runningChainId === chain.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b] h-7 w-7 p-0"
                              onClick={() => handleOpenBuilder(chain)}
                              title="Open builder"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                              onClick={() => handleDeleteChain(chain.id)}
                              title="Delete chain"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {chain.description && (
                          <p className="text-xs text-[#9ca3af] mb-3 line-clamp-2">{chain.description}</p>
                        )}

                        {/* Stats row */}
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          <div className="p-1.5 rounded bg-[#0f1117] text-center">
                            <p className="text-xs font-bold text-emerald-400">{stepsCount}</p>
                            <p className="text-[9px] text-[#6b7280]">steps</p>
                          </div>
                          <div className="p-1.5 rounded bg-[#0f1117] text-center">
                            <p className="text-xs font-bold text-blue-400">{chain.runCount}</p>
                            <p className="text-[9px] text-[#6b7280]">runs</p>
                          </div>
                          <div className="p-1.5 rounded bg-[#0f1117] text-center">
                            <p className={`text-xs font-bold ${successRate >= 80 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{successRate}%</p>
                            <p className="text-[9px] text-[#6b7280]">success</p>
                          </div>
                          <div className="p-1.5 rounded bg-[#0f1117] text-center">
                            <p className="text-xs font-bold text-purple-400">{formatDuration(chain.avgDuration)}</p>
                            <p className="text-[9px] text-[#6b7280]">avg</p>
                          </div>
                        </div>

                        {/* Success rate bar */}
                        {chain.runCount > 0 && (
                          <div className="mt-3">
                            <div className="w-full h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${successRate}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full rounded-full ${
                                  successRate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                                  successRate >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                                  'bg-gradient-to-r from-red-500 to-red-400'
                                }`}
                              />
                            </div>
                          </div>
                        )}

                        {/* Last run */}
                        {chain.lastRunAt && (
                          <div className="flex items-center justify-between mt-2 text-[10px] text-[#4b5563]">
                            <span>Last: {new Date(chain.lastRunAt).toLocaleString()}</span>
                            <span>{chain.successCount}/{chain.runCount} passed</span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#2d2e3d]">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b] text-xs h-7"
                            onClick={() => {
                              setSelectedChain(chain)
                              setChainsTab('runs')
                              fetchChainRuns(chain.id)
                            }}
                          >
                            <Activity className="w-3 h-3 mr-1" />Runs
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b] text-xs h-7"
                            onClick={() => handleOpenBuilder(chain)}
                          >
                            <Settings className="w-3 h-3 mr-1" />Builder
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="runs" className="mt-4">
          {/* Handled by the runs section above via chainsTab */}
          <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardContent className="p-6 text-center">
              <Activity className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
              <p className="text-sm text-[#6b7280] mb-4">Select a chain to view its runs.</p>
              <Select onValueChange={async (id) => {
                const chain = chains.find(c => c.id === id)
                if (chain) {
                  setSelectedChain(chain)
                  setChainsTab('runs')
                  await fetchChainRuns(id)
                }
              }}>
                <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm max-w-xs mx-auto">
                  <SelectValue placeholder="Select a chain..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                  {chains.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-4">
          {/* Handled by the monitoring section above via chainsTab */}
          <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardContent className="p-6 text-center">
              <Eye className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
              <p className="text-sm text-[#6b7280]">Monitoring dashboard will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Chain Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create Agent Chain</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Chain Name</label>
              <Input
                value={newChain.name}
                onChange={e => setNewChain(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Research Pipeline"
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
              <Textarea
                value={newChain.description}
                onChange={e => setNewChain(p => ({ ...p, description: e.target.value }))}
                placeholder="What does this chain do?"
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm min-h-[60px]"
              />
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Chain Type</label>
              <Select value={newChain.chainType} onValueChange={v => setNewChain(p => ({ ...p, chainType: v }))}>
                <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                  {Object.entries(chainTypeConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        {cfg.label} - {cfg.desc}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Error Strategy</label>
              <Select value={newChain.errorStrategy} onValueChange={v => setNewChain(p => ({ ...p, errorStrategy: v }))}>
                <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                  {Object.entries(errorStrategyConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className={cfg.color}>{cfg.label}</span> - {cfg.desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Max Retries</label>
                <Input
                  type="number"
                  value={newChain.maxRetries}
                  onChange={e => setNewChain(p => ({ ...p, maxRetries: parseInt(e.target.value) || 1 }))}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Timeout (ms)</label>
                <Input
                  type="number"
                  value={newChain.timeout}
                  onChange={e => setNewChain(p => ({ ...p, timeout: parseInt(e.target.value) || 300000 }))}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
            </div>
            <Button
              onClick={handleCreateChain}
              disabled={!newChain.name}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />Create Chain
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
