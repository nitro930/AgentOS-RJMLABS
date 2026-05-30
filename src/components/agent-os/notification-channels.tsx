'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone,
  Plus,
  Trash2,
  Power,
  PowerOff,
  TestTube,
  Mail,
  Hash,
  MessageCircle,
  Globe,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface Channel {
  id: string
  name: string
  type: string
  config: any
  isActive: boolean
  triggerEvents: string[]
  lastTriggeredAt: string | null
  triggerCount: number
  failCount: number
  createdAt: string
}

interface Delivery {
  id: string
  channelId: string
  status: string
  payload: any
  attempts: number
  createdAt: string
}

const channelIcons: Record<string, React.ElementType> = {
  email: Mail,
  slack: Hash,
  discord: MessageCircle,
  webhook: Globe,
  telegram: Send,
}

const channelColors: Record<string, string> = {
  email: 'text-blue-400',
  slack: 'text-purple-400',
  discord: 'text-indigo-400',
  webhook: 'text-emerald-400',
  telegram: 'text-cyan-400',
}

const defaultChannels: Omit<Channel, 'id' | 'createdAt'>[] = [
  { name: 'Ops Slack Channel', type: 'slack', config: { webhookUrl: 'https://hooks.slack.com/services/...', channel: '#agentos-alerts' }, isActive: true, triggerEvents: ['agent:error', 'budget:alert', 'health:critical'], lastTriggeredAt: new Date().toISOString(), triggerCount: 47, failCount: 2 },
  { name: 'Admin Email Alerts', type: 'email', config: { to: 'admin@agentos.dev', subject: '[AgentOS] Alert' }, isActive: true, triggerEvents: ['security:breach', 'system:down'], lastTriggeredAt: null, triggerCount: 3, failCount: 0 },
  { name: 'Discord Dev Channel', type: 'discord', config: { webhookUrl: 'https://discord.com/api/webhooks/...' }, isActive: false, triggerEvents: ['agent:complete', 'workflow:success'], lastTriggeredAt: null, triggerCount: 0, failCount: 0 },
  { name: 'Monitoring Webhook', type: 'webhook', config: { url: 'https://monitoring.example.com/api/alerts', method: 'POST' }, isActive: true, triggerEvents: ['health:warning', 'health:critical'], lastTriggeredAt: new Date().toISOString(), triggerCount: 128, failCount: 5 },
]

const recentDeliveries: Delivery[] = [
  { id: '1', channelId: 'ch1', status: 'sent', payload: { title: 'Agent Error', message: 'Hermes failed task #42' }, attempts: 1, createdAt: new Date(Date.now() - 300000).toISOString() },
  { id: '2', channelId: 'ch2', status: 'sent', payload: { title: 'Budget Alert', message: 'Monthly spend reached 80%' }, attempts: 1, createdAt: new Date(Date.now() - 900000).toISOString() },
  { id: '3', channelId: 'ch4', status: 'failed', payload: { title: 'Health Critical', message: 'CPU usage above 95%' }, attempts: 3, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: '4', channelId: 'ch1', status: 'sent', payload: { title: 'Workflow Complete', message: 'Daily SEO report generated' }, attempts: 1, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '5', channelId: 'ch4', status: 'sent', payload: { title: 'Health Warning', message: 'Memory usage above 85%' }, attempts: 1, createdAt: new Date(Date.now() - 7200000).toISOString() },
]

