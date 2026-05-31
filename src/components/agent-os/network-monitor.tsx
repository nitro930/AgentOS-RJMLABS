'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wifi,
  Globe,
  Shield,
  Server,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
  Trash2,
  X,
  Check,
  RefreshCcw,
  Lock,
  Unlock,
  Filter,
  Search,
  ChevronDown,
  AlertTriangle,
  Radio,
  Database,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAgentOSStore } from '@/lib/store'

interface NetworkStats {
  bandwidth: {
    currentIn: number
    currentOut: number
    peakIn: number
    peakOut: number
    unit: string
  }
  connections: {
    total: number
    active: number
    listeners: number
  }
  firewall: {
    status: string
    rulesCount: number
    blockedToday: number
  }
  bandwidthHistory: Array<{
    time: string
    timestamp: string
    bandwidthIn: number
    bandwidthOut: number
  }>
}

interface NetworkConnection {
  id: string
  protocol: string
  localAddress: string
  foreignAddress: string
  state: string
  pid: number
  process: string
}

interface FirewallRule {
  id: string
  action: 'allow' | 'deny'
  protocol: string
  source: string
  destination: string
  port: string
  direction: 'in' | 'out'
  comment: string
}

interface DnsRecord {
  id: string
  domain: string
  type: string
  value: string
  ttl: number
}

type TabId = 'overview' | 'connections' | 'firewall' | 'dns'

