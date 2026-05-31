'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio,
  Zap,
  Eye,
  Plus,
  Trash2,
  Filter,
  ArrowRight,
  Loader2,
  ChevronRight,
  Clock,
  Hash,
  Send,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

// ─── Types ──────────────────────────────────────────────────────

interface EventTopic {
  id: string
  name: string
  description: string | null
  schema: string
  retention: number
  eventCount: number
  lastEventAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { subscriptions: number; events: number }
  subscriptions?: EventSubscription[]
  events?: EventRecord[]
}

interface EventSubscription {
  id: string
  topicId: string
  subscriberType: string
  subscriberId: string | null
  filter: string
  transform: string | null
  isActive: boolean
  deliveryCount: number
  errorCount: number
  lastDeliveredAt: string | null
  createdAt: string
  updatedAt: string
  topic?: { id: string; name: string }
  _count?: { deliveries: number }
}

interface EventRecord {
  id: string
  topicId: string
  eventType: string
  source: string | null
  payload: string
  metadata: string
  isProcessed: boolean
  createdAt: string
  topic?: { id: string; name: string }
}

interface EventDelivery {
  id: string
  subscriptionId: string
  eventId: string
  status: string
  attempts: number
  lastAttemptAt: string | null
  response: string | null
  deliveredAt: string | null
  createdAt: string
  subscription?: {
    id: string
    subscriberType: string
    subscriberId: string | null
    topic: { id: string; name: string }
  }
}

// ─── Constants ──────────────────────────────────────────────────

const tabs = [
  { id: 'topics', label: 'Topics', icon: Radio },
  { id: 'subscriptions', label: 'Subscriptions', icon: Zap },
  { id: 'events', label: 'Events', icon: Eye },
  { id: 'deliveries', label: 'Deliveries', icon: ArrowRight },
]

const subscriberTypes = ['agent', 'webhook', 'automation', 'workflow', 'plugin']

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  retrying: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

