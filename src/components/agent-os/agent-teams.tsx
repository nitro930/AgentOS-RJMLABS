'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Trash2, ChevronRight, Loader2, Search,
  CheckCircle2, XCircle, Clock, Circle, Hash, Megaphone,
  MessageSquare, Eye, Star, Radio, Shield, Crown,
  Send, Hash as HashIcon, Bot, Activity, ArrowRight, Pencil,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAgentOSStore } from '@/lib/store'

// --- Type Definitions ---
interface TeamMemberData {
  id: string
  teamId: string
  agentId: string
  role: string
  status: string
  joinedAt: string
  lastActiveAt?: string
  contribution: number
}

interface TeamChannelData {
  id: string
  teamId: string
  name: string
  type: string
  description?: string
  messages: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TeamData {
  id: string
  name: string
  description?: string
  icon: string
  color: string
  status: string
  objective?: string
  leadAgentId?: string
  sharedMemory: boolean
  sharedKnowledgeBaseId?: string
  maxMembers: number
  tags: string
  createdAt: string
  updatedAt: string
  members: TeamMemberData[]
  channels: TeamChannelData[]
  _count?: { members: number; channels: number }
}

interface AgentData {
  id: string
  name: string
  type: string
  avatar?: string
  status: string
}

interface ActivityItem {
  id: string
  type: 'member_join' | 'member_leave' | 'channel_create' | 'channel_message' | 'status_change' | 'team_create' | 'role_change'
  description: string
  timestamp: string
  icon: React.ElementType
  color: string
}

// --- Config ---
const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  lead: { label: 'Lead', icon: Crown, color: 'text-yellow-400' },
  member: { label: 'Member', icon: Users, color: 'text-blue-400' },
  specialist: { label: 'Specialist', icon: Star, color: 'text-purple-400' },
  reviewer: { label: 'Reviewer', icon: Eye, color: 'text-orange-400' },
  observer: { label: 'Observer', icon: Radio, color: 'text-[#6b7280]' },
}

const statusColors: Record<string, string> = {
  active: 'text-emerald-400',
  paused: 'text-yellow-400',
  disbanded: 'text-red-400',
  idle: 'text-[#6b7280]',
  offline: 'text-[#4b5563]',
}

const channelTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  general: { label: 'General', icon: Hash, color: 'text-blue-400' },
  task: { label: 'Task', icon: CheckCircle2, color: 'text-emerald-400' },
  review: { label: 'Review', icon: Eye, color: 'text-purple-400' },
  announcement: { label: 'Announcement', icon: Megaphone, color: 'text-orange-400' },
  standup: { label: 'Standup', icon: Activity, color: 'text-yellow-400' },
}

