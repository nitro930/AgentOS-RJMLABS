'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cable, Plus, Search, RefreshCw, Server, Wrench, Database, MessageSquare,
  GitBranch, Play, Trash2, ExternalLink, Circle, CheckCircle2, XCircle,
  Loader2, ChevronRight, Globe, Terminal, Plug, Copy, ArrowRight,
  Activity, Clock, Zap, AlertTriangle, Eye, Settings, BookOpen
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAgentOSStore } from '@/lib/store'

interface MCPServerData {
  id: string
  name: string
  description?: string
  version: string
  transportType: string
  command?: string
  args: string
  envVars: string
  url?: string
  headers: string
  status: string
  lastConnectedAt?: string
  toolCount: number
  resourceCount: number
  promptCount: number
  requestCount: number
  errorCount: number
  isActive: boolean
  autoConnect: boolean
  tags: string
  icon: string
  createdAt: string
  tools?: MCPToolData[]
  resources?: MCPResourceData[]
  prompts?: MCPPromptData[]
}

interface MCPToolData {
  id: string
  serverId: string
  name: string
  description?: string
  inputSchema: string
  annotations: string
  isActive: boolean
  useCount: number
  lastUsedAt?: string
  avgDuration: number
  errorRate: number
  server?: { id: string; name: string; icon: string; status: string }
}

interface MCPResourceData {
  id: string
  serverId: string
  uri: string
  name: string
  description?: string
  mimeType?: string
  isActive: boolean
  accessCount: number
  server?: { id: string; name: string; icon: string }
}

interface MCPPromptData {
  id: string
  serverId: string
  name: string
  description?: string
  arguments: string
  isActive: boolean
  useCount: number
  server?: { id: string; name: string; icon: string }
}

interface MCPExecutionData {
  id: string
  serverId: string
  type: string
  name: string
  input: string
  output?: string
  status: string
  error?: string
  duration: number
  createdAt: string
  completedAt?: string
  server?: { id: string; name: string; icon: string }
}

interface MCPPipelineData {
  id: string
  name: string
  description?: string
  status: string
  steps: string
  connections: string
  runCount: number
  lastRunAt?: string
  avgDuration: number
  successRate: number
  isPublic: boolean
  createdAt: string
}

interface MCPServerTemplate {
  name: string
  description: string
  transportType: string
  command: string
  args: string[]
  envVars?: Record<string, string>
  icon: string
  tags: string[]
  category: string
}

const statusColors: Record<string, string> = {
  connected: 'text-emerald-400',
  disconnected: 'text-[#6b7280]',
  error: 'text-red-400',
  connecting: 'text-yellow-400',
}

const statusIcons: Record<string, React.ElementType> = {
  connected: CheckCircle2,
  disconnected: Circle,
  error: XCircle,
  connecting: Loader2,
}

const transportIcons: Record<string, React.ElementType> = {
  stdio: Terminal,
  sse: Globe,
  'streamable-http': Globe,
}

