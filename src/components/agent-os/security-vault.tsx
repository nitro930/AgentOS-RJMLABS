'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Key,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Settings,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface ApiKeyEntry {
  id: string
  name: string
  provider: string
  keyPreview: string
  permissions: string[]
  usageCount: number
  lastUsedAt: string | null
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

interface AccessRuleEntry {
  id: string
  name: string
  resource: string
  action: string
  agentId: string | null
  isAllowed: boolean
  conditions: string
  createdAt: string
}

export function SecurityVault() {
  const { addToast } = useAgentOSStore()
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([])
  const [accessRules, setAccessRules] = useState<AccessRuleEntry[]>([])
  const [activeTab, setActiveTab] = useState<'keys' | 'rules'>('keys')
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [showCreateRule, setShowCreateRule] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [newKey, setNewKey] = useState({ name: '', provider: 'openai', key: '', permissions: ['chat'] })
  const [newRule, setNewRule] = useState({ name: '', resource: 'agents', action: 'read', isAllowed: true })

  useEffect(() => {
    fetchApiKeys()
    fetchAccessRules()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const res = await fetch('/api/security/keys')
      if (res.ok) {
        const data = await res.json()
        setApiKeys(data)
      }
    } catch {}
  }

  const fetchAccessRules = async () => {
    try {
      const res = await fetch('/api/security/rules')
      if (res.ok) {
        const data = await res.json()
        setAccessRules(data)
      }
    } catch {}
  }

  const createApiKey = async () => {
    try {
      const res = await fetch('/api/security/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey),
      })
      if (res.ok) {
        fetchApiKeys()
        setShowCreateKey(false)
        setNewKey({ name: '', provider: 'openai', key: '', permissions: ['chat'] })
        addToast('API key added to vault', 'success')
      }
    } catch {
      addToast('Failed to add API key', 'error')
    }
  }

  const deleteApiKey = async (id: string) => {
    try {
      const res = await fetch(`/api/security/keys/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== id))
        addToast('API key removed', 'success')
      }
    } catch {
      addToast('Failed to remove key', 'error')
    }
  }

  const toggleKeyActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/security/keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) {
        setApiKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, isActive: !isActive } : k))
        )
      }
    } catch {}
  }

  const createAccessRule = async () => {
    try {
      const res = await fetch('/api/security/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      })
      if (res.ok) {
        fetchAccessRules()
        setShowCreateRule(false)
        setNewRule({ name: '', resource: 'agents', action: 'read', isAllowed: true })
        addToast('Access rule created', 'success')
      }
    } catch {
      addToast('Failed to create rule', 'error')
    }
  }

  const deleteAccessRule = async (id: string) => {
    try {
      const res = await fetch(`/api/security/rules/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAccessRules((prev) => prev.filter((r) => r.id !== id))
        addToast('Rule removed', 'success')
      }
    } catch {
      addToast('Failed to remove rule', 'error')
    }
  }

  const providerColors: Record<string, string> = {
    openai: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    anthropic: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    'z-ai': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    custom: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }

  const resourceColors: Record<string, string> = {
    agents: 'text-blue-400',
    memory: 'text-purple-400',
    workflows: 'text-emerald-400',
    terminal: 'text-red-400',
    settings: 'text-amber-400',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            Security Vault
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Manage API keys, access controls, and security policies</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs">
            <Shield className="w-3 h-3" />
            {apiKeys.filter((k) => k.isActive).length} active keys
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-[#1e1f2b] rounded-lg w-fit">
        {[
          { id: 'keys' as const, label: 'API Keys', icon: Key },
          { id: 'rules' as const, label: 'Access Rules', icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-[#0f1117] text-white'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateKey(true)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add API Key
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <div className="text-center py-12 text-[#6b7280]">
              <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No API keys stored</p>
              <p className="text-xs mt-1">Add your first API key to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <motion.div
                  key={key.id}
                  layout
                  className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded-md text-xs font-medium border ${
                        providerColors[key.provider] || providerColors.custom
                      }`}>
                        {key.provider}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">{key.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-xs text-[#6b7280] font-mono">
                            {visibleKeys.has(key.id)
                              ? `sk-...${key.keyPreview}`
                              : `sk-••••••••${key.keyPreview}`}
                          </code>
                          <button
                            onClick={() => {
                              const next = new Set(visibleKeys)
                              next.has(key.id) ? next.delete(key.id) : next.add(key.id)
                              setVisibleKeys(next)
                            }}
                            className="text-[#6b7280] hover:text-white transition-colors"
                          >
                            {visibleKeys.has(key.id) ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleKeyActive(key.id, key.isActive)}
                        className={`px-2 py-1 text-xs rounded-md ${
                          key.isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-[#252636] text-[#6b7280]'
                        }`}
                      >
                        {key.isActive ? 'Active' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => deleteApiKey(key.id)}
                        className="p-1.5 text-[#6b7280] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-[#6b7280]">
                    <span>Used {key.usageCount} times</span>
                    {key.lastUsedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        Last: {new Date(key.lastUsedAt).toLocaleDateString()}
                      </span>
                    )}
                    {key.expiresAt && (
                      <span className={`flex items-center gap-1 ${
                        new Date(key.expiresAt) < new Date() ? 'text-red-400' : ''
                      }`}>
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Expires: {new Date(key.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex gap-1">
                      {key.permissions.map((p) => (
                        <span key={p} className="px-1.5 py-0.5 bg-[#252636] rounded text-[9px]">
                          {p}
                        </span>
                      ))}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Access Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateRule(true)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </button>
          </div>

          {accessRules.length === 0 ? (
            <div className="text-center py-12 text-[#6b7280]">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No access rules configured</p>
              <p className="text-xs mt-1">Create rules to control agent permissions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {accessRules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      rule.isAllowed ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                      {rule.isAllowed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">{rule.name}</h4>
                      <p className="text-xs text-[#6b7280] mt-0.5">
                        <span className={resourceColors[rule.resource] || 'text-[#9ca3af]'}>
                          {rule.resource}
                        </span>
                        {' → '}
                        <span className="text-white">{rule.action}</span>
                        {' → '}
                        <span className={rule.isAllowed ? 'text-emerald-400' : 'text-red-400'}>
                          {rule.isAllowed ? 'ALLOW' : 'DENY'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAccessRule(rule.id)}
                    className="p-1.5 text-[#6b7280] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create API Key Dialog */}
      <AnimatePresence>
        {showCreateKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateKey(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                Add API Key
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Key Name</label>
                  <input
                    value={newKey.name}
                    onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                    placeholder="e.g. OpenAI Production Key"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Provider</label>
                  <select
                    value={newKey.provider}
                    onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="z-ai">Z-AI</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">API Key</label>
                  <input
                    type="password"
                    value={newKey.key}
                    onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500 font-mono"
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Permissions</label>
                  <div className="flex flex-wrap gap-2">
                    {['chat', 'code', 'vision', 'admin'].map((perm) => (
                      <button
                        key={perm}
                        onClick={() => {
                          const perms = newKey.permissions.includes(perm)
                            ? newKey.permissions.filter((p) => p !== perm)
                            : [...newKey.permissions, perm]
                          setNewKey({ ...newKey, permissions: perms })
                        }}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          newKey.permissions.includes(perm)
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-[#0f1117] text-[#6b7280] border border-[#2d2e3d]'
                        }`}
                      >
                        {perm}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateKey(false)}
                  className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createApiKey}
                  disabled={!newKey.name.trim() || !newKey.key.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  Add Key
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Access Rule Dialog */}
      <AnimatePresence>
        {showCreateRule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateRule(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-lg font-semibold text-white">New Access Rule</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Rule Name</label>
                  <input
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                    placeholder="e.g. Deny terminal access"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Resource</label>
                    <select
                      value={newRule.resource}
                      onChange={(e) => setNewRule({ ...newRule, resource: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="agents">Agents</option>
                      <option value="memory">Memory</option>
                      <option value="workflows">Workflows</option>
                      <option value="terminal">Terminal</option>
                      <option value="settings">Settings</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Action</label>
                    <select
                      value={newRule.action}
                      onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="read">Read</option>
                      <option value="write">Write</option>
                      <option value="execute">Execute</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Effect</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewRule({ ...newRule, isAllowed: true })}
                      className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                        newRule.isAllowed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-[#0f1117] text-[#6b7280] border border-[#2d2e3d]'
                      }`}
                    >
                      Allow
                    </button>
                    <button
                      onClick={() => setNewRule({ ...newRule, isAllowed: false })}
                      className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                        !newRule.isAllowed
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-[#0f1117] text-[#6b7280] border border-[#2d2e3d]'
                      }`}
                    >
                      Deny
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreateRule(false)}
                  className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createAccessRule}
                  disabled={!newRule.name.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  Create Rule
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
