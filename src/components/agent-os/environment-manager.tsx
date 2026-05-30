'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Variable,
  Key,
  FileJson,
  Layers,
  Eye,
  EyeOff,
  Shield,
  Plus,
  Trash2,
  Edit3,
  Save,
  RefreshCw,
  Search,
  Globe,
  Bot,
  FolderOpen,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  RotateCw,
  Copy,
  AlertTriangle,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Download,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

// ====== TYPES ======
interface EnvVarData {
  id: string
  key: string
  value: string
  type: string
  scope: string
  scopeId: string | null
  description: string | null
  isSecret: boolean
  isRequired: boolean
  isActive: boolean
  profileId: string | null
  createdAt: string
  updatedAt: string
}

interface EnvProfileData {
  id: string
  name: string
  description: string | null
  isActive: boolean
  variables: string
  variableCount?: number
  overrideCount?: number
  createdAt: string
  updatedAt: string
}

type TabId = 'variables' | 'secrets' | 'configs' | 'profiles'

// ====== HELPERS ======
const typeColors: Record<string, string> = {
  string: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  number: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  boolean: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  secret: 'bg-red-500/20 text-red-400 border-red-500/30',
  json: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const scopeIcons: Record<string, React.ReactNode> = {
  global: <Globe className="w-3 h-3" />,
  agent: <Bot className="w-3 h-3" />,
  workspace: <FolderOpen className="w-3 h-3" />,
}

const scopeColors: Record<string, string> = {
  global: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  agent: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  workspace: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

const profileColors = [
  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bg-rose-500/20 text-rose-400 border-rose-500/30',
]

function maskValue(value: string): string {
  if (value.length <= 4) return '••••'
  return '••••' + value.slice(-4)
}

// ====== MAIN COMPONENT ======
export function EnvironmentManager() {
  const { envTab, setEnvTab } = useAgentOSStore()
  const [envVars, setEnvVars] = useState<EnvVarData[]>([])
  const [profiles, setProfiles] = useState<EnvProfileData[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [scopeFilter, setScopeFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Dialog states
  const [showVarDialog, setShowVarDialog] = useState(false)
  const [editingVar, setEditingVar] = useState<EnvVarData | null>(null)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [editingProfile, setEditingProfile] = useState<EnvProfileData | null>(null)

  // Secret reveal states
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set())

  // Config editor state
  const [configJson, setConfigJson] = useState('{}')
  const [configKey, setConfigKey] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [configError, setConfigError] = useState<string | null>(null)

  // Form states
  const [varForm, setVarForm] = useState({
    key: '',
    value: '',
    type: 'string',
    scope: 'global',
    scopeId: '',
    description: '',
    isSecret: false,
    isRequired: false,
    profileId: '',
  })

  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    variables: '{}',
  })

  // Fetch data
  const fetchEnvVars = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (scopeFilter !== 'all') params.set('scope', scopeFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      const res = await fetch(`/api/env-vars?${params}`)
      if (res.ok) {
        const data = await res.json()
        setEnvVars(data.envVars || [])
      }
    } catch (err) {
      console.error('Failed to fetch env vars:', err)
    }
  }, [scopeFilter, typeFilter])

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch('/api/env-profiles')
      if (res.ok) {
        const data = await res.json()
        setProfiles(data.profiles || [])
        setActiveProfileId(data.activeProfileId || null)
      }
    } catch (err) {
      console.error('Failed to fetch profiles:', err)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchEnvVars(), fetchProfiles()])
    setLoading(false)
  }, [fetchEnvVars, fetchProfiles])

  // Initial data load - use ref to prevent double-fetch in strict mode
  const initialLoadRef = useRef(false)
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true
      const loadInitialData = async () => {
        try {
          const [varsRes, profilesRes] = await Promise.all([
            fetch('/api/env-vars'),
            fetch('/api/env-profiles'),
          ])
          if (varsRes.ok) {
            const varsData = await varsRes.json()
            setEnvVars(varsData.envVars || [])
          }
          if (profilesRes.ok) {
            const profilesData = await profilesRes.json()
            setProfiles(profilesData.profiles || [])
            setActiveProfileId(profilesData.activeProfileId || null)
          }
        } catch (err) {
          console.error('Failed to load initial data:', err)
        } finally {
          setLoading(false)
        }
      }
      loadInitialData()
    }
  }, [])

  // Build config JSON from env vars of type json (useMemo instead of useEffect)
  const computedConfigJson = useMemo(() => {
    const jsonVars = envVars.filter((v) => v.type === 'json' && v.isActive)
    const config: Record<string, unknown> = {}
    for (const v of jsonVars) {
      try {
        config[v.key] = JSON.parse(v.value)
      } catch {
        config[v.key] = v.value
      }
    }
    return JSON.stringify(config, null, 2)
  }, [envVars])

  // Toggle secret reveal
  const toggleReveal = async (envVar: EnvVarData) => {
    if (revealedSecrets.has(envVar.id)) {
      setRevealedSecrets((prev) => {
        const next = new Set(prev)
        next.delete(envVar.id)
        return next
      })
    } else {
      try {
        const res = await fetch(`/api/env-vars/${envVar.id}?reveal=true`)
        if (res.ok) {
          const data = await res.json()
          setEnvVars((prev) =>
            prev.map((v) => (v.id === envVar.id ? { ...v, value: data.envVar.value } : v))
          )
          setRevealedSecrets((prev) => new Set(prev).add(envVar.id))
        }
      } catch (err) {
        console.error('Failed to reveal secret:', err)
      }
    }
  }

  // CRUD operations
  const handleCreateVar = async () => {
    try {
      const res = await fetch('/api/env-vars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...varForm,
          isSecret: varForm.isSecret || varForm.type === 'secret',
          scopeId: varForm.scopeId || null,
          profileId: varForm.profileId || null,
        }),
      })
      if (res.ok) {
        setShowVarDialog(false)
        resetVarForm()
        fetchEnvVars()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create variable')
      }
    } catch (err) {
      console.error('Failed to create var:', err)
    }
  }

  const handleUpdateVar = async () => {
    if (!editingVar) return
    try {
      const res = await fetch(`/api/env-vars/${editingVar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...varForm,
          isSecret: varForm.isSecret || varForm.type === 'secret',
          scopeId: varForm.scopeId || null,
          profileId: varForm.profileId || null,
        }),
      })
      if (res.ok) {
        setShowVarDialog(false)
        setEditingVar(null)
        resetVarForm()
        fetchEnvVars()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update variable')
      }
    } catch (err) {
      console.error('Failed to update var:', err)
    }
  }

  const handleDeleteVar = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variable?')) return
    try {
      const res = await fetch(`/api/env-vars/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchEnvVars()
      }
    } catch (err) {
      console.error('Failed to delete var:', err)
    }
  }

  const handleToggleActive = async (envVar: EnvVarData) => {
    try {
      await fetch(`/api/env-vars/${envVar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !envVar.isActive }),
      })
      fetchEnvVars()
    } catch (err) {
      console.error('Failed to toggle var:', err)
    }
  }

  const handleCreateProfile = async () => {
    try {
      const res = await fetch('/api/env-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })
      if (res.ok) {
        setShowProfileDialog(false)
        resetProfileForm()
        fetchProfiles()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create profile')
      }
    } catch (err) {
      console.error('Failed to create profile:', err)
    }
  }

  const handleUpdateProfile = async () => {
    if (!editingProfile) return
    try {
      const res = await fetch(`/api/env-profiles/${editingProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })
      if (res.ok) {
        setShowProfileDialog(false)
        setEditingProfile(null)
        resetProfileForm()
        fetchProfiles()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
    }
  }

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile? Associated variables will be unlinked.')) return
    try {
      const res = await fetch(`/api/env-profiles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchProfiles()
        fetchEnvVars()
      }
    } catch (err) {
      console.error('Failed to delete profile:', err)
    }
  }

  const handleActivateProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/env-profiles/${id}/activate`, { method: 'POST' })
      if (res.ok) {
        fetchProfiles()
      }
    } catch (err) {
      console.error('Failed to activate profile:', err)
    }
  }

  const resetVarForm = () => {
    setVarForm({
      key: '',
      value: '',
      type: 'string',
      scope: 'global',
      scopeId: '',
      description: '',
      isSecret: false,
      isRequired: false,
      profileId: '',
    })
  }

  const resetProfileForm = () => {
    setProfileForm({ name: '', description: '', variables: '{}' })
  }

  const openEditVar = (envVar: EnvVarData) => {
    setEditingVar(envVar)
    setVarForm({
      key: envVar.key,
      value: '',
      type: envVar.type,
      scope: envVar.scope,
      scopeId: envVar.scopeId || '',
      description: envVar.description || '',
      isSecret: envVar.isSecret,
      isRequired: envVar.isRequired,
      profileId: envVar.profileId || '',
    })
    setShowVarDialog(true)
  }

  const openEditProfile = (profile: EnvProfileData) => {
    setEditingProfile(profile)
    setProfileForm({
      name: profile.name,
      description: profile.description || '',
      variables: profile.variables,
    })
    setShowProfileDialog(true)
  }

  // Filter vars
  const filteredVars = envVars.filter((v) => {
    const matchesSearch =
      !searchQuery ||
      v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesScope = scopeFilter === 'all' || v.scope === scopeFilter
    const matchesType = typeFilter === 'all' || v.type === typeFilter
    return matchesSearch && matchesScope && matchesType
  })

  const secretVars = filteredVars.filter((v) => v.isSecret || v.type === 'secret')
  const regularVars = filteredVars.filter((v) => !v.isSecret && v.type !== 'secret')
  const jsonVars = filteredVars.filter((v) => v.type === 'json')

  // Config tree parsing
  const parseConfigTree = (jsonStr: string) => {
    try {
      const obj = JSON.parse(jsonStr)
      return obj
    } catch {
      return null
    }
  }

  const toggleExpandedKey = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const renderConfigTree = (obj: Record<string, unknown>, prefix = '', depth = 0) => {
    return Object.entries(obj).map(([key, value]) => {
      const fullPath = prefix ? `${prefix}.${key}` : key
      const isObject = value !== null && typeof value === 'object' && !Array.isArray(value)
      const isArray = Array.isArray(value)
      const isExpanded = expandedKeys.has(fullPath)

      return (
        <div key={fullPath} style={{ paddingLeft: `${depth * 20}px` }}>
          <div
            className="flex items-center gap-2 py-1.5 px-2 hover:bg-[#252636] rounded-md cursor-pointer group"
            onClick={() => isObject && toggleExpandedKey(fullPath)}
          >
            {isObject ? (
              isExpanded ? (
                <ChevronDown className="w-3 h-3 text-[#6b7280]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#6b7280]" />
              )
            ) : (
              <div className="w-3" />
            )}
            <span className="text-emerald-400 font-mono text-xs">{key}</span>
            <span className="text-[#6b7280] text-xs">:</span>
            {!isObject && (
              <span className={`font-mono text-xs ${isArray ? 'text-amber-400' : typeof value === 'string' ? 'text-emerald-300' : typeof value === 'number' ? 'text-cyan-400' : typeof value === 'boolean' ? 'text-purple-400' : 'text-[#9ca3af]'}`}>
                {isArray ? `[${value.length} items]` : typeof value === 'string' ? `"${value}"` : String(value)}
              </span>
            )}
            {isObject && (
              <span className="text-[#6b7280] text-xs">{`{${Object.keys(value as Record<string, unknown>).length}}`}</span>
            )}
            <button
              className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-[#2d2e3d] rounded transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(JSON.stringify(value, null, 2))
              }}
              title="Copy value"
            >
              <Copy className="w-3 h-3 text-[#6b7280]" />
            </button>
          </div>
          <AnimatePresence>
            {isObject && isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                {renderConfigTree(value as Record<string, unknown>, fullPath, depth + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    })
  }

  const handleSaveConfig = async () => {
    try {
      const parsed = JSON.parse(configJson)
      // Update or create JSON-type env vars from the config
      for (const [key, value] of Object.entries(parsed)) {
        const existing = envVars.find((v) => v.key === key && v.type === 'json')
        if (existing) {
          await fetch(`/api/env-vars/${existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: JSON.stringify(value) }),
          })
        } else {
          await fetch('/api/env-vars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key,
              value: JSON.stringify(value),
              type: 'json',
              scope: 'global',
              description: `Config key: ${key}`,
            }),
          })
        }
      }
      // Delete removed keys
      for (const v of jsonVars) {
        if (!(v.key in parsed)) {
          await fetch(`/api/env-vars/${v.id}`, { method: 'DELETE' })
        }
      }
      setConfigError(null)
      fetchEnvVars()
    } catch {
      setConfigError('Invalid JSON format')
    }
  }

  const handleLoadConfig = () => {
    setConfigJson(computedConfigJson)
    setConfigError(null)
  }

  const handleExportConfig = () => {
    const blob = new Blob([configJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'agentos-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportConfig = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const content = ev.target?.result as string
          JSON.parse(content) // Validate
          setConfigJson(content)
          setConfigError(null)
        } catch {
          setConfigError('Invalid JSON file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'variables', label: 'Variables', icon: Variable, count: regularVars.length },
    { id: 'secrets', label: 'Secrets', icon: Key, count: secretVars.length },
    { id: 'configs', label: 'Configs', icon: FileJson, count: jsonVars.length },
    { id: 'profiles', label: 'Profiles', icon: Layers, count: profiles.length },
  ]

  // Stats
  const stats = {
    total: envVars.length,
    active: envVars.filter((v) => v.isActive).length,
    secrets: envVars.filter((v) => v.isSecret || v.type === 'secret').length,
    profiles: profiles.length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-[#9ca3af] text-sm">Loading environment data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Variable className="w-5 h-5 text-emerald-400" />
            Environment Manager
          </h2>
          <p className="text-xs text-[#6b7280] mt-0.5">Manage variables, secrets, configs, and profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="px-3 py-1.5 rounded-lg bg-[#1a1b2e] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-emerald-500/30 transition-all text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          {(envTab === 'variables' || envTab === 'secrets') && (
            <button
              onClick={() => {
                resetVarForm()
                setEditingVar(null)
                if (envTab === 'secrets') {
                  setVarForm((prev) => ({ ...prev, type: 'secret', isSecret: true }))
                }
                setShowVarDialog(true)
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" />
              Add {envTab === 'secrets' ? 'Secret' : 'Variable'}
            </button>
          )}
          {envTab === 'profiles' && (
            <button
              onClick={() => {
                resetProfileForm()
                setEditingProfile(null)
                setShowProfileDialog(true)
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" />
              Add Profile
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Vars', value: stats.total, icon: Variable, color: 'text-emerald-400' },
          { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Secrets', value: stats.secrets, icon: Shield, color: 'text-red-400' },
          { label: 'Profiles', value: stats.profiles, icon: Layers, color: 'text-amber-400' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setEnvTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              envTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#252636]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                envTab === tab.id ? 'bg-emerald-500/30 text-emerald-300' : 'bg-[#2d2e3d] text-[#6b7280]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      {envTab !== 'configs' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
            <input
              type="text"
              placeholder="Search variables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#6b7280] focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="px-3 py-2 bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg text-[#9ca3af] text-xs focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Scopes</option>
            <option value="global">Global</option>
            <option value="agent">Agent</option>
            <option value="workspace">Workspace</option>
          </select>
          {envTab === 'variables' && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg text-[#9ca3af] text-xs focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">All Types</option>
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="json">JSON</option>
            </select>
          )}
        </div>
      )}

      {/* Active Profile Banner */}
      {activeProfileId && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-emerald-400">
            Active Profile: <span className="font-semibold">{profiles.find((p) => p.id === activeProfileId)?.name || 'Unknown'}</span>
          </span>
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ====== VARIABLES TAB ====== */}
        {envTab === 'variables' && (
          <motion.div
            key="variables"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {regularVars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Variable className="w-10 h-10 text-[#4b5563] mb-3" />
                <p className="text-[#9ca3af] text-sm">No variables found</p>
                <p className="text-[#6b7280] text-xs mt-1">Create your first environment variable to get started</p>
                <button
                  onClick={() => {
                    resetVarForm()
                    setEditingVar(null)
                    setShowVarDialog(true)
                  }}
                  className="mt-3 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/30 transition-all"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Add Variable
                </button>
              </div>
            ) : (
              <div className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#252636] border-b border-[#2d2e3d] text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">
                  <div className="col-span-3">Key</div>
                  <div className="col-span-3">Value</div>
                  <div className="col-span-1">Type</div>
                  <div className="col-span-2">Scope</div>
                  <div className="col-span-1">Active</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                {/* Rows */}
                <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-[#2d2e3d]">
                  {regularVars.map((envVar, i) => (
                    <motion.div
                      key={envVar.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-[#252636] transition-colors ${
                        !envVar.isActive ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="col-span-3 font-mono text-xs text-white truncate" title={envVar.key}>
                        {envVar.isRequired && <span className="text-red-400 mr-1">*</span>}
                        {envVar.key}
                      </div>
                      <div className="col-span-3 font-mono text-xs text-[#9ca3af] truncate" title={envVar.value}>
                        {envVar.value.length > 40 ? envVar.value.slice(0, 40) + '...' : envVar.value}
                      </div>
                      <div className="col-span-1">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${typeColors[envVar.type] || typeColors.string}`}>
                          {envVar.type}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${scopeColors[envVar.scope] || scopeColors.global}`}>
                          {scopeIcons[envVar.scope]}
                          {envVar.scope}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <button onClick={() => handleToggleActive(envVar)} className="transition-colors">
                          {envVar.isActive ? (
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-[#6b7280]" />
                          )}
                        </button>
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditVar(envVar)}
                          className="p-1.5 rounded-md hover:bg-[#2d2e3d] text-[#6b7280] hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteVar(envVar.id)}
                          className="p-1.5 rounded-md hover:bg-red-500/20 text-[#6b7280] hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ====== SECRETS TAB ====== */}
        {envTab === 'secrets' && (
          <motion.div
            key="secrets"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {secretVars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Key className="w-10 h-10 text-[#4b5563] mb-3" />
                <p className="text-[#9ca3af] text-sm">No secrets found</p>
                <p className="text-[#6b7280] text-xs mt-1">Store API keys, tokens, and passwords securely</p>
                <button
                  onClick={() => {
                    resetVarForm()
                    setEditingVar(null)
                    setVarForm((prev) => ({ ...prev, type: 'secret', isSecret: true }))
                    setShowVarDialog(true)
                  }}
                  className="mt-3 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/30 transition-all"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Add Secret
                </button>
              </div>
            ) : (
              <div className="grid gap-2">
                {secretVars.map((secret, i) => (
                  <motion.div
                    key={secret.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg p-4 ${
                      !secret.isActive ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white font-mono">{secret.key}</p>
                          {secret.description && (
                            <p className="text-[10px] text-[#6b7280]">{secret.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${scopeColors[secret.scope]}`}>
                          {scopeIcons[secret.scope]}
                          {secret.scope}
                        </span>
                        <button
                          onClick={() => handleToggleActive(secret)}
                          className="transition-colors"
                        >
                          {secret.isActive ? (
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-[#6b7280]" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#0f1117] border border-[#2d2e3d] rounded-md px-3 py-2 font-mono text-xs text-[#9ca3af] truncate">
                        {revealedSecrets.has(secret.id) ? secret.value : maskValue(secret.value)}
                      </div>
                      <button
                        onClick={() => toggleReveal(secret)}
                        className="p-2 rounded-md bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-emerald-500/30 transition-all"
                        title={revealedSecrets.has(secret.id) ? 'Hide' : 'Reveal'}
                      >
                        {revealedSecrets.has(secret.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (revealedSecrets.has(secret.id)) {
                            navigator.clipboard.writeText(secret.value)
                          }
                        }}
                        className="p-2 rounded-md bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-emerald-500/30 transition-all"
                        title="Copy"
                        disabled={!revealedSecrets.has(secret.id)}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Rotation indicator */}
                    <div className="flex items-center gap-2 mt-2">
                      <RotateCw className="w-3 h-3 text-[#6b7280]" />
                      <span className="text-[10px] text-[#6b7280]">
                        Last updated: {new Date(secret.updatedAt).toLocaleDateString()}
                      </span>
                      {secret.isRequired && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          Required
                        </span>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => openEditVar(secret)}
                          className="p-1.5 rounded-md hover:bg-[#2d2e3d] text-[#6b7280] hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteVar(secret.id)}
                          className="p-1.5 rounded-md hover:bg-red-500/20 text-[#6b7280] hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ====== CONFIGS TAB ====== */}
        {envTab === 'configs' && (
          <motion.div
            key="configs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Tree View */}
              <div className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#252636] border-b border-[#2d2e3d]">
                  <span className="text-xs font-semibold text-[#9ca3af] flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-purple-400" />
                    Config Tree
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleLoadConfig}
                      className="px-2 py-1 rounded text-[10px] text-[#6b7280] hover:text-white hover:bg-[#2d2e3d] transition-colors flex items-center gap-1"
                      title="Reload from variables"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reload
                    </button>
                    <button
                      onClick={handleImportConfig}
                      className="px-2 py-1 rounded text-[10px] text-[#6b7280] hover:text-white hover:bg-[#2d2e3d] transition-colors flex items-center gap-1"
                      title="Import JSON file"
                    >
                      <Upload className="w-3 h-3" />
                      Import
                    </button>
                    <button
                      onClick={handleExportConfig}
                      className="px-2 py-1 rounded text-[10px] text-[#6b7280] hover:text-white hover:bg-[#2d2e3d] transition-colors flex items-center gap-1"
                      title="Export as JSON file"
                    >
                      <Download className="w-3 h-3" />
                      Export
                    </button>
                  </div>
                </div>
                <div className="p-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {(() => {
                    const tree = parseConfigTree(computedConfigJson)
                    if (!tree || Object.keys(tree).length === 0) {
                      return (
                        <div className="flex flex-col items-center py-8 text-center">
                          <FileJson className="w-8 h-8 text-[#4b5563] mb-2" />
                          <p className="text-xs text-[#6b7280]">No config keys found</p>
                        </div>
                      )
                    }
                    return renderConfigTree(tree)
                  })()}
                </div>
              </div>

              {/* JSON Editor */}
              <div className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#252636] border-b border-[#2d2e3d]">
                  <span className="text-xs font-semibold text-[#9ca3af] flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-emerald-400" />
                    JSON Editor
                  </span>
                  <div className="flex items-center gap-1">
                    {configError && (
                      <span className="text-[10px] text-red-400 flex items-center gap-1 mr-2">
                        <AlertTriangle className="w-3 h-3" />
                        {configError}
                      </span>
                    )}
                    <button
                      onClick={handleSaveConfig}
                      className="px-2 py-1 rounded text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                  </div>
                </div>
                <textarea
                  value={configJson}
                  onChange={(e) => {
                    setConfigJson(e.target.value)
                    try {
                      JSON.parse(e.target.value)
                      setConfigError(null)
                    } catch {
                      setConfigError('Invalid JSON')
                    }
                  }}
                  className="w-full h-96 p-3 bg-[#0f1117] text-emerald-300 font-mono text-xs resize-none focus:outline-none custom-scrollbar"
                  spellCheck={false}
                  placeholder='{\n  "key": "value"\n}'
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ====== PROFILES TAB ====== */}
        {envTab === 'profiles' && (
          <motion.div
            key="profiles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Layers className="w-10 h-10 text-[#4b5563] mb-3" />
                <p className="text-[#9ca3af] text-sm">No profiles found</p>
                <p className="text-[#6b7280] text-xs mt-1">Create environment profiles for dev/staging/production</p>
                <button
                  onClick={() => {
                    resetProfileForm()
                    setEditingProfile(null)
                    setShowProfileDialog(true)
                  }}
                  className="mt-3 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/30 transition-all"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Add Profile
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {profiles.map((profile, i) => {
                  const colorClass = profileColors[i % profileColors.length]
                  const overrides = JSON.parse(profile.variables || '{}')
                  const overrideKeys = Object.keys(overrides)

                  return (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`bg-[#1a1b2e] border rounded-lg p-4 relative overflow-hidden ${
                        profile.isActive
                          ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                          : 'border-[#2d2e3d]'
                      }`}
                    >
                      {/* Active indicator */}
                      {profile.isActive && (
                        <div className="absolute top-0 right-0">
                          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-bl-lg">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-[9px] text-emerald-400 font-semibold">ACTIVE</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg ${colorClass} border flex items-center justify-center`}>
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{profile.name}</h3>
                          {profile.description && (
                            <p className="text-[10px] text-[#6b7280] line-clamp-1">{profile.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-[#0f1117] rounded-md p-2 text-center">
                          <p className="text-lg font-bold text-white">{profile.variableCount || 0}</p>
                          <p className="text-[9px] text-[#6b7280]">Variables</p>
                        </div>
                        <div className="bg-[#0f1117] rounded-md p-2 text-center">
                          <p className="text-lg font-bold text-amber-400">{overrideKeys.length}</p>
                          <p className="text-[9px] text-[#6b7280]">Overrides</p>
                        </div>
                      </div>

                      {/* Override keys preview */}
                      {overrideKeys.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] text-[#6b7280] mb-1">Overrides:</p>
                          <div className="flex flex-wrap gap-1">
                            {overrideKeys.slice(0, 5).map((key) => (
                              <span
                                key={key}
                                className="inline-flex px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-400 font-mono"
                              >
                                {key}
                              </span>
                            ))}
                            {overrideKeys.length > 5 && (
                              <span className="text-[9px] text-[#6b7280]">+{overrideKeys.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[#2d2e3d]">
                        {!profile.isActive ? (
                          <button
                            onClick={() => handleActivateProfile(profile.id)}
                            className="flex-1 px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Activate
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex-1 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400/50 text-[10px] font-medium cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Current
                          </button>
                        )}
                        <button
                          onClick={() => openEditProfile(profile)}
                          className="p-1.5 rounded-md hover:bg-[#2d2e3d] text-[#6b7280] hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="p-1.5 rounded-md hover:bg-red-500/20 text-[#6b7280] hover:text-red-400 transition-colors"
                          title="Delete"
                          disabled={profile.isActive}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== ADD/EDIT VARIABLE DIALOG ====== */}
      <AnimatePresence>
        {showVarDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowVarDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2e3d]">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  {editingVar ? (
                    <>
                      <Edit3 className="w-4 h-4 text-emerald-400" />
                      Edit Variable
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-emerald-400" />
                      Add {varForm.isSecret || varForm.type === 'secret' ? 'Secret' : 'Variable'}
                    </>
                  )}
                </h3>
                <button
                  onClick={() => setShowVarDialog(false)}
                  className="p-1.5 rounded-lg hover:bg-[#2d2e3d] text-[#6b7280] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Key */}
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1.5">
                    Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={varForm.key}
                    onChange={(e) => setVarForm((prev) => ({ ...prev, key: e.target.value }))}
                    placeholder="e.g., API_ENDPOINT"
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs font-mono placeholder:text-[#4b5563] focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Value */}
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1.5">
                    Value <span className="text-red-400">*</span>
                    {editingVar && varForm.isSecret && (
                      <span className="text-[#6b7280] ml-2">(leave empty to keep current)</span>
                    )}
                  </label>
                  {varForm.isSecret || varForm.type === 'secret' ? (
                    <input
                      type="password"
                      value={varForm.value}
                      onChange={(e) => setVarForm((prev) => ({ ...prev, value: e.target.value }))}
                      placeholder="Enter secret value"
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs font-mono placeholder:text-[#4b5563] focus:outline-none focus:border-emerald-500/50"
                    />
                  ) : varForm.type === 'json' ? (
                    <textarea
                      value={varForm.value}
                      onChange={(e) => setVarForm((prev) => ({ ...prev, value: e.target.value }))}
                      placeholder='{"key": "value"}'
                      rows={4}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs font-mono placeholder:text-[#4b5563] focus:outline-none focus:border-emerald-500/50 resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={varForm.value}
                      onChange={(e) => setVarForm((prev) => ({ ...prev, value: e.target.value }))}
                      placeholder="Enter value"
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs font-mono placeholder:text-[#4b5563] focus:outline-none focus:border-emerald-500/50"
                    />
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1.5">Type</label>
                  <div className="flex gap-2 flex-wrap">
                    {['string', 'number', 'boolean', 'secret', 'json'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setVarForm((prev) => ({
                          ...prev,
                          type,
                          isSecret: type === 'secret' ? true : prev.isSecret,
                        }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                          varForm.type === type
                            ? typeColors[type]
                            : 'bg-[#0f1117] border-[#2d2e3d] text-[#6b7280] hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scope */}
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1.5">Scope</label>
                  <div className="flex gap-2">
                    {['global', 'agent', 'workspace'].map((scope) => (
                      <button
                        key={scope}
                        onClick={() => setVarForm((prev) => ({ ...prev, scope }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                          varForm.scope === scope
                            ? scopeColors[scope]
                            : 'bg-[#0f1117] border-[#2d2e3d] text-[#6b7280] hover:text-white'
                        }`}
                      >
                        {scopeIcons[scope]}
                        {scope}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profile */}
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1.5">Profile (optional)</label>
                  <select
                    value={varForm.profileId}
                    onChange={(e) => setVarForm((prev) => ({ ...prev, profileId: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-[#9ca3af] text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">No profile</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1.5">Description</label>
                  <input
                    type="text"
                    value={varForm.description}
                    onChange={(e) => setVarForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#4b5563] focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={varForm.isRequired}
                      onChange={(e) => setVarForm((prev) => ({ ...prev, isRequired: e.target.checked }))}
                      className="w-4 h-4 rounded border-[#2d2e3d] bg-[#0f1117] text-emerald-500 focus:ring-emerald-500/50"
                    />
                    <span className="text-xs text-[#9ca3af]">Required</span>
                  </label>
                  {varForm.type !== 'secret' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={varForm.isSecret}
                        onChange={(e) => setVarForm((prev) => ({ ...prev, isSecret: e.target.checked }))}
                        className="w-4 h-4 rounded border-[#2d2e3d] bg-[#0f1117] text-emerald-500 focus:ring-emerald-500/50"
                      />
                      <span className="text-xs text-[#9ca3af]">Mark as secret</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#2d2e3d]">
                <button
                  onClick={() => setShowVarDialog(false)}
                  className="px-4 py-2 rounded-lg bg-[#0f1117] border border-[#2d2e3d] text-[#9ca3af] text-xs hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingVar ? handleUpdateVar : handleCreateVar}
                  disabled={!varForm.key || (!editingVar && !varForm.value)}
                  className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Save className="w-3 h-3" />
                  {editingVar ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== ADD/EDIT PROFILE DIALOG ====== */}
      <AnimatePresence>
        {showProfileDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowProfileDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2e3d]">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  {editingProfile ? (
                    <>
                      <Edit3 className="w-4 h-4 text-emerald-400" />
                      Edit Profile
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-emerald-400" />
                      Add Profile
                    </>
                  )}
                </h3>
                <button
                  onClick={() => setShowProfileDialog(false)}
                  className="p-1.5 rounded-lg hover:bg-[#2d2e3d] text-[#6b7280] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1.5">
                    Profile Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., development, staging, production"
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#4b5563] focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1.5">Description</label>
                  <input
                    type="text"
                    value={profileForm.description}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#4b5563] focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Variable Overrides */}
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1.5">
                    Variable Overrides (JSON)
                  </label>
                  <textarea
                    value={profileForm.variables}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, variables: e.target.value }))}
                    placeholder='{"API_URL": "https://dev.api.com", "DEBUG": "true"}'
                    rows={6}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs font-mono placeholder:text-[#4b5563] focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                  <p className="text-[10px] text-[#6b7280] mt-1">
                    Key-value pairs that override environment variables when this profile is active
                  </p>
                </div>

                {/* Quick add overrides */}
                <div>
                  <label className="block text-xs text-[#9ca3af] mb-1.5">Quick Add Override</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={configKey}
                      onChange={(e) => setConfigKey(e.target.value)}
                      placeholder="KEY"
                      className="flex-1 px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs font-mono placeholder:text-[#4b5563] focus:outline-none focus:border-emerald-500/50"
                    />
                    <button
                      onClick={() => {
                        if (!configKey) return
                        try {
                          const vars = JSON.parse(profileForm.variables || '{}')
                          vars[configKey] = ''
                          setProfileForm((prev) => ({ ...prev, variables: JSON.stringify(vars, null, 2) }))
                          setConfigKey('')
                        } catch {
                          // ignore
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-[#0f1117] border border-[#2d2e3d] text-[#9ca3af] text-xs hover:text-white transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#2d2e3d]">
                <button
                  onClick={() => setShowProfileDialog(false)}
                  className="px-4 py-2 rounded-lg bg-[#0f1117] border border-[#2d2e3d] text-[#9ca3af] text-xs hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingProfile ? handleUpdateProfile : handleCreateProfile}
                  disabled={!profileForm.name}
                  className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Save className="w-3 h-3" />
                  {editingProfile ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
