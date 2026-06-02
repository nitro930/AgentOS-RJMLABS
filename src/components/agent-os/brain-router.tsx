'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Send, MessageSquare, Cpu, ArrowRight, Zap, PoundSterling, Hash,
  Settings, Globe, Search, Plus, Trash2, CheckCircle, XCircle, Loader2,
  ChevronDown, ExternalLink, Eye, Key, Server, RefreshCw, Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useAgentOSStore, ChatMessage } from '@/lib/store'
import { ModelConfig, RoutingRule, ProviderConfig } from '@/lib/types'

// ============================================================
// PROVIDER DEFINITIONS — static metadata for known providers
// ============================================================
const PROVIDER_DEFS: Record<string, {
  displayName: string
  description: string
  baseUrl: string
  icon: string
  color: string
  requiresKey: boolean
  keyHint: string
  docsUrl: string
}> = {
  openrouter: {
    displayName: 'OpenRouter',
    description: 'Access 200+ models from OpenAI, Anthropic, Google, Meta, Mistral & more through a single API key.',
    baseUrl: 'https://openrouter.ai/api/v1',
    icon: '🌐',
    color: '#6366f1',
    requiresKey: true,
    keyHint: 'sk-or-v1-...',
    docsUrl: 'https://openrouter.ai/keys',
  },
  huggingface: {
    displayName: 'Hugging Face',
    description: 'Free inference API for open-source models. Access thousands of models including Llama, Mistral, Phi & more.',
    baseUrl: 'https://api-inference.huggingface.co',
    icon: '🤗',
    color: '#f59e0b',
    requiresKey: true,
    keyHint: 'hf_...',
    docsUrl: 'https://huggingface.co/settings/tokens',
  },
  openai: {
    displayName: 'OpenAI',
    description: 'Direct access to GPT-4o, GPT-4o-mini, o1, o3 and other OpenAI models.',
    baseUrl: 'https://api.openai.com/v1',
    icon: '🟢',
    color: '#10b981',
    requiresKey: true,
    keyHint: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    displayName: 'Anthropic',
    description: 'Direct access to Claude 3.5 Sonnet, Claude 3 Opus, and other Anthropic models.',
    baseUrl: 'https://api.anthropic.com/v1',
    icon: '🟣',
    color: '#8b5cf6',
    requiresKey: true,
    keyHint: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  ollama: {
    displayName: 'Ollama (Local)',
    description: 'Run open-source models locally with Ollama. No API key needed — models run on your machine.',
    baseUrl: 'http://localhost:11434',
    icon: '🦙',
    color: '#f97316',
    requiresKey: false,
    keyHint: 'No key required',
    docsUrl: 'https://ollama.ai',
  },
  'z-ai': {
    displayName: 'Z-AI (Built-in)',
    description: 'Built-in AI provider included with AgentOS. No configuration needed.',
    baseUrl: '',
    icon: '⚡',
    color: '#06b6d4',
    requiresKey: false,
    keyHint: 'Built-in — no key needed',
    docsUrl: '',
  },
}

interface BrowseModel {
  id: string
  name: string
  provider: string
  contextLength: number | null
  pricing: Record<string, number>
  capabilities: string[]
  description: string
  downloads?: number
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function BrainRouter() {
  const [models, setModels] = useState<ModelConfig[]>([])
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([])
  const [providers, setProviders] = useState<ProviderConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [browseModels, setBrowseModels] = useState<BrowseModel[]>([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browseError, setBrowseError] = useState('')
  const [browseSearch, setBrowseSearch] = useState('')
  const [browseProvider, setBrowseProvider] = useState<string>('openrouter')
  const [addingModelId, setAddingModelId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { chatMessages, addChatMessage, isChatLoading, setIsChatLoading, clearChatMessages, brainTab, setBrainTab } = useAgentOSStore()

  // Provider edit state
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [providerApiKey, setProviderApiKey] = useState('')
  const [providerBaseUrl, setProviderBaseUrl] = useState('')
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({})

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch('/api/models')
      const data = await res.json()
      setModels(data.models || [])
      setRoutingRules(data.routingRules || [])
      if (data.models?.length && !selectedModel) {
        const activeModel = data.models.find((m: ModelConfig) => m.isActive)
        setSelectedModel(activeModel?.id || data.models[0]?.id || '')
      }
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [selectedModel])

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/providers')
      const data = await res.json()
      setProviders(data.providers || [])
    } catch {
      // Error handling
    }
  }, [])

  useEffect(() => {
    fetchModels()
    fetchProviders()
  }, [fetchModels, fetchProviders])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleToggleModel = async (modelId: string, isActive: boolean) => {
    await fetch(`/api/models/${modelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    fetchModels()
  }

  const handleDeleteModel = async (modelId: string) => {
    await fetch(`/api/models/${modelId}`, { method: 'DELETE' })
    if (selectedModel === modelId) setSelectedModel('')
    fetchModels()
  }

  // ============================================================
  // CHAT — multi-provider
  // ============================================================
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault()
    const message = chatInput.trim()
    if (!message || isChatLoading) return

    const selectedModelConfig = models.find((m) => m.id === selectedModel)
    setChatInput('')

    addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      model: selectedModelConfig?.name,
    })

    setIsChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          model: selectedModelConfig?.name,
          modelId: selectedModelConfig?.modelId,
          provider: selectedModelConfig?.provider,
        }),
      })
      const data = await res.json()
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || data.error || 'No response',
        timestamp: new Date(),
        model: data.model || 'unknown',
      })
    } catch {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error: Unable to connect to AI model',
        timestamp: new Date(),
      })
    } finally {
      setIsChatLoading(false)
    }
  }

  // ============================================================
  // PROVIDER CONFIG
  // ============================================================
  const handleSaveProvider = async (providerName: string) => {
    const existing = providers.find((p) => p.name === providerName)
    if (existing) {
      await fetch(`/api/providers/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: providerApiKey,
          baseUrl: providerBaseUrl,
          isActive: true,
        }),
      })
    } else {
      const def = PROVIDER_DEFS[providerName]
      await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: providerName,
          displayName: def?.displayName || providerName,
          provider: providerName,
          apiKey: providerApiKey,
          baseUrl: providerBaseUrl || def?.baseUrl || '',
          isActive: true,
        }),
      })
    }
    setEditingProvider(null)
    setProviderApiKey('')
    setProviderBaseUrl('')
    fetchProviders()
  }

  const handleTestProvider = async (providerName: string) => {
    setTestingProvider(providerName)
    setTestResult((prev) => ({ ...prev, [providerName]: { ok: false, msg: 'Testing...' } }))

    try {
      const existing = providers.find((p) => p.name === providerName)
      const key = providerApiKey || (existing?.apiKey && !existing.apiKey.includes('•') ? existing.apiKey : '')

      // Use backend API route to avoid CORS issues
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerName,
          apiKey: key,
          baseUrl: providerBaseUrl || existing?.baseUrl || '',
        }),
      })

      const data = await res.json()
      setTestResult((prev) => ({
        ...prev,
        [providerName]: { ok: data.ok, msg: data.message || (data.ok ? 'Connected' : 'Connection failed') },
      }))
    } catch {
      setTestResult((prev) => ({
        ...prev,
        [providerName]: { ok: false, msg: 'Connection failed — check network' },
      }))
    } finally {
      setTestingProvider(null)
    }
  }

  // ============================================================
  // MODEL BROWSER
  // ============================================================
  const handleBrowseModels = async (providerName: string) => {
    setBrowseLoading(true)
    setBrowseError('')
    setBrowseModels([])
    try {
      const endpoint = providerName === 'openrouter'
        ? '/api/providers/openrouter/models'
        : '/api/providers/huggingface/models'
      const res = await fetch(endpoint)
      const data = await res.json()
      if (data.error && data.models?.length === 0) {
        setBrowseError(data.error)
      }
      setBrowseModels(data.models || [])
    } catch {
      setBrowseError('Failed to fetch models — check your connection')
    } finally {
      setBrowseLoading(false)
    }
  }

  const handleAddBrowseModel = async (m: BrowseModel) => {
    setAddingModelId(m.id)
    try {
      const promptPrice = m.pricing?.prompt || m.pricing?.input || 0
      const completionPrice = m.pricing?.completion || m.pricing?.output || 0
      const costPer1k = (promptPrice + completionPrice) / 2

      await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: m.name || m.id,
          provider: browseProvider,
          modelId: m.id,
          isActive: true,
          costPer1k,
          maxTokens: m.contextLength || 4096,
          capabilities: m.capabilities,
          priority: 0,
          contextLength: m.contextLength,
          pricing: { prompt: promptPrice, completion: completionPrice },
        }),
      })
      await fetchModels()
    } catch {
      // Error handling
    } finally {
      setAddingModelId(null)
    }
  }

  // ============================================================
  // PROVIDER COLORS
  // ============================================================
  const providerColors: Record<string, string> = {
    openai: '#10b981',
    anthropic: '#8b5cf6',
    local: '#f59e0b',
    'z-ai': '#06b6d4',
    openrouter: '#6366f1',
    huggingface: '#f59e0b',
    ollama: '#f97316',
  }

  // ============================================================
  // TAB BUTTON
  // ============================================================
  const tabs: { id: 'models' | 'providers' | 'browser' | 'rules' | 'chat'; label: string; icon: React.ReactNode }[] = [
    { id: 'models', label: 'Models', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'providers', label: 'Providers', icon: <Settings className="w-3.5 h-3.5" /> },
    { id: 'browser', label: 'Browse', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'rules', label: 'Rules', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ]

  // ============================================================
  // FILTER BROWSE MODELS
  // ============================================================
  const filteredBrowseModels = browseModels.filter((m) => {
    if (!browseSearch) return true
    const q = browseSearch.toLowerCase()
    return (
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      m.capabilities.some((c) => c.toLowerCase().includes(q))
    )
  })

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2"
        >
          <Brain className="w-6 h-6 text-emerald-400" />
          Brain Router
        </motion.h2>
        <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
          Multi-provider AI routing — configure providers, browse models, and chat with any LLM
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setBrainTab(tab.id)
              if (tab.id === 'browser') handleBrowseModels(browseProvider)
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              brainTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#252636] text-[#9ca3af] hover:text-white hover:bg-[#2d2e3d] border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ============================================ */}
        {/* TAB: MODELS */}
        {/* ============================================ */}
        {brainTab === 'models' && (
          <motion.div
            key="models"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Configured Models</h3>
              <button
                onClick={() => setBrainTab('browser')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add from Browser
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 animate-pulse">
                    <div className="h-6 w-32 bg-[#252636] rounded mb-3" />
                    <div className="h-4 w-20 bg-[#252636] rounded" />
                  </div>
                ))
              ) : models.length === 0 ? (
                <div className="col-span-full text-center py-8 text-[#6b7280]">
                  <Cpu className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No models configured</p>
                  <p className="text-xs mt-1">Go to Browse to add models from providers</p>
                </div>
              ) : (
                models.map((model) => {
                  const capabilities: string[] = (() => {
                    try { return JSON.parse(model.capabilities || '[]') } catch { return [] }
                  })()
                  const color = providerColors[model.provider] || '#6b7280'
                  const provDef = PROVIDER_DEFS[model.provider]

                  return (
                    <motion.div
                      key={model.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      className={`rounded-xl border p-4 transition-colors ${
                        selectedModel === model.id
                          ? 'border-emerald-500/30 bg-[#1e1f2b]'
                          : 'border-[#2d2e3d] bg-[#1e1f2b] hover:border-[#3d3e4d]'
                      } ${!model.isActive ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          {provDef?.icon || <Cpu className="w-5 h-5" style={{ color }} />}
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedModel === model.id && model.isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                              Active
                            </span>
                          )}
                          <Switch
                            checked={model.isActive}
                            onCheckedChange={() => handleToggleModel(model.id, model.isActive)}
                          />
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-white mb-1 truncate">{model.name}</h3>
                      <p className="text-xs text-[#6b7280] mb-2 capitalize flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: color }}
                        />
                        {model.provider}
                        {model.contextLength && (
                          <span className="text-[10px] text-[#4b5563] ml-1">
                            ({(model.contextLength / 1000).toFixed(0)}k ctx)
                          </span>
                        )}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[#252636] text-[#9ca3af]"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
                        <div className="flex items-center gap-1">
                          <PoundSterling className="w-3 h-3" />
                          <span>£{model.costPer1k}/1k</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <span>{(model.maxTokens / 1000).toFixed(0)}k max</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        {model.isActive && (
                          <button
                            onClick={() => setSelectedModel(model.id)}
                            className={`flex-1 text-xs py-2 rounded-lg transition-colors ${
                              selectedModel === model.id
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-[#252636] text-[#9ca3af] hover:bg-[#2d2e3d]'
                            }`}
                          >
                            {selectedModel === model.id ? '✓ Selected' : 'Select'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteModel(model.id)}
                          className="p-2 rounded-lg bg-[#252636] text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete model"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}

        {/* ============================================ */}
        {/* TAB: PROVIDERS */}
        {/* ============================================ */}
        {brainTab === 'providers' && (
          <motion.div
            key="providers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <p className="text-xs text-[#9ca3af]">
              Configure your AI providers. Add API keys to connect to OpenRouter, Hugging Face, and more.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(PROVIDER_DEFS).map(([key, def]) => {
                const existing = providers.find((p) => p.name === key)
                const isConfigured = !!existing?.apiKey && !existing.apiKey.includes('•')
                const isEditing = editingProvider === key
                const result = testResult[key]

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${def.color}20` }}
                        >
                          {def.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{def.displayName}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isConfigured ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                Connected
                              </span>
                            ) : key === 'z-ai' ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                                Built-in
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#252636] text-[#6b7280]">
                                Not configured
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {def.docsUrl && (
                          <a
                            href={def.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-[#252636] transition-colors"
                            title="Get API key"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setEditingProvider(null)
                              setProviderApiKey('')
                              setProviderBaseUrl('')
                            } else {
                              setEditingProvider(key)
                              setProviderBaseUrl(existing?.baseUrl || def.baseUrl)
                              setProviderApiKey('')
                            }
                          }}
                          className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-[#252636] transition-colors"
                        >
                          {isEditing ? <XCircle className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#9ca3af] mb-3">{def.description}</p>

                    {/* Test Result */}
                    {result && (
                      <div className={`text-xs px-2 py-1.5 rounded-lg mb-3 flex items-center gap-1.5 ${
                        result.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {result.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {result.msg}
                      </div>
                    )}

                    {/* Edit Form */}
                    {isEditing && (
                      <div className="space-y-3 mt-3 pt-3 border-t border-[#2d2e3d]">
                        {def.requiresKey && (
                          <div>
                            <label className="text-xs text-[#9ca3af] mb-1 block flex items-center gap-1">
                              <Key className="w-3 h-3" /> API Key
                            </label>
                            <Input
                              type="password"
                              value={providerApiKey}
                              onChange={(e) => setProviderApiKey(e.target.value)}
                              placeholder={def.keyHint}
                              className="bg-[#252636] border-[#2d2e3d] text-white text-xs h-9"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-[#9ca3af] mb-1 block flex items-center gap-1">
                            <Server className="w-3 h-3" /> Base URL
                          </label>
                          <Input
                            value={providerBaseUrl}
                            onChange={(e) => setProviderBaseUrl(e.target.value)}
                            placeholder={def.baseUrl}
                            className="bg-[#252636] border-[#2d2e3d] text-white text-xs h-9"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleSaveProvider(key)}
                            disabled={def.requiresKey && !providerApiKey}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => handleTestProvider(key)}
                            disabled={testingProvider === key}
                            variant="outline"
                            className="border-[#2d2e3d] text-[#9ca3af] hover:text-white text-xs h-8 px-3"
                          >
                            {testingProvider === key ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              'Test Connection'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Quick actions when not editing */}
                    {!isEditing && (
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleTestProvider(key)}
                          disabled={testingProvider === key}
                          variant="outline"
                          size="sm"
                          className="border-[#2d2e3d] text-[#9ca3af] hover:text-white text-[11px] h-7"
                        >
                          {testingProvider === key ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <RefreshCw className="w-3 h-3 mr-1" />
                          )}
                          Test
                        </Button>
                        {isConfigured && key !== 'z-ai' && (
                          <Button
                            onClick={() => {
                              setBrowseProvider(key)
                              setBrainTab('browser')
                            }}
                            variant="outline"
                            size="sm"
                            className="border-[#2d2e3d] text-[#9ca3af] hover:text-white text-[11px] h-7"
                          >
                            <Eye className="w-3 h-3 mr-1" /> Browse Models
                          </Button>
                        )}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ============================================ */}
        {/* TAB: MODEL BROWSER */}
        {/* ============================================ */}
        {brainTab === 'browser' && (
          <motion.div
            key="browser"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Browser Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <select
                  value={browseProvider}
                  onChange={(e) => setBrowseProvider(e.target.value)}
                  className="bg-[#252636] border border-[#2d2e3d] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="openrouter">OpenRouter (200+ models)</option>
                  <option value="huggingface">Hugging Face (Open Source)</option>
                </select>
                <Button
                  onClick={() => handleBrowseModels(browseProvider)}
                  disabled={browseLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-3"
                >
                  {browseLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                <Input
                  value={browseSearch}
                  onChange={(e) => setBrowseSearch(e.target.value)}
                  placeholder="Search models by name, provider, or capability..."
                  className="bg-[#252636] border-[#2d2e3d] text-white text-xs h-9 pl-9"
                />
              </div>
            </div>

            {browseError && (
              <div className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400 flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {browseError}
              </div>
            )}

            {/* Model Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {browseLoading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-[#2d2e3d] bg-[#1e1f2b] p-3 animate-pulse">
                    <div className="h-4 w-28 bg-[#252636] rounded mb-2" />
                    <div className="h-3 w-16 bg-[#252636] rounded" />
                  </div>
                ))
              ) : filteredBrowseModels.length === 0 ? (
                <div className="col-span-full text-center py-8 text-[#6b7280]">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No models found</p>
                  <p className="text-xs mt-1">Click the refresh button to load models from {PROVIDER_DEFS[browseProvider]?.displayName}</p>
                </div>
              ) : (
                filteredBrowseModels.slice(0, 60).map((m) => {
                  const isAdded = models.some((existing) => existing.modelId === m.id)
                  const color = providerColors[browseProvider] || '#6b7280'

                  return (
                    <div
                      key={m.id}
                      className="rounded-lg border border-[#2d2e3d] bg-[#1e1f2b] p-3 hover:border-[#3d3e4d] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-xs font-medium text-white truncate flex-1" title={m.id}>
                          {m.name || m.id}
                        </h4>
                        {isAdded ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                            Added
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddBrowseModel(m)}
                            disabled={addingModelId === m.id}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#252636] text-[#9ca3af] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors flex-shrink-0 disabled:opacity-50"
                          >
                            {addingModelId === m.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6b7280] truncate mb-1.5" title={m.id}>
                        {m.id}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {m.capabilities.slice(0, 4).map((cap) => (
                          <span
                            key={cap}
                            className="text-[9px] px-1 py-0.5 rounded bg-[#252636] text-[#9ca3af]"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[#6b7280]">
                        {m.contextLength && (
                          <span>{(m.contextLength / 1000).toFixed(0)}k ctx</span>
                        )}
                        {browseProvider === 'openrouter' && m.pricing && (
                          <span>
                            ${(m.pricing?.prompt || 0).toFixed(3)}/${(m.pricing?.completion || 0).toFixed(3)} per 1M
                          </span>
                        )}
                        {browseProvider === 'huggingface' && (
                          <span className="text-emerald-400">Free</span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {filteredBrowseModels.length > 60 && (
              <p className="text-xs text-[#6b7280] text-center">
                Showing 60 of {filteredBrowseModels.length} models. Use search to narrow results.
              </p>
            )}
          </motion.div>
        )}

        {/* ============================================ */}
        {/* TAB: ROUTING RULES */}
        {/* ============================================ */}
        {brainTab === 'rules' && (
          <motion.div
            key="rules"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Routing Rules
            </h3>
            <div className="space-y-2">
              {routingRules.length === 0 ? (
                <div className="text-center py-6 text-[#6b7280]">
                  <Zap className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No routing rules configured</p>
                </div>
              ) : (
                routingRules.map((rule) => {
                  const condition = (() => {
                    try { return JSON.parse(rule.condition || '{}') } catch { return {} }
                  })()
                  const modelObj = models.find((m) => m.id === rule.modelId)
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{rule.name}</p>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {Object.entries(condition).map(([k, val]) => (
                            <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1f2b] text-[#9ca3af]">
                              {k}: {String(val)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#6b7280] flex-shrink-0" />
                      <span className="text-xs text-emerald-400 font-medium flex-shrink-0">
                        {modelObj?.name || rule.modelId}
                      </span>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rule.isActive ? 'bg-emerald-500' : 'bg-[#4b5563]'}`} />
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}

        {/* ============================================ */}
        {/* TAB: CHAT */}
        {/* ============================================ */}
        {brainTab === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Model Selector */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#252636] border border-[#2d2e3d] text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500/50 appearance-none"
                >
                  <option value="">Select a model...</option>
                  {models.filter((m) => m.isActive).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
              </div>
              <div className="flex items-center gap-1">
                {selectedModel && (() => {
                  const m = models.find((m) => m.id === selectedModel)
                  if (!m) return null
                  const color = providerColors[m.provider] || '#6b7280'
                  return (
                    <span
                      className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      {m.provider}
                    </span>
                  )
                })()}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#2d2e3d] bg-[#252636]">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-white">AI Chat</span>
                  {selectedModel && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 truncate max-w-[150px]">
                      {models.find((m) => m.id === selectedModel)?.name || 'No model'}
                    </span>
                  )}
                </div>
                <button
                  onClick={clearChatMessages}
                  className="text-xs text-[#6b7280] hover:text-white transition-colors px-2 py-1 flex-shrink-0"
                >
                  Clear
                </button>
              </div>

              <div className="h-56 sm:h-72 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-[#6b7280]">
                    <div className="text-center">
                      <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Start a conversation with the AI</p>
                      <p className="text-xs mt-1">Select a model, then type a message</p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          msg.role === 'user'
                            ? 'bg-emerald-600/20 text-emerald-100'
                            : 'bg-[#252636] text-[#d1d5db]'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        {msg.model && msg.role === 'assistant' && (
                          <p className="text-[10px] text-[#6b7280] mt-1">{msg.model}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#252636] rounded-lg px-3 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChat} className="flex items-center gap-2 p-2 border-t border-[#2d2e3d]">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-[#252636] border-[#2d2e3d] text-white text-sm h-11"
                  placeholder={selectedModel ? "Type a message..." : "Select a model first..."}
                  disabled={isChatLoading || !selectedModel}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!chatInput.trim() || isChatLoading || !selectedModel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 w-11 p-0 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
