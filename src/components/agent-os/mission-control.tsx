'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Activity, Cpu, Database, Zap, Users, CheckCircle, Clock, TrendingUp, PoundSterling, Cable, Bug, Container, Shield, Trophy, Store } from 'lucide-react'
import { StatCard } from './stat-card'
import { ActivityTimeline } from './activity-timeline'
import { CommandTerminal } from './command-terminal'
import { DashboardStats, ActivityEvent } from '@/lib/types'
import { useAgentOSStore } from '@/lib/store'

export function MissionControl() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      setStats(data)
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg sm:text-2xl font-bold text-white"
        >
          Mission Control
        </motion.h2>
        <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">System overview and real-time monitoring</p>
      </div>

      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <span className="text-xs sm:text-sm text-emerald-400 font-medium">System Operational</span>
        <span className="text-[10px] sm:text-xs text-emerald-400/60 ml-auto">
          {stats ? `${stats.agents.active}/${stats.agents.total} agents active` : 'Loading...'}
        </span>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          title="Total Agents"
          value={stats?.agents.total ?? 0}
          subtitle={`${stats?.agents.active ?? 0} active`}
          icon={Users}
          color="#10b981"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Tasks"
          value={stats?.tasks.running ?? 0}
          subtitle={`${stats?.tasks.completed ?? 0} completed`}
          icon={Activity}
          color="#f59e0b"
          isLoading={isLoading}
        />
        <StatCard
          title="Memory Entries"
          value={stats?.memory.total ?? 0}
          subtitle={`${stats?.memory.pinned ?? 0} pinned`}
          icon={Database}
          color="#8b5cf6"
          isLoading={isLoading}
        />
        <StatCard
          title="Outputs Today"
          value={stats?.outputs.today ?? 0}
          subtitle="Generated today"
          icon={Zap}
          color="#06b6d4"
          isLoading={isLoading}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Agent Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Agent Status
          </h3>
          <div className="space-y-1 sm:space-y-2">
            {stats?.agents.list.map((agent) => {
              const statusColors: Record<string, string> = {
                running: '#10b981',
                idle: '#6b7280',
                error: '#ef4444',
                paused: '#f59e0b',
              }
              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 p-2 sm:p-2 rounded-lg hover:bg-[#252636] transition-colors"
                >
                  <span className="text-lg">{agent.avatar || '🤖'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{agent.name}</p>
                    <p className="text-[11px] text-[#6b7280]">{agent.tasksCompleted} tasks completed</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${agent.status === 'running' ? 'animate-pulse' : ''}`}
                      style={{ backgroundColor: statusColors[agent.status] || '#6b7280' }}
                    />
                    <span className="text-xs capitalize" style={{ color: statusColors[agent.status] }}>
                      {agent.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Recent Activity
          </h3>
          <ActivityTimeline
            events={(stats?.recentActivity || []) as ActivityEvent[]}
            isLoading={isLoading}
          />
        </motion.div>
      </div>

      {/* Goals & Tasks Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] sm:text-xs text-[#9ca3af]">Goals Active</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats?.goals.active ?? 0}</p>
        </div>
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-[10px] sm:text-xs text-[#9ca3af]">Goals Done</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats?.goals.completed ?? 0}</p>
        </div>
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] sm:text-xs text-[#9ca3af]">Tasks Running</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats?.tasks.running ?? 0}</p>
        </div>
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Database className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] sm:text-xs text-[#9ca3af]">Workspaces</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats?.workspaces ?? 0}</p>
        </div>
      </div>

      {/* Command Terminal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <CommandTerminal />
      </motion.div>

      {/* Quick Access Widgets - 2x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Cost Overview Widget */}
        <QuickWidget
          icon={PoundSterling}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          title="Cost Overview"
          onClick={() => useAgentOSStore.getState().setActiveSection('costs')}
        >
          <MiniCostWidget />
        </QuickWidget>

        {/* MCP Servers Widget */}
        <QuickWidget
          icon={Cable}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
          title="MCP Servers"
          onClick={() => useAgentOSStore.getState().setActiveSection('mcp')}
        >
          <MiniMCPWidget />
        </QuickWidget>

        {/* Docker Status Widget */}
        <QuickWidget
          icon={Container}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10"
          title="Docker Containers"
          onClick={() => useAgentOSStore.getState().setActiveSection('docker')}
        >
          <MiniDockerWidget />
        </QuickWidget>

        {/* Swarm & Teams Widget */}
        <QuickWidget
          icon={Bug}
          iconColor="text-orange-400"
          iconBg="bg-orange-500/10"
          title="Swarm & Teams"
          onClick={() => useAgentOSStore.getState().setActiveSection('swarm')}
        >
          <MiniSwarmWidget />
        </QuickWidget>
      </div>
    </div>
  )
}

// ─── Quick Widget Wrapper ───────────────────────────────────────────

function QuickWidget({ icon: Icon, iconColor, iconBg, title, onClick, children }: {
  icon: React.ElementType
  iconColor: string
  iconBg: string
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-4 cursor-pointer hover:border-[#3d3e4d] transition-colors"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <span className="text-[9px] text-emerald-400 ml-auto font-medium hover:text-emerald-300">View All →</span>
      </div>
      {children}
    </motion.div>
  )
}

// ─── Mini Widgets ────────────────────────────────────────────────────

function MiniCostWidget() {
  const [data, setData] = useState<{ totalSpend: number; monthSpend: number; entries: number } | null>(null)

  useEffect(() => {
    fetch('/api/costs')
      .then(r => r.json())
      .then(d => setData({ totalSpend: d.totalSpend || 0, monthSpend: d.monthSpend || 0, entries: d.entries?.length || 0 }))
      .catch(() => {})
  }, [])

  if (!data) return <div className="space-y-2"><div className="h-4 bg-[#252636] rounded animate-pulse" /><div className="h-4 bg-[#252636] rounded animate-pulse w-3/4" /></div>

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-[#9ca3af]">Total Spend</span>
        <span className="text-white font-medium">£{(Number(data.totalSpend) || 0).toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-[#9ca3af]">This Month</span>
        <span className="text-emerald-400 font-medium">£{(Number(data.monthSpend) || 0).toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-[#9ca3af]">Cost Entries</span>
        <span className="text-white">{data.entries}</span>
      </div>
    </div>
  )
}

function MiniMCPWidget() {
  const [data, setData] = useState<{ connected: number; total: number; tools: number } | null>(null)

  useEffect(() => {
    fetch('/api/mcp/servers')
      .then(r => r.json())
      .then(d => {
        const servers = d.servers || d || []
        const connected = Array.isArray(servers) ? servers.filter((s: any) => s.status === 'connected').length : 0
        const total = Array.isArray(servers) ? servers.length : 0
        setData({ connected, total, tools: Array.isArray(servers) ? servers.reduce((acc: number, s: any) => acc + (s.toolCount || 0), 0) : 0 })
      })
      .catch(() => {})
  }, [])

  if (!data) return <div className="space-y-2"><div className="h-4 bg-[#252636] rounded animate-pulse" /><div className="h-4 bg-[#252636] rounded animate-pulse w-3/4" /></div>

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-[#9ca3af]">Connected</span>
        <span className="text-emerald-400 font-medium">{data.connected}/{data.total}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-[#9ca3af]">Available Tools</span>
        <span className="text-white">{data.tools}</span>
      </div>
      <div className="h-1.5 bg-[#252636] rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: data.total > 0 ? `${(data.connected / data.total) * 100}%` : '0%' }} />
      </div>
    </div>
  )
}

function MiniDockerWidget() {
  const [data, setData] = useState<{ running: number; total: number; images: number } | null>(null)

  useEffect(() => {
    fetch('/api/docker/containers')
      .then(r => r.json())
      .then(d => {
        const containers = d.containers || d || []
        const running = Array.isArray(containers) ? containers.filter((c: any) => c.status === 'running').length : 0
        const total = Array.isArray(containers) ? containers.length : 0
        setData({ running, total, images: 0 })
      })
      .catch(() => {})
  }, [])

  if (!data) return <div className="space-y-2"><div className="h-4 bg-[#252636] rounded animate-pulse" /><div className="h-4 bg-[#252636] rounded animate-pulse w-3/4" /></div>

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-[#9ca3af]">Containers Running</span>
        <span className="text-emerald-400 font-medium">{data.running}/{data.total}</span>
      </div>
      <div className="flex items-center gap-2">
        {data.running > 0 && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] text-emerald-400">{data.running} active</span></div>}
        {data.total - data.running > 0 && <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#6b7280]" /><span className="text-[10px] text-[#6b7280]">{data.total - data.running} stopped</span></div>}
      </div>
    </div>
  )
}

function MiniSwarmWidget() {
  const [data, setData] = useState<{ swarms: number; activeSwarms: number; teams: number } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/swarm').then(r => r.json()).catch(() => ({})),
      fetch('/api/teams').then(r => r.json()).catch(() => ({}))
    ]).then(([swarmData, teamData]) => {
      const swarms = swarmData.swarms || swarmData || []
      const teams = teamData.teams || teamData || []
      setData({
        swarms: Array.isArray(swarms) ? swarms.length : 0,
        activeSwarms: Array.isArray(swarms) ? swarms.filter((s: any) => s.status === 'active').length : 0,
        teams: Array.isArray(teams) ? teams.length : 0
      })
    }).catch(() => {})
  }, [])

  if (!data) return <div className="space-y-2"><div className="h-4 bg-[#252636] rounded animate-pulse" /><div className="h-4 bg-[#252636] rounded animate-pulse w-3/4" /></div>

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-[#9ca3af]">Active Swarms</span>
        <span className="text-orange-400 font-medium">{data.activeSwarms}/{data.swarms}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-[#9ca3af]">Teams</span>
        <span className="text-white">{data.teams}</span>
      </div>
    </div>
  )
}