const teamStatusConfig: Record<string, { label: string; color: string; borderColor: string }> = {
  active: { label: 'Active', color: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
  paused: { label: 'Paused', color: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
  disbanded: { label: 'Disbanded', color: 'text-red-400', borderColor: 'border-red-500/30' },
}

export function AgentTeams() {
  const { teamsTab, setTeamsTab } = useAgentOSStore()
  const [teams, setTeams] = useState<TeamData[]>([])
  const [agents, setAgents] = useState<AgentData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [createChannelDialogOpen, setCreateChannelDialogOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<TeamChannelData | null>(null)
  const [channelMessage, setChannelMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [teamSearch, setTeamSearch] = useState('')

  const [newTeam, setNewTeam] = useState({
    name: '', description: '', icon: '👥', color: '#8b5cf6',
    objective: '', sharedMemory: true, maxMembers: 5, tags: '',
  })

  const [editTeam, setEditTeam] = useState({
    name: '', description: '', icon: '👥', color: '#8b5cf6',
    objective: '', status: 'active', sharedMemory: true, maxMembers: 5,
  })

  const [newMember, setNewMember] = useState({ agentId: '', role: 'member' })
  const [newChannel, setNewChannel] = useState({ name: '', type: 'general', description: '' })

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch('/api/teams')
      if (res.ok) {
        const data = await res.json()
        setTeams(data.teams || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents')
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || [])
      }
    } catch (e) { console.error(e) }
  }, [])

  const fetchTeamDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/teams/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedTeam(data.team)
      }
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchTeams(), fetchAgents()])
      setLoading(false)
    }
    loadAll()
  }, [fetchTeams, fetchAgents])

  // --- Handlers ---
  const handleCreateTeam = async () => {
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTeam,
          tags: newTeam.tags ? newTeam.tags.split(',').map(t => t.trim()) : [],
        }),
      })
      if (res.ok) {
        await fetchTeams()
        setCreateDialogOpen(false)
        setNewTeam({ name: '', description: '', icon: '👥', color: '#8b5cf6', objective: '', sharedMemory: true, maxMembers: 5, tags: '' })
      }
    } catch (e) { console.error(e) }
  }

  const handleUpdateTeam = async () => {
    if (!selectedTeam) return
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editTeam),
      })
      if (res.ok) {
        await fetchTeams()
        await fetchTeamDetail(selectedTeam.id)
        setEditDialogOpen(false)
      }
    } catch (e) { console.error(e) }
  }

  const handleDeleteTeam = async (id: string) => {
    try {
      await fetch(`/api/teams/${id}`, { method: 'DELETE' })
      await fetchTeams()
      if (selectedTeam?.id === id) setSelectedTeam(null)
    } catch (e) { console.error(e) }
  }

  const handleAddMember = async () => {
    if (!selectedTeam) return
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      })
      if (res.ok) {
        await fetchTeamDetail(selectedTeam.id)
        await fetchTeams()
        setAddMemberDialogOpen(false)
        setNewMember({ agentId: '', role: 'member' })
      }
    } catch (e) { console.error(e) }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeam) return
    try {
      await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
      await fetchTeamDetail(selectedTeam.id)
      await fetchTeams()
    } catch (e) { console.error(e) }
  }

  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!selectedTeam) return
    try {
      // Delete old and re-add with new role
      const member = selectedTeam.members.find(m => m.id === memberId)
      if (!member) return
      await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
      await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: member.agentId, role: newRole }),
      })
      await fetchTeamDetail(selectedTeam.id)
      await fetchTeams()
    } catch (e) { console.error(e) }
  }

  const handleCreateChannel = async () => {
    if (!selectedTeam) return
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannel),
      })
      if (res.ok) {
        await fetchTeamDetail(selectedTeam.id)
        await fetchTeams()
        setCreateChannelDialogOpen(false)
        setNewChannel({ name: '', type: 'general', description: '' })
      }
    } catch (e) { console.error(e) }
  }

  const handleSendMessage = async () => {
    if (!selectedTeam || !selectedChannel || !channelMessage.trim()) return
    try {
      await fetch(`/api/teams/${selectedTeam.id}/channels`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: selectedChannel.id,
          message: { senderId: 'user', content: channelMessage },
        }),
      })
      setChannelMessage('')
      // Refresh channel data
      await fetchTeamDetail(selectedTeam.id)
      // Update selected channel with new messages
      const updated = await db_teamChannel_findUnique(selectedTeam.id, selectedChannel.id)
      if (updated) setSelectedChannel(updated)
    } catch (e) { console.error(e) }
  }

  // Helper to refresh a single channel
  const db_teamChannel_findUnique = async (teamId: string, channelId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`)
      if (res.ok) {
        const data = await res.json()
        const ch = data.team?.channels?.find((c: TeamChannelData) => c.id === channelId)
        return ch || null
      }
    } catch (e) { console.error(e) }
    return null
  }

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent ? `${agent.avatar || '🤖'} ${agent.name}` : agentId.slice(0, 8)
  }

  const getAgentAvatar = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent?.avatar || '🤖'
  }

  // Build activity feed
  const buildActivityFeed = (): ActivityItem[] => {
    if (!selectedTeam) return []
    const items: ActivityItem[] = []

    selectedTeam.members.forEach(m => {
      items.push({
        id: `join-${m.id}`,
        type: 'member_join',
        description: `${getAgentName(m.agentId)} joined as ${roleConfig[m.role]?.label || m.role}`,
        timestamp: m.joinedAt,
        icon: Users,
        color: 'text-emerald-400',
      })
    })

    selectedTeam.channels.forEach(ch => {
      items.push({
        id: `ch-${ch.id}`,
        type: 'channel_create',
        description: `Channel #${ch.name} created`,
        timestamp: ch.createdAt,
        icon: Hash,
        color: 'text-blue-400',
      })

      try {
        const msgs = JSON.parse(ch.messages || '[]')
        msgs.forEach((msg: { senderId: string; content: string; timestamp: string }, idx: number) => {
          items.push({
            id: `msg-${ch.id}-${idx}`,
            type: 'channel_message',
            description: `${getAgentName(msg.senderId)} in #${ch.name}: ${msg.content.slice(0, 60)}`,
            timestamp: msg.timestamp,
            icon: MessageSquare,
            color: 'text-purple-400',
          })
        })
      } catch {}
    })

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return items
  }

  const filteredTeams = teams.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (teamSearch && !t.name.toLowerCase().includes(teamSearch.toLowerCase())) return false
    return true
  })

  const activeTeams = teams.filter(t => t.status === 'active').length
  const totalMembers = teams.reduce((sum, t) => sum + (t._count?.members || t.members?.length || 0), 0)
  const totalChannels = teams.reduce((sum, t) => sum + (t._count?.channels || t.channels?.length || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  // --- Detail View ---
  if (selectedTeam) {
    const activityFeed = buildActivityFeed()
    const teamStatus = teamStatusConfig[selectedTeam.status] || teamStatusConfig.active

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
              onClick={() => { setSelectedTeam(null); setSelectedChannel(null) }}
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: `${selectedTeam.color}20` }}
              >
                {selectedTeam.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedTeam.name}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${teamStatus.borderColor} ${teamStatus.color}`}>
                    {teamStatus.label}
                  </Badge>
                  {selectedTeam.sharedMemory && (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                      <Shield className="w-2.5 h-2.5 mr-0.5" />Shared Memory
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
              onClick={() => {
                setEditTeam({
                  name: selectedTeam.name,
                  description: selectedTeam.description || '',
                  icon: selectedTeam.icon,
                  color: selectedTeam.color,
                  objective: selectedTeam.objective || '',
                  status: selectedTeam.status,
                  sharedMemory: selectedTeam.sharedMemory,
                  maxMembers: selectedTeam.maxMembers,
                })
                setEditDialogOpen(true)
              }}
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />Edit
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setAddMemberDialogOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />Add Member
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
              onClick={() => setCreateChannelDialogOpen(true)}
            >
              <Hash className="w-3.5 h-3.5 mr-1.5" />Channel
            </Button>
          </div>
        </div>

        {/* Objective */}
        {selectedTeam.objective && (
          <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-[#6b7280] uppercase tracking-wider font-semibold">Objective</span>
              </div>
              <p className="text-sm text-[#9ca3af]">{selectedTeam.objective}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Members', value: selectedTeam.members?.length || 0, max: selectedTeam.maxMembers, icon: Users, color: 'text-blue-400' },
            { label: 'Channels', value: selectedTeam.channels?.length || 0, icon: Hash, color: 'text-purple-400' },
            { label: 'Active', value: selectedTeam.members?.filter(m => m.status === 'active').length || 0, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Avg Score', value: `${Math.round((selectedTeam.members?.reduce((s, m) => s + m.contribution, 0) / Math.max(selectedTeam.members?.length || 1, 1)) * 100)}%`, icon: Star, color: 'text-yellow-400' },
          ].map(stat => (
            <Card key={stat.label} className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#6b7280]">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">
                      {stat.value}
                      {stat.max ? <span className="text-sm text-[#6b7280]">/{stat.max}</span> : ''}
                    </p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={teamsTab === 'teams' ? 'members' : teamsTab} onValueChange={setTeamsTab}>
          <TabsList className="bg-[#1e1f2b] border border-[#2d2e3d] w-full justify-start overflow-x-auto">
            <TabsTrigger value="members" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <Users className="w-3.5 h-3.5 mr-1.5" />Members
            </TabsTrigger>
            <TabsTrigger value="channels" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <Hash className="w-3.5 h-3.5 mr-1.5" />Channels
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <Activity className="w-3.5 h-3.5 mr-1.5" />Activity
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-4">
            {(!selectedTeam.members || selectedTeam.members.length === 0) ? (
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-8 text-center">
                  <Users className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280] mb-3">No members in this team yet.</p>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAddMemberDialogOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />Add Member
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedTeam.members.map((member, i) => {
                  const role = roleConfig[member.role] || roleConfig.member
                  const RoleIcon = role.icon
                  const agent = agents.find(a => a.id === member.agentId)
                  const isLead = member.role === 'lead'
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className={`bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors ${isLead ? 'ring-1 ring-yellow-500/20' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#0f1117] flex items-center justify-center text-lg">
                                {agent?.avatar || '🤖'}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-white">{agent?.name || member.agentId.slice(0, 8)}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <RoleIcon className={`w-3 h-3 ${role.color}`} />
                                  <span className="text-[10px] text-[#6b7280]">{role.label}</span>
                                  <Circle className={`w-2 h-2 ${statusColors[member.status] || 'text-[#6b7280]'}`} />
                                  <span className="text-[10px] text-[#6b7280]">{member.status}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Select
                                value={member.role}
                                onValueChange={(v) => handleChangeRole(member.id, v)}
                              >
                                <SelectTrigger className="h-6 w-6 p-0 border-0 bg-transparent hover:bg-[#0f1117]">
                                  <span className="sr-only">Change role</span>
                                </SelectTrigger>
                                <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                                  {Object.entries(roleConfig).map(([key, cfg]) => (
                                    <SelectItem key={key} value={key}>
                                      <span className="flex items-center gap-2">
                                        <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
                                        {cfg.label}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:bg-red-500/10 h-6 w-6 p-0"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="p-1.5 rounded bg-[#0f1117] text-center">
                              <p className="text-xs font-bold text-emerald-400">{Math.round(member.contribution * 100)}%</p>
                              <p className="text-[9px] text-[#6b7280]">contribution</p>
                            </div>
                            <div className="p-1.5 rounded bg-[#0f1117] text-center">
                              <p className="text-xs font-bold text-blue-400">
                                {member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleDateString() : 'N/A'}
                              </p>
                              <p className="text-[9px] text-[#6b7280]">last active</p>
                            </div>
                          </div>
                          {/* Contribution bar */}
                          <div className="mt-2">
                            <div className="w-full h-1 bg-[#0f1117] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${member.contribution * 100}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                              />
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

          {/* Channels Tab */}
          <TabsContent value="channels" className="mt-4">
            {selectedChannel ? (
              /* Channel detail / messages view */
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
                    onClick={() => setSelectedChannel(null)}
                  >
                    <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                    Back
                  </Button>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">{selectedChannel.name}</h3>
                    <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#6b7280]">
                      {channelTypeConfig[selectedChannel.type]?.label || selectedChannel.type}
                    </Badge>
                  </div>
                </div>

                {selectedChannel.description && (
                  <p className="text-xs text-[#9ca3af] -mt-2">{selectedChannel.description}</p>
                )}

                {/* Messages */}
                <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                  <CardContent className="p-4">
                    <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                      {(() => {
                        try {
                          const msgs = JSON.parse(selectedChannel.messages || '[]')
                          if (msgs.length === 0) {
                            return (
                              <div className="text-center py-6">
                                <MessageSquare className="w-8 h-8 text-[#2d2e3d] mx-auto mb-2" />
                                <p className="text-xs text-[#6b7280]">No messages yet. Start the conversation!</p>
                              </div>
                            )
                          }
                          return msgs.map((msg: { senderId: string; content: string; timestamp: string }, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#0f1117] flex items-center justify-center text-xs flex-shrink-0">
                                {msg.senderId === 'user' ? '👤' : getAgentAvatar(msg.senderId)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-white">
                                    {msg.senderId === 'user' ? 'You' : getAgentName(msg.senderId)}
                                  </span>
                                  <span className="text-[9px] text-[#4b5563]">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-xs text-[#9ca3af] break-words">{msg.content}</p>
                              </div>
                            </div>
                          ))
                        } catch {
                          return <p className="text-xs text-[#6b7280] text-center py-6">No messages yet.</p>
                        }
                      })()}
                    </div>

                    {/* Message input */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#2d2e3d]">
                      <Input
                        value={channelMessage}
                        onChange={e => setChannelMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                      />
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
                        onClick={handleSendMessage}
                        disabled={!channelMessage.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Channels list view */
              (!selectedTeam.channels || selectedTeam.channels.length === 0) ? (
                <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                  <CardContent className="p-8 text-center">
                    <Hash className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                    <p className="text-sm text-[#6b7280] mb-3">No channels yet. Create a channel to start collaborating.</p>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateChannelDialogOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" />Create Channel
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedTeam.channels.map((channel, i) => {
                    const chType = channelTypeConfig[channel.type] || channelTypeConfig.general
                    const ChIcon = chType.icon
                    let messageCount = 0
                    try { messageCount = JSON.parse(channel.messages || '[]').length } catch {}
                    return (
                      <motion.div
                        key={channel.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card
                          className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors cursor-pointer"
                          onClick={() => setSelectedChannel(channel)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#0f1117] flex items-center justify-center">
                                  <ChIcon className={`w-5 h-5 ${chType.color}`} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-white">#{channel.name}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#6b7280]">
                                      {chType.label}
                                    </Badge>
                                    {!channel.isActive && (
                                      <Badge variant="outline" className="text-[9px] border-red-500/30 text-red-400">
                                        Inactive
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#4b5563]" />
                            </div>
                            {channel.description && (
                              <p className="text-xs text-[#9ca3af] mt-2 line-clamp-1">{channel.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-[#6b7280]">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />{messageCount} messages
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />{new Date(channel.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-4">
            {activityFeed.length === 0 ? (
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-8 text-center">
                  <Activity className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280]">No activity yet. Activity will appear as members join and messages are sent.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {activityFeed.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#9ca3af]">{item.description}</p>
                            <p className="text-[10px] text-[#4b5563] mt-0.5">
                              {new Date(item.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Team Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-[#9ca3af] mb-1 block">Name</label>
                  <Input
                    value={editTeam.name}
                    onChange={e => setEditTeam(p => ({ ...p, name: e.target.value }))}
                    className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Icon</label>
                  <Input
                    value={editTeam.icon}
                    onChange={e => setEditTeam(p => ({ ...p, icon: e.target.value }))}
                    className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm text-center"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
                <Input
                  value={editTeam.description}
                  onChange={e => setEditTeam(p => ({ ...p, description: e.target.value }))}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Objective</label>
                <Input
                  value={editTeam.objective}
                  onChange={e => setEditTeam(p => ({ ...p, objective: e.target.value }))}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Status</label>
                  <Select value={editTeam.status} onValueChange={v => setEditTeam(p => ({ ...p, status: v }))}>
                    <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="disbanded">Disbanded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Max Members</label>
                  <Input
                    type="number"
                    value={editTeam.maxMembers}
                    onChange={e => setEditTeam(p => ({ ...p, maxMembers: parseInt(e.target.value) || 5 }))}
                    className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                  />
                </div>
              </div>
              <Button
                onClick={handleUpdateTeam}
                disabled={!editTeam.name}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />Update Team
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Add Member to Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Agent</label>
                <Select value={newMember.agentId} onValueChange={v => setNewMember(p => ({ ...p, agentId: v }))}>
                  <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                    <SelectValue placeholder="Select agent..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                    {agents.filter(a => !selectedTeam.members?.some(m => m.agentId === a.id && m.status === 'active')).map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.avatar} {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Role</label>
                <Select value={newMember.role} onValueChange={v => setNewMember(p => ({ ...p, role: v }))}>
                  <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                    {Object.entries(roleConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddMember}
                disabled={!newMember.agentId}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />Add Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Channel Dialog */}
        <Dialog open={createChannelDialogOpen} onOpenChange={setCreateChannelDialogOpen}>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Create Channel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Name</label>
                <Input
                  value={newChannel.name}
                  onChange={e => setNewChannel(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. project-alpha"
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Type</label>
                <Select value={newChannel.type} onValueChange={v => setNewChannel(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                    {Object.entries(channelTypeConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
                <Input
                  value={newChannel.description}
                  onChange={e => setNewChannel(p => ({ ...p, description: e.target.value }))}
                  placeholder="Channel purpose..."
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <Button
                onClick={handleCreateChannel}
                disabled={!newChannel.name}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />Create Channel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // --- List View ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Agent Teams</h2>
              <p className="text-xs text-[#6b7280]">Organize agents into collaborative teams</p>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />Create Team
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Teams', value: teams.length, icon: Users, color: 'text-emerald-400' },
          { label: 'Active Teams', value: activeTeams, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Total Members', value: totalMembers, icon: Users, color: 'text-blue-400' },
          { label: 'Total Channels', value: totalChannels, icon: Hash, color: 'text-purple-400' },
        ].map(stat => (
          <Card key={stat.label} className="bg-[#1e1f2b] border-[#2d2e3d]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6b7280]">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <Input
            value={teamSearch}
            onChange={e => setTeamSearch(e.target.value)}
            placeholder="Search teams..."
            className="pl-10 bg-[#1e1f2b] border-[#2d2e3d] text-white text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-[#1e1f2b] border-[#2d2e3d] text-white text-sm">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="disbanded">Disbanded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-[#2d2e3d] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Teams Yet</h3>
            <p className="text-sm text-[#6b7280] mb-4">
              Create your first team to organize agents for collaborative work.
            </p>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Create Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team, i) => {
            const tStatus = teamStatusConfig[team.status] || teamStatusConfig.active
            const memberCount = team._count?.members || team.members?.length || 0
            const channelCount = team._count?.channels || team.channels?.length || 0
            const leadMember = team.members?.find(m => m.role === 'lead')
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/30 transition-all cursor-pointer group"
                  onClick={() => fetchTeamDetail(team.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${team.color}20` }}
                        >
                          {team.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                            {team.name}
                          </h3>
                          <Badge variant="outline" className={`text-[9px] mt-0.5 ${tStatus.borderColor} ${tStatus.color}`}>
                            {tStatus.label}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id) }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {team.description && (
                      <p className="text-xs text-[#9ca3af] line-clamp-2 mb-3">{team.description}</p>
                    )}

                    {team.objective && (
                      <div className="flex items-start gap-1.5 mb-3">
                        <Star className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#9ca3af] line-clamp-1">{team.objective}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-[#6b7280]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />{memberCount}/{team.maxMembers}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />{channelCount}
                      </span>
                      {leadMember && (
                        <span className="flex items-center gap-1">
                          <Crown className="w-3 h-3 text-yellow-400" />{getAgentName(leadMember.agentId)}
                        </span>
                      )}
                      {team.sharedMemory && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Shield className="w-3 h-3" />Shared
                        </span>
                      )}
                    </div>

                    {/* Member avatars row */}
                    {team.members && team.members.length > 0 && (
                      <div className="flex items-center mt-3 -space-x-1.5">
                        {team.members.slice(0, 5).map(m => (
                          <div
                            key={m.id}
                            className="w-6 h-6 rounded-full bg-[#0f1117] border border-[#2d2e3d] flex items-center justify-center text-[10px]"
                            title={getAgentName(m.agentId)}
                          >
                            {getAgentAvatar(m.agentId)}
                          </div>
                        ))}
                        {team.members.length > 5 && (
                          <div className="w-6 h-6 rounded-full bg-[#0f1117] border border-[#2d2e3d] flex items-center justify-center text-[9px] text-[#6b7280]">
                            +{team.members.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-[#9ca3af] mb-1 block">Team Name</label>
                <Input
                  value={newTeam.name}
                  onChange={e => setNewTeam(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Research Team Alpha"
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Icon</label>
                <Input
                  value={newTeam.icon}
                  onChange={e => setNewTeam(p => ({ ...p, icon: e.target.value }))}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm text-center"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
              <Input
                value={newTeam.description}
                onChange={e => setNewTeam(p => ({ ...p, description: e.target.value }))}
                placeholder="What does this team do?"
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Objective</label>
              <Input
                value={newTeam.objective}
                onChange={e => setNewTeam(p => ({ ...p, objective: e.target.value }))}
                placeholder="The team's shared goal"
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newTeam.color}
                    onChange={e => setNewTeam(p => ({ ...p, color: e.target.value }))}
                    className="w-8 h-8 rounded border-[#2d2e3d] bg-transparent cursor-pointer"
                  />
                  <Input
                    value={newTeam.color}
                    onChange={e => setNewTeam(p => ({ ...p, color: e.target.value }))}
                    className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm font-mono flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Max Members</label>
                <Input
                  type="number"
                  value={newTeam.maxMembers}
                  onChange={e => setNewTeam(p => ({ ...p, maxMembers: parseInt(e.target.value) || 5 }))}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Tags (comma-separated)</label>
              <Input
                value={newTeam.tags}
                onChange={e => setNewTeam(p => ({ ...p, tags: e.target.value }))}
                placeholder="research, analysis, code"
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
              />
            </div>
            <Button
              onClick={handleCreateTeam}
              disabled={!newTeam.name}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />Create Team
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
