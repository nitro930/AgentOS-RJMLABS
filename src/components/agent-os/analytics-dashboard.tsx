'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Cpu,
  PoundSterling,
  Brain,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'

interface AgentPerformance {
  name: string
  completed: number
  failed: number
}

interface TaskStatusData {
  name: string
  value: number
  color: string
}

interface MemoryGrowthPoint {
  date: string
  entries: number
}

interface CostByAgent {
  name: string
  cost: number
}

interface ActivityTrendPoint {
  date: string
  events: number
}

interface AnalyticsData {
  stats: {
    totalTasks: number
    completedTasks: number
    totalMemory: number
    totalCost: number
    activeAgents: number
  }
  agentPerformance: AgentPerformance[]
  taskStatus: TaskStatusData[]
  memoryGrowth: MemoryGrowthPoint[]
  costByAgent: CostByAgent[]
  activityTrend: ActivityTrendPoint[]
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
const COST_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-[#9ca3af] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

const CostTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-[#9ca3af] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: entry.color }}>
          £${(Number(entry.value)||0).toFixed(2)}
        </p>
      ))}
    </div>
  )
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics')
      const json = await res.json()
      setData(json)
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [fetchAnalytics])

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <div className="h-8 w-40 bg-[#252636] rounded animate-pulse mb-2" />
          <div className="h-4 w-60 bg-[#252636] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 animate-pulse">
              <div className="h-4 w-20 bg-[#252636] rounded mb-2" />
              <div className="h-8 w-16 bg-[#252636] rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-5 h-72 animate-pulse">
              <div className="h-4 w-32 bg-[#252636] rounded mb-4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const stats = data?.stats || {
    totalTasks: 0,
    completedTasks: 0,
    totalMemory: 0,
    totalCost: 0,
    activeAgents: 0,
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg sm:text-2xl font-bold text-white"
        >
          Analytics
        </motion.h2>
        <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
          Performance insights and system metrics
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Tasks', value: stats.totalTasks, icon: BarChart3, color: '#10b981' },
          { label: 'Completed', value: stats.completedTasks, icon: TrendingUp, color: '#22c55e' },
          { label: 'Memory Entries', value: stats.totalMemory, icon: Brain, color: '#3b82f6' },
          { label: 'Total Cost', value: `£${(Number(stats.totalCost)||0).toFixed(2)}`, icon: PoundSterling, color: '#f59e0b' },
          { label: 'Active Agents', value: stats.activeAgents, icon: Cpu, color: '#8b5cf6' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-4 hover:border-[#3d3e4d] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-[#9ca3af] truncate">{stat.label}</p>
                <p className="text-lg sm:text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent Performance Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Agent Performance
          </h3>
          <div className="h-64">
            {(data?.agentPerformance?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.agentPerformance || []} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2e3d" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#2d2e3d' }}
                    tickLine={{ stroke: '#2d2e3d' }}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#2d2e3d' }}
                    tickLine={{ stroke: '#2d2e3d' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                  <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-[#6b7280]">No agent data available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Task Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            Task Status
          </h3>
          <div className="h-64 flex items-center">
            {(data?.taskStatus?.length ?? 0) > 0 ? (
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height={220}>
                    <RechartsPie>
                      <Pie
                        data={data?.taskStatus || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {(data?.taskStatus || []).map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {(data?.taskStatus || []).map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-[11px] text-[#9ca3af] capitalize">{item.name}</span>
                      <span className="text-[11px] font-medium text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-xs text-[#6b7280]">No task data available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Memory Growth Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-400" />
            Memory Growth (30 Days)
          </h3>
          <div className="h-64">
            {(data?.memoryGrowth?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.memoryGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2e3d" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    axisLine={{ stroke: '#2d2e3d' }}
                    tickLine={{ stroke: '#2d2e3d' }}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#2d2e3d' }}
                    tickLine={{ stroke: '#2d2e3d' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="entries"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#3b82f6' }}
                    name="Entries"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-[#6b7280]">No memory data available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Cost Breakdown by Agent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <PoundSterling className="w-4 h-4 text-emerald-400" />
            Cost by Agent
          </h3>
          <div className="h-64">
            {(data?.costByAgent?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.costByAgent || []} layout="vertical" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2e3d" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#2d2e3d' }}
                    tickLine={{ stroke: '#2d2e3d' }}
                    tickFormatter={(v) => `£${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#2d2e3d' }}
                    tickLine={{ stroke: '#2d2e3d' }}
                    width={80}
                  />
                  <Tooltip content={<CostTooltip />} />
                  <Bar dataKey="cost" radius={[0, 4, 4, 0]} name="Cost">
                    {(data?.costByAgent || []).map((_, index) => (
                      <Cell key={index} fill={COST_COLORS[index % COST_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-[#6b7280]">No cost data available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Activity Trend Area Chart - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5 lg:col-span-2"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Activity Trend (30 Days)
          </h3>
          <div className="h-64">
            {(data?.activityTrend?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.activityTrend || []}>
                  <defs>
                    <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2e3d" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    axisLine={{ stroke: '#2d2e3d' }}
                    tickLine={{ stroke: '#2d2e3d' }}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#2d2e3d' }}
                    tickLine={{ stroke: '#2d2e3d' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#activityGradient)"
                    name="Events"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-[#6b7280]">No activity data available</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