export function MCPServers() {
  const { mcpTab, setMcpTab } = useAgentOSStore()
  const [servers, setServers] = useState<MCPServerData[]>([])
  const [tools, setTools] = useState<MCPToolData[]>([])
  const [resources, setResources] = useState<MCPResourceData[]>([])
  const [prompts, setPrompts] = useState<MCPPromptData[]>([])
  const [executions, setExecutions] = useState<MCPExecutionData[]>([])
  const [pipelines, setPipelines] = useState<MCPPipelineData[]>([])
  const [templates, setTemplates] = useState<MCPServerTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [registryOpen, setRegistryOpen] = useState(false)
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<MCPToolData | null>(null)
  const [executeInput, setExecuteInput] = useState('{}')
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)

  // New server form
  const [newServer, setNewServer] = useState({
    name: '', description: '', transportType: 'stdio', command: 'npx',
    args: '', envVars: '', url: '', headers: '', icon: '🔌', autoConnect: true, tags: '',
  })

  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/servers')
      if (res.ok) {
        const data = await res.json()
        setServers(data.servers || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchTools = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/tools')
      if (res.ok) {
        const data = await res.json()
        setTools(data.tools || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/resources')
      if (res.ok) {
        const data = await res.json()
        setResources(data.resources || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/prompts')
      if (res.ok) {
        const data = await res.json()
        setPrompts(data.prompts || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchExecutions = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/executions?limit=50')
      if (res.ok) {
        const data = await res.json()
        setExecutions(data.executions || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchPipelines = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/pipelines')
      if (res.ok) {
        const data = await res.json()
        setPipelines(data.pipelines || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/discover')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchServers(), fetchTools(), fetchResources(), fetchPrompts(), fetchExecutions(), fetchPipelines(), fetchTemplates()])
      setLoading(false)
    }
    loadAll()
  }, [fetchServers, fetchTools, fetchResources, fetchPrompts, fetchExecutions, fetchPipelines, fetchTemplates])

  const handleCreateServer = async () => {
    try {
      const argsArray = newServer.args ? newServer.args.split(' ').filter(Boolean) : []
      const res = await fetch('/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newServer.name,
          description: newServer.description,
          transportType: newServer.transportType,
          command: newServer.command,
          args: argsArray,
          envVars: newServer.envVars ? JSON.parse(newServer.envVars) : {},
          url: newServer.url,
          headers: newServer.headers ? JSON.parse(newServer.headers) : {},
          icon: newServer.icon,
          autoConnect: newServer.autoConnect,
          tags: newServer.tags ? newServer.tags.split(',').map(t => t.trim()) : [],
        }),
      })
      if (res.ok) {
        await fetchServers()
        await fetchTools()
        setAddDialogOpen(false)
        setNewServer({ name: '', description: '', transportType: 'stdio', command: 'npx', args: '', envVars: '', url: '', headers: '', icon: '🔌', autoConnect: true, tags: '' })
      }
    } catch (e) { console.error(e) }
  }

  const handleInstallTemplate = async (template: MCPServerTemplate) => {
    try {
      const res = await fetch('/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          transportType: template.transportType,
          command: template.command,
          args: template.args,
          envVars: template.envVars || {},
          icon: template.icon,
          autoConnect: false,
          tags: template.tags,
        }),
      })
      if (res.ok) {
        await fetchServers()
        setRegistryOpen(false)
      }
    } catch (e) { console.error(e) }
  }

  const handleDiscover = async (serverId: string) => {
    try {
      const res = await fetch('/api/mcp/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId }),
      })
      if (res.ok) {
        await fetchServers()
        await fetchTools()
        await fetchResources()
        await fetchPrompts()
      }
    } catch (e) { console.error(e) }
  }

  const handleDeleteServer = async (id: string) => {
    try {
      await fetch(`/api/mcp/servers/${id}`, { method: 'DELETE' })
      await fetchServers()
      await fetchTools()
    } catch (e) { console.error(e) }
  }

  const handleExecute = async () => {
    if (!selectedTool) return
    setExecuting(true)
    setExecutionResult(null)
    try {
      const input = executeInput ? JSON.parse(executeInput) : {}
      const res = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: selectedTool.serverId,
          toolId: selectedTool.id,
          type: 'tool',
          name: selectedTool.name,
          input,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setExecutionResult(data.execution)
        await fetchTools()
        await fetchExecutions()
      }
    } catch (e) {
      setExecutionResult({ error: 'Invalid JSON input or execution failed' })
    }
    setExecuting(false)
  }

  const handleToggleConnection = async (server: MCPServerData) => {
    if (server.status === 'connected') {
      await fetch(`/api/mcp/servers/${server.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disconnected' }),
      })
      await fetchServers()
    } else {
      await handleDiscover(server.id)
    }
  }

  const filteredTools = tools.filter(t =>
    !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalTools = servers.reduce((sum, s) => sum + s.toolCount, 0)
  const totalResources = servers.reduce((sum, s) => sum + s.resourceCount, 0)
  const totalPrompts = servers.reduce((sum, s) => sum + s.promptCount, 0)
  const connectedCount = servers.filter(s => s.status === 'connected').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Cable className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">MCP Protocol</h2>
              <p className="text-sm text-[#6b7280]">Model Context Protocol — Connect agents to external tools and data sources</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={registryOpen} onOpenChange={setRegistryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]">
                <BookOpen className="w-4 h-4 mr-2" />
                Registry
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">MCP Server Registry</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 mt-2">
                {templates.map((template, i) => {
                  const TransportIcon = transportIcons[template.transportType] || Terminal
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-lg border border-[#2d2e3d] bg-[#0f1117] hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <span className="text-2xl flex-shrink-0">{template.icon}</span>
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-white">{template.name}</h4>
                            <p className="text-xs text-[#9ca3af] mt-0.5">{template.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-[10px] border-[#2d2e3d] text-[#6b7280]">
                                <TransportIcon className="w-3 h-3 mr-1" />
                                {template.transportType}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] border-[#2d2e3d] text-[#6b7280]">
                                {template.category}
                              </Badge>
                              {template.envVars && Object.keys(template.envVars).length > 0 && (
                                <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400">
                                  Requires API keys
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          onClick={() => handleInstallTemplate(template)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Install
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Server
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">Add MCP Server</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-[#9ca3af] mb-1 block">Server Name</label>
                    <Input
                      value={newServer.name}
                      onChange={e => setNewServer(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Filesystem, GitHub, PostgreSQL"
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
                    <Input
                      value={newServer.description}
                      onChange={e => setNewServer(p => ({ ...p, description: e.target.value }))}
                      placeholder="What this server provides"
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Transport</label>
                    <Select value={newServer.transportType} onValueChange={v => setNewServer(p => ({ ...p, transportType: v }))}>
                      <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                        <SelectItem value="stdio">Stdio</SelectItem>
                        <SelectItem value="sse">SSE</SelectItem>
                        <SelectItem value="streamable-http">Streamable HTTP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">Icon</label>
                    <Input
                      value={newServer.icon}
                      onChange={e => setNewServer(p => ({ ...p, icon: e.target.value }))}
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm w-20"
                    />
                  </div>
                  {newServer.transportType === 'stdio' ? (
                    <>
                      <div>
                        <label className="text-xs text-[#9ca3af] mb-1 block">Command</label>
                        <Input
                          value={newServer.command}
                          onChange={e => setNewServer(p => ({ ...p, command: e.target.value }))}
                          placeholder="npx"
                          className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#9ca3af] mb-1 block">Arguments</label>
                        <Input
                          value={newServer.args}
                          onChange={e => setNewServer(p => ({ ...p, args: e.target.value }))}
                          placeholder="-y @mcp/server-filesystem /path"
                          className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2">
                      <label className="text-xs text-[#9ca3af] mb-1 block">Server URL</label>
                      <Input
                        value={newServer.url}
                        onChange={e => setNewServer(p => ({ ...p, url: e.target.value }))}
                        placeholder="http://localhost:3001/sse"
                        className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                      />
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="text-xs text-[#9ca3af] mb-1 block">Environment Variables (JSON)</label>
                    <Input
                      value={newServer.envVars}
                      onChange={e => setNewServer(p => ({ ...p, envVars: e.target.value }))}
                      placeholder='{"API_KEY": "your-key"}'
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-[#9ca3af] mb-1 block">Tags (comma-separated)</label>
                    <Input
                      value={newServer.tags}
                      onChange={e => setNewServer(p => ({ ...p, tags: e.target.value }))}
                      placeholder="filesystem, tools, io"
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateServer}
                  disabled={!newServer.name}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Server
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Servers', value: servers.length, sub: `${connectedCount} connected`, icon: Server, color: 'text-emerald-400' },
          { label: 'Tools', value: totalTools, sub: `${filteredTools.length} active`, icon: Wrench, color: 'text-blue-400' },
          { label: 'Resources', value: totalResources, sub: 'available', icon: Database, color: 'text-purple-400' },
          { label: 'Prompts', value: totalPrompts, sub: 'templates', icon: MessageSquare, color: 'text-orange-400' },
        ].map(stat => (
          <Card key={stat.label} className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6b7280]">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] text-[#4b5563]">{stat.sub}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={mcpTab} onValueChange={setMcpTab}>
        <TabsList className="bg-[#1e1f2b] border border-[#2d2e3d] w-full justify-start overflow-x-auto">
          <TabsTrigger value="servers" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Server className="w-3.5 h-3.5 mr-1.5" />Servers
          </TabsTrigger>
          <TabsTrigger value="tools" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Wrench className="w-3.5 h-3.5 mr-1.5" />Tools
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Database className="w-3.5 h-3.5 mr-1.5" />Resources
          </TabsTrigger>
          <TabsTrigger value="prompts" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />Prompts
          </TabsTrigger>
          <TabsTrigger value="pipelines" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <GitBranch className="w-3.5 h-3.5 mr-1.5" />Pipelines
          </TabsTrigger>
          <TabsTrigger value="executions" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Activity className="w-3.5 h-3.5 mr-1.5" />History
          </TabsTrigger>
        </TabsList>

        {/* Servers Tab */}
        <TabsContent value="servers" className="mt-4">
          {servers.length === 0 ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-12 text-center">
                <Plug className="w-12 h-12 text-[#2d2e3d] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No MCP Servers</h3>
                <p className="text-sm text-[#6b7280] mb-4">Add your first MCP server to connect your agents to external tools and data sources.</p>
                <div className="flex items-center justify-center gap-2">
                  <Button onClick={() => setRegistryOpen(true)} variant="outline" size="sm" className="border-[#2d2e3d] text-[#9ca3af]">
                    <BookOpen className="w-4 h-4 mr-2" />Browse Registry
                  </Button>
                  <Button onClick={() => setAddDialogOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />Add Server
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servers.map((server, i) => {
                const StatusIcon = statusIcons[server.status] || Circle
                const TransportIcon = transportIcons[server.transportType] || Terminal
                return (
                  <motion.div
                    key={server.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xl">{server.icon}</span>
                            <div className="min-w-0">
                              <CardTitle className="text-sm font-medium text-white truncate">{server.name}</CardTitle>
                              <p className="text-[10px] text-[#6b7280]">v{server.version}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <StatusIcon className={`w-3.5 h-3.5 ${statusColors[server.status]} ${server.status === 'connecting' ? 'animate-spin' : ''}`} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {server.description && (
                          <p className="text-xs text-[#9ca3af] line-clamp-2">{server.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] border-[#2d2e3d] text-[#6b7280]">
                            <TransportIcon className="w-3 h-3 mr-1" />
                            {server.transportType}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-[#2d2e3d] text-[#6b7280]">
                            {server.toolCount} tools
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-[#2d2e3d] text-[#6b7280]">
                            {server.resourceCount} resources
                          </Badge>
                        </div>
                        {server.status === 'connected' && (
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-1.5 rounded bg-[#0f1117]">
                              <p className="text-xs font-bold text-emerald-400">{server.requestCount}</p>
                              <p className="text-[9px] text-[#6b7280]">requests</p>
                            </div>
                            <div className="p-1.5 rounded bg-[#0f1117]">
                              <p className="text-xs font-bold text-blue-400">{server.toolCount}</p>
                              <p className="text-[9px] text-[#6b7280]">tools</p>
                            </div>
                            <div className="p-1.5 rounded bg-[#0f1117]">
                              <p className="text-xs font-bold text-red-400">{server.errorCount}</p>
                              <p className="text-[9px] text-[#6b7280]">errors</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            variant={server.status === 'connected' ? 'outline' : 'default'}
                            className={`flex-1 text-xs ${server.status === 'connected' ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                            onClick={() => handleToggleConnection(server)}
                          >
                            {server.status === 'connected' ? (
                              <><XCircle className="w-3 h-3 mr-1" />Disconnect</>
                            ) : (
                              <><Plug className="w-3 h-3 mr-1" />Connect</>
                            )}
                          </Button>
                          {server.status === 'connected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-[#2d2e3d] text-[#9ca3af] hover:text-white"
                              onClick={() => handleDiscover(server.id)}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDeleteServer(server.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search tools across all servers..."
                  className="pl-10 bg-[#1e1f2b] border-[#2d2e3d] text-white text-sm"
                />
              </div>
            </div>
            {filteredTools.length === 0 ? (
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-8 text-center">
                  <Wrench className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280]">No tools discovered yet. Connect an MCP server to discover its tools.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredTools.map((tool, i) => {
                  const annotations = (() => { try { return JSON.parse(tool.annotations || '{}') } catch { return {} } })()
                  const isReadOnly = annotations.readOnlyHint
                  const isDestructive = annotations.destructiveHint
                  return (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Wrench className="w-4 h-4 text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-medium text-white font-mono">{tool.name}</h4>
                                  {isReadOnly && (
                                    <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">read-only</Badge>
                                  )}
                                  {isDestructive && (
                                    <Badge variant="outline" className="text-[9px] border-red-500/30 text-red-400">destructive</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-[#9ca3af] mt-0.5">{tool.description || 'No description'}</p>
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-[#6b7280]">
                                  {tool.server && (
                                    <span className="flex items-center gap-1">
                                      {tool.server.icon} {tool.server.name}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> {tool.useCount} uses
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {tool.avgDuration}ms avg
                                  </span>
                                  {tool.errorRate > 0 && (
                                    <span className="flex items-center gap-1 text-red-400">
                                      <AlertTriangle className="w-3 h-3" /> {(tool.errorRate * 100).toFixed(0)}% errors
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                              onClick={() => {
                                setSelectedTool(tool)
                                try {
                                  const schema = JSON.parse(tool.inputSchema || '{}')
                                  const example: any = {}
                                  if (schema.properties) {
                                    Object.entries(schema.properties).forEach(([key, val]: [string, any]) => {
                                      example[key] = val.type === 'string' ? '' : val.type === 'number' ? 0 : val.type === 'boolean' ? false : val.type === 'array' ? [] : {}
                                    })
                                  }
                                  setExecuteInput(JSON.stringify(example, null, 2))
                                } catch {
                                  setExecuteInput('{}')
                                }
                                setExecutionResult(null)
                                setExecuteDialogOpen(true)
                              }}
                            >
                              <Play className="w-3 h-3 mr-1" />Run
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="mt-4">
          {resources.length === 0 ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <Database className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280]">No resources available. Connect an MCP server to browse its resources.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {resources.map((resource, i) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <Database className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-white">{resource.name}</h4>
                          <p className="text-xs text-[#9ca3af] font-mono truncate">{resource.uri}</p>
                          {resource.description && <p className="text-xs text-[#6b7280] mt-0.5">{resource.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {resource.mimeType && (
                            <Badge variant="outline" className="text-[10px] border-[#2d2e3d] text-[#6b7280]">{resource.mimeType}</Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] border-[#2d2e3d] text-[#6b7280]">{resource.accessCount} reads</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={async () => {
                              try {
                                await fetch('/api/mcp/execute', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ serverId: resource.serverId, type: 'resource', name: resource.uri, input: {} }),
                                })
                                fetchResources()
                                fetchExecutions()
                              } catch (e) { console.error(e) }
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />Read
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="mt-4">
          {prompts.length === 0 ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280]">No prompts available. Connect an MCP server to discover prompt templates.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {prompts.map((prompt, i) => {
                const args = (() => { try { return JSON.parse(prompt.arguments || '[]') } catch { return [] } })()
                return (
                  <motion.div
                    key={prompt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-4 h-4 text-orange-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-white">{prompt.name}</h4>
                            <p className="text-xs text-[#9ca3af]">{prompt.description || 'No description'}</p>
                            {args.length > 0 && (
                              <div className="flex items-center gap-1 mt-1.5">
                                {args.map((arg: any, j: number) => (
                                  <Badge key={j} variant="outline" className="text-[9px] border-[#2d2e3d] text-[#6b7280]">
                                    {arg.name}{arg.required ? '*' : ''}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] border-[#2d2e3d] text-[#6b7280]">{prompt.useCount} uses</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                              onClick={async () => {
                                try {
                                  const inputArgs: any = {}
                                  args.forEach((arg: any) => { inputArgs[arg.name] = arg.required ? 'REQUIRED' : 'optional' })
                                  await fetch('/api/mcp/execute', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ serverId: prompt.serverId, type: 'prompt', name: prompt.name, input: inputArgs }),
                                  })
                                  fetchPrompts()
                                  fetchExecutions()
                                } catch (e) { console.error(e) }
                              }}
                            >
                              <Play className="w-3 h-3 mr-1" />Use
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Pipelines Tab */}
        <TabsContent value="pipelines" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#9ca3af]">Chain MCP tools together into reusable pipelines</p>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={async () => {
                try {
                  await fetch('/api/mcp/pipelines', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'New Pipeline', description: 'MCP tool pipeline', steps: [], connections: [] }),
                  })
                  fetchPipelines()
                } catch (e) { console.error(e) }
              }}>
                <Plus className="w-4 h-4 mr-2" />New Pipeline
              </Button>
            </div>
            {pipelines.length === 0 ? (
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-8 text-center">
                  <GitBranch className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280] mb-3">Create pipelines to chain MCP tool calls together.</p>
                  <p className="text-xs text-[#4b5563]">For example: Search Files → Read File → Process Content → Write Output</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pipelines.map((pipeline, i) => {
                  const steps = (() => { try { return JSON.parse(pipeline.steps || '[]') } catch { return [] } })()
                  return (
                    <motion.div
                      key={pipeline.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-white">{pipeline.name}</h4>
                                <Badge variant="outline" className={`text-[10px] ${pipeline.status === 'active' ? 'border-emerald-500/30 text-emerald-400' : pipeline.status === 'draft' ? 'border-[#2d2e3d] text-[#6b7280]' : 'border-yellow-500/30 text-yellow-400'}`}>
                                  {pipeline.status}
                                </Badge>
                                {pipeline.isPublic && (
                                  <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">public</Badge>
                                )}
                              </div>
                              {pipeline.description && <p className="text-xs text-[#9ca3af] mt-0.5">{pipeline.description}</p>}
                              {steps.length > 0 && (
                                <div className="flex items-center gap-1 mt-2 flex-wrap">
                                  {steps.map((step: any, j: number) => (
                                    <span key={j} className="flex items-center gap-1">
                                      <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#9ca3af]">{step.toolName || 'step'}</Badge>
                                      {j < steps.length - 1 && <ArrowRight className="w-3 h-3 text-[#4b5563]" />}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-[#6b7280]">
                                <span>{steps.length} steps</span>
                                <span>{pipeline.runCount} runs</span>
                                <span>{(pipeline.successRate * 100).toFixed(0)}% success</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                disabled={pipeline.status === 'running' || steps.length === 0}
                              >
                                <Play className="w-3 h-3 mr-1" />Run
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
                                onClick={async () => {
                                  try {
                                    await fetch(`/api/mcp/pipelines/${pipeline.id}`, { method: 'DELETE' })
                                    fetchPipelines()
                                  } catch (e) { console.error(e) }
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="mt-4">
          {executions.length === 0 ? (
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <Activity className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280]">No execution history yet. Run an MCP tool to see results here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {executions.map((exec, i) => {
                const statusColor = exec.status === 'success' ? 'text-emerald-400' : exec.status === 'error' ? 'text-red-400' : exec.status === 'running' ? 'text-yellow-400' : 'text-[#6b7280]'
                return (
                  <motion.div
                    key={exec.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            exec.type === 'tool' ? 'bg-blue-500/10' : exec.type === 'resource' ? 'bg-purple-500/10' : 'bg-orange-500/10'
                          }`}>
                            {exec.type === 'tool' ? <Wrench className="w-3.5 h-3.5 text-blue-400" /> : exec.type === 'resource' ? <Database className="w-3.5 h-3.5 text-purple-400" /> : <MessageSquare className="w-3.5 h-3.5 text-orange-400" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-white font-mono">{exec.name}</span>
                              <span className={`text-[10px] ${statusColor}`}>{exec.status}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-[#6b7280]">
                              {exec.server && <span>{exec.server.icon} {exec.server.name}</span>}
                              <span>{exec.duration}ms</span>
                              <span>{new Date(exec.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                          {exec.output && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-[#6b7280] hover:text-white"
                              onClick={() => {
                                setSelectedTool(null)
                                setExecuteInput(exec.input)
                                setExecutionResult(exec)
                                setExecuteDialogOpen(true)
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        {exec.error && (
                          <p className="text-xs text-red-400 mt-2 pl-10">{exec.error}</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Execute Dialog */}
      <Dialog open={executeDialogOpen} onOpenChange={setExecuteDialogOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-400" />
              {selectedTool ? `Execute: ${selectedTool.name}` : 'Execution Result'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {selectedTool && (
              <>
                <div>
                  <p className="text-xs text-[#9ca3af] mb-1">{selectedTool.description || 'No description'}</p>
                  {selectedTool.server && (
                    <p className="text-[10px] text-[#6b7280]">Server: {selectedTool.server.icon} {selectedTool.server.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Input (JSON)</label>
                  <textarea
                    value={executeInput}
                    onChange={e => setExecuteInput(e.target.value)}
                    className="w-full h-32 bg-[#0f1117] border border-[#2d2e3d] rounded-md p-3 text-xs text-white font-mono resize-none focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <Button
                  onClick={handleExecute}
                  disabled={executing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {executing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  {executing ? 'Executing...' : 'Execute Tool'}
                </Button>
              </>
            )}
            {executionResult && (
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Result {executionResult.status && <span className={`ml-2 ${executionResult.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{executionResult.status}</span>}
                </label>
                <pre className="w-full bg-[#0f1117] border border-[#2d2e3d] rounded-md p-3 text-xs text-emerald-400 font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(executionResult.output || '{}'), null, 2)
                    } catch {
                      return executionResult.output || executionResult.error || 'No output'
                    }
                  })()}
                </pre>
                {executionResult.duration > 0 && (
                  <p className="text-[10px] text-[#6b7280] mt-1">Duration: {executionResult.duration}ms</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