const subscriberTypeColors: Record<string, { icon: typeof Zap; color: string; bg: string }> = {
  agent: { icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  webhook: { icon: Radio, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  automation: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  workflow: { icon: ArrowRight, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  plugin: { icon: Hash, color: 'text-purple-400', bg: 'bg-purple-500/20' },
}

// ─── Helpers ────────────────────────────────────────────────────

function timeAgo(date: string | null): string {
  if (!date) return 'Never'
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatTimestamp(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function truncatePayload(payload: string, maxLen = 80): string {
  try {
    const parsed = JSON.parse(payload)
    const str = JSON.stringify(parsed, null, 2)
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str
  } catch {
    return payload.length > maxLen ? payload.substring(0, maxLen) + '...' : payload
  }
}

// ─── Component ──────────────────────────────────────────────────

export function EventBus() {
  const { addToast } = useAgentOSStore()
  const [activeTab, setActiveTab] = useState('topics')
  const [loading, setLoading] = useState(false)

  // Topics state
  const [topics, setTopics] = useState<EventTopic[]>([])
  const [showCreateTopic, setShowCreateTopic] = useState(false)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [topicDetail, setTopicDetail] = useState<EventTopic | null>(null)
  const [newTopic, setNewTopic] = useState({ name: '', description: '', schema: '{}', retention: 168 })

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<EventSubscription[]>([])
  const [showCreateSub, setShowCreateSub] = useState(false)
  const [newSub, setNewSub] = useState({
    topicId: '',
    subscriberType: 'agent',
    subscriberId: '',
    filter: '{}',
    transform: '',
  })

  // Events state
  const [events, setEvents] = useState<EventRecord[]>([])
  const [eventsTotal, setEventsTotal] = useState(0)
  const [eventFilter, setEventFilter] = useState({ topicId: '', source: '' })
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showPublishEvent, setShowPublishEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    topicId: '',
    eventType: '',
    source: '',
    payload: '{}',
    metadata: '{}',
  })
  const autoRefreshRef = useRef(autoRefresh)
  useEffect(() => { autoRefreshRef.current = autoRefresh })

  // Deliveries state
  const [deliveries, setDeliveries] = useState<EventDelivery[]>([])
  const [deliveriesTotal, setDeliveriesTotal] = useState(0)
  const [deliveryFilter, setDeliveryFilter] = useState({ subscriptionId: '', status: '' })

  // ─── Fetch functions ─────────────────────────────────────────

  const fetchTopics = useCallback(async () => {
    try {
      const res = await fetch('/api/event-bus/topics')
      if (res.ok) {
        const data = await res.json()
        setTopics(data.topics || [])
      }
    } catch {}
  }, [])

  const fetchTopicDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/event-bus/topics/${id}`)
      if (res.ok) {
        const data = await res.json()
        setTopicDetail(data)
      }
    } catch {}
  }, [])

  const fetchSubscriptions = useCallback(async (topicId?: string) => {
    try {
      const url = topicId
        ? `/api/event-bus/subscriptions?topicId=${topicId}`
        : '/api/event-bus/subscriptions'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setSubscriptions(data.subscriptions || [])
      }
    } catch {}
  }, [])

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (eventFilter.topicId) params.set('topicId', eventFilter.topicId)
      if (eventFilter.source) params.set('source', eventFilter.source)
      params.set('limit', '50')
      const res = await fetch(`/api/event-bus/events?${params}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
        setEventsTotal(data.total || 0)
      }
    } catch {}
  }, [eventFilter.topicId, eventFilter.source])

  const fetchDeliveries = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (deliveryFilter.subscriptionId) params.set('subscriptionId', deliveryFilter.subscriptionId)
      if (deliveryFilter.status) params.set('status', deliveryFilter.status)
      params.set('limit', '50')
      const res = await fetch(`/api/event-bus/deliveries?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDeliveries(data.deliveries || [])
        setDeliveriesTotal(data.total || 0)
      }
    } catch {}
  }, [deliveryFilter.subscriptionId, deliveryFilter.status])

  // ─── Initial load ────────────────────────────────────────────

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTopics(), fetchSubscriptions(), fetchEvents(), fetchDeliveries()]).finally(() => setLoading(false))
  }, [fetchTopics, fetchSubscriptions, fetchEvents, fetchDeliveries])

  // ─── Auto refresh for events tab ────────────────────────────

  useEffect(() => {
    if (activeTab !== 'events' || !autoRefreshRef.current) return
    const interval = setInterval(() => {
      fetchEvents()
    }, 5000)
    return () => clearInterval(interval)
  }, [activeTab, fetchEvents])

  // ─── Refetch when filters change ────────────────────────────

  useEffect(() => {
    if (activeTab === 'events') fetchEvents()
  }, [eventFilter, activeTab, fetchEvents])

  useEffect(() => {
    if (activeTab === 'deliveries') fetchDeliveries()
  }, [deliveryFilter, activeTab, fetchDeliveries])

  // ─── Topic detail ───────────────────────────────────────────

  useEffect(() => {
    if (selectedTopicId) fetchTopicDetail(selectedTopicId)
    else setTopicDetail(null)
  }, [selectedTopicId, fetchTopicDetail])

  // ─── Handlers ────────────────────────────────────────────────

  const handleCreateTopic = async () => {
    if (!newTopic.name.trim()) return
    try {
      const res = await fetch('/api/event-bus/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTopic),
      })
      if (res.ok) {
        setShowCreateTopic(false)
        setNewTopic({ name: '', description: '', schema: '{}', retention: 168 })
        fetchTopics()
        addToast('Topic created successfully', 'success')
      } else {
        const data = await res.json()
        addToast(data.error || 'Failed to create topic', 'error')
      }
    } catch {
      addToast('Failed to create topic', 'error')
    }
  }

  const handleDeleteTopic = async (id: string) => {
    try {
      const res = await fetch(`/api/event-bus/topics/${id}`, { method: 'DELETE' })
      if (res.ok) {
        if (selectedTopicId === id) setSelectedTopicId(null)
        fetchTopics()
        addToast('Topic deleted', 'success')
      }
    } catch {
      addToast('Failed to delete topic', 'error')
    }
  }

  const handleToggleTopic = async (topic: EventTopic) => {
    try {
      await fetch(`/api/event-bus/topics/${topic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !topic.isActive }),
      })
      fetchTopics()
      if (selectedTopicId === topic.id) fetchTopicDetail(topic.id)
    } catch {}
  }

  const handleCreateSubscription = async () => {
    if (!newSub.topicId) return
    try {
      const res = await fetch('/api/event-bus/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSub,
          subscriberId: newSub.subscriberId || null,
          transform: newSub.transform || null,
        }),
      })
      if (res.ok) {
        setShowCreateSub(false)
        setNewSub({ topicId: '', subscriberType: 'agent', subscriberId: '', filter: '{}', transform: '' })
        fetchSubscriptions()
        fetchTopics()
        addToast('Subscription created', 'success')
      } else {
        addToast('Failed to create subscription', 'error')
      }
    } catch {
      addToast('Failed to create subscription', 'error')
    }
  }

  const handleToggleSubscription = async (sub: EventSubscription) => {
    try {
      await fetch(`/api/event-bus/subscriptions/${sub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !sub.isActive }),
      })
      fetchSubscriptions()
    } catch {}
  }

  const handleDeleteSubscription = async (id: string) => {
    try {
      await fetch(`/api/event-bus/subscriptions/${id}`, { method: 'DELETE' })
      fetchSubscriptions()
      fetchTopics()
      addToast('Subscription deleted', 'success')
    } catch {
      addToast('Failed to delete subscription', 'error')
    }
  }

  const handlePublishEvent = async () => {
    if (!newEvent.topicId || !newEvent.eventType) return
    try {
      const res = await fetch('/api/event-bus/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEvent,
          source: newEvent.source || null,
        }),
      })
      if (res.ok) {
        setShowPublishEvent(false)
        setNewEvent({ topicId: '', eventType: '', source: '', payload: '{}', metadata: '{}' })
        fetchEvents()
        fetchTopics()
        addToast('Event published', 'success')
      } else {
        addToast('Failed to publish event', 'error')
      }
    } catch {
      addToast('Failed to publish event', 'error')
    }
  }

  // ─── Stats ───────────────────────────────────────────────────

  const totalTopics = topics.length
  const activeTopics = topics.filter(t => t.isActive).length
  const totalSubscriptions = subscriptions.length
  const totalEvents = eventsTotal
  const pendingDeliveries = deliveries.filter(d => d.status === 'pending' || d.status === 'retrying').length
  const failedDeliveries = deliveries.filter(d => d.status === 'failed').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Radio className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Event Bus
            <span className="text-[10px] font-mono text-emerald-500/70 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              RJMLABS.CO.UK
            </span>
          </h2>
          <p className="text-xs text-[#9ca3af]">Publish-subscribe event streaming &amp; delivery pipeline</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Topics', value: totalTopics, sub: `${activeTopics} active`, icon: Radio, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Subscriptions', value: totalSubscriptions, sub: 'across topics', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Total Events', value: totalEvents, sub: 'recorded', icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Pending', value: pendingDeliveries, sub: 'deliveries', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Failed', value: failedDeliveries, sub: 'deliveries', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(stat => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-[#6b7280]">{stat.sub}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#1e1f2b] rounded-xl p-1 border border-[#2d2e3d]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-[#6b7280] hover:text-white hover:bg-[#252636] border border-transparent'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {/* ═══════════════ TOPICS TAB ═══════════════ */}
          {activeTab === 'topics' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Event Topics</h3>
                <button
                  onClick={() => setShowCreateTopic(!showCreateTopic)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Topic
                </button>
              </div>

              {/* Create Topic Form */}
              <AnimatePresence>
                {showCreateTopic && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-4 space-y-3 overflow-hidden"
                  >
                    <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Create New Topic</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        value={newTopic.name}
                        onChange={e => setNewTopic(p => ({ ...p, name: e.target.value }))}
                        placeholder="Topic name (e.g. agent.completed)"
                        className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                      />
                      <input
                        value={newTopic.description}
                        onChange={e => setNewTopic(p => ({ ...p, description: e.target.value }))}
                        placeholder="Description (optional)"
                        className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <textarea
                      value={newTopic.schema}
                      onChange={e => setNewTopic(p => ({ ...p, schema: e.target.value }))}
                      placeholder='JSON Schema (e.g. {"type":"object"})'
                      rows={2}
                      className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[#9ca3af]">Retention (hours)</label>
                        <input
                          type="number"
                          value={newTopic.retention}
                          onChange={e => setNewTopic(p => ({ ...p, retention: parseInt(e.target.value) || 168 }))}
                          className="w-24 bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div className="flex-1" />
                      <button
                        onClick={handleCreateTopic}
                        className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
                      >
                        Create Topic
                      </button>
                      <button
                        onClick={() => setShowCreateTopic(false)}
                        className="px-4 py-1.5 rounded-lg bg-[#252636] text-[#9ca3af] text-xs font-medium hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Topics List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
              ) : topics.length === 0 ? (
                <div className="text-center py-12 text-[#6b7280]">
                  <Radio className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No topics yet. Create one to start your event pipeline.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar">
                  {topics.map(topic => (
                    <div
                      key={topic.id}
                      className={`bg-[#1e1f2b] border rounded-xl overflow-hidden transition-colors ${
                        selectedTopicId === topic.id ? 'border-emerald-500/40' : 'border-[#2d2e3d]'
                      }`}
                    >
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#252636] transition-colors"
                        onClick={() => setSelectedTopicId(selectedTopicId === topic.id ? null : topic.id)}
                      >
                        <ChevronRight
                          className={`w-4 h-4 text-[#6b7280] transition-transform ${
                            selectedTopicId === topic.id ? 'rotate-90' : ''
                          }`}
                        />
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          topic.isActive ? 'bg-emerald-500/20' : 'bg-gray-500/20'
                        }`}>
                          <Radio className={`w-4 h-4 ${topic.isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate font-mono">{topic.name}</span>
                            {!topic.isActive && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                INACTIVE
                              </span>
                            )}
                          </div>
                          {topic.description && (
                            <p className="text-[11px] text-[#6b7280] truncate mt-0.5">{topic.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-[#6b7280]">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{topic.eventCount} events</span>
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{topic._count?.subscriptions ?? 0} subs</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{topic.retention}h retention</span>
                            <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{timeAgo(topic.lastEventAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={e => { e.stopPropagation(); handleToggleTopic(topic) }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#0f1117] transition-colors"
                            title={topic.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {topic.isActive ? (
                              <ToggleRight className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteTopic(topic.id) }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete topic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Topic Detail */}
                      <AnimatePresence>
                        {selectedTopicId === topic.id && topicDetail && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-[#2d2e3d] overflow-hidden"
                          >
                            <div className="p-3 space-y-3">
                              {/* Schema */}
                              <div>
                                <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Schema</p>
                                <pre className="text-[11px] text-[#9ca3af] bg-[#0f1117] rounded-lg p-2 overflow-x-auto font-mono">
                                  {truncatePayload(topicDetail.schema, 200)}
                                </pre>
                              </div>
                              {/* Subscriptions for this topic */}
                              {topicDetail.subscriptions && topicDetail.subscriptions.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Subscriptions ({topicDetail.subscriptions.length})</p>
                                  <div className="space-y-1">
                                    {topicDetail.subscriptions.map(sub => {
                                      const typeConfig = subscriberTypeColors[sub.subscriberType] || subscriberTypeColors.agent
                                      return (
                                        <div key={sub.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#252636]">
                                          <div className={`w-5 h-5 rounded flex items-center justify-center ${typeConfig.bg}`}>
                                            <typeConfig.icon className={`w-3 h-3 ${typeConfig.color}`} />
                                          </div>
                                          <span className="text-xs text-white flex-1 truncate">
                                            {sub.subscriberType}{sub.subscriberId ? ` → ${sub.subscriberId}` : ''}
                                          </span>
                                          <span className="text-[10px] text-[#6b7280]">{sub.deliveryCount} delivered</span>
                                          {sub.errorCount > 0 && (
                                            <span className="text-[10px] text-red-400">{sub.errorCount} errors</span>
                                          )}
                                          <div className={`w-1.5 h-1.5 rounded-full ${sub.isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              {/* Recent Events */}
                              {topicDetail.events && topicDetail.events.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Recent Events ({topicDetail.events.length})</p>
                                  <div className="space-y-1">
                                    {topicDetail.events.slice(0, 5).map(evt => (
                                      <div key={evt.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#252636]">
                                        <span className="text-xs text-white font-mono truncate flex-1">{evt.eventType}</span>
                                        <span className="text-[10px] text-[#6b7280]">{evt.source || 'system'}</span>
                                        <span className="text-[10px] text-[#6b7280]">{timeAgo(evt.createdAt)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ SUBSCRIPTIONS TAB ═══════════════ */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Subscriptions</h3>
                <button
                  onClick={() => setShowCreateSub(!showCreateSub)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Subscription
                </button>
              </div>

              {/* Create Subscription Form */}
              <AnimatePresence>
                {showCreateSub && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-4 space-y-3 overflow-hidden"
                  >
                    <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Create New Subscription</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-[#9ca3af] uppercase tracking-wider block mb-1">Topic</label>
                        <select
                          value={newSub.topicId}
                          onChange={e => setNewSub(p => ({ ...p, topicId: e.target.value }))}
                          className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="">Select a topic...</option>
                          {topics.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#9ca3af] uppercase tracking-wider block mb-1">Subscriber Type</label>
                        <select
                          value={newSub.subscriberType}
                          onChange={e => setNewSub(p => ({ ...p, subscriberType: e.target.value }))}
                          className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                        >
                          {subscriberTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        value={newSub.subscriberId}
                        onChange={e => setNewSub(p => ({ ...p, subscriberId: e.target.value }))}
                        placeholder="Subscriber ID (optional)"
                        className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                      />
                      <input
                        value={newSub.transform}
                        onChange={e => setNewSub(p => ({ ...p, transform: e.target.value }))}
                        placeholder="Transform expression (optional)"
                        className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <textarea
                      value={newSub.filter}
                      onChange={e => setNewSub(p => ({ ...p, filter: e.target.value }))}
                      placeholder='Filter conditions JSON (e.g. {"eventType":"completed"})'
                      rows={2}
                      className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateSubscription}
                        className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
                      >
                        Create Subscription
                      </button>
                      <button
                        onClick={() => setShowCreateSub(false)}
                        className="px-4 py-1.5 rounded-lg bg-[#252636] text-[#9ca3af] text-xs font-medium hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Subscriptions List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-12 text-[#6b7280]">
                  <Zap className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No subscriptions yet. Subscribe to topics to receive events.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar">
                  {subscriptions.map(sub => {
                    const typeConfig = subscriberTypeColors[sub.subscriberType] || subscriberTypeColors.agent
                    const errorRate = sub.deliveryCount > 0
                      ? Math.round((sub.errorCount / sub.deliveryCount) * 100)
                      : 0
                    return (
                      <div key={sub.id} className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeConfig.bg}`}>
                            <typeConfig.icon className={`w-4 h-4 ${typeConfig.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white capitalize">{sub.subscriberType}</span>
                              {sub.subscriberId && (
                                <span className="text-[11px] text-[#9ca3af] font-mono truncate">→ {sub.subscriberId}</span>
                              )}
                              {!sub.isActive && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                  INACTIVE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-[#6b7280]">
                              {sub.topic && (
                                <span className="flex items-center gap-1 text-emerald-400/70">
                                  <Radio className="w-3 h-3" />{sub.topic.name}
                                </span>
                              )}
                              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{sub.deliveryCount} delivered</span>
                              {sub.errorCount > 0 && (
                                <span className="flex items-center gap-1 text-red-400">
                                  <XCircle className="w-3 h-3" />{sub.errorCount} errors ({errorRate}%)
                                </span>
                              )}
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(sub.lastDeliveredAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleSubscription(sub)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#0f1117] transition-colors"
                              title={sub.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {sub.isActive ? (
                                <ToggleRight className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteSubscription(sub.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete subscription"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {/* Filter/Transform preview */}
                        {(sub.filter !== '{}' || sub.transform) && (
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {sub.filter !== '{}' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-[#0f1117] text-[#9ca3af] font-mono border border-[#2d2e3d]">
                                <Filter className="w-2.5 h-2.5 inline mr-1" />
                                {truncatePayload(sub.filter, 40)}
                              </span>
                            )}
                            {sub.transform && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-[#0f1117] text-amber-400/70 font-mono border border-[#2d2e3d]">
                                <ArrowRight className="w-2.5 h-2.5 inline mr-1" />
                                {sub.transform}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ EVENTS TAB ═══════════════ */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-white">Event Stream</h3>
                <div className="flex items-center gap-2">
                  {/* Auto refresh toggle */}
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      autoRefresh
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-[#252636] text-[#6b7280] border border-[#2d2e3d]'
                    }`}
                  >
                    <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                    Auto-refresh
                  </button>
                  <button
                    onClick={() => fetchEvents()}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#252636] text-[#6b7280] text-[10px] font-medium hover:text-white transition-colors border border-[#2d2e3d]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowPublishEvent(!showPublishEvent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Publish
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2.5 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#6b7280]" />
                  <select
                    value={eventFilter.topicId}
                    onChange={e => setEventFilter(p => ({ ...p, topicId: e.target.value }))}
                    className="bg-transparent text-xs text-white focus:outline-none"
                  >
                    <option value="">All Topics</option>
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2.5 py-1.5">
                  <Search className="w-3.5 h-3.5 text-[#6b7280]" />
                  <input
                    value={eventFilter.source}
                    onChange={e => setEventFilter(p => ({ ...p, source: e.target.value }))}
                    placeholder="Source filter..."
                    className="bg-transparent text-xs text-white placeholder-[#6b7280] focus:outline-none w-28"
                  />
                  {eventFilter.source && (
                    <button onClick={() => setEventFilter(p => ({ ...p, source: '' }))}>
                      <X className="w-3 h-3 text-[#6b7280] hover:text-white" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-[#6b7280]">{eventsTotal} events</span>
              </div>

              {/* Publish Event Form */}
              <AnimatePresence>
                {showPublishEvent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#1e1f2b] border border-emerald-500/20 rounded-xl p-4 space-y-3 overflow-hidden"
                  >
                    <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      Publish New Event
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-[#9ca3af] uppercase tracking-wider block mb-1">Topic</label>
                        <select
                          value={newEvent.topicId}
                          onChange={e => setNewEvent(p => ({ ...p, topicId: e.target.value }))}
                          className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="">Select a topic...</option>
                          {topics.filter(t => t.isActive).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        value={newEvent.eventType}
                        onChange={e => setNewEvent(p => ({ ...p, eventType: e.target.value }))}
                        placeholder="Event type (e.g. completed)"
                        className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                      />
                      <input
                        value={newEvent.source}
                        onChange={e => setNewEvent(p => ({ ...p, source: e.target.value }))}
                        placeholder="Source (optional)"
                        className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <textarea
                      value={newEvent.payload}
                      onChange={e => setNewEvent(p => ({ ...p, payload: e.target.value }))}
                      placeholder='Event payload JSON (e.g. {"agentId":"agent-1","result":"success"})'
                      rows={3}
                      className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handlePublishEvent}
                        className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
                      >
                        Publish Event
                      </button>
                      <button
                        onClick={() => setShowPublishEvent(false)}
                        className="px-4 py-1.5 rounded-lg bg-[#252636] text-[#9ca3af] text-xs font-medium hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Events List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12 text-[#6b7280]">
                  <Eye className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No events yet. Publish an event or wait for auto-refresh.</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
                  {events.map(evt => {
                    const isExpanded = expandedEventId === evt.id
                    return (
                      <div
                        key={evt.id}
                        className={`bg-[#1e1f2b] border rounded-lg overflow-hidden transition-colors ${
                          isExpanded ? 'border-emerald-500/30' : 'border-[#2d2e3d]'
                        }`}
                      >
                        <div
                          className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[#252636] transition-colors"
                          onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                        >
                          <ChevronRight className={`w-3.5 h-3.5 text-[#6b7280] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                            evt.isProcessed ? 'bg-emerald-500/20' : 'bg-yellow-500/20'
                          }`}>
                            {evt.isProcessed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-yellow-400" />
                            )}
                          </div>
                          <span className="text-xs font-mono text-white truncate">{evt.eventType}</span>
                          {evt.topic && (
                            <span className="text-[10px] text-emerald-400/70 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              {evt.topic.name}
                            </span>
                          )}
                          <span className="text-[10px] text-[#6b7280]">{evt.source || 'system'}</span>
                          <span className="text-[10px] text-[#6b7280] ml-auto shrink-0">{formatTimestamp(evt.createdAt)}</span>
                        </div>
                        {/* Payload preview (collapsed) */}
                        {!isExpanded && (
                          <div className="px-3 pb-2">
                            <p className="text-[10px] text-[#6b7280] font-mono truncate">{truncatePayload(evt.payload, 120)}</p>
                          </div>
                        )}
                        {/* Expanded full payload */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-[#2d2e3d] overflow-hidden"
                            >
                              <div className="p-3 space-y-2">
                                <div>
                                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Payload</p>
                                  <pre className="text-[11px] text-[#9ca3af] bg-[#0f1117] rounded-lg p-2 overflow-x-auto font-mono whitespace-pre-wrap">
                                    {(() => { try { return JSON.stringify(JSON.parse(evt.payload), null, 2) } catch { return evt.payload } })()}
                                  </pre>
                                </div>
                                {evt.metadata !== '{}' && (
                                  <div>
                                    <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Metadata</p>
                                    <pre className="text-[11px] text-[#6b7280] bg-[#0f1117] rounded-lg p-2 overflow-x-auto font-mono whitespace-pre-wrap">
                                      {(() => { try { return JSON.stringify(JSON.parse(evt.metadata), null, 2) } catch { return evt.metadata } })()}
                                    </pre>
                                  </div>
                                )}
                                <div className="flex items-center gap-4 text-[10px] text-[#6b7280]">
                                  <span>ID: <span className="text-[#9ca3af] font-mono">{evt.id}</span></span>
                                  <span>Processed: <span className={evt.isProcessed ? 'text-emerald-400' : 'text-yellow-400'}>{evt.isProcessed ? 'Yes' : 'No'}</span></span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ DELIVERIES TAB ═══════════════ */}
          {activeTab === 'deliveries' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Delivery History</h3>
                <span className="text-[10px] text-[#6b7280]">{deliveriesTotal} total</span>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2.5 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#6b7280]" />
                  <select
                    value={deliveryFilter.status}
                    onChange={e => setDeliveryFilter(p => ({ ...p, status: e.target.value }))}
                    className="bg-transparent text-xs text-white focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                    <option value="retrying">Retrying</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-2.5 py-1.5">
                  <Search className="w-3.5 h-3.5 text-[#6b7280]" />
                  <input
                    value={deliveryFilter.subscriptionId}
                    onChange={e => setDeliveryFilter(p => ({ ...p, subscriptionId: e.target.value }))}
                    placeholder="Subscription ID..."
                    className="bg-transparent text-xs text-white placeholder-[#6b7280] focus:outline-none w-40"
                  />
                  {deliveryFilter.subscriptionId && (
                    <button onClick={() => setDeliveryFilter(p => ({ ...p, subscriptionId: '' }))}>
                      <X className="w-3 h-3 text-[#6b7280] hover:text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Deliveries Table */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
              ) : deliveries.length === 0 ? (
                <div className="text-center py-12 text-[#6b7280]">
                  <ArrowRight className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No deliveries yet. Events will be delivered to subscribers automatically.</p>
                </div>
              ) : (
                <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="hidden md:flex items-center gap-4 px-4 py-2 border-b border-[#2d2e3d] text-[10px] text-[#6b7280] uppercase tracking-wider">
                    <span className="w-24">Status</span>
                    <span className="w-28">Subscriber</span>
                    <span className="w-32">Topic</span>
                    <span className="w-16">Attempts</span>
                    <span className="flex-1">Response</span>
                    <span className="w-28">Time</span>
                  </div>
                  {/* Rows */}
                  <div className="max-h-[calc(100vh-440px)] overflow-y-auto custom-scrollbar">
                    {deliveries.map(del => {
                      const statusClass = statusColors[del.status] || statusColors.pending
                      const StatusIcon = del.status === 'delivered' || del.status === 'success'
                        ? CheckCircle2
                        : del.status === 'failed'
                        ? XCircle
                        : del.status === 'retrying'
                        ? RotateCcw
                        : Clock
                      return (
                        <div key={del.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-4 py-2.5 hover:bg-[#252636] border-b border-[#2d2e3d]/50 transition-colors">
                          <div className="w-24 flex items-center gap-1.5">
                            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusClass}`}>
                              {del.status}
                            </span>
                          </div>
                          <div className="w-28">
                            {del.subscription ? (
                              <span className="text-xs text-white capitalize">{del.subscription.subscriberType}</span>
                            ) : (
                              <span className="text-xs text-[#6b7280]">—</span>
                            )}
                          </div>
                          <div className="w-32">
                            {del.subscription?.topic ? (
                              <span className="text-xs text-emerald-400/70 font-mono truncate">{del.subscription.topic.name}</span>
                            ) : (
                              <span className="text-xs text-[#6b7280]">—</span>
                            )}
                          </div>
                          <div className="w-16">
                            <span className="text-xs text-[#9ca3af]">{del.attempts}</span>
                            {del.attempts > 1 && (
                              <RotateCcw className="w-2.5 h-2.5 text-orange-400 inline ml-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {del.response ? (
                              <p className="text-[10px] text-[#9ca3af] font-mono truncate">{truncatePayload(del.response, 60)}</p>
                            ) : (
                              <span className="text-[10px] text-[#6b7280]">—</span>
                            )}
                          </div>
                          <div className="w-28 text-[10px] text-[#6b7280] shrink-0">
                            {del.deliveredAt
                              ? formatTimestamp(del.deliveredAt)
                              : del.lastAttemptAt
                              ? formatTimestamp(del.lastAttemptAt)
                              : formatTimestamp(del.createdAt)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Delivery Stats Summary */}
              {deliveries.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'Delivered', count: deliveries.filter(d => d.status === 'delivered' || d.status === 'success').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Pending', count: deliveries.filter(d => d.status === 'pending').length, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                    { label: 'Retrying', count: deliveries.filter(d => d.status === 'retrying').length, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                    { label: 'Failed', count: deliveries.filter(d => d.status === 'failed').length, color: 'text-red-400', bg: 'bg-red-500/10' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-lg ${s.bg} p-2 text-center`}>
                      <p className="text-lg font-bold text-white">{s.count}</p>
                      <p className={`text-[10px] ${s.color}`}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* RJMLABS.CO.UK Branding */}
      <div className="flex items-center justify-center pt-2">
        <span className="text-[9px] text-[#3b3c4d] font-mono tracking-widest">
          EVENT BUS · RJMLABS.CO.UK
        </span>
      </div>
    </div>
  )
}
