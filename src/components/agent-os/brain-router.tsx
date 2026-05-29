'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Brain, Send, Power, MessageSquare, Cpu, ArrowRight, Zap, DollarSign, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useAgentOSStore, ChatMessage } from '@/lib/store'
import { ModelConfig, RoutingRule } from '@/lib/types'

export function BrainRouter() {
  const [models, setModels] = useState<ModelConfig[]>([])
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { chatMessages, addChatMessage, isChatLoading, setIsChatLoading, clearChatMessages } = useAgentOSStore()

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

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

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

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault()
    const message = chatInput.trim()
    if (!message || isChatLoading) return

    setChatInput('')
    addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      model: selectedModel,
    })

    setIsChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          model: models.find((m) => m.id === selectedModel)?.name,
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

  const providerColors: Record<string, string> = {
    openai: '#10b981',
    anthropic: '#8b5cf6',
    local: '#f59e0b',
    'z-ai': '#06b6d4',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl sm:text-2xl font-bold text-white"
        >
          Brain Router
        </motion.h2>
        <p className="text-sm text-[#9ca3af] mt-1">Model configuration, routing rules, and AI chat interface</p>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 animate-pulse">
              <div className="h-6 w-32 bg-[#252636] rounded mb-3" />
              <div className="h-4 w-20 bg-[#252636] rounded" />
            </div>
          ))
        ) : (
          models.map((model) => {
            const capabilities: string[] = (() => {
              try { return JSON.parse(model.capabilities || '[]') } catch { return [] }
            })()
            const color = providerColors[model.provider] || '#6b7280'

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
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Cpu className="w-5 h-5" style={{ color }} />
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

                <h3 className="text-sm font-semibold text-white mb-1">{model.name}</h3>
                <p className="text-xs text-[#6b7280] mb-3 capitalize">{model.provider}</p>

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
                    <DollarSign className="w-3 h-3" />
                    <span>${model.costPer1k}/1k tokens</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    <span>{(model.maxTokens / 1000).toFixed(0)}k max</span>
                  </div>
                </div>

                {model.isActive && (
                  <button
                    onClick={() => setSelectedModel(model.id)}
                    className={`mt-3 w-full text-xs py-1.5 rounded-lg transition-colors ${
                      selectedModel === model.id
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-[#252636] text-[#9ca3af] hover:bg-[#2d2e3d]'
                    }`}
                  >
                    {selectedModel === model.id ? '✓ Selected for Chat' : 'Select for Chat'}
                  </button>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      {/* Routing Rules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5"
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Routing Rules
        </h3>
        <div className="space-y-2">
          {routingRules.map((rule) => {
            const condition = (() => {
              try { return JSON.parse(rule.condition || '{}') } catch { return {} }
            })()
            const modelName = models.find((m) => m.id === rule.modelId)?.name || rule.modelId
            return (
              <div
                key={rule.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{rule.name}</p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {Object.entries(condition).map(([key, val]) => (
                      <span key={key} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1f2b] text-[#9ca3af]">
                        {key}: {String(val)}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#6b7280] flex-shrink-0" />
                <span className="text-xs text-emerald-400 font-medium flex-shrink-0">{modelName}</span>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rule.isActive ? 'bg-emerald-500' : 'bg-[#4b5563]'}`} />
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2e3d] bg-[#252636]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">AI Chat</span>
            {selectedModel && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                {models.find((m) => m.id === selectedModel)?.name || 'No model'}
              </span>
            )}
          </div>
          <button
            onClick={clearChatMessages}
            className="text-xs text-[#6b7280] hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="h-64 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#6b7280]">
              <div className="text-center">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Start a conversation with the AI</p>
                <p className="text-xs mt-1">Select a model above, then type a message</p>
              </div>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
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

        <form onSubmit={handleChat} className="flex items-center gap-2 p-3 border-t border-[#2d2e3d]">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-[#252636] border-[#2d2e3d] text-white text-sm"
            placeholder="Type a message..."
            disabled={isChatLoading || !selectedModel}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!chatInput.trim() || isChatLoading || !selectedModel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
