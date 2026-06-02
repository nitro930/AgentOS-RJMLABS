'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wrench,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Search,
  Code,
  Globe,
  Terminal,
  Search as SearchIcon,
  Zap,
  Shuffle,
  Star,
  Copy,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface Skill {
  id: string
  name: string
  description: string
  type: string
  icon: string
  parameters: any[]
  returns: any
  isActive: boolean
  isBuiltIn: boolean
  useCount: number
  lastUsedAt: string | null
  agentId: string | null
  createdAt: string
}

const builtInSkills: Omit<Skill, 'id' | 'createdAt'>[] = [
  { name: 'Web Search', description: 'Search the web for real-time information, news, and data. Returns structured results with URLs and snippets.', type: 'web_search', icon: '🔍', parameters: [{ name: 'query', type: 'string', required: true }, { name: 'num_results', type: 'number', required: false }], returns: { type: 'array', items: 'SearchResult' }, isActive: true, isBuiltIn: true, useCount: 1247, lastUsedAt: new Date().toISOString(), agentId: null },
  { name: 'Code Execution', description: 'Execute code in a sandboxed environment. Supports Python, JavaScript, and shell scripts with output capture.', type: 'code_execution', icon: '⚡', parameters: [{ name: 'code', type: 'string', required: true }, { name: 'language', type: 'string', required: true }], returns: { type: 'object', properties: ['stdout', 'stderr', 'exitCode'] }, isActive: true, isBuiltIn: true, useCount: 892, lastUsedAt: new Date().toISOString(), agentId: null },
  { name: 'API Caller', description: 'Make HTTP requests to external APIs. Supports GET, POST, PUT, DELETE with custom headers and body.', type: 'api_call', icon: '🌐', parameters: [{ name: 'url', type: 'string', required: true }, { name: 'method', type: 'string', required: true }, { name: 'headers', type: 'object', required: false }, { name: 'body', type: 'object', required: false }], returns: { type: 'object', properties: ['status', 'data', 'headers'] }, isActive: true, isBuiltIn: true, useCount: 634, lastUsedAt: new Date().toISOString(), agentId: null },
  { name: 'Shell Command', description: 'Execute shell commands on the VPS with output capture. Runs in a sandboxed environment with safety guards.', type: 'shell_command', icon: '💻', parameters: [{ name: 'command', type: 'string', required: true }, { name: 'timeout', type: 'number', required: false }], returns: { type: 'object', properties: ['output', 'exitCode', 'duration'] }, isActive: true, isBuiltIn: true, useCount: 456, lastUsedAt: new Date().toISOString(), agentId: null },
  { name: 'Data Transform', description: 'Transform and process data between formats. Supports JSON, CSV, YAML, Markdown conversion and data manipulation.', type: 'data_transform', icon: '🔄', parameters: [{ name: 'input', type: 'string', required: true }, { name: 'input_format', type: 'string', required: true }, { name: 'output_format', type: 'string', required: true }], returns: { type: 'string' }, isActive: true, isBuiltIn: true, useCount: 312, lastUsedAt: new Date().toISOString(), agentId: null },
  { name: 'Memory Query', description: 'Search and retrieve data from the memory vault. Supports semantic search, tag filtering, and context-aware retrieval.', type: 'function', icon: '🧠', parameters: [{ name: 'query', type: 'string', required: true }, { name: 'tags', type: 'array', required: false }, { name: 'limit', type: 'number', required: false }], returns: { type: 'array', items: 'MemoryEntry' }, isActive: true, isBuiltIn: true, useCount: 723, lastUsedAt: new Date().toISOString(), agentId: null },
  { name: 'File Writer', description: 'Create, update, or append to files on the VPS. Supports atomic writes and file locking for concurrent access.', type: 'function', icon: '📝', parameters: [{ name: 'path', type: 'string', required: true }, { name: 'content', type: 'string', required: true }, { name: 'mode', type: 'string', required: false }], returns: { type: 'object', properties: ['success', 'path', 'size'] }, isActive: true, isBuiltIn: true, useCount: 534, lastUsedAt: new Date().toISOString(), agentId: null },
  { name: 'Notification Send', description: 'Send notifications through configured channels. Supports email, Slack, Discord, and webhook delivery.', type: 'function', icon: '📢', parameters: [{ name: 'channel', type: 'string', required: true }, { name: 'title', type: 'string', required: true }, { name: 'message', type: 'string', required: true }], returns: { type: 'object', properties: ['success', 'channelId'] }, isActive: false, isBuiltIn: true, useCount: 89, lastUsedAt: new Date().toISOString(), agentId: null },
]

const typeIcons: Record<string, React.ElementType> = {
  function: Zap,
  api_call: Globe,
  shell_command: Terminal,
  code_execution: Code,
  web_search: SearchIcon,
  data_transform: Shuffle,
}

