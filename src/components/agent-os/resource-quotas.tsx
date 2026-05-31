'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAgentOSStore } from '@/lib/store'
import {
  Gauge,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  BarChart3,
  Shield,
  ShieldAlert,
  RefreshCw,
  TrendingUp,
  Clock,
  Target,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

// ─── Types ────────────────────────────────────────────────────────────

interface UsageRecord {
  id: string
  quotaId: string
  amount: number
  source: string | null
  description: string | null
  metadata: string
  createdAt: string
}

interface ResourceQuota {
  id: string
  name: string
  targetType: string
  targetId: string | null
  resourceType: string
  limitValue: number
  currentUsage: number
  period: string
  unit: string
  alertThreshold: number
  isAlertFired: boolean
  isHardLimit: boolean
  resetAt: string | null
  lastUpdatedAt: string
  createdAt: string
  updatedAt: string
  usageRecords?: UsageRecord[]
}

interface AlertQuota extends ResourceQuota {
  usagePercent: number
  timeSinceAlertMs: number | null
  isOverLimit: boolean
}

type TabId = 'quotas' | 'usage' | 'alerts'

const TARGET_TYPES = ['agent', 'user', 'team', 'global'] as const
const RESOURCE_TYPES = ['tokens', 'cost', 'requests', 'memory', 'cpu', 'storage'] as const
const PERIODS = ['hourly', 'daily', 'weekly', 'monthly', 'total'] as const

const RESOURCE_ICONS: Record<string, string> = {
  tokens: '🪙',
  cost: '£',
  requests: '📡',
  memory: '💾',
  cpu: '⚡',
  storage: '🗄️',
}

const TARGET_ICONS: Record<string, string> = {
  agent: '🤖',
  user: '👤',
  team: '👥',
  global: '🌍',
}

const PERIOD_LABELS: Record<string, string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  total: 'Total',
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatUsageValue(value: number, resourceType: string): string {
  if (resourceType === 'cost') return `£${value.toFixed(2)}`
  if (resourceType === 'tokens') return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(0)
  if (resourceType === 'memory' || resourceType === 'storage') return value >= 1024 ? `${(value / 1024).toFixed(1)} GB` : `${value.toFixed(0)} MB`
  if (resourceType === 'cpu') return `${value.toFixed(1)} cores`
  if (resourceType === 'requests') return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(0)
  return value.toFixed(2)
}

function getUsagePercent(current: number, limit: number): number {
  if (limit <= 0) return 0
  return Math.min((current / limit) * 100, 100)
}

function getBarColor(percent: number): string {
  if (percent < 60) return '#10b981' // emerald
  if (percent < 80) return '#f59e0b' // amber
  return '#ef4444' // red
}

function getBarGlow(percent: number): string {
  if (percent < 60) return '0 0 8px rgba(16,185,129,0.4)'
  if (percent < 80) return '0 0 8px rgba(245,158,11,0.4)'
  return '0 0 12px rgba(239,68,68,0.5)'
}

function timeAgo(ms: number | null): string {
  if (!ms) return 'Unknown'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ─── Component ────────────────────────────────────────────────────────

export function ResourceQuotas() {
  const { addToast } = useAgentOSStore()

  // State
  const [activeTab, setActiveTab] = useState<TabId>('quotas')
  const [quotas, setQuotas] = useState<ResourceQuota[]>([])
  const [alerts, setAlerts] = useState<AlertQuota[]>([])
  const [selectedQuota, setSelectedQuota] = useState<ResourceQuota | null>(null)
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUsageLoading, setIsUsageLoading] = useState(false)

  // Create/Edit modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuota, setEditingQuota] = useState<ResourceQuota | null>(null)
  const [formName, setFormName] = useState('')
  const [formTargetType, setFormTargetType] = useState<string>('agent')
  const [formTargetId, setFormTargetId] = useState('')
  const [formResourceType, setFormResourceType] = useState<string>('tokens')
  const [formLimitValue, setFormLimitValue] = useState('')
  const [formPeriod, setFormPeriod] = useState<string>('monthly')
  const [formAlertThreshold, setFormAlertThreshold] = useState('0.8')
  const [formIsHardLimit, setFormIsHardLimit] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // ─── Fetch Data ────────────────────────────────────────────────────

  const fetchQuotas = useCallback(async () => {
    try {
      const res = await fetch('/api/quotas')
      if (res.ok) {
        const data = await res.json()
        setQuotas(data.quotas || [])
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/quotas/alerts')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
      }
    } catch {
      // silent
    }
  }, [])

  const fetchUsage = useCallback(async (quotaId: string) => {
    setIsUsageLoading(true)
    try {
      const res = await fetch(`/api/quotas/${quotaId}/usage?limit=50`)
      if (res.ok) {
        const data = await res.json()
        setUsageRecords(data.records || [])
        setSelectedQuota(data.quota || null)
      }
    } catch {
      // silent
    } finally {
      setIsUsageLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuotas()
    fetchAlerts()
    const interval = setInterval(() => {
      fetchQuotas()
      fetchAlerts()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchQuotas, fetchAlerts])

  // ─── Handlers ──────────────────────────────────────────────────────

  const openCreateModal = () => {
    setEditingQuota(null)
    setFormName('')
    setFormTargetType('agent')
    setFormTargetId('')
    setFormResourceType('tokens')
    setFormLimitValue('')
    setFormPeriod('monthly')
    setFormAlertThreshold('0.8')
    setFormIsHardLimit(true)
    setModalOpen(true)
  }

  const openEditModal = (quota: ResourceQuota) => {
    setEditingQuota(quota)
    setFormName(quota.name)
    setFormTargetType(quota.targetType)
    setFormTargetId(quota.targetId || '')
    setFormResourceType(quota.resourceType)
    setFormLimitValue(quota.limitValue.toString())
    setFormPeriod(quota.period)
    setFormAlertThreshold(quota.alertThreshold.toString())
    setFormIsHardLimit(quota.isHardLimit)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formLimitValue) return
    setIsSaving(true)
    try {
      const payload = {
        name: formName.trim(),
        targetType: formTargetType,
        targetId: formTargetId || null,
        resourceType: formResourceType,
        limitValue: formLimitValue,
        period: formPeriod,
        alertThreshold: formAlertThreshold,
        isHardLimit: formIsHardLimit,
        unit: formResourceType === 'cost' ? '£' : formResourceType === 'tokens' ? 'tokens' : formResourceType === 'requests' ? 'requests' : formResourceType === 'memory' ? 'MB' : formResourceType === 'cpu' ? 'cores' : 'GB',
      }

      if (editingQuota) {
        const res = await fetch(`/api/quotas/${editingQuota.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          addToast('Quota updated successfully', 'success')
        }
      } else {
        const res = await fetch('/api/quotas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          addToast('Quota created successfully', 'success')
        }
      }

      setModalOpen(false)
      fetchQuotas()
      fetchAlerts()
    } catch {
      addToast('Failed to save quota', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/quotas/${id}`, { method: 'DELETE' })
      addToast('Quota deleted', 'success')
      fetchQuotas()
      fetchAlerts()
      if (selectedQuota?.id === id) {
        setSelectedQuota(null)
        setUsageRecords([])
      }
    } catch {
      addToast('Failed to delete quota', 'error')
    }
  }

  const handleResetUsage = async (id: string) => {
    try {
      await fetch(`/api/quotas/${id}/reset`, { method: 'POST' })
      addToast('Usage reset successfully', 'success')
      fetchQuotas()
      fetchAlerts()
      if (selectedQuota?.id === id) {
        fetchUsage(id)
      }
    } catch {
      addToast('Failed to reset usage', 'error')
    }
  }

  const handleIncreaseLimit = async (quota: ResourceQuota) => {
    try {
      const newLimit = quota.limitValue * 1.5
      await fetch(`/api/quotas/${quota.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limitValue: newLimit }),
      })
      addToast(`Limit increased to ${formatUsageValue(newLimit, quota.resourceType)}`, 'success')
      fetchQuotas()
      fetchAlerts()
    } catch {
      addToast('Failed to increase limit', 'error')
    }
  }

  // ─── Computed Stats ────────────────────────────────────────────────

  const totalQuotas = quotas.length
  const activeAlerts = alerts.length
  const hardLimitCount = quotas.filter(q => q.isHardLimit).length
  const avgUsage = quotas.length > 0
    ? Math.round(quotas.reduce((sum, q) => sum + getUsagePercent(q.currentUsage, q.limitValue), 0) / quotas.length)
    : 0

  // ─── Tab Definitions ───────────────────────────────────────────────

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'quotas', label: 'Quotas', icon: <Gauge className="w-4 h-4" />, count: totalQuotas },
    { id: 'usage', label: 'Usage', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'alerts', label: 'Alerts', icon: <AlertTriangle className="w-4 h-4" />, count: activeAlerts },
  ]

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2"
          >
            <Gauge className="w-6 h-6 text-emerald-400" />
            Resource Quotas
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Manage resource limits, track usage, and configure alerts
          </p>
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
          onClick={openCreateModal}
        >
          <Plus className="w-4 h-4" />
          Create Quota
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Quotas', value: totalQuotas.toString(), icon: Gauge, color: '#10b981' },
          { label: 'Active Alerts', value: activeAlerts.toString(), icon: AlertTriangle, color: '#ef4444' },
          { label: 'Hard Limits', value: hardLimitCount.toString(), icon: Shield, color: '#f59e0b' },
          { label: 'Avg Usage', value: `${avgUsage}%`, icon: Activity, color: '#06b6d4' },
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
                <p className="text-base sm:text-xl font-bold text-white">{stat.value}</p>
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

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1e1f2b] border border-[#2d2e3d] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#252636] border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-[#252636] text-[#6b7280]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'quotas' && renderQuotasTab()}
          {activeTab === 'usage' && renderUsageTab()}
          {activeTab === 'alerts' && renderAlertsTab()}
        </motion.div>
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingQuota ? (
                <>
                  <Edit2 className="w-4 h-4 text-emerald-400" />
                  Edit Quota
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Create Quota
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-[#9ca3af] text-xs">Quota Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                placeholder="e.g., Monthly API Token Limit"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#9ca3af] text-xs">Target Type</Label>
                <select
                  value={formTargetType}
                  onChange={(e) => setFormTargetType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
                >
                  {TARGET_TYPES.map(t => (
                    <option key={t} value={t}>{TARGET_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Resource Type</Label>
                <select
                  value={formResourceType}
                  onChange={(e) => setFormResourceType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
                >
                  {RESOURCE_TYPES.map(r => (
                    <option key={r} value={r}>{RESOURCE_ICONS[r]} {r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            {formTargetType !== 'global' && (
              <div>
                <Label className="text-[#9ca3af] text-xs">Target ID</Label>
                <Input
                  value={formTargetId}
                  onChange={(e) => setFormTargetId(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                  placeholder={`Enter ${formTargetType} ID...`}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#9ca3af] text-xs">Limit Value</Label>
                <Input
                  value={formLimitValue}
                  onChange={(e) => setFormLimitValue(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                  type="number"
                  step="any"
                  placeholder="1000"
                />
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Period</Label>
                <select
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
                >
                  {PERIODS.map(p => (
                    <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-[#9ca3af] text-xs">Alert Threshold (0-1)</Label>
              <Input
                value={formAlertThreshold}
                onChange={(e) => setFormAlertThreshold(e.target.value)}
                className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                type="number"
                step="0.05"
                min="0"
                max="1"
                placeholder="0.8"
              />
              <p className="text-[10px] text-[#6b7280] mt-1">Alert triggers when usage reaches this fraction of the limit</p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#252636] border border-[#2d2e3d]">
              <div>
                <p className="text-sm text-white font-medium flex items-center gap-2">
                  {formIsHardLimit ? <Shield className="w-4 h-4 text-red-400" /> : <ShieldAlert className="w-4 h-4 text-amber-400" />}
                  {formIsHardLimit ? 'Hard Limit' : 'Soft Limit'}
                </p>
                <p className="text-[10px] text-[#6b7280] mt-0.5">
                  {formIsHardLimit ? 'Blocks operations when limit is exceeded' : 'Warns but allows operations to continue'}
                </p>
              </div>
              <Switch
                checked={formIsHardLimit}
                onCheckedChange={setFormIsHardLimit}
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={!formName.trim() || !formLimitValue || isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSaving ? 'Saving...' : editingQuota ? 'Update Quota' : 'Create Quota'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )

  // ─── Quotas Tab ────────────────────────────────────────────────────

  function renderQuotasTab() {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-[#1e1f2b] rounded-xl border border-[#2d2e3d] animate-pulse" />
          ))}
        </div>
      )
    }

    if (quotas.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-8 sm:p-12 text-center"
        >
          <Gauge className="w-12 h-12 text-[#2d2e3d] mx-auto mb-3" />
          <h3 className="text-sm font-medium text-white mb-1">No Quotas Configured</h3>
          <p className="text-xs text-[#6b7280] mb-4">Create resource quotas to manage and monitor usage limits</p>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            onClick={openCreateModal}
          >
            <Plus className="w-4 h-4" />
            Create First Quota
          </Button>
        </motion.div>
      )
    }

    return (
      <div className="space-y-3">
        {quotas.map((quota, index) => {
          const percent = getUsagePercent(quota.currentUsage, quota.limitValue)
          const barColor = getBarColor(percent)
          const barGlow = getBarGlow(percent)
          const isOverLimit = quota.currentUsage >= quota.limitValue

          return (
            <motion.div
              key={quota.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl border p-4 sm:p-5 transition-colors ${
                isOverLimit
                  ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/30'
                  : quota.isAlertFired
                    ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30'
                    : 'bg-[#1e1f2b] border-[#2d2e3d] hover:border-[#3d3e4d]'
              }`}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{RESOURCE_ICONS[quota.resourceType] || '📊'}</span>
                    <h4 className="text-sm font-semibold text-white truncate">{quota.name}</h4>
                    {quota.isHardLimit ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-400 border border-red-500/20 flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" /> HARD
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                        <ShieldAlert className="w-2.5 h-2.5" /> SOFT
                      </span>
                    )}
                    {quota.isAlertFired && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 flex items-center gap-0.5 animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5" /> ALERT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#252636] text-[#9ca3af] border border-[#2d2e3d] flex items-center gap-1">
                      {TARGET_ICONS[quota.targetType]} {quota.targetType}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#252636] text-[#9ca3af] border border-[#2d2e3d]">
                      {quota.resourceType}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#252636] text-[#9ca3af] border border-[#2d2e3d]">
                      {PERIOD_LABELS[quota.period] || quota.period}
                    </span>
                    {quota.targetId && (
                      <span className="text-[10px] text-[#6b7280] font-mono">
                        ID: {quota.targetId.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => { fetchUsage(quota.id); setActiveTab('usage') }}
                    className="w-7 h-7 rounded-md hover:bg-[#252636] flex items-center justify-center text-[#6b7280] hover:text-emerald-400 transition-colors"
                    title="View usage"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(quota)}
                    className="w-7 h-7 rounded-md hover:bg-[#252636] flex items-center justify-center text-[#6b7280] hover:text-emerald-400 transition-colors"
                    title="Edit quota"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(quota.id)}
                    className="w-7 h-7 rounded-md hover:bg-red-500/10 flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors"
                    title="Delete quota"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#9ca3af]">
                    {formatUsageValue(quota.currentUsage, quota.resourceType)} / {formatUsageValue(quota.limitValue, quota.resourceType)}
                  </span>
                  <span className="text-xs font-medium" style={{ color: barColor }}>
                    {percent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-[#252636] overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full relative"
                    style={{
                      backgroundColor: barColor,
                      boxShadow: barGlow,
                    }}
                  >
                    {/* Animated shimmer */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: ['0%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                  </motion.div>
                  {/* Alert threshold marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white/30"
                    style={{ left: `${quota.alertThreshold * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-[#6b7280]">0%</span>
                  <span className="text-[9px] text-[#6b7280]">
                    Alert at {(quota.alertThreshold * 100).toFixed(0)}%
                  </span>
                  <span className="text-[9px] text-[#6b7280]">100%</span>
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Updated {timeAgo(Date.now() - new Date(quota.lastUpdatedAt).getTime())}
                </span>
                {isOverLimit && (
                  <span className="text-[10px] text-red-400 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Limit exceeded
                  </span>
                )}
                {!isOverLimit && percent >= 80 && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Nearing limit
                  </span>
                )}
                {!isOverLimit && percent < 80 && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Within limits
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  // ─── Usage Tab ─────────────────────────────────────────────────────

  function renderUsageTab() {
    return (
      <div className="space-y-4">
        {/* Quota Selector */}
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4">
          <Label className="text-[#9ca3af] text-xs mb-2 block">Select Quota to View Usage</Label>
          {quotas.length === 0 ? (
            <p className="text-xs text-[#6b7280] text-center py-3">No quotas available</p>
          ) : (
            <select
              value={selectedQuota?.id || ''}
              onChange={(e) => {
                if (e.target.value) fetchUsage(e.target.value)
              }}
              className="w-full px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
            >
              <option value="">Choose a quota...</option>
              {quotas.map(q => (
                <option key={q.id} value={q.id}>
                  {RESOURCE_ICONS[q.resourceType]} {q.name} ({formatUsageValue(q.currentUsage, q.resourceType)} / {formatUsageValue(q.limitValue, q.resourceType)})
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedQuota && (
          <>
            {/* Usage Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Usage Trend — {selectedQuota.name}
                </h3>
                <button
                  onClick={() => handleResetUsage(selectedQuota.id)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-[#252636] text-[#9ca3af] hover:text-white border border-[#2d2e3d] hover:border-[#3d3e4d] flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Usage
                </button>
              </div>

              {/* Simple CSS Bar Chart */}
              <div className="mb-4">
                <div className="flex items-end gap-1 h-32 sm:h-40">
                  {(() => {
                    // Group usage records by day (last 14 days)
                    const now = new Date()
                    const days: { date: string; total: number; label: string }[] = []
                    for (let i = 13; i >= 0; i--) {
                      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
                      const dateStr = d.toISOString().split('T')[0]
                      const dayRecords = usageRecords.filter(r => {
                        const rd = new Date(r.createdAt).toISOString().split('T')[0]
                        return rd === dateStr
                      })
                      const total = dayRecords.reduce((sum, r) => sum + r.amount, 0)
                      days.push({
                        date: dateStr,
                        total,
                        label: d.toLocaleDateString('en', { weekday: 'short' }),
                      })
                    }
                    const maxDayTotal = Math.max(...days.map(d => d.total), 1)

                    return days.map((day, i) => {
                      const height = day.total > 0 ? Math.max((day.total / maxDayTotal) * 100, 3) : 2
                      const percent = selectedQuota.limitValue > 0
                        ? (day.total / selectedQuota.limitValue) * 100
                        : 0
                      const color = getBarColor(percent)

                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ duration: 0.5, delay: i * 0.03 }}
                            className="w-full rounded-t-sm relative group cursor-pointer min-h-[2px]"
                            style={{ backgroundColor: day.total > 0 ? color : '#2d2e3d' }}
                          >
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-[#252636] border border-[#2d2e3d] text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              {formatUsageValue(day.total, selectedQuota.resourceType)}
                            </div>
                          </motion.div>
                          <span className="text-[8px] text-[#6b7280] hidden sm:block">{day.label}</span>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* Progress Overview */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-[#252636] border border-[#2d2e3d]">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#9ca3af]">Current Period Usage</span>
                    <span className="text-xs font-medium" style={{ color: getBarColor(getUsagePercent(selectedQuota.currentUsage, selectedQuota.limitValue)) }}>
                      {getUsagePercent(selectedQuota.currentUsage, selectedQuota.limitValue).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1e1f2b] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getUsagePercent(selectedQuota.currentUsage, selectedQuota.limitValue)}%` }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: getBarColor(getUsagePercent(selectedQuota.currentUsage, selectedQuota.limitValue)),
                        boxShadow: getBarGlow(getUsagePercent(selectedQuota.currentUsage, selectedQuota.limitValue)),
                      }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-white">
                    {formatUsageValue(selectedQuota.currentUsage, selectedQuota.resourceType)}
                  </p>
                  <p className="text-[10px] text-[#6b7280]">
                    of {formatUsageValue(selectedQuota.limitValue, selectedQuota.resourceType)}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Usage Records Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5"
            >
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Usage Records
              </h3>
              {isUsageLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-[#252636] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : usageRecords.length === 0 ? (
                <p className="text-xs text-[#6b7280] text-center py-4">No usage records for this quota</p>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#2d2e3d]">
                        <th className="text-left py-2.5 px-2 text-[#6b7280] font-medium">Amount</th>
                        <th className="text-left py-2.5 px-2 text-[#6b7280] font-medium">Source</th>
                        <th className="text-left py-2.5 px-2 text-[#6b7280] font-medium">Description</th>
                        <th className="text-right py-2.5 px-2 text-[#6b7280] font-medium">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageRecords.slice(0, 25).map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-[#2d2e3d]/50 hover:bg-[#252636]/50 transition-colors"
                        >
                          <td className="py-2.5 px-2 text-emerald-400 font-medium">
                            +{formatUsageValue(record.amount, selectedQuota.resourceType)}
                          </td>
                          <td className="py-2.5 px-2 text-[#9ca3af]">
                            {record.source || '—'}
                          </td>
                          <td className="py-2.5 px-2 text-[#9ca3af] max-w-[200px] truncate">
                            {record.description || '—'}
                          </td>
                          <td className="py-2.5 px-2 text-right text-[#6b7280]">
                            {new Date(record.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}

        {!selectedQuota && quotas.length > 0 && (
          <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-8 text-center">
            <BarChart3 className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
            <p className="text-xs text-[#6b7280]">Select a quota above to view usage details</p>
          </div>
        )}
      </div>
    )
  }

  // ─── Alerts Tab ────────────────────────────────────────────────────

  function renderAlertsTab() {
    if (alerts.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-8 sm:p-12 text-center"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-white mb-1">All Clear</h3>
          <p className="text-xs text-[#6b7280]">No quotas are currently exceeding their alert thresholds</p>
        </motion.div>
      )
    }

    return (
      <div className="space-y-3">
        {/* Alert Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 sm:p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{alerts.length} Active Alert{alerts.length !== 1 ? 's' : ''}</h3>
              <p className="text-[10px] text-[#9ca3af]">Quotas exceeding their alert thresholds</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {alerts.filter(a => a.isOverLimit).length > 0 && (
              <span className="px-2 py-1 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> {alerts.filter(a => a.isOverLimit).length} Over Limit
              </span>
            )}
            {alerts.filter(a => !a.isOverLimit).length > 0 && (
              <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {alerts.filter(a => !a.isOverLimit).length} Warning
              </span>
            )}
          </div>
        </motion.div>

        {/* Alert Cards */}
        {alerts.map((alert, index) => {
          const percent = alert.usagePercent
          const barColor = getBarColor(percent)
          const barGlow = getBarGlow(percent)

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl border p-4 sm:p-5 ${
                alert.isOverLimit
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-amber-500/5 border-amber-500/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{RESOURCE_ICONS[alert.resourceType] || '📊'}</span>
                    <h4 className="text-sm font-semibold text-white truncate">{alert.name}</h4>
                    {alert.isOverLimit ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 flex items-center gap-0.5">
                        <XCircle className="w-2.5 h-2.5" /> OVER LIMIT
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> WARNING
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-[#9ca3af] flex items-center gap-1">
                      <Target className="w-3 h-3" /> {TARGET_ICONS[alert.targetType]} {alert.targetType}
                    </span>
                    <span className="text-[10px] text-[#9ca3af]">•</span>
                    <span className="text-[10px] text-[#9ca3af]">{alert.resourceType}</span>
                    <span className="text-[10px] text-[#9ca3af]">•</span>
                    <span className="text-[10px] text-[#9ca3af]">{PERIOD_LABELS[alert.period]}</span>
                    {alert.timeSinceAlertMs && (
                      <>
                        <span className="text-[10px] text-[#9ca3af]">•</span>
                        <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> Alert {timeAgo(alert.timeSinceAlertMs)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#9ca3af]">
                    {formatUsageValue(alert.currentUsage, alert.resourceType)} / {formatUsageValue(alert.limitValue, alert.resourceType)}
                  </span>
                  <span className="text-xs font-bold" style={{ color: barColor }}>
                    {percent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#252636] overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percent, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full relative"
                    style={{
                      backgroundColor: barColor,
                      boxShadow: barGlow,
                    }}
                  >
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
                        animate={{ x: ['0%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleIncreaseLimit(alert)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center gap-1 transition-colors"
                >
                  <ArrowUpRight className="w-3 h-3" /> Increase Limit (+50%)
                </button>
                <button
                  onClick={() => handleResetUsage(alert.id)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-[#252636] text-[#9ca3af] border border-[#2d2e3d] hover:text-white hover:border-[#3d3e4d] flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Usage
                </button>
                <button
                  onClick={() => { fetchUsage(alert.id); setActiveTab('usage') }}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-[#252636] text-[#9ca3af] border border-[#2d2e3d] hover:text-white hover:border-[#3d3e4d] flex items-center gap-1 transition-colors"
                >
                  <BarChart3 className="w-3 h-3" /> View Details
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }
}
