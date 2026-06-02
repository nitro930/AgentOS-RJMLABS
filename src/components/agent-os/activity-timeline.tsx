'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Play,
  CheckCircle,
  XCircle,
  FilePlus,
  FileEdit,
  Database,
  MessageSquare,
  Rocket,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

// ─── Activity Type Definitions ──────────────────────────────────────────────

type ActivityType =
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'file_created'
  | 'file_modified'
  | 'memory_written'
  | 'message_sent'
  | 'deployment'
  | 'approval_requested'
  | 'guardrail_triggered'

type ActivityStatus = 'success' | 'fail' | 'running'

interface TimelineEntry {
  id: string
  type: ActivityType
  agentName: string
  agentAvatar: string
  description: string
  status: ActivityStatus
  timestamp: Date
  details?: string
}

const ACTIVITY_TYPE_CONFIG: Record<
  ActivityType,
  { icon: typeof Play; color: string; bg: string; border: string; label: string }
> = {
  task_started: {
    icon: Play,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    label: 'Task Started',
  },
  task_completed: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    label: 'Task Completed',
  },
  task_failed: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    label: 'Task Failed',
  },
  file_created: {
    icon: FilePlus,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
    label: 'File Created',
  },
  file_modified: {
    icon: FileEdit,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    label: 'File Modified',
  },
  memory_written: {
    icon: Database,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/30',
    label: 'Memory Written',
  },
  message_sent: {
    icon: MessageSquare,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/30',
    label: 'Message Sent',
  },
  deployment: {
    icon: Rocket,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/30',
    label: 'Deployment',
  },
  approval_requested: {
    icon: ShieldCheck,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
    label: 'Approval Requested',
  },
  guardrail_triggered: {
    icon: ShieldAlert,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    label: 'Guardrail Triggered',
  },
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