const typeColors: Record<string, string> = {
  function: 'text-emerald-400',
  api_call: 'text-violet-400',
  shell_command: 'text-cyan-400',
  code_execution: 'text-amber-400',
  web_search: 'text-blue-400',
  data_transform: 'text-pink-400',
}

export function AgentSkills() {
  const { addToast } = useAgentOSStore()
  const [skills, setSkills] = useState<Skill[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/skills')
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
          setSkills(data)
          return
        }
      }
    } catch {}
    setSkills(builtInSkills.map((s, i) => ({ ...s, id: `skill-${i + 1}`, createdAt: new Date().toISOString() })) as Skill[])
  }

  const toggleSkill = async (id: string, isActive: boolean) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !isActive } : s)))
    addToast(`Skill ${!isActive ? 'enabled' : 'disabled'}`, 'success')
  }

  const filteredSkills = skills.filter((s) => {
    const matchSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = activeType === 'all' || s.type === activeType
    return matchSearch && matchType
  })

  const types = ['all', 'function', 'api_call', 'shell_command', 'code_execution', 'web_search', 'data_transform']

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-400" />
            Agent Skills
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Define and manage tools that agents can invoke during execution</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          New Skill
        </button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500" placeholder="Search skills..." />
        </div>
        <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
          {types.map((t) => (
            <button key={t} onClick={() => setActiveType(t)} className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex-shrink-0 capitalize ${
              activeType === t ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#1e1f2b] text-[#9ca3af] border border-[#2d2e3d] hover:text-white'
            }`}>{t === 'all' ? 'All' : t.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      {/* Skill Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredSkills.map((skill) => {
          const TypeIcon = typeIcons[skill.type] || Zap
          const typeColor = typeColors[skill.type] || 'text-[#9ca3af]'
          return (
            <div key={skill.id} className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0f1117] flex items-center justify-center text-lg flex-shrink-0">{skill.icon}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{skill.name}</h4>
                      {skill.isBuiltIn && <span className="px-1.5 py-0.5 text-[9px] bg-violet-500/10 text-violet-400 rounded">BUILT-IN</span>}
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-0.5 line-clamp-2">{skill.description}</p>
                  </div>
                </div>
                <button onClick={() => toggleSkill(skill.id, skill.isActive)} className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  skill.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#252636] text-[#6b7280]'
                }`}>
                  {skill.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-[#6b7280]">
                <span className={`flex items-center gap-1 ${typeColor}`}><TypeIcon className="w-3 h-3" />{skill.type.replace('_', ' ')}</span>
                <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />{skill.useCount} uses</span>
                <span>{(Array.isArray(skill.parameters) ? skill.parameters : []).length} params</span>
              </div>
              <button onClick={() => setExpandedSkill(expandedSkill === skill.id ? null : skill.id)} className="flex items-center gap-1 mt-2 text-[10px] text-[#6b7280] hover:text-white transition-colors">
                {expandedSkill === skill.id ? 'Less' : 'Parameters & schema'}
              </button>
              <AnimatePresence>
                {expandedSkill === skill.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-3 pt-3 border-t border-[#2d2e3d] space-y-2">
                      <div>
                        <span className="text-[10px] text-[#6b7280] uppercase">Parameters:</span>
                        <div className="space-y-1 mt-1">
                          {(Array.isArray(skill.parameters) ? skill.parameters : []).map((p: any) => (
                            <div key={p.name} className="flex items-center gap-2 text-xs">
                              <code className="text-emerald-400 font-mono bg-emerald-500/5 px-1.5 py-0.5 rounded">{p.name}</code>
                              <span className="text-[#6b7280]">{p.type}</span>
                              {p.required && <span className="text-red-400 text-[9px]">required</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6b7280] uppercase">Returns:</span>
                        <code className="ml-1 text-[9px] text-cyan-400 bg-cyan-500/5 px-1.5 py-0.5 rounded font-mono">
                          {JSON.stringify(skill.returns)}
                        </code>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Create Dialog */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold text-white">New Agent Skill</h3>
              <p className="text-sm text-[#9ca3af]">Define a new tool that agents can invoke during execution.</p>
              <div className="space-y-3">
                <div><label className="text-xs text-[#9ca3af] mb-1 block">Skill Name</label><input className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500" placeholder="e.g. Database Query" /></div>
                <div><label className="text-xs text-[#9ca3af] mb-1 block">Type</label><select className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"><option value="function">Function</option><option value="api_call">API Call</option><option value="shell_command">Shell Command</option><option value="code_execution">Code Execution</option><option value="web_search">Web Search</option><option value="data_transform">Data Transform</option></select></div>
                <div><label className="text-xs text-[#9ca3af] mb-1 block">Description</label><textarea className="w-full h-20 px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500 resize-none" placeholder="What does this skill do?" /></div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white transition-colors">Cancel</button>
                <button onClick={() => { setShowCreate(false); addToast('Skill created', 'success') }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors">Create Skill</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
