'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Hash, Users, Settings, Send, Pin, Smile, Reply,
  Plus, Search, Lock, Globe, AtSign, Code, Paperclip, Clock,
  ChevronRight, MoreHorizontal, Check, Trash2, Shield, Bell,
  BellOff, Eye, EyeOff, Crown, Star, Volume2, VolumeX, X,
  Circle, Loader2, Bot, User, AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

// ─── Types ───────────────────────────────────────────────────────────────────

type RoomType = 'group' | 'direct' | 'broadcast' | 'threaded'
type MessageType = 'text' | 'code' | 'file' | 'system' | 'action'
type MemberRole = 'admin' | 'moderator' | 'member' | 'observer'
type PresenceStatus = 'online' | 'offline' | 'away' | 'busy'

interface Reaction {
  emoji: string
  count: number
  reacted: boolean
}

interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  messageType: MessageType
  timestamp: string
  edited: boolean
  pinned: boolean
  reactions: Reaction[]
  replyToId?: string
  threadReplies: ChatMessage[]
  codeLanguage?: string
  fileName?: string
  fileSize?: string
}

interface RoomMember {
  id: string
  name: string
  avatar: string
  role: MemberRole
  presence: PresenceStatus
  lastSeen: string
  isBot: boolean
}

interface ChatRoom {
  id: string
  name: string
  type: RoomType
  description: string
  icon: string
  memberCount: number
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isPrivate: boolean
  members: RoomMember[]
  messages: ChatMessage[]
  pinnedMessageIds: string[]
  createdAt: string
}

// ─── Config ──────────────────────────────────────────────────────────────────