export function NetworkMonitor() {
  const { addToast } = useAgentOSStore()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [connections, setConnections] = useState<NetworkConnection[]>([])
  const [firewallData, setFirewallData] = useState<{ status: string; defaultPolicy: string; rules: FirewallRule[] } | null>(null)
  const [dnsData, setDnsData] = useState<{ resolver: { primary: string; secondary: string; searchDomain: string }; records: DnsRecord[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [connFilter, setConnFilter] = useState({ protocol: 'all', state: 'all', search: '' })
  const [showFirewallForm, setShowFirewallForm] = useState(false)
  const [showDnsForm, setShowDnsForm] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Firewall form
  const [fwAction, setFwAction] = useState<'allow' | 'deny'>('allow')
  const [fwProtocol, setFwProtocol] = useState('TCP')
  const [fwSource, setFwSource] = useState('0.0.0.0/0')
  const [fwDest, setFwDest] = useState('0.0.0.0/0')
  const [fwPort, setFwPort] = useState('*')
  const [fwDirection, setFwDirection] = useState<'in' | 'out'>('in')
  const [fwComment, setFwComment] = useState('')

  // DNS form
  const [dnsDomain, setDnsDomain] = useState('')
  const [dnsType, setDnsType] = useState('A')
  const [dnsValue, setDnsValue] = useState('')
  const [dnsTtl, setDnsTtl] = useState(3600)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/network/stats')
      if (res.ok) setStats(await res.json())
    } catch { /* silently fail */ }
  }, [])

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/network/connections')
      if (res.ok) setConnections(await res.json())
    } catch { /* silently fail */ }
  }, [])

  const fetchFirewall = useCallback(async () => {
    try {
      const res = await fetch('/api/network/firewall')
      if (res.ok) setFirewallData(await res.json())
    } catch { /* silently fail */ }
  }, [])

  const fetchDns = useCallback(async () => {
    try {
      const res = await fetch('/api/network/dns')
      if (res.ok) setDnsData(await res.json())
    } catch { /* silently fail */ }
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true)
      await Promise.all([fetchStats(), fetchConnections(), fetchFirewall(), fetchDns()])
      setIsLoading(false)
    }
    loadAll()
  }, [fetchStats, fetchConnections, fetchFirewall, fetchDns])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchStats()
        if (activeTab === 'connections') fetchConnections()
      }, 5000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, activeTab, fetchStats, fetchConnections])

  const handleAddFirewallRule = async () => {
    try {
      const res = await fetch('/api/network/firewall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: fwAction, protocol: fwProtocol, source: fwSource,
          destination: fwDest, port: fwPort, direction: fwDirection, comment: fwComment,
        }),
      })
      if (res.ok) {
        addToast('Firewall rule added', 'success')
        fetchFirewall()
        setShowFirewallForm(false)
        setFwAction('allow'); setFwProtocol('TCP'); setFwSource('0.0.0.0/0')
        setFwDest('0.0.0.0/0'); setFwPort('*'); setFwDirection('in'); setFwComment('')
      }
    } catch { addToast('Failed to add rule', 'error') }
  }

  const handleAddDnsRecord = async () => {
    try {
      const res = await fetch('/api/network/dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: dnsDomain, type: dnsType, value: dnsValue, ttl: dnsTtl }),
      })
      if (res.ok) {
        addToast('DNS record added', 'success')
        fetchDns()
        setShowDnsForm(false)
        setDnsDomain(''); setDnsType('A'); setDnsValue(''); setDnsTtl(3600)
      }
    } catch { addToast('Failed to add DNS record', 'error') }
  }

  // Filter connections
  const filteredConnections = connections.filter(c => {
    if (connFilter.protocol !== 'all' && c.protocol !== connFilter.protocol) return false
    if (connFilter.state !== 'all' && c.state !== connFilter.state) return false
    if (connFilter.search && !c.process.toLowerCase().includes(connFilter.search.toLowerCase()) && !c.localAddress.includes(connFilter.search) && !c.foreignAddress.includes(connFilter.search)) return false
    return true
  })

  const getStateColor = (state: string) => {
    switch (state) {
      case 'ESTABLISHED': return 'text-emerald-400'
      case 'LISTEN': return 'text-cyan-400'
      case 'TIME_WAIT': return 'text-amber-400'
      case 'CLOSE_WAIT': return 'text-orange-400'
      case 'SYN_SENT': return 'text-purple-400'
      case 'SYN_RECV': return 'text-blue-400'
      default: return 'text-[#9ca3af]'
    }
  }

  const getProtocolColor = (protocol: string) => {
    switch (protocol) {
      case 'TCP': return 'bg-cyan-500/10 text-cyan-400'
      case 'UDP': return 'bg-amber-500/10 text-amber-400'
      case 'ICMP': return 'bg-purple-500/10 text-purple-400'
      default: return 'bg-[#252636] text-[#9ca3af]'
    }
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'connections', label: 'Connections', icon: Wifi },
    { id: 'firewall', label: 'Firewall', icon: Shield },
    { id: 'dns', label: 'DNS', icon: Globe },
  ]

  const chartData = stats?.bandwidthHistory.map(p => ({
    time: p.time,
    In: p.bandwidthIn,
    Out: p.bandwidthOut,
  })) || []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            Network Monitor
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Real-time network monitoring, connections, firewall, and DNS</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              autoRefresh ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#1e1f2b] text-[#9ca3af] border-[#2d2e3d]'
            }`}
          >
            <RefreshCcw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            Live
          </button>
          <button
            onClick={() => { fetchStats(); fetchConnections(); fetchFirewall(); fetchDns() }}
            className="p-2 bg-[#1e1f2b] text-[#9ca3af] hover:text-white rounded-lg border border-[#2d2e3d] transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#2d2e3d] overflow-x-auto scrollbar-none">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-[#6b7280] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
        >
          {/* ========== OVERVIEW TAB ========== */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Bandwidth In', value: stats ? `${stats.bandwidth.currentIn}` : '--', sub: `Peak: ${stats?.bandwidth.peakIn || '--'}`, unit: stats?.bandwidth.unit || 'Mbps', icon: ArrowDownToLine, color: '#10b981' },
                  { label: 'Bandwidth Out', value: stats ? `${stats.bandwidth.currentOut}` : '--', sub: `Peak: ${stats?.bandwidth.peakOut || '--'}`, unit: stats?.bandwidth.unit || 'Mbps', icon: ArrowUpFromLine, color: '#06b6d4' },
                  { label: 'Connections', value: stats?.connections.total || '--', sub: `Active: ${stats?.connections.active || '--'}`, unit: '', icon: Wifi, color: '#8b5cf6' },
                  { label: 'Listeners', value: stats?.connections.listeners || '--', sub: 'Open ports', unit: '', icon: Server, color: '#f59e0b' },
                  { label: 'Firewall', value: stats?.firewall.status === 'active' ? 'Active' : 'Inactive', sub: `${stats?.firewall.blockedToday || 0} blocked today`, unit: '', icon: Shield, color: stats?.firewall.status === 'active' ? '#10b981' : '#ef4444' },
                ].map(card => {
                  const Icon = card.icon
                  return (
                    <div key={card.label} className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="w-4 h-4" style={{ color: card.color }} />
                        <span className="text-[9px] text-[#6b7280] uppercase tracking-wider">{card.label}</span>
                      </div>
                      <p className="text-xl font-bold text-white">{card.value}<span className="text-[10px] text-[#6b7280] ml-1">{card.unit}</span></p>
                      <p className="text-[10px] text-[#6b7280] mt-1">{card.sub}</p>
                    </div>
                  )
                })}
              </div>

              {/* Bandwidth Chart */}
              <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Bandwidth Over Time
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[#9ca3af]">Inbound</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      <span className="text-[#9ca3af]">Outbound</span>
                    </span>
                  </div>
                </div>
                <div className="h-[250px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="#4b5563" tick={{ fontSize: 10 }} interval={4} />
                        <YAxis stroke="#4b5563" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e1f2b', border: '1px solid #2d2e3d', borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: '#9ca3af' }}
                        />
                        <Area type="monotone" dataKey="In" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Out" stroke="#06b6d4" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[#6b7280] text-sm">Loading chart data...</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========== CONNECTIONS TAB ========== */}
          {activeTab === 'connections' && (
            <div className="space-y-3">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                  <input
                    type="text"
                    placeholder="Search process, address..."
                    value={connFilter.search}
                    onChange={e => setConnFilter({ ...connFilter, search: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                    <select
                      value={connFilter.protocol}
                      onChange={e => setConnFilter({ ...connFilter, protocol: e.target.value })}
                      className="pl-9 pr-8 py-2 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="all">All Protocols</option>
                      <option value="TCP">TCP</option>
                      <option value="UDP">UDP</option>
                      <option value="ICMP">ICMP</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6b7280] pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={connFilter.state}
                      onChange={e => setConnFilter({ ...connFilter, state: e.target.value })}
                      className="px-3 py-2 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="all">All States</option>
                      <option value="ESTABLISHED">ESTABLISHED</option>
                      <option value="LISTEN">LISTEN</option>
                      <option value="TIME_WAIT">TIME_WAIT</option>
                      <option value="CLOSE_WAIT">CLOSE_WAIT</option>
                      <option value="SYN_SENT">SYN_SENT</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6b7280] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Connection Count */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6b7280]">{filteredConnections.length} connections shown</span>
              </div>

              {/* Connections Table */}
              <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2d2e3d]">
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Protocol</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Local Address</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Foreign Address</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">State</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">PID</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Process</th>
                      </tr>
                    </thead>
                    <tbody className="max-h-[400px] overflow-y-auto">
                      {filteredConnections.slice(0, 50).map(conn => (
                        <tr key={conn.id} className="border-b border-[#2d2e3d] last:border-0 hover:bg-[#252636] transition-colors">
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full ${getProtocolColor(conn.protocol)}`}>
                              {conn.protocol}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs font-mono text-[#9ca3af]">{conn.localAddress}</td>
                          <td className="px-3 py-2 text-xs font-mono text-[#9ca3af]">{conn.foreignAddress}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] font-medium ${getStateColor(conn.state)}`}>{conn.state}</span>
                          </td>
                          <td className="px-3 py-2 text-xs font-mono text-[#6b7280]">{conn.pid}</td>
                          <td className="px-3 py-2 text-xs text-white">{conn.process}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredConnections.length > 50 && (
                  <div className="p-2 text-center text-[10px] text-[#6b7280] border-t border-[#2d2e3d]">
                    Showing 50 of {filteredConnections.length} connections
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== FIREWALL TAB ========== */}
          {activeTab === 'firewall' && (
            <div className="space-y-3">
              {/* Firewall Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    firewallData?.status === 'active'
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}>
                    {firewallData?.status === 'active' ? (
                      <Lock className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-xs font-medium ${firewallData?.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                      Firewall {firewallData?.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6b7280]">Default policy: {firewallData?.defaultPolicy || 'deny'}</span>
                  <span className="text-[10px] text-[#6b7280]">{firewallData?.rules.length || 0} rules</span>
                </div>
                <button
                  onClick={() => setShowFirewallForm(!showFirewallForm)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </button>
              </div>

              {/* Add Firewall Rule Form */}
              <AnimatePresence>
                {showFirewallForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#1e1f2b] border border-emerald-500/20 rounded-lg overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <h4 className="text-sm font-medium text-white">New Firewall Rule</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <select
                          value={fwAction}
                          onChange={e => setFwAction(e.target.value as 'allow' | 'deny')}
                          className="px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-xs text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="allow">Allow</option>
                          <option value="deny">Deny</option>
                        </select>
                        <select
                          value={fwProtocol}
                          onChange={e => setFwProtocol(e.target.value)}
                          className="px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-xs text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="TCP">TCP</option>
                          <option value="UDP">UDP</option>
                          <option value="ICMP">ICMP</option>
                        </select>
                        <select
                          value={fwDirection}
                          onChange={e => setFwDirection(e.target.value as 'in' | 'out')}
                          className="px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-xs text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="in">Inbound</option>
                          <option value="out">Outbound</option>
                        </select>
                        <input
                          type="text"
                          value={fwPort}
                          onChange={e => setFwPort(e.target.value)}
                          placeholder="Port (* for all)"
                          className="px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={fwSource}
                          onChange={e => setFwSource(e.target.value)}
                          placeholder="Source (e.g. 0.0.0.0/0)"
                          className="px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                        />
                        <input
                          type="text"
                          value={fwDest}
                          onChange={e => setFwDest(e.target.value)}
                          placeholder="Destination (e.g. 0.0.0.0/0)"
                          className="px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <input
                        type="text"
                        value={fwComment}
                        onChange={e => setFwComment(e.target.value)}
                        placeholder="Comment (optional)"
                        className="w-full px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setShowFirewallForm(false)} className="px-3 py-1.5 text-xs text-[#9ca3af] hover:text-white bg-[#252636] rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleAddFirewallRule} className="px-3 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors">Add Rule</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Firewall Rules Table */}
              <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2d2e3d]">
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Action</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Protocol</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Source</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Destination</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Port</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Direction</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {firewallData?.rules.map(rule => (
                        <tr key={rule.id} className="border-b border-[#2d2e3d] last:border-0 hover:bg-[#252636] transition-colors">
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                              rule.action === 'allow'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {rule.action === 'allow' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {rule.action}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full ${getProtocolColor(rule.protocol)}`}>
                              {rule.protocol}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs font-mono text-[#9ca3af]">{rule.source}</td>
                          <td className="px-3 py-2 text-xs font-mono text-[#9ca3af]">{rule.destination}</td>
                          <td className="px-3 py-2 text-xs font-mono text-white">{rule.port}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              rule.direction === 'in' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {rule.direction === 'in' ? '↓ In' : '↑ Out'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-[#9ca3af] truncate max-w-[150px]">{rule.comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========== DNS TAB ========== */}
          {activeTab === 'dns' && (
            <div className="space-y-3">
              {/* DNS Resolver Info */}
              {dnsData?.resolver && (
                <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                    <Server className="w-4 h-4 text-emerald-400" />
                    DNS Resolver Configuration
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">Primary</p>
                      <p className="text-xs font-mono text-white mt-1">{dnsData.resolver.primary}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">Secondary</p>
                      <p className="text-xs font-mono text-white mt-1">{dnsData.resolver.secondary}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">Search Domain</p>
                      <p className="text-xs font-mono text-white mt-1">{dnsData.resolver.searchDomain}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Add DNS Record */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  DNS Records
                  <span className="text-[10px] text-[#6b7280]">({dnsData?.records.length || 0})</span>
                </h3>
                <button
                  onClick={() => setShowDnsForm(!showDnsForm)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Record
                </button>
              </div>

              {/* Add DNS Record Form */}
              <AnimatePresence>
                {showDnsForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#1e1f2b] border border-emerald-500/20 rounded-lg overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <h4 className="text-sm font-medium text-white">New DNS Record</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={dnsDomain}
                          onChange={e => setDnsDomain(e.target.value)}
                          placeholder="Domain (e.g. api.example.com)"
                          className="col-span-2 px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                        />
                        <select
                          value={dnsType}
                          onChange={e => setDnsType(e.target.value)}
                          className="px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-xs text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="A">A</option>
                          <option value="AAAA">AAAA</option>
                          <option value="CNAME">CNAME</option>
                          <option value="MX">MX</option>
                          <option value="TXT">TXT</option>
                        </select>
                        <input
                          type="number"
                          value={dnsTtl}
                          onChange={e => setDnsTtl(Number(e.target.value))}
                          placeholder="TTL"
                          className="px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <input
                        type="text"
                        value={dnsValue}
                        onChange={e => setDnsValue(e.target.value)}
                        placeholder="Value (e.g. 192.168.1.1)"
                        className="w-full px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setShowDnsForm(false)} className="px-3 py-1.5 text-xs text-[#9ca3af] hover:text-white bg-[#252636] rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleAddDnsRecord} className="px-3 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors">Add Record</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* DNS Records Table */}
              <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2d2e3d]">
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Domain</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Type</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Value</th>
                        <th className="text-left px-3 py-2.5 text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">TTL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dnsData?.records.map(record => {
                        const getTypeBadge = (type: string) => {
                          switch (type) {
                            case 'A': return 'bg-emerald-500/10 text-emerald-400'
                            case 'AAAA': return 'bg-cyan-500/10 text-cyan-400'
                            case 'CNAME': return 'bg-purple-500/10 text-purple-400'
                            case 'MX': return 'bg-amber-500/10 text-amber-400'
                            case 'TXT': return 'bg-orange-500/10 text-orange-400'
                            default: return 'bg-[#252636] text-[#9ca3af]'
                          }
                        }
                        return (
                          <tr key={record.id} className="border-b border-[#2d2e3d] last:border-0 hover:bg-[#252636] transition-colors">
                            <td className="px-3 py-2 text-xs font-mono text-white">{record.domain}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full ${getTypeBadge(record.type)}`}>
                                {record.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs font-mono text-[#9ca3af] max-w-[200px] truncate">{record.value}</td>
                            <td className="px-3 py-2 text-xs text-[#6b7280]">{record.ttl}s</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