function generateDemoData(): TimelineEntry[] {
  const now = Date.now()
  const m = (mins: number) => new Date(now - mins * 60 * 1000)

  return [
    {
      id: '1',
      type: 'task_started',
      agentName: 'Atlas',
      agentAvatar: '🤖',
      description: 'Started data pipeline orchestration',
      status: 'running',
      timestamp: m(2),
      details:
        'Pipeline "etl-daily-sync" initiated with 3 stages: extract (PostgreSQL), transform (pandas), load (BigQuery). Estimated completion: 12 minutes.',
    },
    {
      id: '2',
      type: 'deployment',
      agentName: 'Phoenix',
      agentAvatar: '🔥',
      description: 'Deployed api-gateway v2.4.1 to production',
      status: 'success',
      timestamp: m(8),
      details:
        'Rolling deployment across 6 replicas. Health checks passing. Old version v2.3.8 scaled down. Zero-downtime swap completed in 47s.',
    },
    {
      id: '3',
      type: 'file_created',
      agentName: 'Scribe',
      agentAvatar: '📝',
      description: 'Created src/services/auth/oauth2.ts',
      status: 'success',
      timestamp: m(14),
      details:
        'New OAuth2 service module with PKCE flow support. Includes token refresh logic, scope validation, and automatic retry on 401.',
    },
    {
      id: '4',
      type: 'memory_written',
      agentName: 'Atlas',
      agentAvatar: '🤖',
      description: 'Stored pipeline execution metrics to memory',
      status: 'success',
      timestamp: m(18),
      details:
        'Persisted 2.4MB of execution telemetry: row counts per stage, latency histograms, error rates. Tagged: etl, daily-sync, metrics.',
    },
    {
      id: '5',
      type: 'task_failed',
      agentName: 'Scout',
      agentAvatar: '🔍',
      description: 'Web scraping task failed — rate limit exceeded',
      status: 'fail',
      timestamp: m(23),
      details:
        'Target api.example.com returned 429 after 1,247 requests in 60s. Retry-after header: 300s. Backoff strategy will resume at 15:47 UTC.',
    },
    {
      id: '6',
      type: 'guardrail_triggered',
      agentName: 'Sentinel',
      agentAvatar: '🛡️',
      description: 'Content policy violation blocked output',
      status: 'fail',
      timestamp: m(29),
      details:
        'Agent "Nova" attempted to output PII (email: j***@corp.io). Guardrail "PII-Filter-v3" intercepted and redacted before delivery.',
    },
    {
      id: '7',
      type: 'message_sent',
      agentName: 'Echo',
      agentAvatar: '💬',
      description: 'Sent deployment summary to #ops-channel',
      status: 'success',
      timestamp: m(35),
      details:
        'Slack notification delivered with deployment graph, commit diff summary, and rollback instructions. 3 team members acknowledged.',
    },
    {
      id: '8',
      type: 'file_modified',
      agentName: 'Scribe',
      agentAvatar: '📝',
      description: 'Updated prisma/schema.prisma — added UserPrefs model',
      status: 'success',
      timestamp: m(42),
      details:
        'Added UserPrefs model with fields: id, userId (unique), theme (enum: light/dark/system), notifications (json), createdAt. Migration pending.',
    },
    {
      id: '9',
      type: 'approval_requested',
      agentName: 'Sentinel',
      agentAvatar: '🛡️',
      description: 'Awaiting approval for production DB migration',
      status: 'running',
      timestamp: m(48),
      details:
        'Migration "add-user-prefs-table" targets production PostgreSQL. Requires human approval per policy PROD-DB-001. 2 of 3 approvals received.',
    },
    {
      id: '10',
      type: 'task_completed',
      agentName: 'Atlas',
      agentAvatar: '🤖',
      description: 'Completed ETL pipeline — 2.1M rows processed',
      status: 'success',
      timestamp: m(55),
      details:
        'etl-daily-sync finished in 9m 42s. Extract: 2.1M rows in 3.1s. Transform: 2.1M rows in 8m 14s. Load: 2.1M rows in 1m 25s. Zero errors.',
    },
    {
      id: '11',
      type: 'deployment',
      agentName: 'Phoenix',
      agentAvatar: '🔥',
      description: 'Deployed dashboard frontend v1.8.0 to staging',
      status: 'success',
      timestamp: m(67),
      details:
        'Staging deployment of new analytics dashboard. Bundle size: 342KB gzipped (−12% from tree-shaking). Lighthouse: 94/100.',
    },
    {
      id: '12',
      type: 'memory_written',
      agentName: 'Nova',
      agentAvatar: '⭐',
      description: 'Saved customer feedback analysis to knowledge base',
      status: 'success',
      timestamp: m(78),
      details:
        'Analyzed 847 feedback entries from last 7 days. Top themes: performance (34%), UX (28%), pricing (22%). Sentiment score: +0.67.',
    },
    {
      id: '13',
      type: 'task_started',
      agentName: 'Scout',
      agentAvatar: '🔍',
      description: 'Started competitor monitoring sweep',
      status: 'running',
      timestamp: m(85),
      details:
        'Monitoring 12 competitor URLs for pricing, feature, and content changes. Sweep interval: 4h. Alert threshold: any change detected.',
    },
    {
      id: '14',
      type: 'file_created',
      agentName: 'Nova',
      agentAvatar: '⭐',
      description: 'Created reports/weekly-summary-2024-W09.md',
      status: 'success',
      timestamp: m(97),
      details:
        'Auto-generated weekly summary: 156 tasks completed, 12 failures, 4 deployments, 89% SLA compliance. Included trend charts and anomaly flags.',
    },
    {
      id: '15',
      type: 'task_failed',
      agentName: 'Echo',
      agentAvatar: '💬',
      description: 'Notification delivery failed — Slack webhook expired',
      status: 'fail',
      timestamp: m(110),
      details:
        'Webhook T04B2...Xk expired. 3 messages queued and will retry on alternate channel (email). Webhook rotation scheduled for 16:00 UTC.',
    },
    {
      id: '16',
      type: 'approval_requested',
      agentName: 'Atlas',
      agentAvatar: '🤖',
      description: 'Requesting approval for bulk email campaign',
      status: 'running',
      timestamp: m(125),
      details:
        'Campaign "Q1 Product Update" targets 24,300 subscribers. Estimated cost: $48.60. Content passes all guardrails. Awaiting marketing lead approval.',
    },
    {
      id: '17',
      type: 'message_sent',
      agentName: 'Echo',
      agentAvatar: '💬',
      description: 'Sent incident report to on-call engineer',
      status: 'success',
      timestamp: m(138),
      details:
        'PagerDuty alert triggered for elevated 5xx rate on api-gateway. Assigned to eng-rotate-primary. SLA: 15min response. Incident #INC-2847.',
    },
    {
      id: '18',
      type: 'file_modified',
      agentName: 'Scribe',
      agentAvatar: '📝',
      description: 'Updated docker-compose.yml — added Redis replica',
      status: 'success',
      timestamp: m(155),
      details:
        'Added redis-replica service for read scaling. Configured sentinel for failover. Memory limit: 512MB. Persistence: AOF every 1s.',
    },
    {
      id: '19',
      type: 'guardrail_triggered',
      agentName: 'Sentinel',
      agentAvatar: '🛡️',
      description: 'Budget guardrail halted agent execution',
      status: 'fail',
      timestamp: m(170),
      details:
        'Agent "Atlas" exceeded daily compute budget ($47.20 / $45.00 cap). Execution paused. Remaining queued tasks: 8. Budget resets at 00:00 UTC.',
    },
    {
      id: '20',
      type: 'task_completed',
      agentName: 'Nova',
      agentAvatar: '⭐',
      description: 'Completed model evaluation benchmark suite',
      status: 'success',
      timestamp: m(188),
      details:
        'Ran 5 benchmarks across 3 models. GPT-4o: 92.4% avg. Claude-3.5: 91.1% avg. Gemini-Pro: 87.8% avg. Full results saved to evals/2024-W09.',
    },
    {
      id: '21',
      type: 'deployment',
      agentName: 'Phoenix',
      agentAvatar: '🔥',
      description: 'Deployed real-time notification service v1.0.0',
      status: 'success',
      timestamp: m(205),
      details:
        'WebSocket-based notification microservice deployed to Kubernetes cluster. 3 replicas, auto-scaling 3–10 pods. Health check: /healthz passing.',
    },
    {
      id: '22',
      type: 'task_started',
      agentName: 'Nova',
      agentAvatar: '⭐',
      description: 'Started fine-tuning run on dataset v3',
      status: 'running',
      timestamp: m(222),
      details:
        'LoRA fine-tuning of Llama-3-8B on 14,500 curated examples. Learning rate: 2e-4, epochs: 3, batch size: 32. GPU: A100 ×2. ETA: 4h.',
    },
    {
      id: '23',
      type: 'memory_written',
      agentName: 'Scout',
      agentAvatar: '🔍',
      description: 'Stored competitive intelligence brief',
      status: 'success',
      timestamp: m(240),
      details:
        'Competitor "RivalAI" launched new feature: multi-modal agent chains. Pricing unchanged. Market position: #3 (up from #5). Threat level: moderate.',
    },
  ]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function StatusIndicator({ status }: { status: ActivityStatus }) {
  if (status === 'running') {
    return (
      <span className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Running</span>
      </span>
    )
  }
  if (status === 'success') {
    return (
      <span className="flex items-center gap-1.5">
        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        <span className="text-[10px] font-medium text-emerald-400/80 uppercase tracking-wider">Success</span>
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5">
      <XCircle className="h-3 w-3 text-red-400" />
      <span className="text-[10px] font-medium text-red-400/80 uppercase tracking-wider">Failed</span>
    </span>
  )
}

function StatsBar({ entries }: { entries: TimelineEntry[] }) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  const stats = useMemo(() => {
    const running = entries.filter((e) => e.status === 'running').length
    const completedToday = entries.filter(
      (e) => e.status === 'success' && e.timestamp.getTime() >= todayStart
    ).length
    const errorsToday = entries.filter(
      (e) => e.status === 'fail' && e.timestamp.getTime() >= todayStart
    ).length
    return { total: entries.length, running, completedToday, errorsToday }
  }, [entries, todayStart])

  const items = [
    { label: 'Total', value: stats.total, icon: Activity, color: 'text-[#9ca3af]' },
    { label: 'Running', value: stats.running, icon: Loader2, color: 'text-emerald-400' },
    { label: 'Completed', value: stats.completedToday, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Errors', value: stats.errorsToday, icon: AlertTriangle, color: 'text-red-400' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-3 flex items-center gap-3"
        >
          <item.icon className={`h-4 w-4 ${item.color} flex-shrink-0`} />
          <div>
            <p className="text-lg font-bold text-white leading-none">{item.value}</p>
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mt-0.5">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function FilterPills({
  activeTypes,
  onToggleType,
  onClearTypes,
}: {
  activeTypes: Set<ActivityType>
  onToggleType: (type: ActivityType) => void
  onClearTypes: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const allTypes = Object.keys(ACTIVITY_TYPE_CONFIG) as ActivityType[]
  const visibleTypes = expanded ? allTypes : allTypes.slice(0, 5)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibleTypes.map((type) => {
        const config = ACTIVITY_TYPE_CONFIG[type]
        const isActive = activeTypes.has(type)
        return (
          <button
            key={type}
            onClick={() => onToggleType(type)}
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
              transition-all duration-150 border
              ${
                isActive
                  ? `${config.bg} ${config.color} ${config.border}`
                  : 'bg-[#1e1f2b] text-[#6b7280] border-[#2d2e3d] hover:border-[#3d3e4d] hover:text-[#9ca3af]'
              }
            `}
          >
            <config.icon className="h-3 w-3" />
            {config.label}
          </button>
        )
      })}
      {allTypes.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-[#6b7280] hover:text-[#9ca3af] px-2 py-1 transition-colors"
        >
          {expanded ? 'Show less' : `+${allTypes.length - 5} more`}
        </button>
      )}
      {activeTypes.size > 0 && (
        <button
          onClick={onClearTypes}
          className="text-[11px] text-red-400/70 hover:text-red-400 px-2 py-1 transition-colors flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  )
}

function TimelineCard({
  entry,
  index,
  isLast,
}: {
  entry: TimelineEntry
  index: number
  isLast: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const config = ACTIVITY_TYPE_CONFIG[entry.type]
  const IconComponent = config.icon

  return (
    <div className="relative flex gap-3 sm:gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
          className={`
            relative z-10 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border
            ${config.bg} ${config.border}
          `}
        >
          <IconComponent className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${config.color}`} />
          {entry.status === 'running' && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
          )}
        </motion.div>
        {!isLast && (
          <div className="w-px flex-1 bg-gradient-to-b from-[#2d2e3d] to-transparent min-h-[24px]" />
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03, duration: 0.25 }}
        className={`flex-1 pb-4 ${isLast ? 'pb-0' : ''}`}
      >
        <div
          className={`
            bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg
            hover:border-[#3d3e4d] transition-colors
            ${expanded ? 'ring-1 ring-[#3d3e4d]' : ''}
          `}
        >
          {/* Header */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left p-3 sm:p-4 flex items-start gap-3"
          >
            {/* Agent avatar */}
            <span className="text-lg sm:text-xl flex-shrink-0 mt-0.5">{entry.agentAvatar}</span>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-white">{entry.agentName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.bg} ${config.color} font-medium`}>
                  {config.label}
                </span>
              </div>
              <p className="text-sm text-[#9ca3af] mt-0.5 line-clamp-2">{entry.description}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <StatusIndicator status={entry.status} />
                <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {formatTimeAgo(entry.timestamp)}
                </span>
              </div>
            </div>

            {/* Expand chevron */}
            {entry.details && (
              <div className="flex-shrink-0 text-[#6b7280]">
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            )}
          </button>

          {/* Expandable detail section */}
          <AnimatePresence>
            {expanded && entry.details && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-[#2d2e3d] pt-3">
                  <div className="bg-[#0f1117] rounded-md p-3 border border-[#2d2e3d]">
                    <p className="text-xs text-[#9ca3af] leading-relaxed whitespace-pre-wrap">
                      {entry.details}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-[#6b7280]">
                    <Clock className="h-2.5 w-2.5" />
                    Full timestamp: {formatTimestamp(entry.timestamp)}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ActivityTimeline() {
  const allEntries = useMemo(() => generateDemoData(), [])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTypes, setActiveTypes] = useState<Set<ActivityType>>(new Set())
  const [activeAgent, setActiveAgent] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(true)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Derive unique agent names
  const agentNames = useMemo(() => {
    const names = new Set(allEntries.map((e) => e.agentName))
    return Array.from(names).sort()
  }, [allEntries])

  // Filter logic
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      // Type filter
      if (activeTypes.size > 0 && !activeTypes.has(entry.type)) return false
      // Agent filter
      if (activeAgent && entry.agentName !== activeAgent) return false
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const config = ACTIVITY_TYPE_CONFIG[entry.type]
        const searchable = [
          entry.agentName,
          entry.description,
          config.label,
          entry.details || '',
        ]
          .join(' ')
          .toLowerCase()
        if (!searchable.includes(q)) return false
      }
      return true
    })
  }, [allEntries, activeTypes, activeAgent, searchQuery])

  // Stats for filtered
  const stats = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    return {
      total: filteredEntries.length,
      running: filteredEntries.filter((e) => e.status === 'running').length,
      completedToday: filteredEntries.filter(
        (e) => e.status === 'success' && e.timestamp.getTime() >= todayStart
      ).length,
      errorsToday: filteredEntries.filter(
        (e) => e.status === 'fail' && e.timestamp.getTime() >= todayStart
      ).length,
    }
  }, [filteredEntries])

  // Auto-scroll to bottom when "Live" is active
  useEffect(() => {
    if (isLive && timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight
    }
  }, [filteredEntries, isLive])

  const toggleType = useCallback((type: ActivityType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }, [])

  const clearTypes = useCallback(() => setActiveTypes(new Set()), [])

  const hasFilters = activeTypes.size > 0 || activeAgent !== null || searchQuery.length > 0

  return (
    <div className="bg-[#0f1117] min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-[#2d2e3d] px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e1f2b] border border-[#2d2e3d]">
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">Activity Timeline</h2>
              <p className="text-[11px] text-[#6b7280]">Real-time agent activity feed</p>
            </div>
          </div>

          {/* Live indicator */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${
                isLive
                  ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                  : 'bg-[#1e1f2b] border-[#2d2e3d] text-[#6b7280]'
              }
            `}
          >
            {isLive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
            )}
            <Zap className="h-3 w-3" />
            Live
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Stats Bar */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#2d2e3d]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, icon: Activity, color: 'text-[#9ca3af]' },
              { label: 'Running', value: stats.running, icon: Loader2, color: 'text-emerald-400' },
              { label: 'Completed', value: stats.completedToday, icon: CheckCircle2, color: 'text-emerald-400' },
              { label: 'Errors', value: stats.errorsToday, icon: AlertTriangle, color: 'text-red-400' },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-3 flex items-center gap-3"
              >
                <item.icon className={`h-4 w-4 ${item.color} flex-shrink-0`} />
                <div>
                  <p className="text-lg font-bold text-white leading-none">{item.value}</p>
                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mt-0.5">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#2d2e3d] space-y-3">
          {/* Search + Agent filter row */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b7280]" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Agent filter dropdown */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b7280] pointer-events-none" />
              <select
                value={activeAgent || ''}
                onChange={(e) => setActiveAgent(e.target.value || null)}
                className="appearance-none bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg pl-9 pr-8 py-2 text-xs text-white focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20 transition-colors cursor-pointer min-w-[140px]"
              >
                <option value="">All Agents</option>
                {agentNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b7280] pointer-events-none" />
            </div>
          </div>

          {/* Type filter pills */}
          <FilterPills activeTypes={activeTypes} onToggleType={toggleType} onClearTypes={clearTypes} />
        </div>

        {/* Timeline */}
        <div ref={timelineRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 custom-scrollbar">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#1e1f2b] border border-[#2d2e3d] flex items-center justify-center mb-3">
                <Activity className="h-5 w-5 text-[#6b7280]" />
              </div>
              <p className="text-sm text-[#6b7280]">No activities match your filters</p>
              {hasFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setActiveTypes(new Set())
                    setActiveAgent(null)
                  }}
                  className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              <AnimatePresence mode="popLayout">
                {filteredEntries.map((entry, index) => (
                  <TimelineCard
                    key={entry.id}
                    entry={entry}
                    index={index}
                    isLast={index === filteredEntries.length - 1}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
