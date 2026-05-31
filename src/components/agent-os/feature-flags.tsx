'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flag,
  ToggleLeft,
  ToggleRight,
  Plus,
  Pencil,
  Trash2,
  History,
  Shield,
  ChevronDown,
  X,
  Check,
  AlertTriangle,
  Search,
  Filter,
  Users,
  Globe,
  Percent,
  Layers,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface FeatureFlagData {
  id: string
  key: string
  name: string
  description: string | null
  isEnabled: boolean
  flagType: string
  value: string
  rules: string
  targetScope: string
  targetIds: string
  percentage: number
  variants: string
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  history?: FeatureFlagHistoryData[]
}

interface FeatureFlagHistoryData {
  id: string
  flagId: string
  action: string
  oldValue: string
  newValue: string
  changedBy: string
  createdAt: string
}

interface FlagRule {
  id: string
  condition: string
  field: string
  operator: string
  value: string
  flagValue: string
}

type TabId = 'flags' | 'rules' | 'history'

export function FeatureFlags() {
  const { addToast } = useAgentOSStore()
  const [flags, setFlags] = useState<FeatureFlagData[]>([])
  const [history, setHistory] = useState<FeatureFlagHistoryData[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('flags')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingFlag, setEditingFlag] = useState<FeatureFlagData | null>(null)
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form state
  const [formKey, setFormKey] = useState('')
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formType, setFormType] = useState('boolean')
  const [formValue, setFormValue] = useState('true')
  const [formTargetScope, setFormTargetScope] = useState('all')
  const [formPercentage, setFormPercentage] = useState(100)
  const [formRules, setFormRules] = useState<FlagRule[]>([])

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch('/api/feature-flags')
      if (res.ok) {
        const data = await res.json()
        setFlags(data)
        // Collect all history
        const allHistory: FeatureFlagHistoryData[] = []
        data.forEach((flag: FeatureFlagData) => {
          if (flag.history) {
            allHistory.push(...flag.history.map(h => ({ ...h, flagKey: flag.key, flagName: flag.name })))
          }
        })
        setHistory(allHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFlags()
  }, [fetchFlags])

  const resetForm = () => {
    setFormKey('')
    setFormName('')
    setFormDescription('')
    setFormType('boolean')
    setFormValue('true')
    setFormTargetScope('all')
    setFormPercentage(100)
    setFormRules([])
    setEditingFlag(null)
  }

  const openCreate = () => {
    resetForm()
    setShowCreateDialog(true)
  }

  const openEdit = (flag: FeatureFlagData) => {
    setEditingFlag(flag)
    setFormKey(flag.key)
    setFormName(flag.name)
    setFormDescription(flag.description || '')
    setFormType(flag.flagType)
    setFormValue(flag.value)
    setFormTargetScope(flag.targetScope)
    setFormPercentage(flag.percentage)
    try {
      setFormRules(JSON.parse(flag.rules))
    } catch {
      setFormRules([])
    }
    setShowCreateDialog(true)
  }

  const handleSave = async () => {
    if (!formKey.trim() || !formName.trim()) {
      addToast('Key and name are required', 'error')
      return
    }

    try {
      const payload = {
        key: formKey.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, ''),
        name: formName.trim(),
        description: formDescription.trim() || null,
        flagType: formType,
        value: formValue,
        targetScope: formTargetScope,
        percentage: formPercentage,
        rules: formRules,
      }

      if (editingFlag) {
        const res = await fetch(`/api/feature-flags/${editingFlag.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          addToast(`Flag "${formName}" updated`, 'success')
          fetchFlags()
          setShowCreateDialog(false)
          resetForm()
        } else {
          const err = await res.json()
          addToast(err.error || 'Failed to update flag', 'error')
        }
      } else {
        const res = await fetch('/api/feature-flags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, isEnabled: false }),
        })
        if (res.ok) {
          addToast(`Flag "${formName}" created`, 'success')
          fetchFlags()
          setShowCreateDialog(false)
          resetForm()
        } else {
          const err = await res.json()
          addToast(err.error || 'Failed to create flag', 'error')
        }
      }
    } catch {
      addToast('Network error', 'error')
    }
  }

  const handleToggle = async (flag: FeatureFlagData) => {
    try {
      const res = await fetch(`/api/feature-flags/${flag.id}/toggle`, { method: 'POST' })
      if (res.ok) {
        addToast(`Flag "${flag.name}" ${flag.isEnabled ? 'disabled' : 'enabled'}`, 'success')
        fetchFlags()
      } else {
        addToast('Failed to toggle flag', 'error')
      }
    } catch {
      addToast('Network error', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/feature-flags/${id}`, { method: 'DELETE' })
      if (res.ok) {
        addToast('Flag deleted', 'success')
        fetchFlags()
        setDeleteConfirmId(null)
      } else {
        addToast('Failed to delete flag', 'error')
      }
    } catch {
      addToast('Network error', 'error')
    }
  }

  const addRule = () => {
    setFormRules([...formRules, {
      id: `rule-${Date.now()}`,
      condition: 'agent',
      field: '',
      operator: 'equals',
      value: '',
      flagValue: 'true',
    }])
  }

  const removeRule = (index: number) => {
    setFormRules(formRules.filter((_, i) => i !== index))
  }

  const updateRule = (index: number, field: keyof FlagRule, value: string) => {
    const updated = [...formRules]
    updated[index] = { ...updated[index], [field]: value }
    setFormRules(updated)
  }

  // Filter flags
  const filteredFlags = flags.filter(f => {
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase()) && !f.key.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterType !== 'all' && f.flagType !== filterType) return false
    if (filterStatus === 'enabled' && !f.isEnabled) return false
    if (filterStatus === 'disabled' && f.isEnabled) return false
    return true
  })

  // Compute flag stats for rules tab
  const flagsWithRules = flags.filter(f => {
    try {
      const rules = JSON.parse(f.rules)
      return Array.isArray(rules) && rules.length > 0
    } catch { return false }
  })

  const selectedFlag = flags.find(f => f.id === selectedFlagId)
  const selectedFlagRules: FlagRule[] = selectedFlag ? (() => {
    try { return JSON.parse(selectedFlag.rules) } catch { return [] }
  })() : []

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'text-emerald-400'
      case 'toggled': return 'text-amber-400'
      case 'updated': return 'text-cyan-400'
      case 'deleted': return 'text-red-400'
      case 'rule_added': return 'text-purple-400'
      case 'rule_removed': return 'text-orange-400'
      default: return 'text-[#9ca3af]'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'boolean': return <ToggleRight className="w-3.5 h-3.5" />
      case 'percentage': return <Percent className="w-3.5 h-3.5" />
      case 'variant': return <Layers className="w-3.5 h-3.5" />
      default: return <Flag className="w-3.5 h-3.5" />
    }
  }

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'all': return <Globe className="w-3 h-3" />
      case 'agents': return <Users className="w-3 h-3" />
      case 'roles': return <Shield className="w-3 h-3" />
      default: return <Globe className="w-3 h-3" />
    }
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'flags', label: 'Flags', icon: Flag, count: flags.length },
    { id: 'rules', label: 'Rules', icon: Shield, count: flagsWithRules.length },
    { id: 'history', label: 'History', icon: History, count: history.length },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-emerald-400" />
            Feature Flags
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Control feature rollouts with flags, rules, and audit trails</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Flag
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Flags', value: flags.length, color: '#10b981' },
          { label: 'Enabled', value: flags.filter(f => f.isEnabled).length, color: '#22c55e' },
          { label: 'With Rules', value: flagsWithRules.length, color: '#8b5cf6' },
          { label: 'Changes Today', value: history.filter(h => new Date(h.createdAt).toDateString() === new Date().toDateString()).length, color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-3">
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-bold text-white mt-1" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#2d2e3d]">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-[#6b7280] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="text-[10px] bg-[#252636] px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
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
          {/* ========== FLAGS TAB ========== */}
          {activeTab === 'flags' && (
            <div className="space-y-3">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                  <input
                    type="text"
                    placeholder="Search flags..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                    <select
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      className="pl-9 pr-8 py-2 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="all">All Types</option>
                      <option value="boolean">Boolean</option>
                      <option value="percentage">Percentage</option>
                      <option value="variant">Variant</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6b7280] pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="px-3 py-2 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="all">All Status</option>
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6b7280] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Flags Table */}
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4">
                      <div className="h-4 w-48 bg-[#2d2e3d] rounded mb-2" />
                      <div className="h-3 w-32 bg-[#2d2e3d] rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredFlags.length === 0 ? (
                <div className="text-center py-12 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg">
                  <Flag className="w-10 h-10 mx-auto mb-3 text-[#4b5563]" />
                  <p className="text-sm text-[#6b7280]">
                    {flags.length === 0 ? 'No feature flags yet. Create your first flag!' : 'No flags match your filters'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {filteredFlags.map((flag, index) => (
                    <motion.div
                      key={flag.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`bg-[#1e1f2b] border rounded-lg p-4 hover:border-[#3d3e4d] transition-colors ${
                        flag.isEnabled ? 'border-emerald-500/20' : 'border-[#2d2e3d]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              onClick={() => handleToggle(flag)}
                              className="flex-shrink-0"
                              title={flag.isEnabled ? 'Disable flag' : 'Enable flag'}
                            >
                              {flag.isEnabled ? (
                                <ToggleRight className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-[#6b7280]" />
                              )}
                            </button>
                            <h3 className="text-sm font-medium text-white truncate">{flag.name}</h3>
                            <span className="text-[10px] font-mono text-[#6b7280] bg-[#252636] px-1.5 py-0.5 rounded">{flag.key}</span>
                          </div>
                          {flag.description && (
                            <p className="text-xs text-[#9ca3af] mb-2 line-clamp-1">{flag.description}</p>
                          )}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                              flag.flagType === 'boolean' ? 'bg-cyan-500/10 text-cyan-400' :
                              flag.flagType === 'percentage' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-purple-500/10 text-purple-400'
                            }`}>
                              {getTypeIcon(flag.flagType)}
                              {flag.flagType}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#252636] text-[#9ca3af]">
                              {getScopeIcon(flag.targetScope)}
                              {flag.targetScope}
                            </span>
                            {flag.flagType === 'percentage' && (
                              <span className="text-[10px] text-amber-400">{flag.percentage}% rollout</span>
                            )}
                            <span className="text-[10px] text-[#6b7280]">Updated {formatTime(flag.updatedAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEdit(flag)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-white hover:bg-[#252636] transition-colors"
                            title="Edit flag"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {deleteConfirmId === flag.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(flag.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Confirm delete"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#252636] transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(flag.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete flag"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== RULES TAB ========== */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <select
                  value={selectedFlagId || ''}
                  onChange={e => setSelectedFlagId(e.target.value || null)}
                  className="flex-1 px-3 py-2 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="">Select a flag to view rules...</option>
                  {flags.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.key})</option>
                  ))}
                </select>
              </div>

              {selectedFlag ? (
                <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-white">{selectedFlag.name}</h3>
                      <p className="text-[10px] text-[#6b7280] font-mono">{selectedFlag.key}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedFlag.isEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#252636] text-[#6b7280]'}`}>
                        {selectedFlag.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {selectedFlagRules.length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="w-8 h-8 mx-auto mb-2 text-[#4b5563]" />
                      <p className="text-xs text-[#6b7280]">No rules configured for this flag</p>
                      <p className="text-[10px] text-[#4b5563] mt-1">Edit the flag to add conditional rules</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedFlagRules.map((rule: FlagRule, i: number) => (
                        <div key={rule.id || i} className="bg-[#0f1117] border border-[#2d2e3d] rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-medium text-emerald-400 uppercase">Rule {i + 1}</span>
                            <span className="text-[10px] text-[#6b7280]">
                              {rule.condition === 'agent' ? 'Agent Match' : rule.condition === 'role' ? 'Role Match' : 'Environment Match'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                            <span className="bg-[#252636] px-2 py-1 rounded font-mono">{rule.condition}</span>
                            <span className="text-[#6b7280]">.</span>
                            <span className="bg-[#252636] px-2 py-1 rounded font-mono">{rule.field || 'name'}</span>
                            <span className="text-amber-400">{rule.operator}</span>
                            <span className="bg-[#252636] px-2 py-1 rounded font-mono">{rule.value}</span>
                            <span className="text-[#6b7280]">→</span>
                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-mono">{rule.flagValue}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Default Value */}
                  <div className="mt-4 pt-4 border-t border-[#2d2e3d]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#9ca3af]">Default Value (no rules match)</span>
                      <span className="text-xs font-mono text-white bg-[#252636] px-2 py-1 rounded">{selectedFlag.value}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg">
                  <Shield className="w-10 h-10 mx-auto mb-3 text-[#4b5563]" />
                  <p className="text-sm text-[#6b7280]">Select a flag to view its rules</p>
                  {flagsWithRules.length > 0 && (
                    <p className="text-xs text-[#4b5563] mt-1">{flagsWithRules.length} flag(s) have rules configured</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========== HISTORY TAB ========== */}
          {activeTab === 'history' && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-12 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg">
                  <History className="w-10 h-10 mx-auto mb-3 text-[#4b5563]" />
                  <p className="text-sm text-[#6b7280]">No history yet</p>
                  <p className="text-xs text-[#4b5563] mt-1">Changes to flags will appear here</p>
                </div>
              ) : (
                history.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium capitalize ${getActionColor(entry.action)}`}>
                            {entry.action.replace('_', ' ')}
                          </span>
                          {(entry as FeatureFlagHistoryData & { flagKey?: string }).flagKey && (
                            <span className="text-[10px] font-mono text-[#6b7280] bg-[#252636] px-1.5 py-0.5 rounded">
                              {(entry as FeatureFlagHistoryData & { flagKey?: string }).flagKey}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#6b7280]">
                          <span>by {entry.changedBy}</span>
                          <span>•</span>
                          <span>{formatTime(entry.createdAt)}</span>
                        </div>
                        {entry.oldValue && entry.newValue && (
                          <div className="mt-2 flex items-center gap-2 text-[10px]">
                            <span className="text-red-400/70 line-through font-mono truncate max-w-[120px]">{entry.oldValue.slice(0, 50)}</span>
                            <span className="text-[#6b7280]">→</span>
                            <span className="text-emerald-400/80 font-mono truncate max-w-[120px]">{entry.newValue.slice(0, 50)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Create/Edit Dialog */}
      <AnimatePresence>
        {showCreateDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowCreateDialog(false); resetForm() }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[5%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    {editingFlag ? 'Edit Feature Flag' : 'Create Feature Flag'}
                  </h3>
                  <button
                    onClick={() => { setShowCreateDialog(false); resetForm() }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-white hover:bg-[#252636] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Key */}
                  <div>
                    <label className="block text-xs text-[#9ca3af] mb-1.5">Flag Key *</label>
                    <input
                      type="text"
                      value={formKey}
                      onChange={e => setFormKey(e.target.value)}
                      placeholder="e.g. ENABLE_NEW_DASHBOARD"
                      disabled={!!editingFlag}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs text-[#9ca3af] mb-1.5">Name *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="e.g. New Dashboard Feature"
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs text-[#9ca3af] mb-1.5">Description</label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={e => setFormDescription(e.target.value)}
                      placeholder="What does this flag control?"
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  {/* Type & Value Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#9ca3af] mb-1.5">Flag Type</label>
                      <select
                        value={formType}
                        onChange={e => setFormType(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="boolean">Boolean</option>
                        <option value="percentage">Percentage</option>
                        <option value="variant">Variant</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#9ca3af] mb-1.5">Default Value</label>
                      {formType === 'boolean' ? (
                        <select
                          value={formValue}
                          onChange={e => setFormValue(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formValue}
                          onChange={e => setFormValue(e.target.value)}
                          placeholder="Value"
                          className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                        />
                      )}
                    </div>
                  </div>

                  {/* Target Scope */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#9ca3af] mb-1.5">Target Scope</label>
                      <select
                        value={formTargetScope}
                        onChange={e => setFormTargetScope(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="all">All</option>
                        <option value="agents">Specific Agents</option>
                        <option value="roles">Specific Roles</option>
                        <option value="users">Specific Users</option>
                      </select>
                    </div>
                    {formType === 'percentage' && (
                      <div>
                        <label className="block text-xs text-[#9ca3af] mb-1.5">Rollout %</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={formPercentage}
                          onChange={e => setFormPercentage(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    )}
                  </div>

                  {/* Rules Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-[#9ca3af]">Conditional Rules</label>
                      <button
                        onClick={addRule}
                        className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add Rule
                      </button>
                    </div>
                    {formRules.length === 0 ? (
                      <div className="text-center py-4 bg-[#0f1117] border border-[#2d2e3d] border-dashed rounded-lg">
                        <p className="text-[10px] text-[#6b7280]">No rules. Flag will use default value.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {formRules.map((rule, i) => (
                          <div key={rule.id || i} className="bg-[#0f1117] border border-[#2d2e3d] rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-medium text-emerald-400">Rule {i + 1}</span>
                              <button
                                onClick={() => removeRule(i)}
                                className="text-[#6b7280] hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={rule.condition}
                                onChange={e => updateRule(i, 'condition', e.target.value)}
                                className="px-2 py-1.5 bg-[#1e1f2b] border border-[#2d2e3d] rounded text-xs text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                              >
                                <option value="agent">Agent</option>
                                <option value="role">Role</option>
                                <option value="environment">Environment</option>
                              </select>
                              <select
                                value={rule.operator}
                                onChange={e => updateRule(i, 'operator', e.target.value)}
                                className="px-2 py-1.5 bg-[#1e1f2b] border border-[#2d2e3d] rounded text-xs text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                              >
                                <option value="equals">equals</option>
                                <option value="not_equals">not equals</option>
                                <option value="contains">contains</option>
                                <option value="starts_with">starts with</option>
                              </select>
                              <input
                                type="text"
                                value={rule.value}
                                onChange={e => updateRule(i, 'value', e.target.value)}
                                placeholder="Value to match"
                                className="px-2 py-1.5 bg-[#1e1f2b] border border-[#2d2e3d] rounded text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                              />
                              <input
                                type="text"
                                value={rule.flagValue}
                                onChange={e => updateRule(i, 'flagValue', e.target.value)}
                                placeholder="Flag value"
                                className="px-2 py-1.5 bg-[#1e1f2b] border border-[#2d2e3d] rounded text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-[#2d2e3d]">
                  <button
                    onClick={() => { setShowCreateDialog(false); resetForm() }}
                    className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white bg-[#252636] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                  >
                    {editingFlag ? 'Update Flag' : 'Create Flag'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
