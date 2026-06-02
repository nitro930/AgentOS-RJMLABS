'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Plus,
  Grid,
  Move,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Share2,
  Save,
  RotateCcw,
  BarChart3,
  Activity,
  Users,
  DollarSign,
  List,
  Gauge,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  Check,
  Calendar,
  Code,
  TrendingUp,
  TrendingDown,
  Circle,
  AlertCircle,
  Copy,
  Minimize2,
  GripVertical,
} from 'lucide-react'

// ==========================================
// Types
// ==========================================

type WidgetType =
  | 'stat'
  | 'chart'
  | 'agent-list'
  | 'task-table'
  | 'gauge'
  | 'timeline'
  | 'calendar'
  | 'agent-status'
  | 'cost'
  | 'activity-feed'
  | 'custom-html'

type LayoutMode = 'grid' | 'freeform'

interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  collapsed: boolean
  colorTheme: string
  dataSource: string
  refreshRate: number
  displayOptions: Record<string, boolean | string | number>
  position: number
  /** Grid column span: 1 or 2 */
  colSpan: number
  /** Grid row span: 1 or 2 */
  rowSpan: number
}

interface Dashboard {
  id: string
  name: string
  widgets: WidgetConfig[]
  createdAt: string
  updatedAt: string
}

// ==========================================
// Widget Library Definitions
// ==========================================

const WIDGET_LIBRARY: { type: WidgetType; label: string; icon: typeof BarChart3; description: string; defaultColSpan: number; defaultRowSpan: number }[] = [
  { type: 'stat', label: 'Stat Card', icon: BarChart3, description: 'Big number with trend indicator', defaultColSpan: 1, defaultRowSpan: 1 },
  { type: 'chart', label: 'Chart', icon: Activity, description: 'Mini bar or line chart visualisation', defaultColSpan: 1, defaultRowSpan: 1 },
  { type: 'agent-list', label: 'Agent List', icon: Users, description: 'Agent names with status indicators', defaultColSpan: 1, defaultRowSpan: 1 },
  { type: 'task-table', label: 'Task Table', icon: List, description: 'Recent tasks with status badges', defaultColSpan: 1, defaultRowSpan: 1 },
  { type: 'gauge', label: 'Gauge', icon: Gauge, description: 'Circular progress indicator', defaultColSpan: 1, defaultRowSpan: 1 },
  { type: 'timeline', label: 'Timeline', icon: Clock, description: 'Recent activity timeline items', defaultColSpan: 1, defaultRowSpan: 1 },
  { type: 'calendar', label: 'Calendar', icon: Calendar, description: 'Event calendar view', defaultColSpan: 1, defaultRowSpan: 1 },
  { type: 'agent-status', label: 'Agent Status', icon: Activity, description: 'Agent health and uptime monitoring', defaultColSpan: 1, defaultRowSpan: 1 },
  { type: 'cost', label: 'Cost Tracker', icon: DollarSign, description: 'Cost breakdown in GBP', defaultColSpan: 1, defaultRowSpan: 1 },
  { type: 'activity-feed', label: 'Activity Feed', icon: Activity, description: 'Scrolling activity log', defaultColSpan: 1, defaultRowSpan: 1 },
  { type: 'custom-html', label: 'Custom HTML', icon: Code, description: 'Freeform HTML content block', defaultColSpan: 1, defaultRowSpan: 1 },
]

const COLOR_THEMES = [
  { name: 'Emerald', primary: '#10b981', bg: '#10b98115' },
  { name: 'Blue', primary: '#3b82f6', bg: '#3b82f615' },
  { name: 'Amber', primary: '#f59e0b', bg: '#f59e0b15' },
  { name: 'Purple', primary: '#8b5cf6', bg: '#8b5cf615' },
  { name: 'Cyan', primary: '#06b6d4', bg: '#06b6d415' },
  { name: 'Rose', primary: '#f43f5e', bg: '#f43f5e15' },
  { name: 'Lime', primary: '#84cc16', bg: '#84cc1615' },
  { name: 'Orange', primary: '#f97316', bg: '#f9731615' },
]

const REFRESH_RATES = [
  { label: '5s', value: 5 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: 'Off', value: 0 },
]

// ==========================================
// Mock Data
// ==========================================

