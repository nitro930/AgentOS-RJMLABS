'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ScrollText,
  Search,
  Filter,
  Download,
  RefreshCcw,
  AlertTriangle,
  Info,
  XCircle,
  Shield,
  User,
  Bot,
  Server,
  Clock,
  ChevronDown,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface AuditEntry {
  id: string
  action: string
  resource: string
  resourceId: string | null
  details: string
  source: string
  sourceId: string | null
  ipAddress: string | null
  severity: string
  timestamp: string
}

export function AuditLog() {
  const { addToast } = useAgentOSStore()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [filterResource, setFilterResource] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, critical: 0, today: 0, thisWeek: 0 })

  useEffect(() => {
    fetchAuditLog()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [entries, searchQuery, filterAction, filterResource, filterSeverity, filterSource])

  const fetchAuditLog = async () => {
    try {
      const res = await fetch('/api/audit-log')
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
        // Calculate stats
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        setStats({
          total: data.length,
          critical: data.filter((e: AuditEntry) => e.severity === 'critical').length,
          today: data.filter((e: AuditEntry) => new Date(e.timestamp) >= today).length,
          thisWeek: data.filter((e: AuditEntry) => new Date(e.timestamp) >= weekAgo).length,
        })
      }
    } catch {}
  }

  const applyFilters = () => {
    let filtered = [...entries]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.action.toLowerCase().includes(q) ||
          e.resource.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q)
      )
    }
    if (filterAction !== 'all') {
      filtered = filtered.filter((e) => e.action === filterAction)
    }
    if (filterResource !== 'all') {
      filtered = filtered.filter((e) => e.resource === filterResource)
    }
    if (filterSeverity !== 'all') {
      filtered = filtered.filter((e) => e.severity === filterSeverity)
    }
    if (filterSource !== 'all') {
      filtered = filtered.filter((e) => e.source === filterSource)
    }
    setFilteredEntries(filtered)
  }

  const exportLog = () => {
    const csv = [
      'Timestamp,Action,Resource,Source,Severity,Details',
      ...filteredEntries.map((e) =>
        `"${e.timestamp}","${e.action}","${e.resource}","${e.source}","${e.severity}","${e.details.replace(/"/g, '""')}"`
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Audit log exported', 'success')
  }

  const severityConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    critical: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  }

  const sourceConfig: Record<string, { icon: React.ElementType; color: string }> = {
    user: { icon: User, color: 'text-blue-400' },
    agent: { icon: Bot, color: 'text-emerald-400' },
    system: { icon: Server, color: 'text-violet-400' },
    api: { icon: Shield, color: 'text-amber-400' },
  }

  const actionColors: Record<string, string> = {
    create: 'text-emerald-400',
    read: 'text-blue-400',
    update: 'text-amber-400',
    delete: 'text-red-400',
    execute: 'text-violet-400',
    login: 'text-cyan-400',
    api_call: 'text-pink-400',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-emerald-400" />
            Audit Log
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Complete system activity trail for compliance and security</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportLog}
            className="flex items-center gap-2 px-3 py-2 bg-[#1e1f2b] text-[#9ca3af] hover:text-white text-sm rounded-lg border border-[#2d2e3d] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={fetchAuditLog}
            className="flex items-center gap-2 px-3 py-2 bg-[#1e1f2b] text-[#9ca3af] hover:text-white text-sm rounded-lg border border-[#2d2e3d] transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: stats.total, color: 'text-white' },
          { label: 'Critical', value: stats.critical, color: 'text-red-400' },
          { label: 'Today', value: stats.today, color: 'text-emerald-400' },
          { label: 'This Week', value: stats.thisWeek, color: 'text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-3">
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">{stat.label}</p>
            <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
              placeholder="Search audit log..."
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              showFilters
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-[#1e1f2b] text-[#9ca3af] border-[#2d2e3d] hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-3"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase mb-1 block">Action</label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-white text-xs outline-none"
                >
                  <option value="all">All Actions</option>
                  <option value="create">Create</option>
                  <option value="read">Read</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="execute">Execute</option>
                  <option value="login">Login</option>
                  <option value="api_call">API Call</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase mb-1 block">Resource</label>
                <select
                  value={filterResource}
                  onChange={(e) => setFilterResource(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-white text-xs outline-none"
                >
                  <option value="all">All Resources</option>
                  <option value="agent">Agent</option>
                  <option value="memory">Memory</option>
                  <option value="workflow">Workflow</option>
                  <option value="api_key">API Key</option>
                  <option value="terminal">Terminal</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase mb-1 block">Severity</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-white text-xs outline-none"
                >
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#6b7280] uppercase mb-1 block">Source</label>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded text-white text-xs outline-none"
                >
                  <option value="all">All Sources</option>
                  <option value="user">User</option>
                  <option value="agent">Agent</option>
                  <option value="system">System</option>
                  <option value="api">API</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-xs text-[#6b7280]">
        Showing {filteredEntries.length} of {entries.length} events
      </div>

      {/* Log Entries */}
      <div className="space-y-1">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-[#6b7280]">
            <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No audit entries found</p>
            <p className="text-xs mt-1">Events will appear here as the system is used</p>
          </div>
        ) : (
          filteredEntries.slice(0, 100).map((entry) => {
            const sevConfig = severityConfig[entry.severity] || severityConfig.info
            const srcConfig = sourceConfig[entry.source] || sourceConfig.system
            const SevIcon = sevConfig.icon
            const SrcIcon = srcConfig.icon

            return (
              <motion.div
                key={entry.id}
                className={`bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg overflow-hidden ${
                  entry.severity === 'critical' ? 'border-red-500/30' : ''
                }`}
              >
                <button
                  onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#252636] transition-colors"
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${sevConfig.bg}`}>
                    <SevIcon className={`w-3.5 h-3.5 ${sevConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${actionColors[entry.action] || 'text-white'}`}>
                        {entry.action.toUpperCase()}
                      </span>
                      <span className="text-[#6b7280]">→</span>
                      <span className="text-xs text-white">{entry.resource}</span>
                      <SrcIcon className={`w-3 h-3 ${srcConfig.color} ml-1`} />
                      <span className="text-[10px] text-[#6b7280]">{entry.source}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#6b7280] flex-shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </button>
                {expandedEntry === entry.id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    className="border-t border-[#2d2e3d] p-3 bg-[#0f1117]"
                  >
                    <div className="space-y-2 text-xs">
                      {entry.resourceId && (
                        <div>
                          <span className="text-[#6b7280]">Resource ID:</span>{' '}
                          <code className="text-emerald-400 font-mono">{entry.resourceId}</code>
                        </div>
                      )}
                      {entry.sourceId && (
                        <div>
                          <span className="text-[#6b7280]">Source ID:</span>{' '}
                          <code className="text-amber-400 font-mono">{entry.sourceId}</code>
                        </div>
                      )}
                      {entry.ipAddress && (
                        <div>
                          <span className="text-[#6b7280]">IP Address:</span>{' '}
                          <code className="text-cyan-400 font-mono">{entry.ipAddress}</code>
                        </div>
                      )}
                      <div>
                        <span className="text-[#6b7280]">Details:</span>
                        <pre className="mt-1 p-2 bg-[#1e1f2b] rounded text-[#d1d5db] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(entry.details), null, 2)
                            } catch {
                              return entry.details
                            }
                          })()}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
