'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store, Download, Upload, Star, Search, Filter, ChevronDown,
  Trash2, RefreshCw, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Package, Tag, User, Clock, ArrowUpDown, ExternalLink, Eye,
  Plus, MessageSquare, ThumbsUp, ShieldCheck, BadgeCheck, X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// ─── Types ──────────────────────────────────────────────────────

interface MarketplaceAgentData {
  id: string
  name: string
  description: string
  category: string
  icon: string
  config: string
  author: string
  version: string
  tags: string
  rating: number
  reviewCount: number
  installCount: number
  isOfficial: boolean
  isVerified: boolean
  status: string
  createdAt: string
  updatedAt: string
  _count?: { reviews: number }
  reviews?: MarketplaceReviewData[]
}

interface MarketplaceReviewData {
  id: string
  agentId: string
  userId: string
  rating: number
  title: string | null
  content: string | null
  isVerified: boolean
  createdAt: string
}

interface InstalledAgentData {
  id: string
  name: string
  type: string
  description: string
  status: string
  avatar: string | null
  config: string
  color: string
  tasksCompleted: number
  tasksFailed: number
  lastActiveAt: string | null
  createdAt: string
  marketplaceId: string | null
  marketplaceVersion: string | null
  marketplaceAuthor: string | null
  hasUpdate: boolean
}

// ─── Config ─────────────────────────────────────────────────────

const categories = [
  { value: 'all', label: 'All Categories', icon: Store },
  { value: 'general', label: 'General', icon: Package },
  { value: 'coding', label: 'Coding', icon: Upload },
  { value: 'research', label: 'Research', icon: Search },
  { value: 'writing', label: 'Writing', icon: MessageSquare },
  { value: 'data', label: 'Data', icon: Filter },
  { value: 'devops', label: 'DevOps', icon: RefreshCw },
  { value: 'security', label: 'Security', icon: ShieldCheck },
]

const categoryColors: Record<string, string> = {
  general: 'border-[#2d2e3d] text-[#9ca3af]',
  coding: 'border-emerald-500/30 text-emerald-400',
  research: 'border-blue-500/30 text-blue-400',
  writing: 'border-purple-500/30 text-purple-400',
  data: 'border-orange-500/30 text-orange-400',
  devops: 'border-cyan-500/30 text-cyan-400',
  security: 'border-red-500/30 text-red-400',
}

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'reviews', label: 'Most Reviewed' },
]

// ─── Star Rating Component ──────────────────────────────────────

