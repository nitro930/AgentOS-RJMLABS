'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Settings,
  Clock,
  Zap,
  Code,
  MessageSquare,
  FileText,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface PlaygroundSession {
  id: string
  name: string
  agentId: string | null
  modelId: string | null
  status: string
  input: string
  output: string | null
  config: string
  iterations: number
  tokensUsed: number
  duration: number
  tags: string[]
  createdAt: string
}

interface Agent {
  id: string
  name: string
  type: string
  avatar: string | null
  color: string
  status: string
}

interface ModelConfig {
  id: string
  name: string
  provider: string
}

export function AgentPlayground() {
  const { addToast } = useAgentOSStore()
  const [sessions, setSessions] = useState<PlaygroundSession[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [models, setModels] = useState<ModelConfig[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [testInput, setTestInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [newSession, setNewSession] = useState({
    name: '',
    agentId: '',
    modelId: '',
  })

  useEffect(() => {
    fetchSessions()
    fetchAgents()
    fetchModels()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/playground')
      if (res.ok) setSessions(await res.json())
    } catch {}
  }

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents')
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || data)
      }
    } catch {}
  }

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models')
      if (res.ok) {
        const data = await res.json()
        setModels(data.models || data)
      }
    } catch {}
  }

  const createSession = async () => {
    try {
      const res = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSession,
          input: JSON.stringify({ prompt: testInput }),
        }),
      })
      if (res.ok) {
        const session = await res.json()
        setSessions((prev) => [session, ...prev])
        setActiveSessionId(session.id)
        setShowCreate(false)
        setNewSession({ name: '', agentId: '', modelId: '' })
        addToast('Playground session created', 'success')
      }
    } catch {
      addToast('Failed to create session', 'error')
    }
  }

  const runTest = async () => {
    if (!activeSessionId || !testInput.trim() || isRunning) return
    setIsRunning(true)

    try {
      const res = await fetch(`/api/playground/${activeSessionId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: testInput }),
      })
      if (res.ok) {
        const result = await res.json()
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSessionId ? { ...s, ...result, status: 'completed' } : s))
        )
        addToast('Test run completed', 'success')
      }
    } catch {
      addToast('Test run failed', 'error')
    } finally {
      setIsRunning(false)
    }
  }

  const deleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/playground/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id))
        if (activeSessionId === id) setActiveSessionId(null)
        addToast('Session deleted', 'success')
      }
    } catch {}
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
    idle: { icon: Pause, color: 'text-[#6b7280]' },
    running: { icon: Play, color: 'text-emerald-400' },
    paused: { icon: Pause, color: 'text-amber-400' },
    completed: { icon: CheckCircle, color: 'text-emerald-400' },
    failed: { icon: XCircle, color: 'text-red-400' },
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-400" />
            Agent Playground
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Test, debug, and iterate on agent configurations in isolation</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Test
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Session List */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-medium text-[#9ca3af] px-1">Sessions</h3>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-[#6b7280] bg-[#1e1f2b] rounded-lg border border-[#2d2e3d]">
              <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No test sessions yet</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto custom-scrollbar">
              {sessions.map((session) => {
                const sc = statusConfig[session.status] || statusConfig.idle
                const StatusIcon = sc.icon
                return (
                  <button
                    key={session.id}
                    onClick={() => {
                      setActiveSessionId(session.id)
                      try {
                        const input = JSON.parse(session.input)
                        setTestInput(input.prompt || '')
                      } catch {}
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      activeSessionId === session.id
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-[#1e1f2b] border-[#2d2e3d] hover:bg-[#252636]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-medium truncate">{session.name}</span>
                      <StatusIcon className={`w-3.5 h-3.5 flex-shrink-0 ${sc.color}`} />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-[#6b7280]">
                      <span>{session.iterations} runs</span>
                      <span>{session.tokensUsed} tokens</span>
                      <span>{session.duration}ms</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Active Session */}
        <div className="lg:col-span-2 space-y-4">
          {activeSession ? (
            <>
              {/* Session Header */}
              <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{activeSession.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#6b7280]">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {activeSession.iterations} iterations
                      </span>
                      <span>{activeSession.tokensUsed} tokens</span>
                      <span>{activeSession.duration}ms total</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSession(activeSession.id)}
                    className="p-2 text-[#6b7280] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Input Area */}
              <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Test Input</h4>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="w-full h-32 bg-[#0f1117] border border-[#2d2e3d] rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500 resize-none font-mono"
                  placeholder="Enter your test prompt here..."
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={runTest}
                    disabled={isRunning || !testInput.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isRunning ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run Test
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setTestInput('')}
                    className="px-3 py-2 text-sm text-[#6b7280] hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Output Area */}
              <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Output</h4>
                  {activeSession.output && (
                    <button
                      onClick={() => {
                        try {
                          const out = JSON.parse(activeSession.output || '{}')
                          navigator.clipboard.writeText(JSON.stringify(out, null, 2))
                          addToast('Output copied', 'success')
                        } catch {}
                      }}
                      className="p-1.5 text-[#6b7280] hover:text-white transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="bg-[#0f1117] border border-[#2d2e3d] rounded-lg p-3 min-h-[200px] max-h-[400px] overflow-y-auto">
                  {activeSession.output ? (
                    <pre className="text-sm text-[#d1d5db] font-mono whitespace-pre-wrap">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(activeSession.output), null, 2)
                        } catch {
                          return activeSession.output
                        }
                      })()}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-[180px] text-[#4b5563]">
                      <div className="text-center">
                        <Code className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">Run a test to see output</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Templates */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-[#9ca3af]">Quick Test Prompts</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Code Review', prompt: 'Review this code for bugs and suggest improvements:\n\nfunction add(a, b) {\n  return a + b\n}' },
                    { label: 'Summarize', prompt: 'Summarize the key points of the following text in 3 bullet points.' },
                    { label: 'Debug', prompt: 'Find and fix the bug in this function:\n\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)' },
                    { label: 'Generate', prompt: 'Generate a REST API endpoint for a user management system with CRUD operations.' },
                    { label: 'Analyze', prompt: 'Analyze the sentiment of this text and provide a confidence score.' },
                  ].map((tmpl) => (
                    <button
                      key={tmpl.label}
                      onClick={() => setTestInput(tmpl.prompt)}
                      className="px-3 py-1.5 text-xs bg-[#1e1f2b] text-[#9ca3af] hover:text-white hover:bg-[#252636] rounded-lg border border-[#2d2e3d] transition-colors"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-[#6b7280] bg-[#1e1f2b] rounded-lg border border-[#2d2e3d]">
              <div className="text-center">
                <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select or create a playground session</p>
                <p className="text-xs mt-1">Test your agents in an isolated sandbox</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Session Dialog */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-400" />
                New Playground Session
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Session Name</label>
                  <input
                    value={newSession.name}
                    onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                    placeholder="e.g. Code Review Test"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Agent (optional)</label>
                  <select
                    value={newSession.agentId}
                    onChange={(e) => setNewSession({ ...newSession, agentId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="">No agent (direct model)</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.avatar} {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Model (optional)</label>
                  <select
                    value={newSession.modelId}
                    onChange={(e) => setNewSession({ ...newSession, modelId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="">Default routing</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.provider})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createSession}
                  disabled={!newSession.name.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  Create Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