function generateId(): string {
  return `w-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function generateDashboardId(): string {
  return `dash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const DEMO_DASHBOARDS: Dashboard[] = [
  {
    id: 'dash-ops-001',
    name: 'Operations Overview',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-03-04T08:30:00Z',
    widgets: [
      { id: 'w-1', type: 'stat', title: 'Active Agents', collapsed: false, colorTheme: 'Emerald', dataSource: 'agents', refreshRate: 15, displayOptions: {}, position: 0, colSpan: 1, rowSpan: 1 },
      { id: 'w-2', type: 'stat', title: 'Tasks Today', collapsed: false, colorTheme: 'Blue', dataSource: 'tasks', refreshRate: 30, displayOptions: {}, position: 1, colSpan: 1, rowSpan: 1 },
      { id: 'w-3', type: 'cost', title: 'Monthly Spend', collapsed: false, colorTheme: 'Amber', dataSource: 'costs', refreshRate: 60, displayOptions: {}, position: 2, colSpan: 1, rowSpan: 1 },
      { id: 'w-4', type: 'chart', title: 'Task Throughput', collapsed: false, colorTheme: 'Emerald', dataSource: 'tasks', refreshRate: 30, displayOptions: { chartType: 'bar' }, position: 3, colSpan: 1, rowSpan: 1 },
      { id: 'w-5', type: 'agent-list', title: 'Agent Roster', collapsed: false, colorTheme: 'Blue', dataSource: 'agents', refreshRate: 15, displayOptions: {}, position: 4, colSpan: 1, rowSpan: 1 },
      { id: 'w-6', type: 'activity-feed', title: 'Live Activity', collapsed: false, colorTheme: 'Cyan', dataSource: 'activity', refreshRate: 5, displayOptions: {}, position: 5, colSpan: 1, rowSpan: 1 },
      { id: 'w-7', type: 'gauge', title: 'System Load', collapsed: false, colorTheme: 'Purple', dataSource: 'system', refreshRate: 15, displayOptions: {}, position: 6, colSpan: 1, rowSpan: 1 },
      { id: 'w-8', type: 'task-table', title: 'Recent Tasks', collapsed: false, colorTheme: 'Emerald', dataSource: 'tasks', refreshRate: 30, displayOptions: {}, position: 7, colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: 'dash-perf-002',
    name: 'Agent Performance',
    createdAt: '2025-02-01T14:00:00Z',
    updatedAt: '2025-03-04T12:00:00Z',
    widgets: [
      { id: 'w-9', type: 'stat', title: 'Success Rate', collapsed: false, colorTheme: 'Emerald', dataSource: 'agents', refreshRate: 30, displayOptions: {}, position: 0, colSpan: 1, rowSpan: 1 },
      { id: 'w-10', type: 'stat', title: 'Avg Response', collapsed: false, colorTheme: 'Cyan', dataSource: 'agents', refreshRate: 30, displayOptions: {}, position: 1, colSpan: 1, rowSpan: 1 },
      { id: 'w-11', type: 'gauge', title: 'CPU Usage', collapsed: false, colorTheme: 'Amber', dataSource: 'system', refreshRate: 15, displayOptions: {}, position: 2, colSpan: 1, rowSpan: 1 },
      { id: 'w-12', type: 'chart', title: 'Agent Latency', collapsed: false, colorTheme: 'Blue', dataSource: 'agents', refreshRate: 30, displayOptions: { chartType: 'line' }, position: 3, colSpan: 1, rowSpan: 1 },
      { id: 'w-13', type: 'agent-status', title: 'Health Monitor', collapsed: false, colorTheme: 'Emerald', dataSource: 'agents', refreshRate: 15, displayOptions: {}, position: 4, colSpan: 1, rowSpan: 1 },
      { id: 'w-14', type: 'timeline', title: 'Event Log', collapsed: false, colorTheme: 'Purple', dataSource: 'activity', refreshRate: 5, displayOptions: {}, position: 5, colSpan: 1, rowSpan: 1 },
      { id: 'w-15', type: 'cost', title: 'Cost per Agent', collapsed: false, colorTheme: 'Amber', dataSource: 'costs', refreshRate: 60, displayOptions: {}, position: 6, colSpan: 1, rowSpan: 1 },
    ],
  },
]

// Mock data for widget content
const MOCK_AGENT_DATA = [
  { name: 'Atlas', status: 'online', avatar: '🤖' },
  { name: 'Phoenix', status: 'online', avatar: '🔥' },
  { name: 'Scribe', status: 'idle', avatar: '📝' },
  { name: 'Scout', status: 'online', avatar: '🔍' },
  { name: 'Sentinel', status: 'offline', avatar: '🛡️' },
  { name: 'Echo', status: 'online', avatar: '💬' },
  { name: 'Nova', status: 'busy', avatar: '⭐' },
]

const MOCK_TASKS = [
  { id: 'T-2847', title: 'Data pipeline orchestration', status: 'running', agent: 'Atlas' },
  { id: 'T-2846', title: 'Deploy api-gateway v2.4.1', status: 'completed', agent: 'Phoenix' },
  { id: 'T-2845', title: 'Create OAuth2 service module', status: 'completed', agent: 'Scribe' },
  { id: 'T-2844', title: 'Web scraping — rate limited', status: 'failed', agent: 'Scout' },
  { id: 'T-2843', title: 'PII filter check', status: 'completed', agent: 'Sentinel' },
  { id: 'T-2842', title: 'Send deployment summary', status: 'completed', agent: 'Echo' },
]

const MOCK_ACTIVITY = [
  { time: '2m ago', agent: 'Atlas', action: 'Started data pipeline orchestration', type: 'info' },
  { time: '8m ago', agent: 'Phoenix', action: 'Deployed api-gateway v2.4.1 to production', type: 'success' },
  { time: '14m ago', agent: 'Scribe', action: 'Created src/services/auth/oauth2.ts', type: 'success' },
  { time: '23m ago', agent: 'Scout', action: 'Web scraping task failed — rate limit exceeded', type: 'error' },
  { time: '29m ago', agent: 'Sentinel', action: 'Content policy violation blocked', type: 'warning' },
  { time: '35m ago', agent: 'Echo', action: 'Sent deployment summary to #ops-channel', type: 'success' },
  { time: '42m ago', agent: 'Scribe', action: 'Updated prisma/schema.prisma', type: 'success' },
  { time: '55m ago', agent: 'Atlas', action: 'Completed ETL pipeline — 2.1M rows processed', type: 'success' },
]

const MOCK_CHART_DATA = [
  { label: 'Mon', value: 65 },
  { label: 'Tue', value: 80 },
  { label: 'Wed', value: 45 },
  { label: 'Thu', value: 90 },
  { label: 'Fri', value: 72 },
  { label: 'Sat', value: 35 },
  { label: 'Sun', value: 58 },
]

const MOCK_TIMELINE = [
  { time: '10:42', label: 'Pipeline started', detail: 'ETL daily sync initiated' },
  { time: '10:38', label: 'Deployment complete', detail: 'api-gateway v2.4.1 live' },
  { time: '10:31', label: 'File created', detail: 'oauth2.ts added to services' },
  { time: '10:25', label: 'Rate limit hit', detail: 'Scout throttled on api.example.com' },
  { time: '10:18', label: 'Guardrail triggered', detail: 'PII filter intercepted output' },
]

const MOCK_COST_BREAKDOWN = [
  { label: 'GPT-4o', amount: 124.50 },
  { label: 'Claude 3.5', amount: 89.30 },
  { label: 'Embeddings', amount: 23.10 },
  { label: 'Infrastructure', amount: 45.80 },
]

const MOCK_CALENDAR_EVENTS = [
  { day: 3, title: 'Sprint Review', color: '#10b981' },
  { day: 5, title: 'Deploy v2.5', color: '#3b82f6' },
  { day: 8, title: 'Cost Audit', color: '#f59e0b' },
  { day: 12, title: 'Agent Eval', color: '#8b5cf6' },
  { day: 18, title: 'Security Review', color: '#f43f5e' },
  { day: 22, title: 'Team Standup', color: '#06b6d4' },
]

// ==========================================
// Helper Functions
// ==========================================

function getColorTheme(name: string) {
  return COLOR_THEMES.find((c) => c.name === name) || COLOR_THEMES[0]
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'online': return '#10b981'
    case 'idle': return '#f59e0b'
    case 'busy': return '#3b82f6'
    case 'offline': return '#6b7280'
    default: return '#6b7280'
  }
}

function getTaskStatusColor(status: string): string {
  switch (status) {
    case 'running': return '#3b82f6'
    case 'completed': return '#10b981'
    case 'failed': return '#ef4444'
    case 'pending': return '#f59e0b'
    default: return '#6b7280'
  }
}

function getTaskStatusBg(status: string): string {
  switch (status) {
    case 'running': return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/30'
    case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    default: return 'bg-[#252636] text-[#6b7280] border-[#2d2e3d]'
  }
}

// ==========================================
// Widget Content Renderers
// ==========================================

function StatWidgetContent({ widget }: { widget: WidgetConfig }) {
  const theme = getColorTheme(widget.colorTheme)
  const statsByTitle: Record<string, { value: string; trend: number; label: string }> = {
    'Active Agents': { value: '6', trend: 12, label: 'vs last week' },
    'Tasks Today': { value: '47', trend: -3, label: 'vs yesterday' },
    'Success Rate': { value: '94.2%', trend: 2.1, label: 'vs last month' },
    'Avg Response': { value: '1.2s', trend: -8, label: 'vs last week' },
  }
  const data = statsByTitle[widget.title] || { value: '42', trend: 5, label: 'vs last period' }
  const isUp = data.trend >= 0

  return (
    <div className="flex flex-col items-center justify-center h-full py-2">
      <motion.p
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-3xl sm:text-4xl font-bold text-white"
      >
        {data.value}
      </motion.p>
      <div className="flex items-center gap-1.5 mt-2">
        {isUp ? (
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
        )}
        <span className={`text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {isUp ? '+' : ''}{data.trend}%
        </span>
        <span className="text-[10px] text-[#6b7280]">{data.label}</span>
      </div>
      <div className="mt-3 w-12 h-1 rounded-full" style={{ backgroundColor: theme.primary, opacity: 0.5 }} />
    </div>
  )
}

function ChartWidgetContent({ widget }: { widget: WidgetConfig }) {
  const theme = getColorTheme(widget.colorTheme)
  const isLine = widget.displayOptions.chartType === 'line'
  const maxVal = Math.max(...MOCK_CHART_DATA.map((d) => d.value))

  if (isLine) {
    const points = MOCK_CHART_DATA.map((d, i) => {
      const x = (i / (MOCK_CHART_DATA.length - 1)) * 100
      const y = 100 - (d.value / maxVal) * 80
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="h-full flex flex-col">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="flex-1 w-full" style={{ minHeight: 80 }}>
          <polyline
            points={points}
            fill="none"
            stroke={theme.primary}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {MOCK_CHART_DATA.map((d, i) => {
            const x = (i / (MOCK_CHART_DATA.length - 1)) * 100
            const y = 100 - (d.value / maxVal) * 80
            return <circle key={i} cx={x} cy={y} r="2" fill={theme.primary} vectorEffect="non-scaling-stroke" />
          })}
        </svg>
        <div className="flex justify-between px-1 mt-1">
          {MOCK_CHART_DATA.map((d, i) => (
            <span key={i} className="text-[8px] text-[#6b7280]">{d.label}</span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-end gap-1.5 sm:gap-2 px-1">
        {MOCK_CHART_DATA.map((d, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / maxVal) * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="flex-1 rounded-t-sm min-h-[4px] relative group"
            style={{ backgroundColor: theme.primary, opacity: 0.8 }}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-white bg-[#252636] px-1 rounded whitespace-nowrap pointer-events-none">
              {d.value}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between px-1 mt-1.5">
        {MOCK_CHART_DATA.map((d, i) => (
          <span key={i} className="text-[8px] text-[#6b7280] flex-1 text-center">{d.label}</span>
        ))}
      </div>
    </div>
  )
}

function AgentListWidgetContent() {
  return (
    <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
      {MOCK_AGENT_DATA.map((agent, i) => (
        <motion.div
          key={agent.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-[#252636] transition-colors"
        >
          <span className="text-sm">{agent.avatar}</span>
          <span className="text-xs text-white font-medium flex-1">{agent.name}</span>
          <div className="flex items-center gap-1.5">
            <Circle className="w-2 h-2" fill={getStatusColor(agent.status)} stroke="none" />
            <span className="text-[9px] text-[#6b7280] capitalize">{agent.status}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function TaskTableWidgetContent() {
  return (
    <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
      {MOCK_TASKS.map((task, i) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-[#252636] transition-colors"
        >
          <span className="text-[9px] font-mono text-[#6b7280] w-12 flex-shrink-0">{task.id}</span>
          <span className="text-[11px] text-white flex-1 truncate">{task.title}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0 ${getTaskStatusBg(task.status)}`}>
            {task.status}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function GaugeWidgetContent({ widget }: { widget: WidgetConfig }) {
  const theme = getColorTheme(widget.colorTheme)
  const gaugesByTitle: Record<string, number> = {
    'System Load': 72,
    'CPU Usage': 58,
    'Memory Usage': 84,
  }
  const value = gaugesByTitle[widget.title] || 65
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center h-full py-1">
      <div className="relative w-24 h-24 sm:w-28 sm:h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="#252636"
            strokeWidth="8"
          />
          <motion.circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke={theme.primary}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-bold text-white">{value}%</span>
          <span className="text-[9px] text-[#6b7280]">of capacity</span>
        </div>
      </div>
    </div>
  )
}

function TimelineWidgetContent() {
  return (
    <div className="space-y-0 max-h-44 overflow-y-auto custom-scrollbar pr-1">
      {MOCK_TIMELINE.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex gap-3 py-1.5 relative"
        >
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1" />
            {i < MOCK_TIMELINE.length - 1 && (
              <div className="w-px flex-1 bg-[#2d2e3d] min-h-[16px]" />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#6b7280]">{item.time}</span>
              <span className="text-[11px] text-white font-medium truncate">{item.label}</span>
            </div>
            <p className="text-[10px] text-[#6b7280] truncate">{item.detail}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function CalendarWidgetContent() {
  const today = new Date().getDate()
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const firstDayOfWeek = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()

  const days: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="text-[8px] text-[#6b7280] font-medium py-0.5">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {days.slice(0, 35).map((day, i) => {
          const event = day ? MOCK_CALENDAR_EVENTS.find((e) => e.day === day) : null
          const isToday = day === today
          return (
            <div
              key={i}
              className={`h-5 sm:h-6 flex items-center justify-center text-[9px] rounded-sm relative ${
                day ? 'text-[#9ca3af] hover:bg-[#252636] cursor-pointer' : ''
              } ${isToday ? 'bg-emerald-500/20 text-emerald-400 font-bold' : ''}`}
            >
              {day}
              {event && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: event.color }} />
              )}
            </div>
          )
        })}
      </div>
      <div className="space-y-1 mt-2 border-t border-[#2d2e3d] pt-2">
        {MOCK_CALENDAR_EVENTS.slice(0, 3).map((ev, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
            <span className="text-[9px] text-[#6b7280]">Day {ev.day}</span>
            <span className="text-[10px] text-white truncate">{ev.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AgentStatusWidgetContent() {
  const statuses = [
    { agent: 'Atlas', uptime: '99.9%', health: 'healthy', latency: '45ms' },
    { agent: 'Phoenix', uptime: '99.7%', health: 'healthy', latency: '62ms' },
    { agent: 'Scribe', uptime: '98.2%', health: 'degraded', latency: '180ms' },
    { agent: 'Scout', uptime: '99.5%', health: 'healthy', latency: '38ms' },
    { agent: 'Sentinel', uptime: '0%', health: 'offline', latency: '—' },
    { agent: 'Echo', uptime: '99.8%', health: 'healthy', latency: '55ms' },
  ]

  return (
    <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
      {statuses.map((s, i) => {
        const healthColor = s.health === 'healthy' ? '#10b981' : s.health === 'degraded' ? '#f59e0b' : '#6b7280'
        return (
          <motion.div
            key={s.agent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-[#252636] transition-colors"
          >
            <Circle className="w-2 h-2 flex-shrink-0" fill={healthColor} stroke="none" />
            <span className="text-[11px] text-white font-medium flex-1">{s.agent}</span>
            <span className="text-[9px] text-[#6b7280] font-mono">{s.uptime}</span>
            <span className="text-[9px] text-[#6b7280] font-mono w-12 text-right">{s.latency}</span>
          </motion.div>
        )
      })}
    </div>
  )
}

function CostWidgetContent({ widget }: { widget: WidgetConfig }) {
  const theme = getColorTheme(widget.colorTheme)
  const total = MOCK_COST_BREAKDOWN.reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className="flex flex-col items-center py-1">
      <motion.p
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-2xl sm:text-3xl font-bold text-white"
      >
        £{total.toFixed(2)}
      </motion.p>
      <p className="text-[10px] text-[#6b7280] mb-3">this month</p>
      <div className="w-full space-y-2">
        {MOCK_COST_BREAKDOWN.map((item, i) => {
          const pct = (item.amount / total) * 100
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-[#9ca3af]">{item.label}</span>
                <span className="text-[10px] font-medium text-white">£{item.amount.toFixed(2)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#252636] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: theme.primary, opacity: 1 - i * 0.15 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ActivityFeedWidgetContent() {
  return (
    <div className="space-y-1 max-h-44 overflow-y-auto custom-scrollbar pr-1">
      {MOCK_ACTIVITY.map((item, i) => {
        const typeColor = item.type === 'success' ? '#10b981' : item.type === 'error' ? '#ef4444' : item.type === 'warning' ? '#f59e0b' : '#3b82f6'
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-[#252636] transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: typeColor }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white truncate">{item.action}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-emerald-400">{item.agent}</span>
                <span className="text-[9px] text-[#6b7280]">{item.time}</span>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function CustomHtmlWidgetContent() {
  return (
    <div className="text-[11px] text-[#9ca3af] p-2 bg-[#0f1117] rounded border border-[#2d2e3d]">
      <p className="text-[9px] text-[#6b7280] mb-1">{'/* Custom HTML widget */'}</p>
      <p className="text-emerald-400">&lt;div&gt;</p>
      <p className="pl-3 text-white">Hello, AgentOS!</p>
      <p className="text-emerald-400">&lt;/div&gt;</p>
    </div>
  )
}

// ==========================================
// Widget Card Component
// ==========================================

function WidgetCard({
  widget,
  onRemove,
  onToggleCollapse,
  onConfigure,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: {
  widget: WidgetConfig
  onRemove: () => void
  onToggleCollapse: () => void
  onConfigure: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  isDragOver: boolean
}) {
  const theme = getColorTheme(widget.colorTheme)

  const renderContent = () => {
    switch (widget.type) {
      case 'stat': return <StatWidgetContent widget={widget} />
      case 'chart': return <ChartWidgetContent widget={widget} />
      case 'agent-list': return <AgentListWidgetContent />
      case 'task-table': return <TaskTableWidgetContent />
      case 'gauge': return <GaugeWidgetContent widget={widget} />
      case 'timeline': return <TimelineWidgetContent />
      case 'calendar': return <CalendarWidgetContent />
      case 'agent-status': return <AgentStatusWidgetContent />
      case 'cost': return <CostWidgetContent widget={widget} />
      case 'activity-feed': return <ActivityFeedWidgetContent />
      case 'custom-html': return <CustomHtmlWidgetContent />
      default: return <p className="text-xs text-[#6b7280]">Unknown widget type</p>
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        rounded-xl border bg-[#1a1b2e] overflow-hidden group
        transition-all duration-200
        ${isDragOver ? 'border-emerald-400/60 shadow-lg shadow-emerald-500/10' : 'border-[#2d2e3d] hover:border-[#3d3e4d]'}
      `}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Title Bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2d2e3d] bg-[#1e1f2b]">
        <GripVertical className="w-3.5 h-3.5 text-[#4b5563] cursor-grab active:cursor-grabbing group-hover:text-[#9ca3af] transition-colors flex-shrink-0" />
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.primary }} />
        <span className="text-[11px] font-semibold text-white flex-1 truncate">{widget.title}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onConfigure}
            className="p-1 rounded hover:bg-[#252636] text-[#6b7280] hover:text-white transition-colors"
            title="Configure"
          >
            <Settings className="w-3 h-3" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-[#252636] text-[#6b7280] hover:text-white transition-colors"
            title={widget.collapsed ? 'Expand' : 'Collapse'}
          >
            {widget.collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-red-500/10 text-[#6b7280] hover:text-red-400 transition-colors"
            title="Remove"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!widget.collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3">
              {renderContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize Handle */}
      {!widget.collapsed && (
        <div className="h-1.5 bg-[#0f1117] hover:bg-emerald-500/20 cursor-ns-resize transition-colors flex items-center justify-center">
          <div className="w-6 h-0.5 rounded-full bg-[#2d2e3d] group-hover:bg-[#4b5563] transition-colors" />
        </div>
      )}
    </motion.div>
  )
}

// ==========================================
// Widget Configuration Dialog
// ==========================================

function WidgetConfigDialog({
  widget,
  onClose,
  onSave,
}: {
  widget: WidgetConfig
  onClose: () => void
  onSave: (updated: WidgetConfig) => void
}) {
  const [title, setTitle] = useState(widget.title)
  const [dataSource, setDataSource] = useState(widget.dataSource)
  const [refreshRate, setRefreshRate] = useState(widget.refreshRate)
  const [colorTheme, setColorTheme] = useState(widget.colorTheme)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2e3d]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Configure Widget</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#252636] text-[#6b7280] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialog Body */}
        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/20 transition-colors"
            />
          </div>

          {/* Data Source */}
          <div>
            <label className="text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Data Source</label>
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              className="w-full mt-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
            >
              <option value="agents">Agents</option>
              <option value="tasks">Tasks</option>
              <option value="costs">Costs</option>
              <option value="system">System</option>
              <option value="activity">Activity</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Refresh Rate */}
          <div>
            <label className="text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Refresh Rate</label>
            <div className="flex gap-1.5 mt-1.5">
              {REFRESH_RATES.map((rate) => (
                <button
                  key={rate.value}
                  onClick={() => setRefreshRate(rate.value)}
                  className={`text-[10px] px-2.5 py-1.5 rounded-md border transition-all ${
                    refreshRate === rate.value
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-[#0f1117] text-[#6b7280] border-[#2d2e3d] hover:text-white hover:border-[#4b5563]'
                  }`}
                >
                  {rate.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Theme */}
          <div>
            <label className="text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Color Theme</label>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {COLOR_THEMES.map((ct) => (
                <button
                  key={ct.name}
                  onClick={() => setColorTheme(ct.name)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all ${
                    colorTheme === ct.name
                      ? 'border-emerald-500/50 bg-[#252636]'
                      : 'border-[#2d2e3d] hover:border-[#4b5563]'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ct.primary }} />
                  <span className={`text-[10px] ${colorTheme === ct.name ? 'text-white' : 'text-[#6b7280]'}`}>{ct.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Display Options */}
          {(widget.type === 'chart') && (
            <div>
              <label className="text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Chart Type</label>
              <div className="flex gap-1.5 mt-1.5">
                <button
                  onClick={() => {/* handled via save */}}
                  className="text-[10px] px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                >
                  Bar
                </button>
                <button
                  onClick={() => {/* handled via save */}}
                  className="text-[10px] px-3 py-1.5 rounded-md bg-[#0f1117] text-[#6b7280] border border-[#2d2e3d] hover:text-white"
                >
                  Line
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#2d2e3d]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-[#9ca3af] hover:text-white hover:bg-[#252636] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({
                ...widget,
                title,
                dataSource,
                refreshRate,
                colorTheme,
              })
              onClose()
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3 h-3" />
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ==========================================
// Main Component
// ==========================================

export function CustomDashboards() {
  // Dashboard state
  const [dashboards, setDashboards] = useState<Dashboard[]>(DEMO_DASHBOARDS)
  const [activeDashboardId, setActiveDashboardId] = useState(DEMO_DASHBOARDS[0].id)

  // UI state
  const [widgetLibraryOpen, setWidgetLibraryOpen] = useState(true)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [configWidgetId, setConfigWidgetId] = useState<string | null>(null)
  const [editingDashboardName, setEditingDashboardName] = useState(false)
  const [dashboardNameInput, setDashboardNameInput] = useState('')
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null)
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null)
  const [draggedLibraryType, setDraggedLibraryType] = useState<WidgetType | null>(null)
  const [addMenuOpen, setAddMenuOpen] = useState(false)

  // Get active dashboard
  const activeDashboard = useMemo(
    () => dashboards.find((d) => d.id === activeDashboardId) || dashboards[0],
    [dashboards, activeDashboardId]
  )

  const sortedWidgets = useMemo(
    () => [...activeDashboard.widgets].sort((a, b) => a.position - b.position),
    [activeDashboard.widgets]
  )

  // ==========================================
  // Handlers
  // ==========================================

  const handleAddWidget = useCallback((type: WidgetType) => {
    const def = WIDGET_LIBRARY.find((w) => w.type === type)
    if (!def) return

    const newWidget: WidgetConfig = {
      id: generateId(),
      type,
      title: def.label,
      collapsed: false,
      colorTheme: 'Emerald',
      dataSource: 'agents',
      refreshRate: 30,
      displayOptions: {},
      position: activeDashboard.widgets.length,
      colSpan: def.defaultColSpan,
      rowSpan: def.defaultRowSpan,
    }

    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeDashboardId
          ? { ...d, widgets: [...d.widgets, newWidget], updatedAt: new Date().toISOString() }
          : d
      )
    )
    setAddMenuOpen(false)
  }, [activeDashboard.widgets.length, activeDashboardId])

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeDashboardId
          ? { ...d, widgets: d.widgets.filter((w) => w.id !== widgetId), updatedAt: new Date().toISOString() }
          : d
      )
    )
  }, [activeDashboardId])

  const handleToggleCollapse = useCallback((widgetId: string) => {
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeDashboardId
          ? {
              ...d,
              widgets: d.widgets.map((w) =>
                w.id === widgetId ? { ...w, collapsed: !w.collapsed } : w
              ),
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    )
  }, [activeDashboardId])

  const handleConfigureWidget = useCallback((updated: WidgetConfig) => {
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeDashboardId
          ? {
              ...d,
              widgets: d.widgets.map((w) => (w.id === updated.id ? updated : w)),
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    )
  }, [activeDashboardId])

  const handleCreateDashboard = useCallback(() => {
    const newDash: Dashboard = {
      id: generateDashboardId(),
      name: `Dashboard ${dashboards.length + 1}`,
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setDashboards((prev) => [...prev, newDash])
    setActiveDashboardId(newDash.id)
  }, [dashboards.length])

  const handleDeleteDashboard = useCallback((id: string) => {
    setDashboards((prev) => {
      const next = prev.filter((d) => d.id !== id)
      if (id === activeDashboardId && next.length > 0) {
        setActiveDashboardId(next[0].id)
      }
      return next
    })
  }, [activeDashboardId])

  const handleRenameDashboard = useCallback(() => {
    if (!dashboardNameInput.trim()) return
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeDashboardId ? { ...d, name: dashboardNameInput.trim(), updatedAt: new Date().toISOString() } : d
      )
    )
    setEditingDashboardName(false)
  }, [dashboardNameInput, activeDashboardId])

  const handleResetLayout = useCallback(() => {
    setDashboards(DEMO_DASHBOARDS)
    setActiveDashboardId(DEMO_DASHBOARDS[0].id)
  }, [])

  // Drag and drop for reordering
  const handleWidgetDragStart = useCallback((widgetId: string) => {
    setDraggedWidgetId(widgetId)
  }, [])

  const handleWidgetDragOver = useCallback((e: React.DragEvent, widgetId: string) => {
    e.preventDefault()
    setDragOverWidgetId(widgetId)
  }, [])

  const handleWidgetDrop = useCallback((targetWidgetId: string) => {
    if (!draggedWidgetId || draggedWidgetId === targetWidgetId) {
      setDraggedWidgetId(null)
      setDragOverWidgetId(null)
      return
    }

    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== activeDashboardId) return d
        const widgets = [...d.widgets]
        const dragIdx = widgets.findIndex((w) => w.id === draggedWidgetId)
        const targetIdx = widgets.findIndex((w) => w.id === targetWidgetId)
        if (dragIdx === -1 || targetIdx === -1) return d

        const [removed] = widgets.splice(dragIdx, 1)
        widgets.splice(targetIdx, 0, removed)

        // Reassign positions
        const reindexed = widgets.map((w, i) => ({ ...w, position: i }))
        return { ...d, widgets: reindexed, updatedAt: new Date().toISOString() }
      })
    )

    setDraggedWidgetId(null)
    setDragOverWidgetId(null)
  }, [draggedWidgetId, activeDashboardId])

  // Drag from library to grid
  const handleLibraryDragStart = useCallback((type: WidgetType) => {
    setDraggedLibraryType(type)
  }, [])

  const handleGridDrop = useCallback(() => {
    if (draggedLibraryType) {
      handleAddWidget(draggedLibraryType)
      setDraggedLibraryType(null)
    }
  }, [draggedLibraryType, handleAddWidget])

  const handleLibraryDragEnd = useCallback(() => {
    setDraggedLibraryType(null)
  }, [])

  const configWidget = configWidgetId ? activeDashboard.widgets.find((w) => w.id === configWidgetId) : null

  return (
    <div className={`bg-[#0f1117] flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-0'}`}>
      {/* ==================== Header ==================== */}
      <div className="border-b border-[#2d2e3d] px-4 sm:px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e1f2b] border border-[#2d2e3d]">
              <LayoutDashboard className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">Custom Dashboards</h2>
              <p className="text-[11px] text-[#6b7280]">Drag-and-drop widget builder for personalised views</p>
            </div>
          </div>

          {/* Dashboard Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg overflow-hidden">
              {dashboards.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDashboardId(d.id)}
                  className={`px-3 py-1.5 text-xs font-medium transition-all relative ${
                    d.id === activeDashboardId
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-[#6b7280] hover:text-white hover:bg-[#252636]'
                  }`}
                >
                  {d.name}
                  {d.id === activeDashboardId && (
                    <motion.div
                      layoutId="dashboard-tab-active"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"
                    />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreateDashboard}
              className="p-1.5 rounded-lg bg-[#1a1b2e] border border-[#2d2e3d] text-[#6b7280] hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
              title="Create new dashboard"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dashboard Name Editor */}
        <div className="mt-3 flex items-center gap-2">
          {editingDashboardName ? (
            <div className="flex items-center gap-2">
              <input
                value={dashboardNameInput}
                onChange={(e) => setDashboardNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameDashboard()}
                autoFocus
                className="bg-[#0f1117] border border-emerald-500/50 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400/20 w-48"
              />
              <button onClick={handleRenameDashboard} className="p-1 rounded hover:bg-[#252636] text-emerald-400">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingDashboardName(false)} className="p-1 rounded hover:bg-[#252636] text-[#6b7280]">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white font-medium">{activeDashboard.name}</span>
              <button
                onClick={() => {
                  setDashboardNameInput(activeDashboard.name)
                  setEditingDashboardName(true)
                }}
                className="p-0.5 rounded hover:bg-[#252636] text-[#6b7280] hover:text-white transition-colors"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              {dashboards.length > 1 && (
                <button
                  onClick={() => handleDeleteDashboard(activeDashboardId)}
                  className="p-0.5 rounded hover:bg-red-500/10 text-[#6b7280] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          <span className="text-[9px] text-[#6b7280]">
            {activeDashboard.widgets.length} widget{activeDashboard.widgets.length !== 1 ? 's' : ''} · Updated {new Date(activeDashboard.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* ==================== Toolbar ==================== */}
      <div className="border-b border-[#2d2e3d] px-4 sm:px-6 py-2 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {/* Add Widget */}
          <div className="relative">
            <button
              onClick={() => setAddMenuOpen(!addMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Widget
            </button>
            <AnimatePresence>
              {addMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1 w-56 bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl shadow-xl z-30 overflow-hidden"
                >
                  <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto custom-scrollbar">
                    {WIDGET_LIBRARY.map((def) => {
                      const IconComp = def.icon
                      return (
                        <button
                          key={def.type}
                          onClick={() => handleAddWidget(def.type)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-[#252636] transition-colors"
                        >
                          <IconComp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-white font-medium">{def.label}</p>
                            <p className="text-[9px] text-[#6b7280] truncate">{def.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Layout Toggle */}
          <div className="flex items-center bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg p-0.5">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                layoutMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[#6b7280] hover:text-white'
              }`}
              title="Grid layout"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode('freeform')}
              className={`p-1.5 rounded-md transition-colors ${
                layoutMode === 'freeform' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[#6b7280] hover:text-white'
              }`}
              title="Freeform layout"
            >
              <Move className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Save */}
          <button
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-[#9ca3af] hover:text-white hover:bg-[#1a1b2e] border border-[#2d2e3d] transition-colors"
          >
            <Save className="w-3 h-3" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleResetLayout}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-[#9ca3af] hover:text-white hover:bg-[#1a1b2e] border border-[#2d2e3d] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Share */}
          <button
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-[#9ca3af] hover:text-white hover:bg-[#1a1b2e] border border-[#2d2e3d] transition-colors"
          >
            <Share2 className="w-3 h-3" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-[#9ca3af] hover:text-white hover:bg-[#1a1b2e] border border-[#2d2e3d] transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>

          {/* Toggle Library */}
          <button
            onClick={() => setWidgetLibraryOpen(!widgetLibraryOpen)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] border transition-colors ${
              widgetLibraryOpen
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : 'text-[#9ca3af] hover:text-white border-[#2d2e3d] hover:bg-[#1a1b2e]'
            }`}
          >
            {widgetLibraryOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span className="hidden sm:inline">Library</span>
          </button>
        </div>
      </div>

      {/* ==================== Main Content ==================== */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ---- Widget Library Panel ---- */}
        <AnimatePresence>
          {widgetLibraryOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-[#2d2e3d] bg-[#0f1117] overflow-hidden flex-shrink-0"
            >
              <div className="w-[220px] h-full flex flex-col">
                <div className="px-3 py-3 border-b border-[#2d2e3d]">
                  <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                    <Grid className="w-3.5 h-3.5 text-emerald-400" />
                    Widget Library
                  </h3>
                  <p className="text-[9px] text-[#6b7280] mt-1">Drag widgets to the dashboard</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {WIDGET_LIBRARY.map((def) => {
                    const IconComp = def.icon
                    const isDragging = draggedLibraryType === def.type
                    return (
                      <motion.div
                        key={def.type}
                        draggable
                        onDragStart={() => handleLibraryDragStart(def.type)}
                        onDragEnd={handleLibraryDragEnd}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing
                          border transition-all
                          ${isDragging
                            ? 'border-emerald-400/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
                            : 'border-[#2d2e3d] bg-[#1a1b2e] hover:border-[#3d3e4d] hover:bg-[#252636]'
                          }
                        `}
                      >
                        <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                          <IconComp className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-white font-medium truncate">{def.label}</p>
                          <p className="text-[8px] text-[#6b7280] truncate">{def.description}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Dashboard Grid ---- */}
        <div
          className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleGridDrop}
        >
          {sortedWidgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-16 h-16 rounded-full bg-[#1a1b2e] border border-[#2d2e3d] flex items-center justify-center mb-4">
                <LayoutDashboard className="h-6 w-6 text-[#6b7280]" />
              </div>
              <p className="text-sm text-[#6b7280] mb-1">No widgets yet</p>
              <p className="text-xs text-[#4b5563] mb-4">Add widgets from the library or click &quot;Add Widget&quot;</p>
              <button
                onClick={() => setAddMenuOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Your First Widget
              </button>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              layoutMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}>
              <AnimatePresence mode="popLayout">
                {sortedWidgets.map((widget) => (
                  <WidgetCard
                    key={widget.id}
                    widget={widget}
                    onRemove={() => handleRemoveWidget(widget.id)}
                    onToggleCollapse={() => handleToggleCollapse(widget.id)}
                    onConfigure={() => setConfigWidgetId(widget.id)}
                    onDragStart={() => handleWidgetDragStart(widget.id)}
                    onDragOver={(e) => handleWidgetDragOver(e, widget.id)}
                    onDrop={() => handleWidgetDrop(widget.id)}
                    isDragOver={dragOverWidgetId === widget.id && draggedWidgetId !== widget.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ==================== Configuration Dialog ==================== */}
      <AnimatePresence>
        {configWidget && (
          <WidgetConfigDialog
            widget={configWidget}
            onClose={() => setConfigWidgetId(null)}
            onSave={handleConfigureWidget}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
