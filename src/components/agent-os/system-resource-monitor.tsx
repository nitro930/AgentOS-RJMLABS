'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface SystemData {
  cpu: { usage: number; cores: number; model: string; temperature: number }
  memory: { total: number; used: number; cached: number; swapTotal: number; swapUsed: number }
  disk: { total: number; used: number; filesystem: string; mountPoint: string }
  network: { bytesIn: number; bytesOut: number; packetsIn: number; packetsOut: number }
  processes: { pid: number; name: string; cpu: number; memory: number; status: string }[]
  uptime: number
  loadAverage: number[]
}

function formatBytes(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb} MB`
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function formatNetworkBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${bytes} B`
}

function getCpuColor(usage: number): string {
  if (usage >= 80) return 'text-red-400'
  if (usage >= 50) return 'text-amber-400'
  return 'text-emerald-400'
}

function getCpuBarColor(usage: number): string {
  if (usage >= 80) return 'bg-red-500'
  if (usage >= 50) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'running':
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Running</span>
    case 'sleeping':
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">Sleeping</span>
    case 'stopped':
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-400 border border-red-500/30">Stopped</span>
    default:
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#2d2e3d] text-[#9ca3af]">{status}</span>
  }
}

function SkeletonCard() {
  return (
    <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[#2d2e3d]" />
        <div className="flex-1">
          <div className="h-4 w-20 bg-[#2d2e3d] rounded mb-2" />
          <div className="h-3 w-16 bg-[#2d2e3d] rounded" />
        </div>
      </div>
      <div className="h-8 w-24 bg-[#2d2e3d] rounded mb-3" />
      <div className="h-2 w-full bg-[#2d2e3d] rounded" />
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-4 animate-pulse">
      <div className="h-5 w-32 bg-[#2d2e3d] rounded mb-4" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 mb-3">
          <div className="h-4 w-12 bg-[#2d2e3d] rounded" />
          <div className="h-4 w-24 bg-[#2d2e3d] rounded" />
          <div className="h-4 w-16 bg-[#2d2e3d] rounded" />
          <div className="h-4 w-16 bg-[#2d2e3d] rounded" />
          <div className="h-4 w-16 bg-[#2d2e3d] rounded" />
        </div>
      ))}
    </div>
  )
}

