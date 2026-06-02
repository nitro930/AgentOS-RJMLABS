'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  Filter,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Circle,
  Ban,
  Bell,
  Repeat,
  GripVertical,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────
type ViewMode = 'month' | 'week' | 'day'
type EventType = 'task' | 'meeting' | 'maintenance' | 'deployment' | 'review' | 'deadline'
type EventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
type Priority = 'low' | 'medium' | 'high' | 'critical'

interface CalendarEvent {
  id: string
  title: string
  type: EventType
  status: EventStatus
  priority: Priority
  start: Date
  end: Date
  agentId: string
  agentName: string
  agentAvatar: string
  description: string
  recurrence: string
  reminder: string
  color: string
}

// ─── Constants ───────────────────────────────────────────
const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bg: string; border: string }> = {
  task: { label: 'Task', color: '#3b82f6', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  meeting: { label: 'Meeting', color: '#8b5cf6', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
  maintenance: { label: 'Maintenance', color: '#f97316', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  deployment: { label: 'Deployment', color: '#ef4444', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  review: { label: 'Review', color: '#10b981', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  deadline: { label: 'Deadline', color: '#eab308', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' },
}

const STATUS_CONFIG: Record<EventStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  scheduled: { label: 'Scheduled', icon: <Circle className="w-3 h-3" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  in_progress: { label: 'In Progress', icon: <RefreshCw className="w-3 h-3 animate-spin" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  cancelled: { label: 'Cancelled', icon: <Ban className="w-3 h-3" />, color: 'text-red-400', bg: 'bg-red-500/10' },
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', dot: 'bg-red-500' },
  high: { label: 'High', color: 'text-amber-400', dot: 'bg-amber-500' },
  medium: { label: 'Medium', color: 'text-blue-400', dot: 'bg-blue-500' },
  low: { label: 'Low', color: 'text-gray-400', dot: 'bg-gray-500' },
}

const AGENTS = [
  { id: 'agent-1', name: 'Orchestrator', avatar: '🤖' },
  { id: 'agent-2', name: 'Inspector', avatar: '🔎' },
  { id: 'agent-3', name: 'Deployer', avatar: '🚀' },
  { id: 'agent-4', name: 'Tester', avatar: '🧪' },
  { id: 'agent-5', name: 'Documenter', avatar: '📝' },
  { id: 'agent-6', name: 'Sentinel', avatar: '🛡️' },
  { id: 'agent-7', name: 'Designer', avatar: '🎨' },
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

const RECURRENCE_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Biweekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
]

const REMINDER_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: '5 min before', value: '5min' },
  { label: '15 min before', value: '15min' },
  { label: '30 min before', value: '30min' },
  { label: '1 hour before', value: '1hr' },
  { label: '1 day before', value: '1day' },
]

// ─── Helper Functions ────────────────────────────────────
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

function getWeekDates(date: Date): Date[] {
  const day = date.getDay()
  const start = new Date(date)
  start.setDate(start.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

function formatTime(date: Date): string {
  const h = date.getHours()
  const m = date.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function formatDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Generate Mock Data ──────────────────────────────────
function generateMockEvents(): CalendarEvent[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()

  const events: CalendarEvent[] = [
    {
      id: 'ev1',
      title: 'Sprint Planning Session',
      type: 'meeting',
      status: 'scheduled',
      priority: 'high',
      start: new Date(year, month, today, 9, 0),
      end: new Date(year, month, today, 10, 30),
      agentId: 'agent-1',
      agentName: 'Orchestrator',
      agentAvatar: '🤖',
      description: 'Plan sprint objectives and assign tasks to agents for the upcoming cycle.',
      recurrence: 'biweekly',
      reminder: '15min',
      color: EVENT_TYPE_CONFIG.meeting.color,
    },
    {
      id: 'ev2',
      title: 'Database Backup',
      type: 'maintenance',
      status: 'scheduled',
      priority: 'medium',
      start: new Date(year, month, today, 2, 0),
      end: new Date(year, month, today, 3, 0),
      agentId: 'agent-3',
      agentName: 'Deployer',
      agentAvatar: '🚀',
      description: 'Automated database backup with verification and integrity checks.',
      recurrence: 'daily',
      reminder: 'none',
      color: EVENT_TYPE_CONFIG.maintenance.color,
    },
    {
      id: 'ev3',
      title: 'Deploy v2.4.0 to Production',
      type: 'deployment',
      status: 'scheduled',
      priority: 'critical',
      start: new Date(year, month, today + 2, 14, 0),
      end: new Date(year, month, today + 2, 16, 0),
      agentId: 'agent-3',
      agentName: 'Deployer',
      agentAvatar: '🚀',
      description: 'Deploy new release with blue-green strategy and zero-downtime rollout.',
      recurrence: 'none',
      reminder: '1hr',
      color: EVENT_TYPE_CONFIG.deployment.color,
    },
    {
      id: 'ev4',
      title: 'Code Review: Auth Module',
      type: 'review',
      status: 'in_progress',
      priority: 'high',
      start: new Date(year, month, today, 11, 0),
      end: new Date(year, month, today, 12, 0),
      agentId: 'agent-6',
      agentName: 'Sentinel',
      agentAvatar: '🛡️',
      description: 'Security review of the new authentication module with JWT rotation.',
      recurrence: 'none',
      reminder: '30min',
      color: EVENT_TYPE_CONFIG.review.color,
    },
    {
      id: 'ev5',
      title: 'Performance Benchmark Run',
      type: 'task',
      status: 'scheduled',
      priority: 'medium',
      start: new Date(year, month, today + 1, 8, 0),
      end: new Date(year, month, today + 1, 10, 0),
      agentId: 'agent-2',
      agentName: 'Inspector',
      agentAvatar: '🔎',
      description: 'Run comprehensive performance benchmarks across all agent endpoints.',
      recurrence: 'weekly',
      reminder: '15min',
      color: EVENT_TYPE_CONFIG.task.color,
    },
    {
      id: 'ev6',
      title: 'API Documentation Update',
      type: 'task',
      status: 'in_progress',
      priority: 'low',
      start: new Date(year, month, today - 1, 13, 0),
      end: new Date(year, month, today - 1, 15, 0),
      agentId: 'agent-5',
      agentName: 'Documenter',
      agentAvatar: '📝',
      description: 'Update API documentation with new endpoints and schema changes.',
      recurrence: 'none',
      reminder: 'none',
      color: EVENT_TYPE_CONFIG.task.color,
    },
    {
      id: 'ev7',
      title: 'Feature Freeze Deadline',
      type: 'deadline',
      status: 'scheduled',
      priority: 'critical',
      start: new Date(year, month, today + 5, 23, 59),
      end: new Date(year, month, today + 5, 23, 59),
      agentId: 'agent-1',
      agentName: 'Orchestrator',
      agentAvatar: '🤖',
      description: 'No new features after this deadline. Only bug fixes and polish.',
      recurrence: 'none',
      reminder: '1day',
      color: EVENT_TYPE_CONFIG.deadline.color,
    },
    {
      id: 'ev8',
      title: 'Integration Test Suite',
      type: 'task',
      status: 'completed',
      priority: 'high',
      start: new Date(year, month, today - 2, 9, 0),
      end: new Date(year, month, today - 2, 12, 0),
      agentId: 'agent-4',
      agentName: 'Tester',
      agentAvatar: '🧪',
      description: 'Run full integration test suite with coverage report generation.',
      recurrence: 'daily',
      reminder: 'none',
      color: EVENT_TYPE_CONFIG.task.color,
    },
    {
      id: 'ev9',
      title: 'Design System Sync',
      type: 'meeting',
      status: 'scheduled',
      priority: 'medium',
      start: new Date(year, month, today + 3, 10, 0),
      end: new Date(year, month, today + 3, 11, 0),
      agentId: 'agent-7',
      agentName: 'Designer',
      agentAvatar: '🎨',
      description: 'Sync on design system updates and component library alignment.',
      recurrence: 'weekly',
      reminder: '15min',
      color: EVENT_TYPE_CONFIG.meeting.color,
    },
    {
      id: 'ev10',
      title: 'Server Patch & Reboot',
      type: 'maintenance',
      status: 'scheduled',
      priority: 'high',
      start: new Date(year, month, today + 4, 1, 0),
      end: new Date(year, month, today + 4, 2, 30),
      agentId: 'agent-3',
      agentName: 'Deployer',
      agentAvatar: '🚀',
      description: 'Apply critical OS security patches and reboot staging servers.',
      recurrence: 'monthly',
      reminder: '1hr',
      color: EVENT_TYPE_CONFIG.maintenance.color,
    },
    {
      id: 'ev11',
      title: 'Sprint Retrospective',
      type: 'meeting',
      status: 'cancelled',
      priority: 'low',
      start: new Date(year, month, today - 3, 15, 0),
      end: new Date(year, month, today - 3, 16, 0),
      agentId: 'agent-1',
      agentName: 'Orchestrator',
      agentAvatar: '🤖',
      description: 'Sprint retrospective meeting — cancelled due to team unavailability.',
      recurrence: 'biweekly',
      reminder: '15min',
      color: EVENT_TYPE_CONFIG.meeting.color,
    },
    {
      id: 'ev12',
      title: 'Security Audit Report',
      type: 'review',
      status: 'scheduled',
      priority: 'critical',
      start: new Date(year, month, today + 6, 14, 0),
      end: new Date(year, month, today + 6, 16, 30),
      agentId: 'agent-6',
      agentName: 'Sentinel',
      agentAvatar: '🛡️',
      description: 'Comprehensive security audit review and vulnerability assessment.',
      recurrence: 'monthly',
      reminder: '1day',
      color: EVENT_TYPE_CONFIG.review.color,
    },
    {
      id: 'ev13',
      title: 'UI Component QA Pass',
      type: 'task',
      status: 'in_progress',
      priority: 'medium',
      start: new Date(year, month, today, 14, 0),
      end: new Date(year, month, today, 16, 0),
      agentId: 'agent-4',
      agentName: 'Tester',
      agentAvatar: '🧪',
      description: 'Quality assurance pass on all new UI components and interactions.',
      recurrence: 'none',
      reminder: '30min',
      color: EVENT_TYPE_CONFIG.task.color,
    },
    {
      id: 'ev14',
      title: 'Hotfix v2.3.7 Deployment',
      type: 'deployment',
      status: 'completed',
      priority: 'critical',
      start: new Date(year, month, today - 4, 22, 0),
      end: new Date(year, month, today - 4, 22, 45),
      agentId: 'agent-3',
      agentName: 'Deployer',
      agentAvatar: '🚀',
      description: 'Emergency hotfix for authentication token rotation bug.',
      recurrence: 'none',
      reminder: 'none',
      color: EVENT_TYPE_CONFIG.deployment.color,
    },
    {
      id: 'ev15',
      title: 'Release v2.5.0 Deadline',
      type: 'deadline',
      status: 'scheduled',
      priority: 'critical',
      start: new Date(year, month, today + 10, 23, 59),
      end: new Date(year, month, today + 10, 23, 59),
      agentId: 'agent-1',
      agentName: 'Orchestrator',
      agentAvatar: '🤖',
      description: 'Major release deadline. All features must be merged and tested.',
      recurrence: 'none',
      reminder: '1day',
      color: EVENT_TYPE_CONFIG.deadline.color,
    },
    {
      id: 'ev16',
      title: 'Load Testing',
      type: 'task',
      status: 'scheduled',
      priority: 'high',
      start: new Date(year, month, today + 1, 15, 0),
      end: new Date(year, month, today + 1, 17, 0),
      agentId: 'agent-2',
      agentName: 'Inspector',
      agentAvatar: '🔎',
      description: 'Run load tests simulating 10k concurrent users on API gateway.',
      recurrence: 'weekly',
      reminder: '30min',
      color: EVENT_TYPE_CONFIG.task.color,
    },
    {
      id: 'ev17',
      title: 'Dependency Update Check',
      type: 'maintenance',
      status: 'completed',
      priority: 'medium',
      start: new Date(year, month, today - 5, 9, 0),
      end: new Date(year, month, today - 5, 10, 0),
      agentId: 'agent-3',
      agentName: 'Deployer',
      agentAvatar: '🚀',
      description: 'Check and update all npm/pip dependencies for security patches.',
      recurrence: 'weekly',
      reminder: 'none',
      color: EVENT_TYPE_CONFIG.maintenance.color,
    },
  ]

  return events
}

// ─── Main Component ──────────────────────────────────────
export function SchedulingCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(generateMockEvents)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventPanel, setShowEventPanel] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [filterType, setFilterType] = useState<EventType | 'all'>('all')
  const [createForm, setCreateForm] = useState({
    title: '',
    type: 'task' as EventType,
    priority: 'medium' as Priority,
    agentId: 'agent-1',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    description: '',
    recurrence: 'none',
    reminder: '15min',
  })

  // ── Navigation ──
  const navigatePrev = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev)
      if (viewMode === 'month') d.setMonth(d.getMonth() - 1)
      else if (viewMode === 'week') d.setDate(d.getDate() - 7)
      else d.setDate(d.getDate() - 1)
      return d
    })
  }, [viewMode])

  const navigateNext = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev)
      if (viewMode === 'month') d.setMonth(d.getMonth() + 1)
      else if (viewMode === 'week') d.setDate(d.getDate() + 7)
      else d.setDate(d.getDate() + 1)
      return d
    })
  }, [viewMode])

  const navigateToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  // ── Filtered events ──
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesAgent = filterAgent === 'all' || ev.agentId === filterAgent
      const matchesType = filterType === 'all' || ev.type === filterType
      return matchesAgent && matchesType
    })
  }, [events, filterAgent, filterType])

  // ── Events by date key ──
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    filteredEvents.forEach((ev) => {
      const key = dateKey(ev.start)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    })
    return map
  }, [filteredEvents])

  // ── Month view data ──
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const prevMonthDays = getDaysInMonth(year, month - 1)
    const cells: { date: Date; isCurrentMonth: boolean }[] = []

    // Previous month fill
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false })
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), isCurrentMonth: true })
    }
    // Next month fill
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) {
      cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false })
    }

    return { cells, year, month }
  }, [currentDate])

  // ── Week view data ──
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])

  // ── Upcoming events (next 7 days) ──
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return filteredEvents
      .filter((ev) => ev.start >= now && ev.start <= next7 && ev.status !== 'cancelled')
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 8)
  }, [filteredEvents])

  // ── Stats ──
  const stats = useMemo(() => {
    const now = new Date()
    return {
      total: events.length,
      today: events.filter((ev) => isSameDay(ev.start, now)).length,
      upcoming: events.filter((ev) => ev.start > now && ev.status !== 'cancelled').length,
      inProgress: events.filter((ev) => ev.status === 'in_progress').length,
    }
  }, [events])

  // ── Event handlers ──
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventPanel(true)
  }

  const handleCreateEvent = () => {
    if (!createForm.title.trim()) return
    const agent = AGENTS.find((a) => a.id === createForm.agentId) || AGENTS[0]
    const [startH, startM] = createForm.startTime.split(':').map(Number)
    const [endH, endM] = createForm.endTime.split(':').map(Number)
    const startDate = createForm.startDate ? new Date(createForm.startDate) : new Date()
    const endDate = createForm.endDate ? new Date(createForm.endDate) : new Date(startDate)

    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startH, startM)
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), endH, endM)

    const newEvent: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: createForm.title.trim(),
      type: createForm.type,
      status: 'scheduled',
      priority: createForm.priority,
      start,
      end,
      agentId: agent.id,
      agentName: agent.name,
      agentAvatar: agent.avatar,
      description: createForm.description,
      recurrence: createForm.recurrence,
      reminder: createForm.reminder,
      color: EVENT_TYPE_CONFIG[createForm.type].color,
    }
    setEvents((prev) => [...prev, newEvent])
    setShowCreateDialog(false)
    resetCreateForm()
  }

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id))
    setShowEventPanel(false)
    setSelectedEvent(null)
  }

  const handleStatusChange = (id: string, status: EventStatus) => {
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, status } : ev)))
    if (selectedEvent?.id === id) {
      setSelectedEvent((prev) => (prev ? { ...prev, status } : null))
    }
  }

  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      type: 'task',
      priority: 'medium',
      agentId: 'agent-1',
      startDate: dateKey(new Date()),
      startTime: '09:00',
      endDate: dateKey(new Date()),
      endTime: '10:00',
      description: '',
      recurrence: 'none',
      reminder: '15min',
    })
  }

  // ── Header label ──
  const headerLabel = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    if (viewMode === 'week') {
      const start = weekDates[0]
      const end = weekDates[6]
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${end.getDate()}, ${end.getFullYear()}`
      }
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${end.getFullYear()}`
    }
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }, [viewMode, currentDate, weekDates])

  // ── Mini calendar data ──
  const miniMonthData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const cells: { day: number; date: Date }[] = []
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: getDaysInMonth(year, month - 1) - i, date: new Date(year, month - 1, getDaysInMonth(year, month - 1) - i) })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, date: new Date(year, month, d) })
    }
    const remaining = 35 - cells.length
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, date: new Date(year, month + 1, d) })
    }
    return { cells, year, month }
  }, [currentDate])

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">Scheduling Calendar</h1>
            <p className="text-xs sm:text-sm text-[#9ca3af]">Visual calendar view of scheduled tasks and events</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-9 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showFilters
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#1e1f2b] text-[#9ca3af] border border-[#2d2e3d] hover:bg-[#252636] hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>
          <button
            onClick={() => { resetCreateForm(); setShowCreateDialog(true) }}
            className="h-9 px-3 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Event
          </button>
        </div>
      </motion.div>

      {/* ── Stats Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
      >
        {[
          { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Total Events', value: stats.total, color: '#9ca3af' },
          { icon: <Clock className="w-3.5 h-3.5" />, label: 'Today', value: stats.today, color: '#3b82f6' },
          { icon: <Bell className="w-3.5 h-3.5" />, label: 'Upcoming', value: stats.upcoming, color: '#f59e0b' },
          { icon: <RefreshCw className="w-3.5 h-3.5" />, label: 'In Progress', value: stats.inProgress, color: '#10b981' },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#1a1b2e] border border-[#2d2e3d]">
            <div className="flex items-center justify-center" style={{ color: stat.color }}>{stat.icon}</div>
            <div className="min-w-0">
              <div className="text-[10px] text-[#6b7280] truncate">{stat.label}</div>
              <div className="text-sm font-semibold text-white leading-tight">{stat.value}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Filters ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-xl bg-[#1a1b2e] border border-[#2d2e3d]">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#6b7280]" />
                <span className="text-xs text-[#9ca3af]">Agent:</span>
              </div>
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="h-8 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
              >
                <option value="all">All Agents</option>
                {AGENTS.map((a) => (
                  <option key={a.id} value={a.id}>{a.avatar} {a.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-[#6b7280]" />
                <span className="text-xs text-[#9ca3af]">Type:</span>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as EventType | 'all')}
                className="h-8 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
              >
                <option value="all">All Types</option>
                {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, typeof EVENT_TYPE_CONFIG[EventType]][]).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content: Sidebar + Calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* ── Sidebar ── */}
        <div className="space-y-4 order-2 lg:order-1">
          {/* Mini Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-xl bg-[#1a1b2e] border border-[#2d2e3d] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">
                {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1">
                <button onClick={navigatePrev} className="w-6 h-6 rounded flex items-center justify-center text-[#6b7280] hover:text-white hover:bg-[#252636] transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={navigateNext} className="w-6 h-6 rounded flex items-center justify-center text-[#6b7280] hover:text-white hover:bg-[#252636] transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-[10px] text-[#6b7280] font-medium py-1">{d}</div>
              ))}
              {miniMonthData.cells.map((cell, i) => {
                const hasEvents = eventsByDate.has(dateKey(cell.date))
                const isCurrentMonth = cell.date.getMonth() === currentDate.getMonth()
                const today = isToday(cell.date)
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentDate(new Date(cell.date))}
                    className={`relative w-7 h-7 rounded-md text-[11px] flex items-center justify-center transition-colors ${
                      today
                        ? 'bg-emerald-500 text-white font-bold'
                        : isCurrentMonth
                        ? 'text-[#9ca3af] hover:bg-[#252636] hover:text-white'
                        : 'text-[#4b5563]'
                    }`}
                  >
                    {cell.day}
                    {hasEvents && !today && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-xl bg-[#1a1b2e] border border-[#2d2e3d] p-4"
          >
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Upcoming Events
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-[#6b7280] text-center py-4">No upcoming events</p>
              ) : (
                upcomingEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => handleEventClick(ev)}
                    className="w-full text-left p-2 rounded-lg bg-[#0f1117] hover:bg-[#252636] transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: EVENT_TYPE_CONFIG[ev.type].color }} />
                      <span className="text-xs font-medium text-white truncate group-hover:text-emerald-400 transition-colors">{ev.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#6b7280]">
                      <span>{ev.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span>·</span>
                      <span>{formatTime(ev.start)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>

          {/* Agent Filter Quick Access */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="rounded-xl bg-[#1a1b2e] border border-[#2d2e3d] p-4"
          >
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Agent Filter
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setFilterAgent('all')}
                className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
                  filterAgent === 'all' ? 'bg-emerald-500/15 text-emerald-400' : 'text-[#9ca3af] hover:bg-[#252636] hover:text-white'
                }`}
              >
                All Agents
              </button>
              {AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setFilterAgent(agent.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors ${
                    filterAgent === agent.id ? 'bg-emerald-500/15 text-emerald-400' : 'text-[#9ca3af] hover:bg-[#252636] hover:text-white'
                  }`}
                >
                  <span>{agent.avatar}</span>
                  <span>{agent.name}</span>
                  <span className="ml-auto text-[10px] text-[#6b7280]">
                    {events.filter((e) => e.agentId === agent.id).length}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Event Type Filter */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="rounded-xl bg-[#1a1b2e] border border-[#2d2e3d] p-4"
          >
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" />
              Event Type
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setFilterType('all')}
                className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
                  filterType === 'all' ? 'bg-emerald-500/15 text-emerald-400' : 'text-[#9ca3af] hover:bg-[#252636] hover:text-white'
                }`}
              >
                All Types
              </button>
              {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, typeof EVENT_TYPE_CONFIG[EventType]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors ${
                    filterType === key ? 'bg-emerald-500/15 text-emerald-400' : 'text-[#9ca3af] hover:bg-[#252636] hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span>{cfg.label}</span>
                  <span className="ml-auto text-[10px] text-[#6b7280]">
                    {events.filter((e) => e.type === key).length}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Calendar Area ── */}
        <div className="order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-xl bg-[#1a1b2e] border border-[#2d2e3d] overflow-hidden"
          >
            {/* Calendar Header with Navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2e3d]">
              <div className="flex items-center gap-2">
                <button onClick={navigatePrev} className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#9ca3af] hover:text-white transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={navigateNext} className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#9ca3af] hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={navigateToday} className="h-8 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors border border-emerald-500/20">
                  Today
                </button>
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-white">{headerLabel}</h2>
              <div className="flex items-center bg-[#0f1117] rounded-lg border border-[#2d2e3d] p-0.5">
                {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                      viewMode === mode
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-[#6b7280] hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Content */}
            <div className="overflow-auto max-h-[calc(100vh-280px)]">
              {viewMode === 'month' && <MonthView cells={monthData.cells} eventsByDate={eventsByDate} onEventClick={handleEventClick} onDateClick={(date) => { setCurrentDate(date); setViewMode('day') }} />}
              {viewMode === 'week' && <WeekView dates={weekDates} events={filteredEvents} onEventClick={handleEventClick} />}
              {viewMode === 'day' && <DayView date={currentDate} events={filteredEvents} onEventClick={handleEventClick} />}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Event Detail Slide-Over Panel ── */}
      <AnimatePresence>
        {showEventPanel && selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowEventPanel(false); setSelectedEvent(null) }}
            />
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#1a1b2e] border-l border-[#2d2e3d] shadow-2xl overflow-y-auto"
            >
              <div className="p-5">
                {/* Panel Header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-bold text-white">Event Details</h3>
                  <button
                    onClick={() => { setShowEventPanel(false); setSelectedEvent(null) }}
                    className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Event Color Bar */}
                <div className="h-1.5 rounded-full mb-5" style={{ backgroundColor: EVENT_TYPE_CONFIG[selectedEvent.type].color }} />

                {/* Title */}
                <h2 className="text-xl font-bold text-white mb-3">{selectedEvent.title}</h2>

                {/* Type & Status */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full ${EVENT_TYPE_CONFIG[selectedEvent.type].bg} ${EVENT_TYPE_CONFIG[selectedEvent.type].border} border`} style={{ color: EVENT_TYPE_CONFIG[selectedEvent.type].color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: EVENT_TYPE_CONFIG[selectedEvent.type].color }} />
                    {EVENT_TYPE_CONFIG[selectedEvent.type].label}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full ${STATUS_CONFIG[selectedEvent.status].bg} ${STATUS_CONFIG[selectedEvent.status].color}`}>
                    {STATUS_CONFIG[selectedEvent.status].icon}
                    {STATUS_CONFIG[selectedEvent.status].label}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#252636] ${PRIORITY_CONFIG[selectedEvent.priority].color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[selectedEvent.priority].dot}`} />
                    {PRIORITY_CONFIG[selectedEvent.priority].label}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0f1117]">
                    <Clock className="w-4 h-4 text-[#6b7280]" />
                    <div>
                      <div className="text-xs text-[#6b7280]">Time</div>
                      <div className="text-sm text-white">
                        {selectedEvent.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {' · '}
                        {formatTime(selectedEvent.start)} – {formatTime(selectedEvent.end)}
                      </div>
                      <div className="text-[11px] text-emerald-400">Duration: {formatDuration(selectedEvent.start, selectedEvent.end)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0f1117]">
                    <Users className="w-4 h-4 text-[#6b7280]" />
                    <div>
                      <div className="text-xs text-[#6b7280]">Agent</div>
                      <div className="text-sm text-white">{selectedEvent.agentAvatar} {selectedEvent.agentName}</div>
                    </div>
                  </div>
                  {selectedEvent.recurrence !== 'none' && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0f1117]">
                      <Repeat className="w-4 h-4 text-[#6b7280]" />
                      <div>
                        <div className="text-xs text-[#6b7280]">Recurrence</div>
                        <div className="text-sm text-white capitalize">{selectedEvent.recurrence}</div>
                      </div>
                    </div>
                  )}
                  {selectedEvent.reminder !== 'none' && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0f1117]">
                      <Bell className="w-4 h-4 text-[#6b7280]" />
                      <div>
                        <div className="text-xs text-[#6b7280]">Reminder</div>
                        <div className="text-sm text-white">{REMINDER_OPTIONS.find((r) => r.value === selectedEvent.reminder)?.label}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedEvent.description && (
                  <div className="mb-5">
                    <h4 className="text-xs text-[#6b7280] font-medium mb-2">Description</h4>
                    <p className="text-sm text-[#9ca3af] leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}

                {/* Status Change */}
                <div className="mb-5">
                  <h4 className="text-xs text-[#6b7280] font-medium mb-2">Change Status</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(STATUS_CONFIG) as [EventStatus, typeof STATUS_CONFIG[EventStatus]][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(selectedEvent.id, key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          selectedEvent.status === key
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#0f1117] text-[#9ca3af] border border-[#2d2e3d] hover:bg-[#252636] hover:text-white'
                        }`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-[#2d2e3d]">
                  <button
                    onClick={() => handleStatusChange(selectedEvent.id, 'in_progress')}
                    className="flex-1 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Start
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="h-9 px-4 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Create Event Dialog ── */}
      <AnimatePresence>
        {showCreateDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCreateDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-lg bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white">Create New Event</h3>
                  <button
                    onClick={() => setShowCreateDialog(false)}
                    className="w-7 h-7 rounded-md bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Title */}
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Title *</label>
                    <input
                      type="text"
                      value={createForm.title}
                      onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Event title..."
                      className="w-full h-9 px-3 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  {/* Type & Priority */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Type</label>
                      <select
                        value={createForm.type}
                        onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as EventType }))}
                        className="w-full h-9 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                      >
                        {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, typeof EVENT_TYPE_CONFIG[EventType]][]).map(([key, cfg]) => (
                          <option key={key} value={key}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Priority</label>
                      <select
                        value={createForm.priority}
                        onChange={(e) => setCreateForm((f) => ({ ...f, priority: e.target.value as Priority }))}
                        className="w-full h-9 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                      >
                        {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
                          <option key={key} value={key}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Start Date/Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Start Date</label>
                      <input
                        type="date"
                        value={createForm.startDate}
                        onChange={(e) => setCreateForm((f) => ({ ...f, startDate: e.target.value, endDate: e.target.value }))}
                        className="w-full h-9 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">Start Time</label>
                      <input
                        type="time"
                        value={createForm.startTime}
                        onChange={(e) => setCreateForm((f) => ({ ...f, startTime: e.target.value }))}
                        className="w-full h-9 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* End Date/Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">End Date</label>
                      <input
                        type="date"
                        value={createForm.endDate}
                        onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))}
                        className="w-full h-9 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">End Time</label>
                      <input
                        type="time"
                        value={createForm.endTime}
                        onChange={(e) => setCreateForm((f) => ({ ...f, endTime: e.target.value }))}
                        className="w-full h-9 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Agent */}
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Assigned Agent</label>
                    <select
                      value={createForm.agentId}
                      onChange={(e) => setCreateForm((f) => ({ ...f, agentId: e.target.value }))}
                      className="w-full h-9 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                    >
                      {AGENTS.map((a) => (
                        <option key={a.id} value={a.id}>{a.avatar} {a.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Recurrence & Reminder */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block flex items-center gap-1">
                        <Repeat className="w-3 h-3" /> Recurrence
                      </label>
                      <select
                        value={createForm.recurrence}
                        onChange={(e) => setCreateForm((f) => ({ ...f, recurrence: e.target.value }))}
                        className="w-full h-9 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                      >
                        {RECURRENCE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block flex items-center gap-1">
                        <Bell className="w-3 h-3" /> Reminder
                      </label>
                      <select
                        value={createForm.reminder}
                        onChange={(e) => setCreateForm((f) => ({ ...f, reminder: e.target.value }))}
                        className="w-full h-9 px-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-xs text-[#9ca3af] focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                      >
                        {REMINDER_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe the event..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-md bg-[#0f1117] border border-[#2d2e3d] text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowCreateDialog(false)}
                      className="flex-1 h-9 rounded-md bg-[#252636] hover:bg-[#2d2e3d] text-xs text-[#9ca3af] hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateEvent}
                      disabled={!createForm.title.trim()}
                      className="flex-1 h-9 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-500/30"
                    >
                      Create Event
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Month View ──────────────────────────────────────────
function MonthView({
  cells,
  eventsByDate,
  onEventClick,
  onDateClick,
}: {
  cells: { date: Date; isCurrentMonth: boolean }[]
  eventsByDate: Map<string, CalendarEvent[]>
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
}) {
  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[#2d2e3d]">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="py-2 text-center text-[11px] font-medium text-[#6b7280]">
            {day}
          </div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const key = dateKey(cell.date)
          const dayEvents = eventsByDate.get(key) || []
          const today = isToday(cell.date)
          return (
            <div
              key={i}
              className={`min-h-[90px] sm:min-h-[110px] border-b border-r border-[#2d2e3d]/50 p-1.5 sm:p-2 cursor-pointer hover:bg-[#252636]/30 transition-colors ${
                !cell.isCurrentMonth ? 'bg-[#0f1117]/50' : ''
              }`}
              onClick={() => onDateClick(cell.date)}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[11px] sm:text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    today
                      ? 'bg-emerald-500 text-white'
                      : cell.isCurrentMonth
                      ? 'text-[#9ca3af]'
                      : 'text-[#4b5563]'
                  }`}
                >
                  {cell.date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[9px] text-[#6b7280]">{dayEvents.length}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                    className="w-full text-left group"
                  >
                    <div
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] truncate transition-colors group-hover:brightness-125"
                      style={{ backgroundColor: `${EVENT_TYPE_CONFIG[ev.type].color}20`, color: EVENT_TYPE_CONFIG[ev.type].color }}
                    >
                      <GripVertical className="w-2.5 h-2.5 opacity-50 flex-shrink-0" />
                      <span className="truncate">{ev.title}</span>
                    </div>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] text-[#6b7280] px-1.5">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week View ───────────────────────────────────────────
function WeekView({
  dates,
  events,
  onEventClick,
}: {
  dates: Date[]
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}) {
  const VISIBLE_HOURS = HOURS.filter((h) => h >= 6 && h <= 22)

  return (
    <div className="flex">
      {/* Time gutter */}
      <div className="w-16 flex-shrink-0 border-r border-[#2d2e3d]">
        <div className="h-10 border-b border-[#2d2e3d]" />
        {VISIBLE_HOURS.map((hour) => (
          <div key={hour} className="h-14 border-b border-[#2d2e3d]/30 flex items-start justify-end pr-2 pt-0.5">
            <span className="text-[10px] text-[#6b7280]">{formatHour(hour)}</span>
          </div>
        ))}
      </div>
      {/* Day columns */}
      <div className="flex-1 grid grid-cols-7">
        {dates.map((date, colIdx) => {
          const dayEvents = events.filter((ev) => isSameDay(ev.start, date))
          const today = isToday(date)
          return (
            <div key={colIdx} className={`border-r border-[#2d2e3d]/50 last:border-r-0 ${today ? 'bg-emerald-500/[0.02]' : ''}`}>
              {/* Day header */}
              <div className={`h-10 border-b border-[#2d2e3d] flex flex-col items-center justify-center ${today ? 'bg-emerald-500/10' : ''}`}>
                <span className={`text-[10px] ${today ? 'text-emerald-400' : 'text-[#6b7280]'}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className={`text-xs font-bold ${today ? 'text-emerald-400' : 'text-white'}`}>
                  {date.getDate()}
                </span>
              </div>
              {/* Hour slots */}
              <div className="relative">
                {VISIBLE_HOURS.map((hour) => (
                  <div key={hour} className="h-14 border-b border-[#2d2e3d]/30 relative group hover:bg-[#252636]/20 transition-colors" />
                ))}
                {/* Events overlay */}
                <div className="absolute inset-0 top-0">
                  {dayEvents.map((ev) => {
                    const startHour = ev.start.getHours() + ev.start.getMinutes() / 60
                    const endHour = ev.end.getHours() + ev.end.getMinutes() / 60
                    const duration = Math.max(endHour - startHour, 0.5)
                    const topOffset = Math.max((startHour - 6) * 56, 0)
                    const height = Math.max(duration * 56, 28)
                    return (
                      <motion.button
                        key={ev.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => onEventClick(ev)}
                        className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left group/event cursor-pointer transition-all hover:brightness-125 overflow-hidden"
                        style={{
                          top: `${topOffset}px`,
                          height: `${height}px`,
                          backgroundColor: `${EVENT_TYPE_CONFIG[ev.type].color}20`,
                          borderLeft: `3px solid ${EVENT_TYPE_CONFIG[ev.type].color}`,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <GripVertical className="w-2.5 h-2.5 opacity-50 flex-shrink-0" style={{ color: EVENT_TYPE_CONFIG[ev.type].color }} />
                          <span className="text-[10px] font-medium truncate" style={{ color: EVENT_TYPE_CONFIG[ev.type].color }}>
                            {ev.title}
                          </span>
                        </div>
                        {height > 36 && (
                          <div className="text-[9px] mt-0.5" style={{ color: `${EVENT_TYPE_CONFIG[ev.type].color}99` }}>
                            {formatTime(ev.start)}
                          </div>
                        )}
                        {/* Status dot */}
                        <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                          ev.status === 'in_progress' ? 'bg-amber-400 animate-pulse' :
                          ev.status === 'completed' ? 'bg-emerald-400' :
                          ev.status === 'cancelled' ? 'bg-red-400' : 'bg-blue-400'
                        }`} />
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Day View ────────────────────────────────────────────
function DayView({
  date,
  events,
  onEventClick,
}: {
  date: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}) {
  const VISIBLE_HOURS = HOURS.filter((h) => h >= 5 && h <= 23)
  const dayEvents = events.filter((ev) => isSameDay(ev.start, date))

  return (
    <div className="flex">
      {/* Time gutter */}
      <div className="w-20 flex-shrink-0 border-r border-[#2d2e3d]">
        <div className="h-12 border-b border-[#2d2e3d] flex items-center justify-center">
          <span className="text-xs font-semibold text-white">
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
        {VISIBLE_HOURS.map((hour) => (
          <div key={hour} className="h-16 border-b border-[#2d2e3d]/30 flex items-start justify-end pr-3 pt-1">
            <span className="text-[11px] text-[#6b7280]">{formatHour(hour)}</span>
          </div>
        ))}
      </div>
      {/* Day content */}
      <div className="flex-1 relative">
        {/* Day header */}
        <div className="h-12 border-b border-[#2d2e3d] bg-emerald-500/5 flex items-center justify-center">
          <span className="text-xs text-emerald-400 font-medium">
            {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} scheduled
          </span>
        </div>
        {/* Hour grid */}
        <div className="relative">
          {VISIBLE_HOURS.map((hour) => {
            const now = new Date()
            const isCurrentHour = isToday(date) && now.getHours() === hour
            return (
              <div
                key={hour}
                className={`h-16 border-b border-[#2d2e3d]/30 relative group hover:bg-[#252636]/20 transition-colors ${
                  isCurrentHour ? 'bg-emerald-500/[0.03]' : ''
                }`}
              >
                {isCurrentHour && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                    style={{ top: `${(now.getMinutes() / 60) * 100}%` }}
                  >
                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                  </div>
                )}
              </div>
            )
          })}
          {/* Events */}
          {dayEvents.map((ev) => {
            const startHour = ev.start.getHours() + ev.start.getMinutes() / 60
            const endHour = ev.end.getHours() + ev.end.getMinutes() / 60
            const duration = Math.max(endHour - startHour, 0.5)
            const topOffset = Math.max((startHour - 5) * 64, 0)
            const height = Math.max(duration * 64, 32)
            const statusCfg = STATUS_CONFIG[ev.status]
            return (
              <motion.button
                key={ev.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => onEventClick(ev)}
                className="absolute left-2 right-2 rounded-lg px-3 py-2 text-left cursor-pointer transition-all hover:brightness-125 overflow-hidden group/event"
                style={{
                  top: `${topOffset}px`,
                  height: `${height}px`,
                  backgroundColor: `${EVENT_TYPE_CONFIG[ev.type].color}15`,
                  borderLeft: `4px solid ${EVENT_TYPE_CONFIG[ev.type].color}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <GripVertical className="w-3 h-3 opacity-50 flex-shrink-0" style={{ color: EVENT_TYPE_CONFIG[ev.type].color }} />
                    <span className="text-xs font-semibold truncate" style={{ color: EVENT_TYPE_CONFIG[ev.type].color }}>
                      {ev.title}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color} flex-shrink-0`}>
                    {statusCfg.icon}
                    {statusCfg.label}
                  </span>
                </div>
                {height > 44 && (
                  <div className="flex items-center gap-3 text-[10px]" style={{ color: `${EVENT_TYPE_CONFIG[ev.type].color}99` }}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(ev.start)} – {formatTime(ev.end)}
                    </span>
                    <span>({formatDuration(ev.start, ev.end)})</span>
                  </div>
                )}
                {height > 64 && (
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[#6b7280]">
                    <span>{ev.agentAvatar}</span>
                    <span>{ev.agentName}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[ev.priority].dot}`} />
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