function StarRating({ rating, size = 'sm', interactive = false, onChange }: {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (r: number) => void
}) {
  const [hover, setHover] = useState(0)
  const sizeMap = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }
  const iconSize = sizeMap[size]

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
        >
          <Star
            className={`${iconSize} ${
              star <= (hover || rating)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-[#2d2e3d]'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────

export function AgentMarketplace() {
  const [activeTab, setActiveTab] = useState('browse')
  const [agents, setAgents] = useState<MarketplaceAgentData[]>([])
  const [installedAgents, setInstalledAgents] = useState<InstalledAgentData[]>([])
  const [recentReviews, setRecentReviews] = useState<(MarketplaceReviewData & { agentName?: string; agentIcon?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('popular')
  const [total, setTotal] = useState(0)
  const [reviewsLoaded, setReviewsLoaded] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<MarketplaceAgentData | null>(null)
  const [installDialogOpen, setInstallDialogOpen] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [installCustomName, setInstallCustomName] = useState('')
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewAgent, setReviewAgent] = useState<MarketplaceAgentData | null>(null)
  const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '' })
  const [submitForm, setSubmitForm] = useState({
    name: '', description: '', category: 'general', icon: '🏪',
    config: '{}', tags: '', author: 'community', version: '1.0.0',
  })

  // ─── Data Fetching ─────────────────────────────────────────

  const fetchAgents = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category && category !== 'all') params.set('category', category)
      params.set('sort', sort)
      const res = await fetch(`/api/marketplace?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || [])
        setTotal(data.total || 0)
      }
    } catch (e) { console.error(e) }
  }, [search, category, sort])

  const fetchInstalled = useCallback(async () => {
    try {
      const res = await fetch('/api/marketplace/installed')
      if (res.ok) {
        const data = await res.json()
        setInstalledAgents(data.installed || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchRecentReviews = useCallback(async () => {
    try {
      // Get all published agents with reviews
      const res = await fetch('/api/marketplace?limit=50')
      if (res.ok) {
        const data = await res.json()
        const allAgents: MarketplaceAgentData[] = data.agents || []
        const allReviews: (MarketplaceReviewData & { agentName?: string; agentIcon?: string })[] = []
        
        for (const agent of allAgents) {
          try {
            const rRes = await fetch(`/api/marketplace/${agent.id}/reviews?limit=3`)
            if (rRes.ok) {
              const rData = await rRes.json()
              for (const rev of rData.reviews || []) {
                allReviews.push({ ...rev, agentName: agent.name, agentIcon: agent.icon })
              }
            }
          } catch {}
        }
        
        allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setRecentReviews(allReviews.slice(0, 20))
      }
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchAgents(), fetchInstalled()])
      setLoading(false)
    }
    loadAll()
  }, [fetchAgents, fetchInstalled])

  const loadReviewsIfNeeded = useCallback(async () => {
    if (reviewsLoaded) return
    setReviewsLoaded(true)
    await fetchRecentReviews()
  }, [reviewsLoaded, fetchRecentReviews])

  // ─── Handlers ──────────────────────────────────────────────

  const handleInstall = async () => {
    if (!selectedAgent) return
    setInstalling(true)
    try {
      const res = await fetch(`/api/marketplace/${selectedAgent.id}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customName: installCustomName || undefined }),
      })
      if (res.ok) {
        await fetchAgents()
        await fetchInstalled()
        setInstallDialogOpen(false)
        setInstallCustomName('')
        setSelectedAgent(null)
      }
    } catch (e) { console.error(e) }
    setInstalling(false)
  }

  const handleUninstall = async (agentId: string) => {
    try {
      await fetch(`/api/agents/${agentId}`, { method: 'DELETE' })
      await fetchInstalled()
    } catch (e) { console.error(e) }
  }

  const handleSubmitAgent = async () => {
    if (!submitForm.name || !submitForm.description) return
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submitForm,
          tags: submitForm.tags || '[]',
        }),
      })
      if (res.ok) {
        await fetchAgents()
        setSubmitForm({
          name: '', description: '', category: 'general', icon: '🏪',
          config: '{}', tags: '', author: 'community', version: '1.0.0',
        })
      }
    } catch (e) { console.error(e) }
  }

  const handleSubmitReview = async () => {
    if (!reviewAgent) return
    try {
      const res = await fetch(`/api/marketplace/${reviewAgent.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview),
      })
      if (res.ok) {
        await fetchAgents()
        setReviewDialogOpen(false)
        setReviewAgent(null)
        setNewReview({ rating: 5, title: '', content: '' })
      }
    } catch (e) { console.error(e) }
  }

  const handleViewDetail = async (agent: MarketplaceAgentData) => {
    try {
      const res = await fetch(`/api/marketplace/${agent.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedAgent(data.agent)
      }
    } catch (e) { console.error(e) }
  }

  // ─── Stats ─────────────────────────────────────────────────

  const totalInstalls = agents.reduce((sum, a) => sum + a.installCount, 0)
  const avgRating = agents.length > 0
    ? (agents.reduce((sum, a) => sum + a.rating, 0) / agents.length).toFixed(1)
    : '0'
  const officialCount = agents.filter(a => a.isOfficial).length
  const installedCount = installedAgents.length

  // ─── Loading ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  // ─── Detail View ───────────────────────────────────────────

  if (selectedAgent && !installDialogOpen) {
    const parsedTags = (() => { try { return JSON.parse(selectedAgent.tags || '[]') } catch { return [] } })()
    const parsedConfig = (() => { try { return JSON.parse(selectedAgent.config || '{}') } catch { return {} } })()
    const reviews = selectedAgent.reviews || []

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
              onClick={() => setSelectedAgent(null)}
            >
              <ChevronDown className="w-4 h-4 rotate-90 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl border border-emerald-500/20">
                {selectedAgent.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{selectedAgent.name}</h2>
                  {selectedAgent.isOfficial && (
                    <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">
                      <BadgeCheck className="w-3 h-3 mr-0.5" />Official
                    </Badge>
                  )}
                  {selectedAgent.isVerified && (
                    <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400">
                      <ShieldCheck className="w-3 h-3 mr-0.5" />Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#6b7280]">by {selectedAgent.author}</span>
                  <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#6b7280]">
                    v{selectedAgent.version}
                  </Badge>
                  <Badge variant="outline" className={`text-[9px] ${categoryColors[selectedAgent.category] || ''}`}>
                    {selectedAgent.category}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => { setInstallCustomName(''); setInstallDialogOpen(true) }}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />Install
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Rating', value: (Number(selectedAgent.rating)||0).toFixed(1), icon: Star, color: 'text-yellow-400' },
            { label: 'Reviews', value: selectedAgent.reviewCount, icon: MessageSquare, color: 'text-blue-400' },
            { label: 'Installs', value: selectedAgent.installCount, icon: Download, color: 'text-emerald-400' },
            { label: 'Version', value: selectedAgent.version, icon: Package, color: 'text-purple-400' },
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

        {/* Description */}
        <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Description</h3>
            <p className="text-sm text-[#9ca3af] whitespace-pre-wrap">{selectedAgent.description}</p>
          </CardContent>
        </Card>

        {/* Tags */}
        {parsedTags.length > 0 && (
          <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {parsedTags.map((tag: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                    <Tag className="w-3 h-3 mr-1" />{tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Config Preview */}
        <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Configuration</h3>
            <pre className="text-xs text-[#9ca3af] bg-[#0f1117] p-3 rounded-lg overflow-x-auto max-h-48 custom-scrollbar">
              {JSON.stringify(parsedConfig, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Reviews ({reviews.length})
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
                onClick={() => { setReviewAgent(selectedAgent); setReviewDialogOpen(true) }}
              >
                <Plus className="w-3 h-3 mr-1" />Write Review
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <p className="text-sm text-[#6b7280] text-center py-4">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {reviews.map(review => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1e1f2b] flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-[#6b7280]" />
                        </div>
                        <div>
                          <span className="text-xs text-white font-medium">{review.userId}</span>
                          {review.isVerified && (
                            <BadgeCheck className="w-3 h-3 text-blue-400 ml-1 inline" />
                          )}
                        </div>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.title && (
                      <p className="text-xs font-semibold text-white mt-1.5">{review.title}</p>
                    )}
                    {review.content && (
                      <p className="text-xs text-[#9ca3af] mt-1">{review.content}</p>
                    )}
                    <p className="text-[10px] text-[#4b5563] mt-1.5">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Install Dialog */}
        <Dialog open={installDialogOpen} onOpenChange={setInstallDialogOpen}>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                Install {selectedAgent.icon} {selectedAgent.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Custom Agent Name (optional)</label>
                <Input
                  value={installCustomName}
                  onChange={e => setInstallCustomName(e.target.value)}
                  placeholder={selectedAgent.name}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div className="p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                <p className="text-xs text-[#6b7280]">This will create a new agent from the marketplace template with the following configuration:</p>
                <p className="text-xs text-[#9ca3af] mt-1">
                  <span className="font-medium text-white">Type:</span> custom<br />
                  <span className="font-medium text-white">Version:</span> {selectedAgent.version}<br />
                  <span className="font-medium text-white">Category:</span> {selectedAgent.category}
                </p>
              </div>
              <Button
                onClick={handleInstall}
                disabled={installing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {installing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {installing ? 'Installing...' : 'Install Agent'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ─── Main View ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Agent Marketplace</h2>
            <p className="text-xs text-[#6b7280]">Discover, install & share agent templates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
            onClick={() => fetchAgents()}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Available', value: total, icon: Store, color: 'text-emerald-400' },
          { label: 'Total Installs', value: totalInstalls, icon: Download, color: 'text-blue-400' },
          { label: 'Avg Rating', value: avgRating, icon: Star, color: 'text-yellow-400' },
          { label: 'Official', value: officialCount, icon: BadgeCheck, color: 'text-purple-400' },
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1e1f2b] border border-[#2d2e3d] w-full justify-start overflow-x-auto">
          <TabsTrigger value="browse" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Store className="w-3.5 h-3.5 mr-1.5" />Browse
          </TabsTrigger>
          <TabsTrigger value="installed" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Download className="w-3.5 h-3.5 mr-1.5" />Installed
            {installedCount > 0 && (
              <Badge variant="outline" className="ml-1.5 text-[9px] border-emerald-500/30 text-emerald-400 px-1">
                {installedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="submit" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Upload className="w-3.5 h-3.5 mr-1.5" />Submit
          </TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400" onClick={loadReviewsIfNeeded}>
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />Reviews
          </TabsTrigger>
        </TabsList>

        {/* ── Browse Tab ──────────────────────────────────────── */}
        <TabsContent value="browse" className="mt-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search agents by name, description, author..."
                className="pl-10 bg-[#1e1f2b] border-[#2d2e3d] text-white text-sm"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-44 bg-[#1e1f2b] border-[#2d2e3d] text-white text-sm">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-[#6b7280]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-44 bg-[#1e1f2b] border-[#2d2e3d] text-white text-sm">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-[#6b7280]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                {sortOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agent Grid */}
          {agents.length === 0 ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <Store className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280] mb-1">No agents found</p>
                <p className="text-xs text-[#4b5563]">Try adjusting your search or filters, or submit a new agent</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent, i) => {
                const parsedTags = (() => { try { return JSON.parse(agent.tags || '[]') } catch { return [] } })()
                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors h-full flex flex-col">
                      <CardContent className="p-4 flex-1 flex flex-col">
                        {/* Header */}
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-[#0f1117] flex items-center justify-center text-2xl flex-shrink-0 border border-[#2d2e3d]">
                            {agent.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-sm font-semibold text-white truncate">{agent.name}</h3>
                              {agent.isOfficial && (
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              )}
                              {agent.isVerified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[#6b7280]">by {agent.author}</span>
                              <Badge variant="outline" className={`text-[8px] ${categoryColors[agent.category] || ''}`}>
                                {agent.category}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Rating & Stats */}
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1">
                            <StarRating rating={Math.round(agent.rating)} size="sm" />
                            <span className="text-xs text-yellow-400 font-medium ml-1">{(Number(agent.rating)||0).toFixed(1)}</span>
                          </div>
                          <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                            <Download className="w-3 h-3" />{agent.installCount}
                          </span>
                          <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />{agent.reviewCount}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[#9ca3af] mt-2 line-clamp-2 flex-1">{agent.description}</p>

                        {/* Tags */}
                        {parsedTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {parsedTags.slice(0, 3).map((tag: string, j: number) => (
                              <Badge key={j} variant="outline" className="text-[9px] border-[#2d2e3d] text-[#6b7280]">
                                {tag}
                              </Badge>
                            ))}
                            {parsedTags.length > 3 && (
                              <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#4b5563]">
                                +{parsedTags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#2d2e3d]">
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                            onClick={() => {
                              setSelectedAgent(agent)
                              setInstallCustomName('')
                              setInstallDialogOpen(true)
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />Install
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b] text-xs h-8"
                            onClick={() => handleViewDetail(agent)}
                          >
                            <Eye className="w-3 h-3 mr-1" />Detail
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

        {/* ── Installed Tab ───────────────────────────────────── */}
        <TabsContent value="installed" className="mt-4">
          {installedAgents.length === 0 ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <Download className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280] mb-1">No agents installed yet</p>
                <p className="text-xs text-[#4b5563]">Browse the marketplace and install agent templates</p>
                <Button
                  size="sm"
                  className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setActiveTab('browse')}
                >
                  <Store className="w-3.5 h-3.5 mr-1.5" />Browse Marketplace
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              {installedAgents.map((agent, i) => {
                const statusColor = agent.status === 'running' ? 'text-emerald-400' :
                  agent.status === 'idle' ? 'text-[#6b7280]' :
                  agent.status === 'error' ? 'text-red-400' :
                  'text-yellow-400'
                const StatusIcon = agent.status === 'running' ? CheckCircle2 :
                  agent.status === 'error' ? XCircle :
                  agent.status === 'paused' ? AlertTriangle : Clock

                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#0f1117] flex items-center justify-center text-xl flex-shrink-0 border border-[#2d2e3d]">
                              {agent.avatar || '🤖'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-white truncate">{agent.name}</h4>
                                <Badge variant="outline" className={`text-[9px] ${statusColor} flex-shrink-0`}>
                                  <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                                  {agent.status}
                                </Badge>
                                {agent.hasUpdate && (
                                  <Badge variant="outline" className="text-[9px] border-yellow-500/30 text-yellow-400 flex-shrink-0">
                                    <RefreshCw className="w-2.5 h-2.5 mr-0.5" />Update
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#6b7280]">
                                <Badge variant="outline" className="text-[8px] border-[#2d2e3d] text-[#6b7280]">
                                  v{agent.marketplaceVersion || '1.0.0'}
                                </Badge>
                                {agent.marketplaceAuthor && (
                                  <span>by {agent.marketplaceAuthor}</span>
                                )}
                                <span className="flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  {agent.tasksCompleted} done
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <XCircle className="w-3 h-3 text-red-400" />
                                  {agent.tasksFailed} fail
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {agent.hasUpdate && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 text-xs h-7"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />Update
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-7"
                              onClick={() => handleUninstall(agent.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />Uninstall
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

        {/* ── Submit Tab ──────────────────────────────────────── */}
        <TabsContent value="submit" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Submit Agent to Marketplace</h3>
                      <p className="text-xs text-[#6b7280]">Share your agent template with the community</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Agent Name *</label>
                      <Input
                        value={submitForm.name}
                        onChange={e => setSubmitForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Code Reviewer Pro"
                        className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Icon (Emoji)</label>
                      <Input
                        value={submitForm.icon}
                        onChange={e => setSubmitForm(p => ({ ...p, icon: e.target.value }))}
                        placeholder="🏪"
                        className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Description *</label>
                    <Textarea
                      value={submitForm.description}
                      onChange={e => setSubmitForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Describe what your agent does, its capabilities, and use cases..."
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Category</label>
                      <Select value={submitForm.category} onValueChange={v => setSubmitForm(p => ({ ...p, category: v }))}>
                        <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                          {categories.filter(c => c.value !== 'all').map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Version</label>
                      <Input
                        value={submitForm.version}
                        onChange={e => setSubmitForm(p => ({ ...p, version: e.target.value }))}
                        placeholder="1.0.0"
                        className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Author</label>
                    <Input
                      value={submitForm.author}
                      onChange={e => setSubmitForm(p => ({ ...p, author: e.target.value }))}
                      placeholder="community"
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Tags (comma-separated)</label>
                    <Input
                      value={submitForm.tags}
                      onChange={e => setSubmitForm(p => ({ ...p, tags: e.target.value }))}
                      placeholder="e.g. code-review, testing, automation"
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Agent Configuration (JSON)</label>
                    <Textarea
                      value={submitForm.config}
                      onChange={e => setSubmitForm(p => ({ ...p, config: e.target.value }))}
                      placeholder='{"type": "custom", "model": "gpt-4o", "systemPrompt": "..."}'
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm font-mono min-h-[120px]"
                    />
                  </div>

                  <Button
                    onClick={handleSubmitAgent}
                    disabled={!submitForm.name || !submitForm.description}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />Submit to Marketplace
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div>
              <Card className="bg-[#1e1f2b] border-[#2d2e3d] sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#1e1f2b] flex items-center justify-center text-2xl border border-[#2d2e3d]">
                        {submitForm.icon || '🏪'}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{submitForm.name || 'Agent Name'}</h4>
                        <span className="text-[10px] text-[#6b7280]">by {submitForm.author || 'community'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-2 line-clamp-3">
                      {submitForm.description || 'Agent description will appear here...'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-[8px] ${categoryColors[submitForm.category] || ''}`}>
                        {submitForm.category}
                      </Badge>
                      <Badge variant="outline" className="text-[8px] border-[#2d2e3d] text-[#6b7280]">
                        v{submitForm.version}
                      </Badge>
                    </div>
                    {submitForm.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {submitForm.tags.split(',').map((tag, j) => tag.trim() && (
                          <Badge key={j} variant="outline" className="text-[8px] border-[#2d2e3d] text-[#6b7280]">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-[#2d2e3d]">
                      <StarRating rating={0} size="sm" />
                      <span className="text-[10px] text-[#6b7280]">0 installs</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Reviews Tab ─────────────────────────────────────── */}
        <TabsContent value="reviews" className="mt-4">
          {recentReviews.length === 0 ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280] mb-1">No reviews yet</p>
                <p className="text-xs text-[#4b5563]">Reviews will appear here once agents receive feedback</p>
                <Button
                  size="sm"
                  className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setActiveTab('browse')}
                >
                  <Store className="w-3.5 h-3.5 mr-1.5" />Browse & Review
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {recentReviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#0f1117] flex items-center justify-center text-lg border border-[#2d2e3d] flex-shrink-0">
                          {review.agentIcon || '🏪'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{review.agentName}</span>
                              <Badge variant="outline" className="text-[8px] border-[#2d2e3d] text-[#6b7280]">
                                by {review.userId}
                              </Badge>
                              {review.isVerified && (
                                <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                              )}
                            </div>
                            <span className="text-[10px] text-[#4b5563] flex-shrink-0">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={review.rating} size="sm" />
                            <span className="text-xs text-yellow-400 font-medium">{review.rating}.0</span>
                          </div>
                          {review.title && (
                            <p className="text-xs font-semibold text-white mt-1">{review.title}</p>
                          )}
                          {review.content && (
                            <p className="text-xs text-[#9ca3af] mt-1">{review.content}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Write Review for {reviewAgent?.icon} {reviewAgent?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-[#9ca3af] mb-2 block">Rating</label>
              <StarRating
                rating={newReview.rating}
                size="lg"
                interactive
                onChange={r => setNewReview(p => ({ ...p, rating: r }))}
              />
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Title (optional)</label>
              <Input
                value={newReview.title}
                onChange={e => setNewReview(p => ({ ...p, title: e.target.value }))}
                placeholder="Summary of your experience"
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Review (optional)</label>
              <Textarea
                value={newReview.content}
                onChange={e => setNewReview(p => ({ ...p, content: e.target.value }))}
                placeholder="Share your experience with this agent..."
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm min-h-[80px]"
              />
            </div>
            <Button
              onClick={handleSubmitReview}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
