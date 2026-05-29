'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal as TerminalIcon,
  Plus,
  Trash2,
  Play,
  Square,
  Copy,
  RotateCcw,
  ChevronDown,
  Server,
  Wifi,
  WifiOff,
  Clock,
  Save,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface TerminalSession {
  id: string
  name: string
  host: string
  port: number
  username: string
  status: string
  lastCommand: string | null
  commandCount: number
  createdAt: string
}

interface TerminalCommand {
  id: string
  sessionId: string
  command: string
  output: string
  exitCode: number | null
  duration: number
  createdAt: string
}

export function VPSTerminal() {
  const { addToast } = useAgentOSStore()
  const [sessions, setSessions] = useState<TerminalSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [commands, setCommands] = useState<TerminalCommand[]>([])
  const [input, setInput] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [showSessionMenu, setShowSessionMenu] = useState(false)
  const [showNewSession, setShowNewSession] = useState(false)
  const [newSession, setNewSession] = useState({ name: '', host: 'localhost', port: 22, username: 'root' })
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    if (activeSessionId) {
      fetchCommands()
    }
  }, [activeSessionId])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [commands])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/terminal/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
        if (data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].id)
        }
      }
    } catch {}
  }

  const fetchCommands = async () => {
    if (!activeSessionId) return
    try {
      const res = await fetch(`/api/terminal/commands?sessionId=${activeSessionId}`)
      if (res.ok) {
        const data = await res.json()
        setCommands(data)
      }
    } catch {}
  }

  const createSession = async () => {
    try {
      const res = await fetch('/api/terminal/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession),
      })
      if (res.ok) {
        const session = await res.json()
        setSessions((prev) => [...prev, session])
        setActiveSessionId(session.id)
        setShowNewSession(false)
        setNewSession({ name: '', host: 'localhost', port: 22, username: 'root' })
        addToast('Terminal session created', 'success')
      }
    } catch {
      addToast('Failed to create session', 'error')
    }
  }

  const deleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/terminal/sessions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id))
        if (activeSessionId === id) {
          setActiveSessionId(sessions.find((s) => s.id !== id)?.id || null)
        }
        addToast('Session deleted', 'success')
      }
    } catch {
      addToast('Failed to delete session', 'error')
    }
  }

  const executeCommand = async () => {
    if (!input.trim() || !activeSessionId || isExecuting) return
    const cmd = input.trim()
    setInput('')
    setIsExecuting(true)

    try {
      const res = await fetch('/api/terminal/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId, command: cmd }),
      })
      if (res.ok) {
        const result = await res.json()
        setCommands((prev) => [...prev, result])
      }
    } catch {
      addToast('Command execution failed', 'error')
    } finally {
      setIsExecuting(false)
      inputRef.current?.focus()
    }
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  const getPrompt = () => {
    if (!activeSession) return '$ '
    return `${activeSession.username}@${activeSession.host}:~$ `
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-emerald-400" />
            VPS Terminal
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Execute commands on your VPS directly from AgentOS</p>
        </div>
        <button
          onClick={() => setShowNewSession(true)}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      {/* Session Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors flex-shrink-0 ${
              activeSessionId === session.id
                ? 'bg-[#1e1f2b] text-white border border-[#2d2e3d]'
                : 'text-[#9ca3af] hover:bg-[#1e1f2b] hover:text-white'
            }`}
          >
            <Server className="w-3 h-3" />
            {session.name}
            <div className={`w-1.5 h-1.5 rounded-full ${
              session.status === 'connected' ? 'bg-emerald-400' : 'bg-[#6b7280]'
            }`} />
            <button
              onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
              className="text-[#6b7280] hover:text-red-400 ml-1"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </button>
        ))}
      </div>

      {/* Terminal Window */}
      <div className="bg-[#0a0b0e] border border-[#2d2e3d] rounded-xl overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#111218] border-b border-[#2d2e3d]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs text-[#6b7280] font-mono ml-2">
              {activeSession ? `${activeSession.username}@${activeSession.host}` : 'No session'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {activeSession?.status === 'connected' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-[#6b7280]" />
            )}
            <span className="text-[10px] text-[#6b7280] font-mono">
              {activeSession ? `${activeSession.commandCount} commands` : '---'}
            </span>
          </div>
        </div>

        {/* Terminal Output */}
        <div
          ref={terminalRef}
          className="h-[500px] overflow-y-auto custom-scrollbar p-4 font-mono text-sm space-y-1"
        >
          {!activeSession ? (
            <div className="flex flex-col items-center justify-center h-full text-[#6b7280]">
              <TerminalIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No active terminal session</p>
              <p className="text-xs mt-1">Create a new session to get started</p>
            </div>
          ) : (
            <>
              <div className="text-emerald-400">
                {`AgentOS Terminal v2.0 — Connected to ${activeSession.host}`}
              </div>
              <div className="text-[#6b7280]">
                {`Session: ${activeSession.name} | User: ${activeSession.username} | Type 'help' for commands`}
              </div>
              <div className="text-[#4b5563]">{'─'.repeat(60)}</div>

              {commands.map((cmd) => (
                <div key={cmd.id} className="space-y-0.5">
                  <div className="text-emerald-400">
                    <span className="text-[#6b7280]">{getPrompt()}</span>
                    {cmd.command}
                  </div>
                  {cmd.output && (
                    <pre className="text-[#d1d5db] whitespace-pre-wrap text-xs leading-relaxed">
                      {cmd.output}
                    </pre>
                  )}
                  {cmd.exitCode !== null && cmd.exitCode !== 0 && (
                    <div className="text-red-400 text-xs">
                      exit code: {cmd.exitCode}
                    </div>
                  )}
                  <div className="text-[#4b5563] text-[10px]">
                    <Clock className="w-2.5 h-2.5 inline mr-1" />
                    {cmd.duration}ms
                  </div>
                </div>
              ))}

              {isExecuting && (
                <div className="text-emerald-400 animate-pulse">
                  <span className="text-[#6b7280]">{getPrompt()}</span>
                  executing...
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Line */}
        {activeSession && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[#111218] border-t border-[#2d2e3d]">
            <span className="text-emerald-400 font-mono text-sm">{getPrompt()}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') executeCommand()
              }}
              className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder-[#4b5563]"
              placeholder="Type a command..."
              disabled={isExecuting}
              autoFocus
            />
            <button
              onClick={executeCommand}
              disabled={isExecuting || !input.trim()}
              className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30 transition-colors"
            >
              <Play className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Commands */}
      {activeSession && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[#9ca3af]">Quick Commands</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'System Info', cmd: 'uname -a' },
              { label: 'Disk Usage', cmd: 'df -h' },
              { label: 'Memory', cmd: 'free -h' },
              { label: 'Processes', cmd: 'ps aux --sort=-%mem | head -10' },
              { label: 'Network', cmd: 'ss -tuln' },
              { label: 'Docker PS', cmd: 'docker ps' },
              { label: 'Uptime', cmd: 'uptime' },
              { label: 'Who Am I', cmd: 'whoami' },
            ].map((qc) => (
              <button
                key={qc.label}
                onClick={() => { setInput(qc.cmd) }}
                className="px-3 py-1.5 text-xs bg-[#1e1f2b] text-[#9ca3af] hover:text-white hover:bg-[#252636] rounded-lg border border-[#2d2e3d] transition-colors font-mono"
              >
                {qc.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New Session Dialog */}
      <AnimatePresence>
        {showNewSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowNewSession(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-lg font-semibold text-white">New Terminal Session</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Session Name</label>
                  <input
                    value={newSession.name}
                    onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                    placeholder="My VPS"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Host</label>
                    <input
                      value={newSession.host}
                      onChange={(e) => setNewSession({ ...newSession, host: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500 font-mono"
                      placeholder="localhost"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Port</label>
                    <input
                      type="number"
                      value={newSession.port}
                      onChange={(e) => setNewSession({ ...newSession, port: parseInt(e.target.value) || 22 })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Username</label>
                  <input
                    value={newSession.username}
                    onChange={(e) => setNewSession({ ...newSession, username: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500 font-mono"
                    placeholder="root"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNewSession(false)}
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
