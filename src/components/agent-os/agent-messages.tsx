'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Send,
  Plus,
  Mail,
  Share2,
  HelpCircle,
  ArrowRightLeft,
  Users,
  Hash,
  Clock,
  BarChart3,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Agent {
  id: string
  name: string
  avatar?: string
}

interface AgentMessage {
  id: string
  fromAgentId: string
  toAgentId: string
  content: string
  messageType: 'message' | 'task_delegation' | 'context_share' | 'query' | 'response'
  threadId: string
  timestamp: string
  read: boolean
}

const messageTypeConfig: Record<string, { color: string; bg: string; border: string; icon: typeof MessageSquare; label: string }> = {
  message: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: MessageSquare, label: 'Message' },
  task_delegation: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: ArrowRightLeft, label: 'Task' },
  context_share: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Share2, label: 'Context' },
  query: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: HelpCircle, label: 'Query' },
  response: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: Mail, label: 'Response' },
}

const agentColors = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-pink-500',
]

export function AgentMessages() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newFromId, setNewFromId] = useState('')
  const [newToId, setNewToId] = useState('')
  const [newMessageType, setNewMessageType] = useState<AgentMessage['messageType']>('message')
  const [newContent, setNewContent] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, messagesRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/messages'),
      ])
      const agentsData = await agentsRes.json()
      const messagesData = await messagesRes.json()
      setAgents(agentsData.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })))
      setMessages(messagesData)
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages, selectedAgentId])

  const unreadByAgent = agents.reduce<Record<string, number>>((acc, agent) => {
    acc[agent.id] = messages.filter(
      (m) => m.toAgentId === agent.id && !m.read
    ).length
    return acc
  }, {})

  const agentThreads = selectedAgentId
    ? messages
        .filter((m) => m.fromAgentId === selectedAgentId || m.toAgentId === selectedAgentId)
        .reduce<Record<string, AgentMessage[]>>((acc, m) => {
          const key = m.threadId
          if (!acc[key]) acc[key] = []
          acc[key].push(m)
          return acc
        }, {})
    : {}

  const handleCreate = async () => {
    if (!newFromId || !newToId || !newContent.trim()) return
    setIsCreating(true)
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAgentId: newFromId,
          toAgentId: newToId,
          content: newContent,
          messageType: newMessageType,
        }),
      })
      setCreateOpen(false)
      setNewFromId('')
      setNewToId('')
      setNewMessageType('message')
      setNewContent('')
      fetchData()
    } catch {
      // Error handling
    } finally {
      setIsCreating(false)
    }
  }

  const getAgentName = (id: string) => agents.find((a) => a.id === id)?.name || id
  const getAgentColor = (id: string) => agentColors[agents.findIndex((a) => a.id === id) % agentColors.length]

  const typeBreakdown = messages.reduce<Record<string, number>>((acc, m) => {
    acc[m.messageType] = (acc[m.messageType] || 0) + 1
    return acc
  }, {})

  const stats = {
    total: messages.length,
    unread: messages.filter((m) => !m.read).length,
    typeBreakdown,
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg sm:text-2xl font-bold text-white"
          >
            Agent Messages
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Inter-agent communication and task delegation
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
              <Plus className="w-4 h-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-[#9ca3af] text-xs">From Agent</Label>
                <select
                  value={newFromId}
                  onChange={(e) => setNewFromId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
                >
                  <option value="">Select agent...</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">To Agent</Label>
                <select
                  value={newToId}
                  onChange={(e) => setNewToId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
                >
                  <option value="">Select agent...</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Message Type</Label>
                <select
                  value={newMessageType}
                  onChange={(e) => setNewMessageType(e.target.value as AgentMessage['messageType'])}
                  className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
                >
                  {Object.entries(messageTypeConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Content</Label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none resize-none"
                  placeholder="Type your message..."
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newFromId || !newToId || !newContent.trim() || isCreating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isCreating ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Messages', value: stats.total, icon: MessageSquare, color: '#10b981' },
          { label: 'Unread', value: stats.unread, icon: Mail, color: '#ef4444' },
          { label: 'Agents', value: agents.length, icon: Users, color: '#3b82f6' },
          {
            label: 'Top Type',
            value: Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
            icon: Hash,
            color: '#f59e0b',
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-4 hover:border-[#3d3e4d] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[#9ca3af]">{stat.label}</p>
                <p className="text-lg sm:text-2xl font-bold text-white capitalize">{stat.value}</p>
              </div>
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Split Layout */}
      {isLoading ? (
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-5 animate-pulse">
          <div className="h-4 w-32 bg-[#252636] rounded mb-3" />
          <div className="h-3 w-48 bg-[#252636] rounded" />
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-8 sm:p-12 text-center">
          <MessageSquare className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
          <p className="text-sm text-[#9ca3af]">No agents available</p>
          <p className="text-xs text-[#6b7280] mt-1">Create agents to enable messaging</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 h-[500px]">
          {/* Agent Sidebar */}
          <div className="w-full sm:w-56 flex-shrink-0 rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] overflow-hidden">
            <div className="p-3 border-b border-[#2d2e3d]">
              <p className="text-xs text-[#9ca3af] uppercase tracking-wider">Agents</p>
            </div>
            <div className="overflow-y-auto custom-scrollbar max-h-[440px]">
              {agents.map((agent) => {
                const isSelected = selectedAgentId === agent.id
                const unread = unreadByAgent[agent.id] || 0
                const color = getAgentColor(agent.id)
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-[#252636] border-l-2 border-emerald-500'
                        : 'hover:bg-[#252636]/50 border-l-2 border-transparent'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-white truncate flex-1">{agent.name}</span>
                    {unread > 0 && (
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {unread}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] overflow-hidden flex flex-col">
            {selectedAgentId ? (
              <>
                <div className="p-3 border-b border-[#2d2e3d] flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${getAgentColor(selectedAgentId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {getAgentName(selectedAgentId).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white">{getAgentName(selectedAgentId)}</span>
                  <span className="text-[10px] text-[#6b7280]">
                    {messages.filter(
                      (m) => m.fromAgentId === selectedAgentId || m.toAgentId === selectedAgentId
                    ).length}{' '}
                    messages
                  </span>
                </div>
                <div
                  ref={threadRef}
                  className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3"
                >
                  {Object.entries(agentThreads).length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-[#6b7280]">No messages with this agent</p>
                    </div>
                  ) : (
                    Object.entries(agentThreads).map(([threadId, threadMessages]) => (
                      <div key={threadId} className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-px flex-1 bg-[#2d2e3d]" />
                          <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {threadId.substring(0, 8)}
                          </span>
                          <div className="h-px flex-1 bg-[#2d2e3d]" />
                        </div>
                        {threadMessages.map((msg) => {
                          const isFromSelected = msg.fromAgentId === selectedAgentId
                          const mtc = messageTypeConfig[msg.messageType]
                          const MtcIcon = mtc.icon
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isFromSelected ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-xl p-2.5 ${
                                  isFromSelected
                                    ? 'bg-emerald-500/15 border border-emerald-500/20'
                                    : 'bg-[#252636] border border-[#2d2e3d]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div
                                    className={`w-4 h-4 rounded-full ${getAgentColor(msg.fromAgentId)} flex items-center justify-center text-[8px] text-white font-bold`}
                                  >
                                    {getAgentName(msg.fromAgentId).charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-[11px] font-medium text-white">
                                    {getAgentName(msg.fromAgentId)}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded ${mtc.bg} ${mtc.border} border ${mtc.color}`}
                                  >
                                    <MtcIcon className="w-2.5 h-2.5" />
                                    {mtc.label}
                                  </span>
                                  {!msg.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  )}
                                </div>
                                <p className="text-[12px] text-[#d1d5db] leading-relaxed">{msg.content}</p>
                                <p className="text-[9px] text-[#6b7280] mt-1 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-8 h-8 text-[#6b7280] mx-auto mb-2" />
                  <p className="text-sm text-[#9ca3af]">Select an agent to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
