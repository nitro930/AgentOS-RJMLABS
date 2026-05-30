'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  MemoryStick,
  AlertTriangle,
  RefreshCcw,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Server,
  Thermometer,
  Zap,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAgentOSStore } from '@/lib/store'

interface MetricSnapshot {
  timestamp: string
  cpu: number
  memory: number
  disk: number
  networkIn: number
  networkOut: number
  load: number
}

interface HealthAlert {
  id: string
  metric: string
  condition: string
  threshold: number
  current: number
  severity: string
  message: string
  isResolved: boolean
  createdAt: string
}

export function SystemHealth() {
  const { addToast } = useAgentOSStore()
  const [metrics, setMetrics] = useState<MetricSnapshot[]>([])
  const [currentStats, setCurrentStats] = useState({
    cpu: 0, memory: 0, disk: 0, networkIn: 0, networkOut: 0, load: 0, uptime: '0d 0h',
  })
  const [alerts, setAlerts] = useState<HealthAlert[]>([])
  const [activeChart, setActiveChart] = useState<'cpu' | 'memory' | 'disk' | 'network'>('cpu')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchMetrics()
    fetchAlerts()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchMetrics, 5000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh])

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/health/metrics')
      if (res.ok) {
        const data = await res.json()
        if (data.current) {
          setCurrentStats(data.current)
        }
        if (data.history) {
          setMetrics(data.history)
        }
      }
    } catch {}
  }

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/health/alerts')
      if (res.ok) setAlerts(await res.json())
    } catch {}
  }

  const metricCards = [
    { key: 'cpu' as const, label: 'CPU Usage', value: currentStats.cpu, unit: '%', icon: Cpu, color: '#10b981', max: 100 },
    { key: 'memory' as const, label: 'Memory', value: currentStats.memory, unit: '%', icon: MemoryStick, color: '#8b5cf6', max: 100 },
    { key: 'disk' as const, label: 'Disk', value: currentStats.disk, unit: '%', icon: HardDrive, color: '#f59e0b', max: 100 },
    { key: 'network' as const, label: 'Network', value: currentStats.networkIn, unit: 'Mbps', icon: Wifi, color: '#06b6d4', max: 1000 },
  ]

  const getStatusColor = (value: number, thresholds = [60, 80]) => {
    if (value < thresholds[0]) return 'text-emerald-400'
    if (value < thresholds[1]) return 'text-amber-400'
    return 'text-red-400'
  }

  const getProgressColor = (value: number) => {
    if (value < 60) return 'bg-emerald-500'
    if (value < 80) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const chartData = metrics.map((m) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cpu: m.cpu,
    memory: m.memory,
    disk: m.disk,
    networkIn: m.networkIn,
    networkOut: m.networkOut,
  }))

  const chartColors: Record<string, string> = {
    cpu: '#10b981',
    memory: '#8b5cf6',
    disk: '#f59e0b',
    network: '#06b6d4',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            System Health
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Real-time VPS monitoring with live metrics and alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAutoRefresh(!autoRefresh) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              autoRefresh ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#1e1f2b] text-[#9ca3af] border-[#2d2e3d]'
            }`}
          >
            <RefreshCcw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            Live
          </button>
          <button onClick={fetchMetrics} className="p-2 bg-[#1e1f2b] text-[#9ca3af] hover:text-white rounded-lg border border-[#2d2e3d] transition-colors">
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metricCards.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.key}
              onClick={() => setActiveChart(card.key)}
              className={`bg-[#1e1f2b] border rounded-lg p-4 text-left transition-colors ${
                activeChart === card.key ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[#2d2e3d] hover:border-[#3d3e4d]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4" style={{ color: card.color }} />
                <span className={`text-xs ${getStatusColor(card.value)}`}>
                  {card.value > 80 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{card.value.toFixed(1)}<span className="text-xs text-[#6b7280] ml-1">{card.unit}</span></p>
              <p className="text-[10px] text-[#6b7280] mt-1">{card.label}</p>
              <div className="mt-2 h-1 bg-[#0f1117] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(card.value)}`}
                  style={{ width: `${Math.min(card.value, 100)}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* Chart Area */}
      <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white capitalize">{activeChart} Usage Over Time</h3>
          <div className="flex gap-1">
            {['cpu', 'memory', 'disk', 'network'].map((key) => (
              <button
                key={key}
                onClick={() => setActiveChart(key as any)}
                className={`px-2 py-1 text-[10px] rounded transition-colors ${
                  activeChart === key ? 'text-white' : 'text-[#6b7280] hover:text-white'
                }`}
                style={activeChart === key ? { backgroundColor: `${chartColors[key]}20`, color: chartColors[key] } : {}}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors[activeChart]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColors[activeChart]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#4b5563" tick={{ fontSize: 10 }} />
              <YAxis stroke="#4b5563" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1f2b', border: '1px solid #2d2e3d', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Area
                type="monotone"
                dataKey={activeChart === 'network' ? 'networkIn' : activeChart}
                stroke={chartColors[activeChart]}
                fillOpacity={1}
                fill="url(#colorMetric)"
                strokeWidth={2}
              />
              {activeChart === 'network' && (
                <Area
                  type="monotone"
                  dataKey="networkOut"
                  stroke="#f59e0b"
                  fillOpacity={0.1}
                  fill="#f59e0b"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Info + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* System Info */}
        <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            System Info
          </h3>
          {[
            { label: 'Hostname', value: 'agentos-vps', icon: Server },
            { label: 'Uptime', value: currentStats.uptime, icon: Clock },
            { label: 'Load Average', value: currentStats.load.toFixed(2), icon: Activity },
            { label: 'CPU Cores', value: '4', icon: Cpu },
            { label: 'Total Memory', value: '8 GB', icon: MemoryStick },
            { label: 'Total Disk', value: '100 GB', icon: HardDrive },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-[#2d2e3d] last:border-0">
              <span className="text-xs text-[#9ca3af] flex items-center gap-2">
                <item.icon className="w-3 h-3" />
                {item.label}
              </span>
              <span className="text-xs text-white font-mono">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Active Alerts */}
        <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Active Alerts
          </h3>
          {alerts.filter((a) => !a.isResolved).length === 0 ? (
            <div className="text-center py-6 text-[#6b7280]">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-50" />
              <p className="text-xs">All systems healthy</p>
            </div>
          ) : (
            alerts.filter((a) => !a.isResolved).map((alert) => (
              <div key={alert.id} className={`p-2.5 rounded-lg border ${
                alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'
              }`}>
                <div className="flex items-center gap-2">
                  {alert.severity === 'critical' ? (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="text-xs font-medium text-white">{alert.metric.toUpperCase()}</span>
                  <span className="text-[10px] text-[#6b7280]">{alert.message}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
