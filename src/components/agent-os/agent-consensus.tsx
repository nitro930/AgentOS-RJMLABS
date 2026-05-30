'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Vote, ThumbsUp, ThumbsDown, Trophy, BarChart3, Clock, Users,
  Plus, XCircle, CheckCircle2, Loader2, ChevronRight, ChevronDown,
  Circle, Ban, AlertTriangle, Zap, Target, Crown, Shield,
  X, Send, Info, Sparkles, Timer, Hash
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { useAgentOSStore } from '@/lib/store'

// ─── Types ────────────────────────────────────────────────────────

interface ConsensusVoteData {
  id: string
  roundId: string
  agentId: string
  vote: string
  reason?: string
  weight: number
  confidence: number
  createdAt: string
}

interface ConsensusRoundData {
  id: string
  title: string
  description?: string
  topic: string
  type: string
  status: string
  proposerId?: string
  options: string
  threshold: number
  strategy: string
  weights: string
  maxVotes: number
  deadline?: string
  result?: string
  totalVotes: number
  createdAt: string
  closedAt?: string
  votes?: ConsensusVoteData[]
  _count?: { votes: number }
}

interface AgentData {
  id: string
  name: string
  type: string
  avatar?: string
  status: string
}

interface ResultData {
  roundId: string
  roundTitle: string
  strategy: string
  threshold: number
  totalVotes: number
  winner: { id: string; label: string } | null
  passed: boolean
  breakdown: {
    id: string
    label: string
    description?: string
    votes: number
    weightedScore: number
    avgConfidence: number
    percentage: number
  }[]
  strategyDetails: Record<string, unknown>
  status: string
}

// ─── Config Maps ──────────────────────────────────────────────────

const roundTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  vote: { label: 'Vote', icon: Vote, color: 'text-blue-400' },
  ranking: { label: 'Ranking', icon: BarChart3, color: 'text-purple-400' },
  scoring: { label: 'Scoring', icon: Target, color: 'text-orange-400' },
  approval: { label: 'Approval', icon: ThumbsUp, color: 'text-emerald-400' },
  consensus: { label: 'Consensus', icon: Shield, color: 'text-yellow-400' },
}

const strategyConfig: Record<string, { label: string; icon: React.ElementType; color: string; desc: string }> = {
  simple_majority: { label: 'Simple Majority', icon: ThumbsUp, color: 'text-blue-400', desc: 'Option with most votes wins (≥threshold)' },
  super_majority: { label: 'Super Majority', icon: Crown, color: 'text-yellow-400', desc: 'Requires 2/3+ agreement to pass' },
  unanimous: { label: 'Unanimous', icon: Shield, color: 'text-red-400', desc: 'All voters must agree on the same option' },
  weighted: { label: 'Weighted', icon: Zap, color: 'text-orange-400', desc: 'Votes weighted by agent authority' },
  borda: { label: 'Borda Count', icon: BarChart3, color: 'text-purple-400', desc: 'Rank-based point scoring system' },
}

const statusColors: Record<string, string> = {
  open: 'text-emerald-400',
  voting: 'text-blue-400',
  closed: 'text-[#6b7280]',
  expired: 'text-yellow-400',
  cancelled: 'text-red-400',
}

const statusBg: Record<string, string> = {
  open: 'border-emerald-500/30 text-emerald-400',
  voting: 'border-blue-500/30 text-blue-400',
  closed: 'border-[#2d2e3d] text-[#6b7280]',
  expired: 'border-yellow-500/30 text-yellow-400',
  cancelled: 'border-red-500/30 text-red-400',
}

const statusIcons: Record<string, React.ElementType> = {
  open: Circle,
  voting: Vote,
  closed: CheckCircle2,
  expired: Clock,
  cancelled: Ban,
}

// ─── Component ────────────────────────────────────────────────────