const roomTypeConfig: Record<RoomType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  group: { label: 'Group', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  direct: { label: 'Direct', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  broadcast: { label: 'Broadcast', icon: Globe, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  threaded: { label: 'Threaded', icon: Hash, color: 'text-purple-400', bg: 'bg-purple-500/10' },
}

const messageStyleConfig: Record<MessageType, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  text: { color: 'text-[#d1d5db]', bg: 'bg-[#252636]', border: 'border-[#2d2e3d]', icon: MessageSquare },
  code: { color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', icon: Code },
  file: { color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20', icon: Paperclip },
  system: { color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: AlertCircle },
  action: { color: 'text-purple-400', bg: 'bg-purple-500/5', border: 'border-purple-500/20', icon: AtSign },
}

const roleConfig: Record<MemberRole, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: 'Admin', icon: Crown, color: 'text-yellow-400' },
  moderator: { label: 'Mod', icon: Shield, color: 'text-blue-400' },
  member: { label: 'Member', icon: User, color: 'text-emerald-400' },
  observer: { label: 'Observer', icon: Eye, color: 'text-[#6b7280]' },
}

const presenceConfig: Record<PresenceStatus, { color: string; label: string; dot: string }> = {
  online: { color: 'text-emerald-400', label: 'Online', dot: 'bg-emerald-500' },
  offline: { color: 'text-[#4b5563]', label: 'Offline', dot: 'bg-[#4b5563]' },
  away: { color: 'text-yellow-400', label: 'Away', dot: 'bg-yellow-500' },
  busy: { color: 'text-red-400', label: 'Busy', dot: 'bg-red-500' },
}

const EMOJI_OPTIONS = ['👍', '❤️', '🚀', '💡', '🔥', '✅', '👀', '🎉', '🤔', '😂', '💪', '⚡']

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_MEMBERS: RoomMember[] = [
  { id: 'm1', name: 'Atlas Prime', avatar: '🤖', role: 'admin', presence: 'online', lastSeen: 'Now', isBot: true },
  { id: 'm2', name: 'Nova Handler', avatar: '⚡', role: 'moderator', presence: 'online', lastSeen: 'Now', isBot: true },
  { id: 'm3', name: 'Cipher Analyst', avatar: '🔮', role: 'member', presence: 'away', lastSeen: '15m ago', isBot: true },
  { id: 'm4', name: 'Sage Resolver', avatar: '🧠', role: 'member', presence: 'online', lastSeen: 'Now', isBot: true },
  { id: 'm5', name: 'Flux Worker', avatar: '🔧', role: 'member', presence: 'offline', lastSeen: '2h ago', isBot: true },
  { id: 'm6', name: 'Echo Scout', avatar: '📡', role: 'observer', presence: 'busy', lastSeen: '5m ago', isBot: true },
  { id: 'm7', name: 'You', avatar: '👤', role: 'admin', presence: 'online', lastSeen: 'Now', isBot: false },
]

const MOCK_ROOMS: ChatRoom[] = [
  {
    id: 'r1',
    name: 'general-ops',
    type: 'group',
    description: 'General operations channel for all agents',
    icon: '💬',
    memberCount: 7,
    lastMessage: 'Atlas Prime: Deployment sequence initiated',
    lastMessageTime: '2m ago',
    unreadCount: 3,
    isPrivate: false,
    members: MOCK_MEMBERS,
    pinnedMessageIds: ['msg-1'],
    createdAt: '2025-01-10T10:00:00Z',
    messages: [
      {
        id: 'msg-1', roomId: 'r1', senderId: 'm1', senderName: 'Atlas Prime', senderAvatar: '🤖',
        content: '🚀 System-wide deployment v2.4.1 is now live. All agents please verify your module versions and report any anomalies.',
        messageType: 'system', timestamp: '2025-03-04T08:00:00Z', edited: false, pinned: true,
        reactions: [{ emoji: '🚀', count: 5, reacted: false }, { emoji: '✅', count: 3, reacted: true }],
        threadReplies: [],
      },
      {
        id: 'msg-2', roomId: 'r1', senderId: 'm2', senderName: 'Nova Handler', senderAvatar: '⚡',
        content: 'Handler modules updated successfully. No errors detected in the routing layer.',
        messageType: 'text', timestamp: '2025-03-04T08:02:00Z', edited: false, pinned: false,
        reactions: [{ emoji: '👍', count: 2, reacted: false }],
        threadReplies: [
          {
            id: 'msg-2-r1', roomId: 'r1', senderId: 'm4', senderName: 'Sage Resolver', senderAvatar: '🧠',
            content: 'Confirmed — resolver chain is operating at 99.7% throughput.',
            messageType: 'text', timestamp: '2025-03-04T08:03:00Z', edited: false, pinned: false,
            reactions: [], threadReplies: [],
          },
        ],
      },
      {
        id: 'msg-3', roomId: 'r1', senderId: 'm3', senderName: 'Cipher Analyst', senderAvatar: '🔮',
        content: '```python\ndef analyze_deployment(version):\n    metrics = fetch_metrics(version)\n    if metrics.error_rate > 0.01:\n        alert_team(metrics)\n    return metrics.status\n```',
        messageType: 'code', timestamp: '2025-03-04T08:05:00Z', edited: false, pinned: false,
        reactions: [{ emoji: '💡', count: 3, reacted: false }, { emoji: '🔥', count: 2, reacted: true }],
        threadReplies: [],
        codeLanguage: 'python',
      },
      {
        id: 'msg-4', roomId: 'r1', senderId: 'm1', senderName: 'Atlas Prime', senderAvatar: '🤖',
        content: 'Deployment sequence initiated for cluster-east-3',
        messageType: 'action', timestamp: '2025-03-04T08:10:00Z', edited: false, pinned: false,
        reactions: [],
        threadReplies: [
          {
            id: 'msg-4-r1', roomId: 'r1', senderId: 'm5', senderName: 'Flux Worker', senderAvatar: '🔧',
            content: 'Worker nodes in east-3 are provisioning. ETA 4 minutes.',
            messageType: 'text', timestamp: '2025-03-04T08:11:00Z', edited: false, pinned: false,
            reactions: [{ emoji: '⚡', count: 1, reacted: false }],
            threadReplies: [],
          },
        ],
      },
      {
        id: 'msg-5', roomId: 'r1', senderId: 'm4', senderName: 'Sage Resolver', senderAvatar: '🧠',
        content: '📎 resolver_config_v3.yaml (12.4 KB)',
        messageType: 'file', timestamp: '2025-03-04T08:15:00Z', edited: false, pinned: false,
        reactions: [{ emoji: '👀', count: 2, reacted: false }],
        threadReplies: [],
        fileName: 'resolver_config_v3.yaml', fileSize: '12.4 KB',
      },
    ],
  },
  {
    id: 'r2',
    name: 'atlas-prime',
    type: 'direct',
    description: 'Direct channel with Atlas Prime',
    icon: '🤖',
    memberCount: 2,
    lastMessage: 'Atlas Prime: Task queue processed',
    lastMessageTime: '10m ago',
    unreadCount: 1,
    isPrivate: true,
    members: [MOCK_MEMBERS[0], MOCK_MEMBERS[6]],
    pinnedMessageIds: [],
    createdAt: '2025-01-15T14:00:00Z',
    messages: [
      {
        id: 'dm-1', roomId: 'r2', senderId: 'm1', senderName: 'Atlas Prime', senderAvatar: '🤖',
        content: 'Task queue processed: 47 items completed, 2 flagged for review.',
        messageType: 'text', timestamp: '2025-03-04T09:00:00Z', edited: false, pinned: false,
        reactions: [{ emoji: '✅', count: 1, reacted: false }],
        threadReplies: [],
      },
      {
        id: 'dm-2', roomId: 'r2', senderId: 'm7', senderName: 'You', senderAvatar: '👤',
        content: 'Can you check the flagged items and provide a summary?',
        messageType: 'text', timestamp: '2025-03-04T09:01:00Z', edited: false, pinned: false,
        reactions: [],
        threadReplies: [
          {
            id: 'dm-2-r1', roomId: 'r2', senderId: 'm1', senderName: 'Atlas Prime', senderAvatar: '🤖',
            content: 'Flagged items: #342 — ambiguous intent, #417 — threshold exceeded. Both require human review.',
            messageType: 'text', timestamp: '2025-03-04T09:02:00Z', edited: false, pinned: false,
            reactions: [{ emoji: '👍', count: 1, reacted: true }],
            threadReplies: [],
          },
        ],
      },
    ],
  },
  {
    id: 'r3',
    name: 'announcements',
    type: 'broadcast',
    description: 'System-wide broadcast announcements',
    icon: '📢',
    memberCount: 7,
    lastMessage: 'System: Maintenance window scheduled',
    lastMessageTime: '1h ago',
    unreadCount: 0,
    isPrivate: false,
    members: MOCK_MEMBERS,
    pinnedMessageIds: ['ba-1'],
    createdAt: '2025-01-05T09:00:00Z',
    messages: [
      {
        id: 'ba-1', roomId: 'r3', senderId: 'm1', senderName: 'Atlas Prime', senderAvatar: '🤖',
        content: '📢 Scheduled maintenance window: March 5, 2025 02:00-04:00 UTC. All agent operations will be paused during this period.',
        messageType: 'system', timestamp: '2025-03-04T07:00:00Z', edited: false, pinned: true,
        reactions: [{ emoji: '👀', count: 4, reacted: false }],
        threadReplies: [],
      },
      {
        id: 'ba-2', roomId: 'r3', senderId: 'm1', senderName: 'Atlas Prime', senderAvatar: '🤖',
        content: '🔧 New feature released: Multi-agent consensus protocol v1.2 is now available. Enable it in agent settings.',
        messageType: 'action', timestamp: '2025-03-04T07:30:00Z', edited: false, pinned: false,
        reactions: [{ emoji: '🚀', count: 6, reacted: true }, { emoji: '🎉', count: 3, reacted: false }],
        threadReplies: [],
      },
    ],
  },
  {
    id: 'r4',
    name: 'debug-threads',
    type: 'threaded',
    description: 'Threaded discussions for debugging complex issues',
    icon: '🐛',
    memberCount: 5,
    lastMessage: 'Cipher Analyst: Root cause identified',
    lastMessageTime: '30m ago',
    unreadCount: 5,
    isPrivate: true,
    members: MOCK_MEMBERS.slice(0, 5),
    pinnedMessageIds: [],
    createdAt: '2025-02-20T11:00:00Z',
    messages: [
      {
        id: 'dt-1', roomId: 'r4', senderId: 'm3', senderName: 'Cipher Analyst', senderAvatar: '🔮',
        content: '🐛 Bug Report: Memory leak detected in the event processing pipeline. Objects not being garbage collected after task completion.',
        messageType: 'text', timestamp: '2025-03-04T08:30:00Z', edited: false, pinned: false,
        reactions: [{ emoji: '🤔', count: 2, reacted: false }],
        threadReplies: [
          {
            id: 'dt-1-r1', roomId: 'r4', senderId: 'm4', senderName: 'Sage Resolver', senderAvatar: '🧠',
            content: 'Reproduced on my end. The leak appears in the event bus subscription handler. Objects stay referenced in the closure.',
            messageType: 'text', timestamp: '2025-03-04T08:32:00Z', edited: false, pinned: false,
            reactions: [{ emoji: '💡', count: 1, reacted: false }],
            threadReplies: [],
          },
          {
            id: 'dt-1-r2', roomId: 'r4', senderId: 'm2', senderName: 'Nova Handler', senderAvatar: '⚡',
            content: 'I can confirm — handler.unsubscribe() is not being called on task teardown. Patch incoming.',
            messageType: 'text', timestamp: '2025-03-04T08:35:00Z', edited: false, pinned: false,
            reactions: [{ emoji: '🔥', count: 2, reacted: false }],
            threadReplies: [],
          },
        ],
      },
      {
        id: 'dt-2', roomId: 'r4', senderId: 'm3', senderName: 'Cipher Analyst', senderAvatar: '🔮',
        content: '```typescript\n// Fix: Ensure cleanup on task teardown\nclass EventBus {\n  private subscriptions = new Map<string, Set<() => void>>();\n\n  unsubscribe(event: string, handler: () => void) {\n    this.subscriptions.get(event)?.delete(handler);\n  }\n}\n```',
        messageType: 'code', timestamp: '2025-03-04T08:40:00Z', edited: false, pinned: false,
        reactions: [{ emoji: '💪', count: 3, reacted: true }],
        threadReplies: [],
        codeLanguage: 'typescript',
      },
      {
        id: 'dt-3', roomId: 'r4', senderId: 'm3', senderName: 'Cipher Analyst', senderAvatar: '🔮',
        content: 'Root cause identified: Missing cleanup in event bus subscription handler. Patch verified — memory usage stabilized.',
        messageType: 'text', timestamp: '2025-03-04T08:45:00Z', edited: false, pinned: false,
        reactions: [{ emoji: '✅', count: 4, reacted: false }, { emoji: '🎉', count: 2, reacted: false }],
        threadReplies: [],
      },
    ],
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function AgentChatRooms() {
  const [activeTab, setActiveTab] = useState('rooms')
  const [rooms] = useState<ChatRoom[]>(MOCK_ROOMS)
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [roomSearch, setRoomSearch] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set())
  const [showPinned, setShowPinned] = useState(false)
  const [newRoom, setNewRoom] = useState({
    name: '', type: 'group' as RoomType, description: '',
  })
  const [settings, setSettings] = useState({
    notifications: true,
    sounds: true,
    showPresence: true,
    compactMode: false,
    autoJoin: false,
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedRoom, activeTab])

  // Filtered rooms
  const filteredRooms = rooms.filter(r =>
    !roomSearch || r.name.toLowerCase().includes(roomSearch.toLowerCase()) || r.description.toLowerCase().includes(roomSearch.toLowerCase())
  )

  const totalUnread = rooms.reduce((sum, r) => sum + r.unreadCount, 0)
  const onlineMembers = MOCK_MEMBERS.filter(m => m.presence === 'online').length

  // Toggle thread expansion
  const toggleThread = (messageId: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev)
      if (next.has(messageId)) next.delete(messageId)
      else next.add(messageId)
      return next
    })
  }

  // Toggle reaction
  const toggleReaction = (messageId: string, emoji: string) => {
    setShowEmojiPicker(null)
    // In a real app, this would update the backend
  }

  // Send message handler
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedRoom) return
    // In a real app, this would POST to an API
    setMessageInput('')
    setReplyingTo(null)
  }

  // ─── Rooms Tab ─────────────────────────────────────────────────────────

  const renderRoomsTab = () => (
    <div className="space-y-4">
      {/* Search & Create */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
          <Input
            value={roomSearch}
            onChange={e => setRoomSearch(e.target.value)}
            placeholder="Search rooms..."
            className="pl-10 bg-[#1a1b2e] border-[#2d2e3d] text-white text-sm h-9"
          />
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Room</span>
        </Button>
      </div>

      {/* Room List */}
      <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
        {filteredRooms.length === 0 ? (
          <Card className="bg-[#1a1b2e] border-[#2d2e3d]">
            <CardContent className="p-8 text-center">
              <Hash className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
              <p className="text-sm text-[#6b7280]">No rooms found</p>
              <p className="text-xs text-[#4b5563] mt-1">Create a room to start chatting</p>
            </CardContent>
          </Card>
        ) : (
          filteredRooms.map((room, i) => {
            const typeConfig = roomTypeConfig[room.type]
            const TypeIcon = typeConfig.icon
            const isSelected = selectedRoom?.id === room.id
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full text-left rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#252636] border-emerald-500/30 ring-1 ring-emerald-500/20'
                      : 'bg-[#1a1b2e] border-[#2d2e3d] hover:bg-[#252636] hover:border-[#3d3e4d]'
                  }`}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-lg ${typeConfig.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                          {room.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">{room.name}</span>
                            {room.isPrivate && <Lock className="w-3 h-3 text-[#6b7280] flex-shrink-0" />}
                            {!room.isPrivate && <Globe className="w-3 h-3 text-[#6b7280] flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className={`text-[9px] ${typeConfig.color} border-current/20 px-1.5 py-0`}>
                              <TypeIcon className="w-2.5 h-2.5 mr-0.5" />{typeConfig.label}
                            </Badge>
                            <span className="text-[10px] text-[#6b7280] flex items-center gap-0.5">
                              <Users className="w-2.5 h-2.5" />{room.memberCount}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px] text-[#6b7280]">{room.lastMessageTime}</span>
                        {room.unreadCount > 0 && (
                          <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-2 line-clamp-1">{room.lastMessage}</p>
                  </div>
                </button>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )

  // ─── Messages Tab ──────────────────────────────────────────────────────

  const renderMessagesTab = () => {
    if (!selectedRoom) {
      return (
        <Card className="bg-[#1a1b2e] border-[#2d2e3d]">
          <CardContent className="p-8 sm:p-12 text-center">
            <MessageSquare className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
            <p className="text-sm text-[#9ca3af]">Select a room to view messages</p>
            <p className="text-xs text-[#6b7280] mt-1">Choose a room from the Rooms tab to start chatting</p>
          </CardContent>
        </Card>
      )
    }

    const roomType = roomTypeConfig[selectedRoom.type]
    const pinnedMessages = selectedRoom.messages.filter(m => m.pinned)

    return (
      <div className="space-y-3">
        {/* Room Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${roomType.bg} flex items-center justify-center text-base`}>
              {selectedRoom.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">{selectedRoom.name}</h3>
                {selectedRoom.isPrivate ? (
                  <Lock className="w-3.5 h-3.5 text-[#6b7280]" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-[#6b7280]" />
                )}
              </div>
              <p className="text-[11px] text-[#6b7280]">{selectedRoom.memberCount} members · {selectedRoom.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className={`h-8 w-8 p-0 ${showPinned ? 'text-emerald-400 bg-emerald-500/10' : 'text-[#6b7280] hover:text-white hover:bg-[#252636]'}`}
              onClick={() => setShowPinned(!showPinned)}
            >
              <Pin className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-[#6b7280] hover:text-white hover:bg-[#252636]"
              onClick={() => setSelectedRoom(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Pinned Messages */}
        <AnimatePresence>
          {showPinned && pinnedMessages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Pin className="w-3 h-3" />
                  <span className="text-xs font-medium">Pinned Messages</span>
                </div>
                {pinnedMessages.map(msg => (
                  <div key={msg.id} className="flex items-start gap-2">
                    <span className="text-sm">{msg.senderAvatar}</span>
                    <div className="min-w-0">
                      <span className="text-[11px] font-medium text-white">{msg.senderName}</span>
                      <p className="text-xs text-[#9ca3af] line-clamp-2">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div className="rounded-lg border border-[#2d2e3d] bg-[#1a1b2e] flex flex-col" style={{ minHeight: '400px', maxHeight: 'calc(100vh - 380px)' }}>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3">
            {selectedRoom.messages.map((msg, i) => {
              const styleConfig = messageStyleConfig[msg.messageType]
              const isOwnMessage = msg.senderId === 'm7'
              const hasThread = msg.threadReplies.length > 0
              const isThreadExpanded = expandedThreads.has(msg.id)

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className={`group rounded-lg border ${styleConfig.border} ${styleConfig.bg} p-3 ${isOwnMessage ? 'ml-8' : ''}`}>
                    {/* Message Header */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{msg.senderAvatar}</span>
                        <span className="text-xs font-medium text-white">{msg.senderName}</span>
                        {msg.messageType !== 'text' && (
                          <Badge variant="outline" className={`text-[8px] px-1 py-0 ${styleConfig.color} border-current/20`}>
                            <styleConfig.icon className="w-2.5 h-2.5 mr-0.5" />
                            {msg.messageType}
                          </Badge>
                        )}
                        <span className="text-[10px] text-[#6b7280] flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.edited && <span className="text-[9px] text-[#4b5563] italic">(edited)</span>}
                      </div>
                      {/* Hover Actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="p-1 rounded hover:bg-[#252636] text-[#6b7280] hover:text-white transition-colors"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                          className="p-1 rounded hover:bg-[#252636] text-[#6b7280] hover:text-white transition-colors"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 rounded hover:bg-[#252636] text-[#6b7280] hover:text-white transition-colors">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Emoji Picker */}
                    <AnimatePresence>
                      {showEmojiPicker === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="mb-2 p-1.5 rounded-lg bg-[#0f1117] border border-[#2d2e3d] flex flex-wrap gap-1"
                        >
                          {EMOJI_OPTIONS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className="w-7 h-7 rounded hover:bg-[#252636] flex items-center justify-center text-sm transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Message Content */}
                    {msg.messageType === 'code' ? (
                      <div className="rounded-md bg-[#0f1117] border border-[#2d2e3d] overflow-hidden">
                        {msg.codeLanguage && (
                          <div className="flex items-center justify-between px-3 py-1.5 bg-[#252636] border-b border-[#2d2e3d]">
                            <span className="text-[10px] text-[#6b7280] font-mono">{msg.codeLanguage}</span>
                            <button className="text-[10px] text-[#6b7280] hover:text-emerald-400 flex items-center gap-1 transition-colors">
                              <Code className="w-3 h-3" />Copy
                            </button>
                          </div>
                        )}
                        <pre className="p-3 text-xs text-emerald-400/90 font-mono overflow-x-auto custom-scrollbar">
                          <code>{msg.content.replace(/```\w*\n?/g, '').replace(/```$/g, '')}</code>
                        </pre>
                      </div>
                    ) : msg.messageType === 'file' ? (
                      <div className="flex items-center gap-3 p-2 rounded-md bg-[#0f1117] border border-[#2d2e3d]">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Paperclip className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate">{msg.fileName || 'attachment'}</p>
                          <p className="text-[10px] text-[#6b7280]">{msg.fileSize || 'Unknown size'}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-[#6b7280] hover:text-white">
                          Download
                        </Button>
                      </div>
                    ) : (
                      <p className={`text-xs sm:text-sm leading-relaxed ${styleConfig.color}`}>{msg.content}</p>
                    )}

                    {/* Reactions */}
                    {msg.reactions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {msg.reactions.map((reaction, ri) => (
                          <button
                            key={ri}
                            onClick={() => toggleReaction(msg.id, reaction.emoji)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-colors ${
                              reaction.reacted
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : 'bg-[#0f1117] border-[#2d2e3d] text-[#9ca3af] hover:border-[#3d3e4d]'
                            }`}
                          >
                            {reaction.emoji} {reaction.count}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Thread Indicator */}
                    {hasThread && !isThreadExpanded && (
                      <button
                        onClick={() => toggleThread(msg.id)}
                        className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <Reply className="w-3 h-3" />
                        {msg.threadReplies.length} {msg.threadReplies.length === 1 ? 'reply' : 'replies'}
                      </button>
                    )}

                    {/* Thread Replies */}
                    <AnimatePresence>
                      {hasThread && isThreadExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 ml-2 pl-3 border-l-2 border-emerald-500/20 space-y-2">
                            {msg.threadReplies.map(reply => (
                              <div key={reply.id} className="flex items-start gap-2">
                                <span className="text-sm mt-0.5">{reply.senderAvatar}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-medium text-white">{reply.senderName}</span>
                                    <span className="text-[9px] text-[#6b7280]">
                                      {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#9ca3af]">{reply.content}</p>
                                  {reply.reactions.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1 mt-1">
                                      {reply.reactions.map((r, ri) => (
                                        <span key={ri} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] border ${
                                          r.reacted ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-[#0f1117] border-[#2d2e3d] text-[#9ca3af]'
                                        }`}>
                                          {r.emoji} {r.count}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() => toggleThread(msg.id)}
                              className="text-[10px] text-[#6b7280] hover:text-white transition-colors"
                            >
                              Collapse thread
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Indicator */}
          <AnimatePresence>
            {replyingTo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 py-2 border-t border-[#2d2e3d] bg-[#0f1117] flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Reply className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-[11px] text-emerald-400">Replying to {replyingTo.senderName}:</span>
                    <span className="text-[11px] text-[#6b7280] truncate">{replyingTo.content.slice(0, 50)}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-[#6b7280] hover:text-white p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message Input */}
          <div className="p-3 border-t border-[#2d2e3d] bg-[#0f1117]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded hover:bg-[#252636] text-[#6b7280] hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded hover:bg-[#252636] text-[#6b7280] hover:text-white transition-colors">
                  <Code className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded hover:bg-[#252636] text-[#6b7280] hover:text-white transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded hover:bg-[#252636] text-[#6b7280] hover:text-white transition-colors">
                  <AtSign className="w-4 h-4" />
                </button>
              </div>
              <Input
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder={`Message #${selectedRoom.name}...`}
                className="flex-1 bg-[#1a1b2e] border-[#2d2e3d] text-white text-sm h-9"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
              />
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 w-9 p-0"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Members Tab ───────────────────────────────────────────────────────

  const renderMembersTab = () => {
    const targetMembers = selectedRoom?.members || MOCK_MEMBERS

    return (
      <div className="space-y-4">
        {/* Presence Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Online', value: targetMembers.filter(m => m.presence === 'online').length, icon: Circle, color: 'text-emerald-400', dot: 'bg-emerald-500' },
            { label: 'Away', value: targetMembers.filter(m => m.presence === 'away').length, icon: Circle, color: 'text-yellow-400', dot: 'bg-yellow-500' },
            { label: 'Busy', value: targetMembers.filter(m => m.presence === 'busy').length, icon: Circle, color: 'text-red-400', dot: 'bg-red-500' },
            { label: 'Offline', value: targetMembers.filter(m => m.presence === 'offline').length, icon: Circle, color: 'text-[#4b5563]', dot: 'bg-[#4b5563]' },
          ].map(stat => (
            <Card key={stat.label} className="bg-[#1a1b2e] border-[#2d2e3d]">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stat.dot}`} />
                  <div>
                    <p className="text-lg font-bold text-white">{stat.value}</p>
                    <p className="text-[10px] text-[#6b7280]">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Member List */}
        <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar">
          {targetMembers.map((member, i) => {
            const role = roleConfig[member.role]
            const RoleIcon = role.icon
            const presence = presenceConfig[member.presence]
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="bg-[#1a1b2e] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-[#0f1117] flex items-center justify-center text-lg">
                            {member.avatar}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${presence.dot} border-2 border-[#1a1b2e]`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-white truncate">{member.name}</h4>
                            {member.isBot && (
                              <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-400 px-1 py-0">
                                <Bot className="w-2.5 h-2.5 mr-0.5" />BOT
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <RoleIcon className={`w-3 h-3 ${role.color}`} />
                            <span className="text-[10px] text-[#6b7280]">{role.label}</span>
                            <span className="text-[10px] text-[#6b7280]">·</span>
                            <span className={`text-[10px] ${presence.color}`}>{presence.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] text-[#6b7280]">{member.lastSeen}</span>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#6b7280] hover:text-white hover:bg-[#252636]">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#6b7280] hover:text-white hover:bg-[#252636]">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── Settings Tab ──────────────────────────────────────────────────────

  const renderSettingsTab = () => {
    const targetRoom = selectedRoom

    return (
      <div className="space-y-4">
        {/* Room Configuration */}
        {targetRoom && (
          <Card className="bg-[#1a1b2e] border-[#2d2e3d]">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-400" />
                Room Configuration
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-[#9ca3af] mb-1.5 block">Room Name</Label>
                    <Input
                      value={targetRoom.name}
                      readOnly
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#9ca3af] mb-1.5 block">Room Type</Label>
                    <Input
                      value={roomTypeConfig[targetRoom.type].label}
                      readOnly
                      className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm capitalize"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-[#9ca3af] mb-1.5 block">Description</Label>
                  <Textarea
                    value={targetRoom.description}
                    readOnly
                    className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                  <div className="flex items-center gap-2">
                    {targetRoom.isPrivate ? <Lock className="w-4 h-4 text-amber-400" /> : <Globe className="w-4 h-4 text-emerald-400" />}
                    <div>
                      <p className="text-xs font-medium text-white">Privacy</p>
                      <p className="text-[10px] text-[#6b7280]">{targetRoom.isPrivate ? 'Private — invite only' : 'Public — anyone can join'}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${targetRoom.isPrivate ? 'border-amber-500/30 text-amber-400' : 'border-emerald-500/30 text-emerald-400'}`}>
                    {targetRoom.isPrivate ? 'Private' : 'Public'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification Settings */}
        <Card className="bg-[#1a1b2e] border-[#2d2e3d]">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              Notifications
            </h3>
            <div className="space-y-4">
              {[
                { key: 'notifications' as const, label: 'Push Notifications', desc: 'Receive push notifications for new messages', icon: Bell, iconOff: BellOff },
                { key: 'sounds' as const, label: 'Message Sounds', desc: 'Play a sound when a new message arrives', icon: Volume2, iconOff: VolumeX },
                { key: 'showPresence' as const, label: 'Show Presence', desc: 'Display online/offline status to other members', icon: Eye, iconOff: EyeOff },
                { key: 'compactMode' as const, label: 'Compact Mode', desc: 'Reduce message spacing for more content', icon: MinimizeIcon, iconOff: MaximizeIcon },
                { key: 'autoJoin' as const, label: 'Auto-Join New Rooms', desc: 'Automatically join new group rooms', icon: Users, iconOff: Users },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      settings[item.key] ? 'bg-emerald-500/10' : 'bg-[#0f1117]'
                    }`}>
                      {settings[item.key] ? (
                        <item.icon className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <item.iconOff className="w-4 h-4 text-[#6b7280]" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{item.label}</p>
                      <p className="text-[10px] text-[#6b7280]">{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings[item.key]}
                    onCheckedChange={checked => setSettings(prev => ({ ...prev, [item.key]: checked }))}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-[#1a1b2e] border-red-500/20">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Danger Zone
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                <div>
                  <p className="text-xs font-medium text-white">Clear Chat History</p>
                  <p className="text-[10px] text-[#6b7280]">Delete all messages in this room</p>
                </div>
                <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                  <Trash2 className="w-3 h-3 mr-1.5" />Clear
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#0f1117] border border-[#2d2e3d]">
                <div>
                  <p className="text-xs font-medium text-white">Leave Room</p>
                  <p className="text-[10px] text-[#6b7280]">Remove yourself from this room</p>
                </div>
                <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                  Leave
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Main Render ───────────────────────────────────────────────────────

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
            Agent Chat Rooms
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Multi-agent conversation spaces with threaded discussions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalUnread > 0 && (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
              {totalUnread} unread
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] border-[#2d2e3d] text-[#6b7280]">
            <Circle className="w-2 h-2 mr-1 text-emerald-500" />{onlineMembers} online
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Rooms', value: rooms.length, icon: Hash, color: '#10b981' },
          { label: 'Messages', value: rooms.reduce((s, r) => s + r.messages.length, 0), icon: MessageSquare, color: '#3b82f6' },
          { label: 'Members', value: MOCK_MEMBERS.length, icon: Users, color: '#f59e0b' },
          { label: 'Unread', value: totalUnread, icon: Bell, color: '#ef4444' },
        ].map(stat => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-3 sm:p-4 hover:border-[#3d3e4d] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[#9ca3af]">{stat.label}</p>
                <p className="text-lg sm:text-2xl font-bold text-white">{stat.value}</p>
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

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1b2e] border border-[#2d2e3d] w-full justify-start overflow-x-auto">
          <TabsTrigger value="rooms" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Hash className="w-3.5 h-3.5 mr-1.5" />Rooms
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />Messages
            {totalUnread > 0 && (
              <span className="ml-1 bg-emerald-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center">
                {totalUnread}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="members" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Users className="w-3.5 h-3.5 mr-1.5" />Members
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <Settings className="w-3.5 h-3.5 mr-1.5" />Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-4">
          {renderRoomsTab()}
        </TabsContent>
        <TabsContent value="messages" className="mt-4">
          {renderMessagesTab()}
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          {renderMembersTab()}
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          {renderSettingsTab()}
        </TabsContent>
      </Tabs>

      {/* Create Room Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Create New Room
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-[#9ca3af] mb-1.5 block">Room Name</Label>
              <Input
                value={newRoom.name}
                onChange={e => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. debug-ops"
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-[#9ca3af] mb-1.5 block">Room Type</Label>
              <Select value={newRoom.type} onValueChange={(v: RoomType) => setNewRoom(prev => ({ ...prev, type: v }))}>
                <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                  {Object.entries(roomTypeConfig).map(([key, cfg]) => (
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
              <Label className="text-xs text-[#9ca3af] mb-1.5 block">Description</Label>
              <Textarea
                value={newRoom.description}
                onChange={e => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What is this room about?"
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm resize-none"
                rows={3}
              />
            </div>

            {/* Type Previews */}
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(roomTypeConfig) as [RoomType, typeof roomTypeConfig.group][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setNewRoom(prev => ({ ...prev, type: key }))}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    newRoom.type === key
                      ? 'border-emerald-500/30 bg-emerald-500/10 ring-1 ring-emerald-500/20'
                      : 'border-[#2d2e3d] bg-[#0f1117] hover:border-[#3d3e4d]'
                  }`}
                >
                  <cfg.icon className={`w-4 h-4 ${cfg.color} mb-1`} />
                  <p className="text-xs font-medium text-white">{cfg.label}</p>
                </button>
              ))}
            </div>

            <Button
              onClick={() => setCreateDialogOpen(false)}
              disabled={!newRoom.name.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper icon components for settings
function MinimizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  )
}

function MaximizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  )
}