export function NotificationChannels() {
  const { addToast } = useAgentOSStore()
  const [channels, setChannels] = useState<Channel[]>([])
  const [deliveries] = useState<Delivery[]>(recentDeliveries)
  const [activeTab, setActiveTab] = useState<'channels' | 'deliveries'>('channels')
  const [showCreate, setShowCreate] = useState(false)
  const [newChannel, setNewChannel] = useState({ name: '', type: 'slack', webhookUrl: '', events: [] as string[] })

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/channels')
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) { setChannels(data); return }
      }
    } catch {}
    setChannels(defaultChannels.map((c, i) => ({ ...c, id: `ch-${i + 1}`, createdAt: new Date().toISOString() })) as Channel[])
  }

  const toggleChannel = (id: string, isActive: boolean) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !isActive } : c)))
    addToast(`Channel ${!isActive ? 'enabled' : 'disabled'}`, 'success')
  }

  const testChannel = async (channel: Channel) => {
    addToast(`Test sent to ${channel.name}`, 'success')
  }

  const allEvents = [
    'agent:start', 'agent:complete', 'agent:error',
    'workflow:success', 'workflow:failed',
    'health:warning', 'health:critical',
    'budget:alert', 'budget:exceeded',
    'security:breach', 'system:down',
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-400" />
            Alert Channels
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Configure where and how notifications get delivered</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Add Channel
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-[#1e1f2b] rounded-lg w-fit">
        {[
          { id: 'channels' as const, label: 'Channels', icon: Megaphone },
          { id: 'deliveries' as const, label: 'Delivery Log', icon: Send },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === tab.id ? 'bg-[#0f1117] text-white' : 'text-[#9ca3af] hover:text-white'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Channels Tab */}
      {activeTab === 'channels' && (
        <div className="space-y-3">
          {channels.map((channel) => {
            const Icon = channelIcons[channel.type] || Globe
            const color = channelColors[channel.type] || 'text-[#9ca3af]'
            return (
              <div key={channel.id} className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-[#0f1117] ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white">{channel.name}</h4>
                        <span className={`px-1.5 py-0.5 text-[9px] rounded capitalize ${color} bg-[#0f1117]`}>{channel.type}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-[#6b7280]">
                        <span>{channel.triggerCount} sent</span>
                        {channel.failCount > 0 && <span className="text-red-400">{channel.failCount} failed</span>}
                        {channel.lastTriggeredAt && (
                          <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(channel.lastTriggeredAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => testChannel(channel)} className="p-1.5 text-[#6b7280] hover:text-white transition-colors" title="Send test">
                      <TestTube className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleChannel(channel.id, channel.isActive)} className={`p-1.5 rounded-lg transition-colors ${channel.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#252636] text-[#6b7280]'}`}>
                      {channel.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {channel.triggerEvents.map((evt) => (
                    <span key={evt} className="px-1.5 py-0.5 bg-[#0f1117] text-[9px] text-amber-400 rounded border border-[#2d2e3d] font-mono">{evt}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delivery Log Tab */}
      {activeTab === 'deliveries' && (
        <div className="space-y-2">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {delivery.status === 'sent' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <div>
                  <p className="text-sm text-white">{delivery.payload?.title || 'Notification'}</p>
                  <p className="text-xs text-[#6b7280]">{delivery.payload?.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                {delivery.attempts > 1 && <span className="text-amber-400">{delivery.attempts} attempts</span>}
                <span>{new Date(delivery.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Channel Dialog */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold text-white">New Alert Channel</h3>
              <div className="space-y-3">
                <div><label className="text-xs text-[#9ca3af] mb-1 block">Channel Name</label><input value={newChannel.name} onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })} className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500" placeholder="e.g. Ops Slack" /></div>
                <div><label className="text-xs text-[#9ca3af] mb-1 block">Type</label><select value={newChannel.type} onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value })} className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"><option value="slack">Slack</option><option value="discord">Discord</option><option value="email">Email</option><option value="webhook">Webhook</option><option value="telegram">Telegram</option></select></div>
                <div><label className="text-xs text-[#9ca3af] mb-1 block">Webhook URL / Address</label><input value={newChannel.webhookUrl} onChange={(e) => setNewChannel({ ...newChannel, webhookUrl: e.target.value })} className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500 font-mono" placeholder="https://..." /></div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">Trigger Events</label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {allEvents.map((evt) => (
                      <button key={evt} onClick={() => {
                        const events = newChannel.events.includes(evt) ? newChannel.events.filter((e) => e !== evt) : [...newChannel.events, evt]
                        setNewChannel({ ...newChannel, events })
                      }} className={`px-1.5 py-0.5 text-[9px] rounded font-mono transition-colors ${
                        newChannel.events.includes(evt) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#0f1117] text-[#6b7280] border border-[#2d2e3d]'
                      }`}>{evt}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white transition-colors">Cancel</button>
                <button onClick={() => { setShowCreate(false); addToast('Channel created', 'success') }} disabled={!newChannel.name.trim()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50">Create Channel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