export function AgentConsensus() {
  const { consensusTab, setConsensusTab } = useAgentOSStore()
  const [rounds, setRounds] = useState<ConsensusRoundData[]>([])
  const [agents, setAgents] = useState<AgentData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRound, setSelectedRound] = useState<ConsensusRoundData | null>(null)
  const [roundResult, setRoundResult] = useState<ResultData | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [resultLoading, setResultLoading] = useState(false)

  // Create form state
  const [newRound, setNewRound] = useState({
    title: '',
    description: '',
    topic: '',
    type: 'vote',
    strategy: 'simple_majority',
    threshold: 0.5,
    deadline: '',
    options: [
      { id: 'option_1', label: 'Option A', description: '' },
      { id: 'option_2', label: 'Option B', description: '' },
    ],
  })

  // Vote form state
  const [voteForm, setVoteForm] = useState({ optionId: '', reason: '', confidence: 1 })

  // ─── Data Fetching ───────────────────────────────────────────

  const fetchRounds = useCallback(async () => {
    try {
      const res = await fetch('/api/consensus')
      if (res.ok) {
        const data = await res.json()
        setRounds(data.rounds || [])
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

  const fetchRoundDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/consensus/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedRound(data.round)
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchResult = useCallback(async (id: string) => {
    setResultLoading(true)
    try {
      const res = await fetch(`/api/consensus/${id}/result`)
      if (res.ok) {
        const data = await res.json()
        setRoundResult(data.result)
      }
    } catch (e) { console.error(e) }
    setResultLoading(false)
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchRounds(), fetchAgents()])
      setLoading(false)
    }
    loadAll()
  }, [fetchRounds, fetchAgents])

  // ─── Handlers ────────────────────────────────────────────────

  const handleCreateRound = async () => {
    try {
      const res = await fetch('/api/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRound.title,
          description: newRound.description,
          topic: newRound.topic,
          type: newRound.type,
          strategy: newRound.strategy,
          threshold: newRound.threshold,
          options: newRound.options,
          deadline: newRound.deadline || null,
        }),
      })
      if (res.ok) {
        await fetchRounds()
        setCreateDialogOpen(false)
        setNewRound({
          title: '', description: '', topic: '', type: 'vote',
          strategy: 'simple_majority', threshold: 0.5, deadline: '',
          options: [
            { id: 'option_1', label: 'Option A', description: '' },
            { id: 'option_2', label: 'Option B', description: '' },
          ],
        })
      }
    } catch (e) { console.error(e) }
  }

  const handleCloseRound = async (roundId: string) => {
    try {
      const res = await fetch(`/api/consensus/${roundId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      })
      if (res.ok) {
        await fetchRounds()
        if (selectedRound?.id === roundId) {
          await fetchRoundDetail(roundId)
        }
      }
    } catch (e) { console.error(e) }
  }

  const handleCancelRound = async (roundId: string) => {
    try {
      const res = await fetch(`/api/consensus/${roundId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (res.ok) {
        await fetchRounds()
        if (selectedRound?.id === roundId) {
          await fetchRoundDetail(roundId)
        }
      }
    } catch (e) { console.error(e) }
  }

  const handleCastVote = async () => {
    if (!selectedRound || !voteForm.optionId) return
    try {
      // Use first agent as a demo voter
      const voterId = agents.length > 0 ? agents[0].id : 'demo-agent'
      const res = await fetch(`/api/consensus/${selectedRound.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: voterId,
          vote: voteForm.optionId,
          reason: voteForm.reason || undefined,
          confidence: voteForm.confidence,
        }),
      })
      if (res.ok) {
        await fetchRoundDetail(selectedRound.id)
        await fetchRounds()
        setVoteForm({ optionId: '', reason: '', confidence: 1 })
      } else {
        const data = await res.json()
        // Try with another agent if already voted
        if (data.error?.includes('already voted') && agents.length > 1) {
          for (let i = 1; i < agents.length; i++) {
            const retryRes = await fetch(`/api/consensus/${selectedRound.id}/vote`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agentId: agents[i].id,
                vote: voteForm.optionId,
                reason: voteForm.reason || undefined,
                confidence: voteForm.confidence,
              }),
            })
            if (retryRes.ok) {
              await fetchRoundDetail(selectedRound.id)
              await fetchRounds()
              setVoteForm({ optionId: '', reason: '', confidence: 1 })
              break
            }
          }
        }
      }
    } catch (e) { console.error(e) }
  }

  const handleSelectRound = async (round: ConsensusRoundData) => {
    setSelectedRound(round)
    setRoundResult(null)
    setVoteForm({ optionId: '', reason: '', confidence: 1 })
    await fetchRoundDetail(round.id)
    setConsensusTab('vote')
  }

  const handleViewResult = async (round: ConsensusRoundData) => {
    setSelectedRound(round)
    await fetchRoundDetail(round.id)
    await fetchResult(round.id)
    setConsensusTab('results')
  }

  const addOption = () => {
    const id = `option_${newRound.options.length + 1}`
    setNewRound(p => ({
      ...p,
      options: [...p.options, { id, label: '', description: '' }],
    }))
  }

  const removeOption = (index: number) => {
    if (newRound.options.length <= 2) return
    setNewRound(p => ({
      ...p,
      options: p.options.filter((_, i) => i !== index),
    }))
  }

  const updateOption = (index: number, field: 'label' | 'description', value: string) => {
    setNewRound(p => ({
      ...p,
      options: p.options.map((o, i) => i === index ? { ...o, [field]: value } : o),
    }))
  }

  // ─── Helpers ──────────────────────────────────────────────────

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent ? `${agent.avatar || '🤖'} ${agent.name}` : agentId.slice(0, 8)
  }

  const parseOptions = (optionsStr: string): { id: string; label: string; description?: string }[] => {
    try { return JSON.parse(optionsStr || '[]') } catch { return [] }
  }

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return null
    const d = new Date(deadline)
    const now = new Date()
    const diff = d.getTime() - now.getTime()
    if (diff < 0) return 'Expired'
    if (diff < 3600000) return `${Math.ceil(diff / 60000)}m left`
    if (diff < 86400000) return `${Math.ceil(diff / 3600000)}h left`
    return `${Math.ceil(diff / 86400000)}d left`
  }

  // ─── Stats ────────────────────────────────────────────────────

  const openRounds = rounds.filter(r => r.status === 'open' || r.status === 'voting').length
  const closedRounds = rounds.filter(r => r.status === 'closed').length
  const totalVotes = rounds.reduce((sum, r) => sum + (r._count?.votes || r.totalVotes || 0), 0)

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
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Vote className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Agent Consensus</h2>
              <p className="text-xs text-[#6b7280]">Multi-agent voting & decision making</p>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />New Round
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open Rounds', value: openRounds, icon: Circle, color: 'text-emerald-400' },
          { label: 'Closed Rounds', value: closedRounds, icon: CheckCircle2, color: 'text-[#6b7280]' },
          { label: 'Total Votes', value: totalVotes, icon: ThumbsUp, color: 'text-blue-400' },
          { label: 'All Rounds', value: rounds.length, icon: BarChart3, color: 'text-purple-400' },
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
      <Tabs value={consensusTab} onValueChange={setConsensusTab}>
        <TabsList className="bg-[#1e1f2b] border border-[#2d2e3d] w-full justify-start overflow-x-auto">
          <TabsTrigger value="rounds" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" />Rounds
          </TabsTrigger>
          <TabsTrigger value="vote" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400" disabled={!selectedRound}>
            <Vote className="w-3.5 h-3.5 mr-1.5" />Vote
          </TabsTrigger>
          <TabsTrigger value="results" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400" disabled={!selectedRound}>
            <Trophy className="w-3.5 h-3.5 mr-1.5" />Results
          </TabsTrigger>
          <TabsTrigger value="create" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Plus className="w-3.5 h-3.5 mr-1.5" />Create
          </TabsTrigger>
        </TabsList>

        {/* ─── ROUNDS TAB ─────────────────────────────────────── */}
        <TabsContent value="rounds" className="mt-4">
          {rounds.length === 0 ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <Vote className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280] mb-3">No consensus rounds yet.</p>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setConsensusTab('create')}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />Create Round
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {rounds.map((round, i) => {
                const typeCfg = roundTypeConfig[round.type] || roundTypeConfig.vote
                const TypeIcon = typeCfg.icon
                const StatusIcon = statusIcons[round.status] || Circle
                const deadlineStr = formatDeadline(round.deadline)
                const options = parseOptions(round.options)
                const voteCount = round._count?.votes || round.totalVotes || 0
                const isActive = round.status === 'open' || round.status === 'voting'

                return (
                  <motion.div
                    key={round.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className={`bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors cursor-pointer ${selectedRound?.id === round.id ? 'border-emerald-500/40' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <TypeIcon className={`w-4 h-4 ${typeCfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0" onClick={() => handleSelectRound(round)}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-medium text-white">{round.title}</h4>
                              <Badge variant="outline" className={`text-[9px] ${statusBg[round.status] || 'border-[#2d2e3d] text-[#6b7280]'}`}>
                                <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                                {round.status}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#9ca3af]">
                                {typeCfg.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#9ca3af] mt-0.5 line-clamp-1">{round.topic}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#6b7280]">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />{voteCount} vote{voteCount !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />{options.length} option{options.length !== 1 ? 's' : ''}
                              </span>
                              {round.deadline && (
                                <span className={`flex items-center gap-1 ${deadlineStr === 'Expired' ? 'text-red-400' : 'text-yellow-400'}`}>
                                  <Timer className="w-3 h-3" />{deadlineStr}
                                </span>
                              )}
                              {round.proposerId && (
                                <span className="flex items-center gap-1">
                                  <Crown className="w-3 h-3" />{getAgentName(round.proposerId)}
                                </span>
                              )}
                            </div>
                            {/* Mini vote distribution bar */}
                            {voteCount > 0 && (
                              <div className="flex gap-0.5 mt-2 h-1.5 rounded-full overflow-hidden bg-[#0f1117]">
                                {options.map((opt, oi) => {
                                  const optVotes = round.votes?.filter(v => v.vote === opt.id).length || 0
                                  const pct = voteCount > 0 ? (optVotes / voteCount) * 100 : 0
                                  const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'text-pink-500']
                                  return (
                                    <div
                                      key={opt.id}
                                      className={`${colors[oi % colors.length]} transition-all`}
                                      style={{ width: `${pct}%` }}
                                      title={`${opt.label}: ${optVotes} vote${optVotes !== 1 ? 's' : ''}`}
                                    />
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            {isActive && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-emerald-400 hover:bg-emerald-500/10 h-7 px-2"
                                  onClick={() => handleSelectRound(round)}
                                >
                                  <Vote className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-[#6b7280] hover:bg-[#1e1f2b] h-7 px-2"
                                  onClick={() => handleCloseRound(round.id)}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:bg-red-500/10 h-7 px-2"
                                  onClick={() => handleCancelRound(round.id)}
                                >
                                  <Ban className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            {!isActive && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-purple-400 hover:bg-purple-500/10 h-7 px-2"
                                onClick={() => handleViewResult(round)}
                              >
                                <Trophy className="w-3 h-3" />
                              </Button>
                            )}
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

        {/* ─── VOTE TAB ───────────────────────────────────────── */}
        <TabsContent value="vote" className="mt-4">
          {!selectedRound ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <Vote className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280]">Select a round from the Rounds tab to vote.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Round info header */}
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline" className={`text-[9px] ${statusBg[selectedRound.status]}`}>
                      {selectedRound.status}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#9ca3af]">
                      {roundTypeConfig[selectedRound.type]?.label || selectedRound.type}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#9ca3af]">
                      {strategyConfig[selectedRound.strategy]?.label || selectedRound.strategy}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-white">{selectedRound.title}</h3>
                  <p className="text-sm text-[#9ca3af] mt-1">{selectedRound.topic}</p>
                  {selectedRound.description && (
                    <p className="text-xs text-[#6b7280] mt-1">{selectedRound.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-[#6b7280]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {(selectedRound._count?.votes || selectedRound.votes?.length || 0)} vote{(selectedRound._count?.votes || selectedRound.votes?.length || 0) !== 1 ? 's' : ''} cast
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Threshold: {Math.round(selectedRound.threshold * 100)}%
                    </span>
                    {selectedRound.deadline && (
                      <span className={`flex items-center gap-1 ${formatDeadline(selectedRound.deadline) === 'Expired' ? 'text-red-400' : 'text-yellow-400'}`}>
                        <Timer className="w-3 h-3" />{formatDeadline(selectedRound.deadline)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Options + vote form */}
              {(selectedRound.status === 'open' || selectedRound.status === 'voting') ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vote form */}
                  <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-white flex items-center gap-2">
                        <Send className="w-4 h-4 text-emerald-400" />Cast Your Vote
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-xs text-[#9ca3af] mb-2 block">Select Option</label>
                        <div className="space-y-2">
                          {parseOptions(selectedRound.options).map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setVoteForm(p => ({ ...p, optionId: opt.id }))}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                                voteForm.optionId === opt.id
                                  ? 'border-emerald-500/50 bg-emerald-500/10'
                                  : 'border-[#2d2e3d] bg-[#0f1117] hover:border-[#3d3e4d]'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                voteForm.optionId === opt.id ? 'border-emerald-400' : 'border-[#4b5563]'
                              }`}>
                                {voteForm.optionId === opt.id && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                              </div>
                              <div>
                                <p className="text-sm text-white font-medium">{opt.label}</p>
                                {opt.description && <p className="text-[10px] text-[#6b7280]">{opt.description}</p>}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-[#9ca3af] mb-1 block">Confidence ({Math.round(voteForm.confidence * 100)}%)</label>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={voteForm.confidence}
                          onChange={e => setVoteForm(p => ({ ...p, confidence: parseFloat(e.target.value) }))}
                          className="w-full accent-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#9ca3af] mb-1 block">Reason (optional)</label>
                        <Textarea
                          value={voteForm.reason}
                          onChange={e => setVoteForm(p => ({ ...p, reason: e.target.value }))}
                          placeholder="Why this choice..."
                          className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm min-h-[60px]"
                        />
                      </div>
                      <Button
                        onClick={handleCastVote}
                        disabled={!voteForm.optionId}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Vote className="w-4 h-4 mr-2" />Cast Vote
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Vote distribution */}
                  <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />Vote Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {parseOptions(selectedRound.options).map((opt, oi) => {
                        const optVotes = selectedRound.votes?.filter(v => v.vote === opt.id) || []
                        const totalV = selectedRound.votes?.length || 0
                        const pct = totalV > 0 ? Math.round((optVotes.length / totalV) * 100) : 0
                        const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']
                        return (
                          <div key={opt.id}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-white">{opt.label}</span>
                              <span className="text-xs text-[#6b7280]">{optVotes.length} vote{optVotes.length !== 1 ? 's' : ''} ({pct}%)</span>
                            </div>
                            <div className="w-full h-3 bg-[#0f1117] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className={`h-full ${colors[oi % colors.length]} rounded-full`}
                              />
                            </div>
                            {optVotes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {optVotes.map(v => (
                                  <Badge key={v.id} variant="outline" className="text-[8px] border-[#2d2e3d] text-[#6b7280]">
                                    {getAgentName(v.agentId)} • {Math.round(v.confidence * 100)}%
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Recent votes */}
                      {selectedRound.votes && selectedRound.votes.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#2d2e3d]">
                          <p className="text-[10px] text-[#6b7280] mb-2 uppercase tracking-wider">Recent Votes</p>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                            {selectedRound.votes.slice(-5).reverse().map(v => {
                              const votedOption = parseOptions(selectedRound.options).find(o => o.id === v.vote)
                              return (
                                <div key={v.id} className="flex items-center gap-2 text-[10px]">
                                  <span className="text-[#9ca3af]">{getAgentName(v.agentId)}</span>
                                  <ChevronRight className="w-2.5 h-2.5 text-[#4b5563]" />
                                  <span className="text-emerald-400">{votedOption?.label || v.vote}</span>
                                  <span className="text-[#4b5563]">•</span>
                                  <span className="text-[#6b7280]">{Math.round(v.confidence * 100)}% conf</span>
                                  {v.reason && <span className="text-[#4b5563] italic line-clamp-1 ml-1">&ldquo;{v.reason}&rdquo;</span>}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                    <p className="text-sm text-[#9ca3af]">This round is {selectedRound.status} and no longer accepting votes.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#2d2e3d] text-purple-400 hover:bg-purple-500/10 mt-3"
                      onClick={() => handleViewResult(selectedRound)}
                    >
                      <Trophy className="w-3.5 h-3.5 mr-1.5" />View Results
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ─── RESULTS TAB ────────────────────────────────────── */}
        <TabsContent value="results" className="mt-4">
          {!selectedRound ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <Trophy className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280]">Select a round to view results.</p>
              </CardContent>
            </Card>
          ) : resultLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : !roundResult ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280] mb-3">No results calculated yet.</p>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => fetchResult(selectedRound.id)}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />Calculate Result
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Result header */}
              <Card className={`bg-[#1e1f2b] border-2 ${roundResult.passed ? 'border-emerald-500/50' : 'border-red-500/30'}`}>
                <CardContent className="p-6 text-center">
                  {roundResult.winner ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 10 }}
                        className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3"
                      >
                        <Trophy className={`w-8 h-8 ${roundResult.passed ? 'text-emerald-400' : 'text-red-400'}`} />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white">{roundResult.winner.label}</h3>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${roundResult.passed ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}
                        >
                          {roundResult.passed ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" />PASSED</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" />NOT PASSED</>
                          )}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#6b7280] mt-2">
                        {roundResult.totalVotes} total vote{roundResult.totalVotes !== 1 ? 's' : ''} • Threshold: {Math.round(roundResult.threshold * 100)}%
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-12 h-12 text-[#4b5563] mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-[#6b7280]">No Winner Determined</h3>
                      <p className="text-xs text-[#4b5563] mt-1">Insufficient votes to determine a winner</p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Strategy info */}
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">Strategy Used</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const cfg = strategyConfig[roundResult.strategy] || strategyConfig.simple_majority
                      const CfgIcon = cfg.icon
                      return (
                        <>
                          <div className="w-8 h-8 rounded-lg bg-[#0f1117] flex items-center justify-center">
                            <CfgIcon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div>
                            <p className="text-sm text-white">{cfg.label}</p>
                            <p className="text-[10px] text-[#6b7280]">{cfg.desc}</p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Vote breakdown */}
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />Vote Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {roundResult.breakdown.map((item, i) => {
                    const isWinner = roundResult.winner?.id === item.id
                    const colors = ['from-emerald-500 to-emerald-400', 'from-blue-500 to-blue-400', 'from-purple-500 to-purple-400', 'from-orange-500 to-orange-400', 'from-pink-500 to-pink-400']
                    return (
                      <div key={item.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {isWinner && <Trophy className="w-3.5 h-3.5 text-yellow-400" />}
                            <span className={`text-sm ${isWinner ? 'text-white font-semibold' : 'text-[#9ca3af]'}`}>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                            <span>{item.votes} vote{item.votes !== 1 ? 's' : ''}</span>
                            <span>{item.percentage}%</span>
                            {roundResult.strategy === 'weighted' && (
                              <span>Score: {item.weightedScore.toFixed(1)}</span>
                            )}
                          </div>
                        </div>
                        <div className="w-full h-4 bg-[#0f1117] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
                            className={`h-full bg-gradient-to-r ${colors[i % colors.length]} rounded-full relative`}
                          >
                            {item.percentage > 15 && (
                              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/80">
                                {item.percentage}%
                              </span>
                            )}
                          </motion.div>
                        </div>
                        {item.avgConfidence > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-[#4b5563]">
                            <span>Avg confidence: {Math.round(item.avgConfidence * 100)}%</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Individual votes */}
              {selectedRound.votes && selectedRound.votes.length > 0 && (
                <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />Individual Votes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                      {selectedRound.votes.map(v => {
                        const votedOption = parseOptions(selectedRound.options).find(o => o.id === v.vote)
                        const isWinnerVote = roundResult.winner?.id === v.vote
                        return (
                          <div key={v.id} className="flex items-center gap-2 p-2 rounded-lg bg-[#0f1117] text-[11px]">
                            <span className="text-[#9ca3af] min-w-[80px]">{getAgentName(v.agentId)}</span>
                            <ChevronRight className="w-2.5 h-2.5 text-[#4b5563]" />
                            <span className={isWinnerVote ? 'text-emerald-400 font-medium' : 'text-[#9ca3af]'}>
                              {votedOption?.label || v.vote}
                            </span>
                            <span className="text-[#4b5563] ml-auto">conf: {Math.round(v.confidence * 100)}%</span>
                            {v.reason && (
                              <span className="text-[#4b5563] italic line-clamp-1 max-w-[150px]">&ldquo;{v.reason}&rdquo;</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ─── CREATE TAB ─────────────────────────────────────── */}
        <TabsContent value="create" className="mt-4">
          <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />Create New Consensus Round
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Title *</label>
                    <Input
                      value={newRound.title}
                      onChange={e => setNewRound(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Choose deployment strategy"
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
                    <Textarea
                      value={newRound.description}
                      onChange={e => setNewRound(p => ({ ...p, description: e.target.value }))}
                      placeholder="Optional description..."
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm min-h-[60px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Topic / Question *</label>
                    <Textarea
                      value={newRound.topic}
                      onChange={e => setNewRound(p => ({ ...p, topic: e.target.value }))}
                      placeholder="What should we decide on?"
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm min-h-[60px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Round Type</label>
                      <Select value={newRound.type} onValueChange={v => setNewRound(p => ({ ...p, type: v }))}>
                        <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                          {Object.entries(roundTypeConfig).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                                {cfg.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Strategy</label>
                      <Select value={newRound.strategy} onValueChange={v => setNewRound(p => ({ ...p, strategy: v }))}>
                        <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                          {Object.entries(strategyConfig).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                                {cfg.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Threshold ({Math.round(newRound.threshold * 100)}%)</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={newRound.threshold}
                        onChange={e => setNewRound(p => ({ ...p, threshold: parseFloat(e.target.value) }))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Deadline (optional)</label>
                      <Input
                        type="datetime-local"
                        value={newRound.deadline}
                        onChange={e => setNewRound(p => ({ ...p, deadline: e.target.value }))}
                        className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Options section */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-[#9ca3af]">Voting Options</label>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-emerald-400 hover:bg-emerald-500/10 h-6 text-xs"
                        onClick={addOption}
                      >
                        <Plus className="w-3 h-3 mr-1" />Add Option
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {newRound.options.map((opt, i) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-[#0f1117] flex items-center justify-center text-[10px] text-[#6b7280] flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 space-y-1">
                            <Input
                              value={opt.label}
                              onChange={e => updateOption(i, 'label', e.target.value)}
                              placeholder="Option label"
                              className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm h-8"
                            />
                            <Input
                              value={opt.description}
                              onChange={e => updateOption(i, 'description', e.target.value)}
                              placeholder="Description (optional)"
                              className="bg-[#0f1117] border-[#2d2e3d] text-white text-xs h-7"
                            />
                          </div>
                          {newRound.options.length > 2 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                              onClick={() => removeOption(i)}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategy info */}
                  <Card className="bg-[#0f1117] border-[#2d2e3d]">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {(() => {
                          const cfg = strategyConfig[newRound.strategy]
                          const CfgIcon = cfg.icon
                          return <CfgIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        })()}
                        <span className="text-xs font-medium text-white">{strategyConfig[newRound.strategy]?.label}</span>
                      </div>
                      <p className="text-[10px] text-[#6b7280]">{strategyConfig[newRound.strategy]?.desc}</p>
                    </CardContent>
                  </Card>

                  {/* Preview */}
                  <Card className="bg-[#0f1117] border-[#2d2e3d]">
                    <CardContent className="p-3">
                      <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2">Preview</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#4b5563]">Type</span>
                          <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#9ca3af]">
                            {roundTypeConfig[newRound.type]?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#4b5563]">Strategy</span>
                          <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#9ca3af]">
                            {strategyConfig[newRound.strategy]?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#4b5563]">Threshold</span>
                          <span className="text-[10px] text-emerald-400">{Math.round(newRound.threshold * 100)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#4b5563]">Options</span>
                          <span className="text-[10px] text-white">{newRound.options.filter(o => o.label).length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Button
                onClick={handleCreateRound}
                disabled={!newRound.title || !newRound.topic || newRound.options.filter(o => o.label).length < 2}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />Create Consensus Round
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog (accessible from header button) */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Quick Create Round</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Title *</label>
              <Input
                value={newRound.title}
                onChange={e => setNewRound(p => ({ ...p, title: e.target.value }))}
                placeholder="Round title"
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Topic *</label>
              <Input
                value={newRound.topic}
                onChange={e => setNewRound(p => ({ ...p, topic: e.target.value }))}
                placeholder="What to decide?"
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Type</label>
                <Select value={newRound.type} onValueChange={v => setNewRound(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                    {Object.entries(roundTypeConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Strategy</label>
                <Select value={newRound.strategy} onValueChange={v => setNewRound(p => ({ ...p, strategy: v }))}>
                  <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                    {Object.entries(strategyConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Options (one per line)</label>
              <Textarea
                value={newRound.options.map(o => o.label).join('\n')}
                onChange={e => {
                  const lines = e.target.value.split('\n').filter(l => l.trim())
                  setNewRound(p => ({
                    ...p,
                    options: lines.map((label, i) => ({ id: `option_${i + 1}`, label: label.trim(), description: '' })),
                  }))
                }}
                placeholder="Option A&#10;Option B&#10;Option C"
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm min-h-[80px]"
              />
            </div>
            <Button
              onClick={handleCreateRound}
              disabled={!newRound.title || !newRound.topic || newRound.options.filter(o => o.label).length < 2}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />Create Round
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