export function SystemResourceMonitor() {
  const [data, setData] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [prevNetwork, setPrevNetwork] = useState<{ bytesIn: number; bytesOut: number } | null>(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetch('/api/system-resources')
      if (res.ok) {
        const json = await res.json()
        setPrevNetwork(prev => data?.network ? { bytesIn: data.network.bytesIn, bytesOut: data.network.bytesOut } : prev)
        setData(json)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error('Failed to fetch system resources:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [data])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 10000)
    return () => clearInterval(interval)
  }, [])

  const memPercent = data ? Math.round((data.memory.used / data.memory.total) * 100) : 0
  const diskPercent = data ? Math.round((data.disk.used / data.disk.total) * 100) : 0

  const netInTrend = prevNetwork && data ? data.network.bytesIn > prevNetwork.bytesIn : null
  const netOutTrend = prevNetwork && data ? data.network.bytesOut > prevNetwork.bytesOut : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">System Resources</h2>
            <p className="text-xs text-[#6b7280]">
              {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
              <span className="ml-2 text-emerald-400">Auto-refresh: 10s</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1e1f2b] border border-[#2d2e3d] text-sm text-[#9ca3af] hover:text-white hover:border-emerald-500/30 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* System Info Bar */}
      {data && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3 text-xs"
        >
          <span className="px-2.5 py-1 rounded-md bg-[#1e1f2b] border border-[#2d2e3d] text-[#9ca3af]">
            Uptime: <span className="text-emerald-400 font-mono">{formatUptime(data.uptime)}</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#1e1f2b] border border-[#2d2e3d] text-[#9ca3af]">
            Load: <span className="text-emerald-400 font-mono">{data.loadAverage.join(' / ')}</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#1e1f2b] border border-[#2d2e3d] text-[#9ca3af]">
            CPU: <span className="text-white font-mono">{data.cpu.model}</span>
          </span>
        </motion.div>
      )}

      {/* Metric Cards Grid */}
      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* CPU Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-4 hover:border-emerald-500/20 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">CPU Usage</p>
                <p className="text-[10px] text-[#6b7280]">{data.cpu.cores} cores</p>
              </div>
            </div>
            <div className="flex items-end justify-between mb-3">
              <span className={`text-3xl font-bold font-mono ${getCpuColor(data.cpu.usage)}`}>
                {data.cpu.usage}%
              </span>
              <span className="text-xs text-[#6b7280]">
                {data.cpu.temperature}°C
              </span>
            </div>
            {/* Gauge bar */}
            <div className="w-full h-2 bg-[#0f1117] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.cpu.usage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${getCpuBarColor(data.cpu.usage)}`}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-emerald-400">0%</span>
              <span className="text-[9px] text-amber-400">50%</span>
              <span className="text-[9px] text-red-400">100%</span>
            </div>
          </motion.div>

          {/* Memory Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-4 hover:border-emerald-500/20 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <MemoryStick className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Memory (RAM)</p>
                <p className="text-[10px] text-[#6b7280]">{formatBytes(data.memory.total)} total</p>
              </div>
            </div>
            <div className="flex items-end justify-between mb-3">
              <span className="text-3xl font-bold font-mono text-blue-400">{memPercent}%</span>
              <span className="text-xs text-[#6b7280]">
                {formatBytes(data.memory.used)} / {formatBytes(data.memory.total)}
              </span>
            </div>
            <div className="w-full h-2 bg-[#0f1117] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${memPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-blue-500"
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-[#6b7280]">
              <span>Cached: {formatBytes(data.memory.cached)}</span>
              <span>Swap: {formatBytes(data.memory.swapUsed)}/{formatBytes(data.memory.swapTotal)}</span>
            </div>
          </motion.div>

          {/* Disk Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-4 hover:border-emerald-500/20 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Disk Usage</p>
                <p className="text-[10px] text-[#6b7280]">{data.disk.filesystem} {data.disk.mountPoint}</p>
              </div>
            </div>
            <div className="flex items-end justify-between mb-3">
              <span className="text-3xl font-bold font-mono text-purple-400">{diskPercent}%</span>
              <span className="text-xs text-[#6b7280]">
                {formatBytes(data.disk.used)} / {formatBytes(data.disk.total)}
              </span>
            </div>
            <div className="w-full h-2 bg-[#0f1117] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${diskPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-purple-500"
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-[#6b7280]">
              <span>Free: {formatBytes(data.disk.total - data.disk.used)}</span>
              <span>{((data.disk.used / data.disk.total) * 100).toFixed(1)}% used</span>
            </div>
          </motion.div>

          {/* Network Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-4 hover:border-emerald-500/20 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Network className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Network I/O</p>
                <p className="text-[10px] text-[#6b7280]">Total transfer</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-[#9ca3af]">Inbound</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {formatNetworkBytes(data.network.bytesIn)}
                  </span>
                  {netInTrend !== null && (
                    netInTrend
                      ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                      : <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs text-[#9ca3af]">Outbound</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-mono font-bold text-orange-400">
                    {formatNetworkBytes(data.network.bytesOut)}
                  </span>
                  {netOutTrend !== null && (
                    netOutTrend
                      ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                      : <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#2d2e3d] flex justify-between text-[10px] text-[#6b7280]">
              <span>Pkts In: {data.network.packetsIn.toLocaleString()}</span>
              <span>Pkts Out: {data.network.packetsOut.toLocaleString()}</span>
            </div>
          </motion.div>
        </div>
      ) : null}

      {/* Process List */}
      {loading && !data ? (
        <SkeletonTable />
      ) : data ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2e3d]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-medium text-white">Top Processes by CPU</h3>
            </div>
            <span className="text-[10px] text-[#6b7280]">{data.processes.length} processes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#6b7280] text-xs border-b border-[#2d2e3d]">
                  <th className="text-left px-4 py-2.5 font-medium">PID</th>
                  <th className="text-left px-4 py-2.5 font-medium">Name</th>
                  <th className="text-right px-4 py-2.5 font-medium">CPU %</th>
                  <th className="text-right px-4 py-2.5 font-medium">Memory %</th>
                  <th className="text-center px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {data.processes.map((proc, i) => (
                    <motion.tr
                      key={proc.pid}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-[#2d2e3d]/50 hover:bg-[#252636] transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#9ca3af]">{proc.pid}</td>
                      <td className="px-4 py-3 text-white font-medium">{proc.name}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${proc.cpu > 10 ? 'bg-red-500' : proc.cpu > 5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, proc.cpu * 5)}%` }}
                            />
                          </div>
                          <span className={`font-mono text-xs ${proc.cpu > 10 ? 'text-red-400' : proc.cpu > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {proc.cpu}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${proc.memory > 8 ? 'bg-red-500' : proc.memory > 4 ? 'bg-amber-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(100, proc.memory * 5)}%` }}
                            />
                          </div>
                          <span className={`font-mono text-xs ${proc.memory > 8 ? 'text-red-400' : proc.memory > 4 ? 'text-amber-400' : 'text-blue-400'}`}>
                            {proc.memory}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(proc.status)}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}
