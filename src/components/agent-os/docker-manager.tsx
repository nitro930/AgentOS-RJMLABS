'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Container,
  Box,
  Network,
  HardDrive,
  Play,
  Square,
  RotateCcw,
  Trash2,
  Download,
  Plus,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Pause,
  Play as ResumeIcon,
  X,
  Terminal,
  Cpu,
  MemoryStick,
  Clock,
  ArrowUpDown,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

// ====== TYPES ======
interface PortMapping {
  internal: number
  external: number
  protocol: string
}

interface ContainerData {
  id: string
  name: string
  image: string
  status: string
  ports: string
  envVars: string
  networks: string
  volumes: string
  cpuPercent: number
  memoryUsage: number
  memoryLimit: number
  createdAt: string
  updatedAt: string
}

interface ImageData {
  id: string
  name: string
  tag: string
  size: number
  created: string
  containers: number
}

interface NetworkData {
  id: string
  name: string
  driver: string
  scope: string
  containers: number
  created: string
  labels: Record<string, string>
}

interface VolumeData {
  id: string
  name: string
  driver: string
  mountpoint: string
  size: number
  containers: number
  created: string
  labels: Record<string, string>
}

type TabId = 'containers' | 'images' | 'networks' | 'volumes'

// ====== HELPERS ======
const statusColors: Record<string, string> = {
  running: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  stopped: 'bg-red-500/20 text-red-400 border-red-500/30',
  paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  restarting: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  dead: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const statusDotColors: Record<string, string> = {
  running: 'bg-emerald-400',
  stopped: 'bg-red-400',
  paused: 'bg-amber-400',
  restarting: 'bg-cyan-400 animate-pulse',
  dead: 'bg-gray-500',
}

const driverColors: Record<string, string> = {
  bridge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  host: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  null: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  overlay: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  macvlan: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

function formatBytes(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb} MB`
}

function formatUptime(createdAt: string, status: string): string {
  if (status !== 'running') return '—'
  const diff = Date.now() - new Date(createdAt).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

// ====== MAIN COMPONENT ======
export function DockerManager() {
  const { dockerTab, setDockerTab } = useAgentOSStore()
  const [containers, setContainers] = useState<ContainerData[]>([])
  const [images, setImages] = useState<ImageData[]>([])
  const [networks, setNetworks] = useState<NetworkData[]>([])
  const [volumes, setVolumes] = useState<VolumeData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedContainer, setExpandedContainer] = useState<string | null>(null)
  const [containerLogs, setContainerLogs] = useState<Record<string, string>>({})
  const [loadingLogs, setLoadingLogs] = useState<Record<string, boolean>>({})

  // Dialog states
  const [showPullImageDialog, setShowPullImageDialog] = useState(false)
  const [showCreateNetworkDialog, setShowCreateNetworkDialog] = useState(false)
  const [showCreateVolumeDialog, setShowCreateVolumeDialog] = useState(false)
  const [showRunContainerDialog, setShowRunContainerDialog] = useState(false)
  const [selectedImageForRun, setSelectedImageForRun] = useState<ImageData | null>(null)

  // Form states
  const [pullImageName, setPullImageName] = useState('')
  const [networkForm, setNetworkForm] = useState({ name: '', driver: 'bridge' })
  const [volumeForm, setVolumeForm] = useState({ name: '', driver: 'local' })
  const [runContainerForm, setRunContainerForm] = useState({
    name: '',
    ports: '',
    envVars: '',
    networks: '',
    volumes: '',
  })

  const initialLoadRef = useRef(false)

  // Fetch functions
  const fetchContainers = useCallback(async () => {
    try {
      const res = await fetch('/api/docker/containers')
      if (res.ok) {
        const data = await res.json()
        setContainers(data.containers || [])
      }
    } catch (err) {
      console.error('Failed to fetch containers:', err)
    }
  }, [])

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch('/api/docker/images')
      if (res.ok) {
        const data = await res.json()
        setImages(data.images || [])
      }
    } catch (err) {
      console.error('Failed to fetch images:', err)
    }
  }, [])

  const fetchNetworks = useCallback(async () => {
    try {
      const res = await fetch('/api/docker/networks')
      if (res.ok) {
        const data = await res.json()
        setNetworks(data.networks || [])
      }
    } catch (err) {
      console.error('Failed to fetch networks:', err)
    }
  }, [])

  const fetchVolumes = useCallback(async () => {
    try {
      const res = await fetch('/api/docker/volumes')
      if (res.ok) {
        const data = await res.json()
        setVolumes(data.volumes || [])
      }
    } catch (err) {
      console.error('Failed to fetch volumes:', err)
    }
  }, [])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchContainers(), fetchImages(), fetchNetworks(), fetchVolumes()])
    setLoading(false)
  }, [fetchContainers, fetchImages, fetchNetworks, fetchVolumes])

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true
      fetchAllData()
    }
  }, [fetchAllData])

  // Container actions
  const handleContainerAction = async (containerId: string, action: string) => {
    try {
      const res = await fetch(`/api/docker/containers/${containerId}?action=${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        await fetchContainers()
      }
    } catch (err) {
      console.error(`Failed to ${action} container:`, err)
    }
  }

  const handleRemoveContainer = async (containerId: string, containerName: string) => {
    if (!confirm(`Remove container "${containerName}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/docker/containers/${containerId}`, { method: 'DELETE' })
      if (res.ok) {
        setExpandedContainer(null)
        await fetchContainers()
      }
    } catch (err) {
      console.error('Failed to remove container:', err)
    }
  }

  // Load container logs
  const loadContainerLogs = async (containerId: string) => {
    setLoadingLogs((prev) => ({ ...prev, [containerId]: true }))
    try {
      const res = await fetch(`/api/docker/containers/${containerId}`)
      if (res.ok) {
        const data = await res.json()
        setContainerLogs((prev) => ({ ...prev, [containerId]: data.logs || 'No logs available' }))
      }
    } catch (err) {
      console.error('Failed to load logs:', err)
    } finally {
      setLoadingLogs((prev) => ({ ...prev, [containerId]: false }))
    }
  }

  const toggleExpanded = (containerId: string) => {
    if (expandedContainer === containerId) {
      setExpandedContainer(null)
    } else {
      setExpandedContainer(containerId)
      if (!containerLogs[containerId]) {
        loadContainerLogs(containerId)
      }
    }
  }

  // Image actions
  const handlePullImage = async () => {
    if (!pullImageName.trim()) return
    try {
      const res = await fetch('/api/docker/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameTag: pullImageName.trim() }),
      })
      if (res.ok) {
        setShowPullImageDialog(false)
        setPullImageName('')
        await fetchImages()
      }
    } catch (err) {
      console.error('Failed to pull image:', err)
    }
  }

  const handleRemoveImage = async (imageId: string, imageName: string) => {
    if (!confirm(`Remove image "${imageName}"?`)) return
    setImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const handleRunImage = (image: ImageData) => {
    setSelectedImageForRun(image)
    setRunContainerForm({
      name: `${image.name.replace('/', '-')}-${image.tag}`,
      ports: '',
      envVars: '',
      networks: '',
      volumes: '',
    })
    setShowRunContainerDialog(true)
  }

  const handleCreateContainer = async () => {
    if (!selectedImageForRun || !runContainerForm.name) return
    try {
      const ports = runContainerForm.ports
        ? runContainerForm.ports.split(',').map((p) => {
            const [ext, int] = p.trim().split(':')
            return { internal: parseInt(int || ext), external: parseInt(ext), protocol: 'tcp' }
          })
        : []

      const envVars: Record<string, string> = {}
      if (runContainerForm.envVars) {
        runContainerForm.envVars.split(',').forEach((pair) => {
          const [key, val] = pair.trim().split('=')
          if (key) envVars[key] = val || ''
        })
      }

      const res = await fetch('/api/docker/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: runContainerForm.name,
          image: `${selectedImageForRun.name}:${selectedImageForRun.tag}`,
          ports,
          envVars,
          networks: runContainerForm.networks ? runContainerForm.networks.split(',').map((n) => n.trim()) : [],
          volumes: runContainerForm.volumes ? runContainerForm.volumes.split(',').map((v) => v.trim()) : [],
        }),
      })
      if (res.ok) {
        setShowRunContainerDialog(false)
        setSelectedImageForRun(null)
        setDockerTab('containers')
        await fetchContainers()
      }
    } catch (err) {
      console.error('Failed to create container:', err)
    }
  }

  // Network actions
  const handleCreateNetwork = async () => {
    if (!networkForm.name.trim()) return
    try {
      const res = await fetch('/api/docker/networks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(networkForm),
      })
      if (res.ok) {
        setShowCreateNetworkDialog(false)
        setNetworkForm({ name: '', driver: 'bridge' })
        await fetchNetworks()
      }
    } catch (err) {
      console.error('Failed to create network:', err)
    }
  }

  const handleRemoveNetwork = async (networkId: string, networkName: string) => {
    if (!confirm(`Remove network "${networkName}"?`)) return
    setNetworks((prev) => prev.filter((net) => net.id !== networkId))
  }

  // Volume actions
  const handleCreateVolume = async () => {
    if (!volumeForm.name.trim()) return
    try {
      const res = await fetch('/api/docker/volumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(volumeForm),
      })
      if (res.ok) {
        setShowCreateVolumeDialog(false)
        setVolumeForm({ name: '', driver: 'local' })
        await fetchVolumes()
      }
    } catch (err) {
      console.error('Failed to create volume:', err)
    }
  }

  const handleRemoveVolume = async (volumeId: string, volumeName: string) => {
    if (!confirm(`Remove volume "${volumeName}"? This will delete all data.`)) return
    setVolumes((prev) => prev.filter((vol) => vol.id !== volumeId))
  }

  // Filtering
  const filteredContainers = containers.filter((c) => {
    const q = searchQuery.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.image.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    )
  })

  const filteredImages = images.filter((img) => {
    const q = searchQuery.toLowerCase()
    return img.name.toLowerCase().includes(q) || img.tag.toLowerCase().includes(q)
  })

  const filteredNetworks = networks.filter((net) => {
    const q = searchQuery.toLowerCase()
    return net.name.toLowerCase().includes(q) || net.driver.toLowerCase().includes(q)
  })

  const filteredVolumes = volumes.filter((vol) => {
    const q = searchQuery.toLowerCase()
    return vol.name.toLowerCase().includes(q) || vol.driver.toLowerCase().includes(q)
  })

  // Stats
  const runningCount = containers.filter((c) => c.status === 'running').length
  const totalCpu = containers.reduce((sum, c) => sum + c.cpuPercent, 0)
  const totalMemory = containers.reduce((sum, c) => sum + c.memoryUsage, 0)
  const totalDisk = images.reduce((sum, img) => sum + img.size, 0)

  const tabs: { id: TabId; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'containers', label: 'Containers', icon: Container, count: containers.length },
    { id: 'images', label: 'Images', icon: Box, count: images.length },
    { id: 'networks', label: 'Networks', icon: Network, count: networks.length },
    { id: 'volumes', label: 'Volumes', icon: HardDrive, count: volumes.length },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Container className="w-8 h-8 text-emerald-400 animate-pulse" />
          <span className="text-[#9ca3af] text-sm">Loading Docker resources...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Container className="w-5 h-5 text-emerald-400" />
            Docker Manager
          </h2>
          <p className="text-xs text-[#6b7280] mt-0.5">Manage containers, images, networks, and volumes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllData}
            className="px-3 py-1.5 rounded-lg bg-[#1a1b2e] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-emerald-500/30 transition-all text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          {dockerTab === 'containers' && (
            <button
              onClick={() => {
                setSelectedImageForRun(null)
                setRunContainerForm({ name: '', ports: '', envVars: '', networks: '', volumes: '' })
                setShowRunContainerDialog(true)
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" />
              New Container
            </button>
          )}
          {dockerTab === 'images' && (
            <button
              onClick={() => setShowPullImageDialog(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all text-xs flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" />
              Pull Image
            </button>
          )}
          {dockerTab === 'networks' && (
            <button
              onClick={() => setShowCreateNetworkDialog(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" />
              Create Network
            </button>
          )}
          {dockerTab === 'volumes' && (
            <button
              onClick={() => setShowCreateVolumeDialog(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" />
              Create Volume
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Running', value: runningCount, icon: Play, color: 'text-emerald-400' },
          { label: 'CPU Usage', value: `${totalCpu.toFixed(1)}%`, icon: Cpu, color: 'text-cyan-400' },
          { label: 'Memory', value: formatBytes(totalMemory), icon: MemoryStick, color: 'text-amber-400' },
          { label: 'Disk', value: formatBytes(totalDisk), icon: HardDrive, color: 'text-purple-400' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDockerTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              dockerTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#252636]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  dockerTab === tab.id ? 'bg-emerald-500/30 text-emerald-300' : 'bg-[#2d2e3d] text-[#6b7280]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
        <input
          type="text"
          placeholder={`Search ${dockerTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#6b7280] focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ====== CONTAINERS TAB ====== */}
        {dockerTab === 'containers' && (
          <motion.div
            key="containers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {filteredContainers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Container className="w-10 h-10 text-[#4b5563] mb-3" />
                <p className="text-[#9ca3af] text-sm">No containers found</p>
                <p className="text-[#6b7280] text-xs mt-1">Create a container from an image or run a new one</p>
              </div>
            ) : (
              <div className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#252636] border-b border-[#2d2e3d] text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Image</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">CPU</div>
                  <div className="col-span-1">Memory</div>
                  <div className="col-span-1">Uptime</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                {/* Rows */}
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-[#2d2e3d]">
                  {filteredContainers.map((container, i) => {
                    const isExpanded = expandedContainer === container.id
                    const ports: PortMapping[] = JSON.parse(container.ports || '[]')
                    return (
                      <div key={container.id}>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-[#252636] transition-colors cursor-pointer"
                          onClick={() => toggleExpanded(container.id)}
                        >
                          <div className="col-span-3 flex items-center gap-2 min-w-0">
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 text-[#6b7280] flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-[#6b7280] flex-shrink-0" />
                            )}
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusDotColors[container.status]?.replace('bg-', '') || '#6b7280' }}>
                              <div className={`w-2 h-2 rounded-full ${statusDotColors[container.status] || 'bg-gray-500'}`} />
                            </div>
                            <span className="text-xs text-white font-mono truncate" title={container.name}>
                              {container.name}
                            </span>
                          </div>
                          <div className="col-span-2 text-xs text-[#9ca3af] font-mono truncate" title={container.image}>
                            {container.image}
                          </div>
                          <div className="col-span-2">
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                statusColors[container.status] || statusColors.dead
                              }`}
                            >
                              {container.status}
                            </span>
                          </div>
                          <div className="col-span-1 text-xs text-cyan-400 font-mono">
                            {container.cpuPercent.toFixed(1)}%
                          </div>
                          <div className="col-span-1 text-xs text-amber-400 font-mono">
                            {container.memoryUsage > 0 ? `${container.memoryUsage}M` : '—'}
                          </div>
                          <div className="col-span-1 text-xs text-[#9ca3af]">
                            {formatUptime(container.createdAt, container.status)}
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {container.status === 'running' && (
                              <>
                                <button
                                  onClick={() => handleContainerAction(container.id, 'pause')}
                                  className="p-1.5 rounded-md hover:bg-amber-500/20 text-[#6b7280] hover:text-amber-400 transition-colors"
                                  title="Pause"
                                >
                                  <Pause className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleContainerAction(container.id, 'stop')}
                                  className="p-1.5 rounded-md hover:bg-red-500/20 text-[#6b7280] hover:text-red-400 transition-colors"
                                  title="Stop"
                                >
                                  <Square className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleContainerAction(container.id, 'restart')}
                                  className="p-1.5 rounded-md hover:bg-cyan-500/20 text-[#6b7280] hover:text-cyan-400 transition-colors"
                                  title="Restart"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              </>
                            )}
                            {container.status === 'stopped' && (
                              <button
                                onClick={() => handleContainerAction(container.id, 'start')}
                                className="p-1.5 rounded-md hover:bg-emerald-500/20 text-[#6b7280] hover:text-emerald-400 transition-colors"
                                title="Start"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            )}
                            {container.status === 'paused' && (
                              <button
                                onClick={() => handleContainerAction(container.id, 'unpause')}
                                className="p-1.5 rounded-md hover:bg-emerald-500/20 text-[#6b7280] hover:text-emerald-400 transition-colors"
                                title="Resume"
                              >
                                <ResumeIcon className="w-3 h-3" />
                              </button>
                            )}
                            {container.status === 'dead' && (
                              <span className="text-[10px] text-red-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Dead
                              </span>
                            )}
                            <button
                              onClick={() => handleRemoveContainer(container.id, container.name)}
                              className="p-1.5 rounded-md hover:bg-red-500/20 text-[#6b7280] hover:text-red-400 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 py-3 bg-[#0f1117] border-t border-[#2d2e3d] space-y-3">
                                {/* Details Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div>
                                    <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Ports</span>
                                    <div className="mt-1 space-y-0.5">
                                      {ports.length > 0 ? (
                                        ports.map((p, idx) => (
                                          <p key={idx} className="text-xs text-emerald-400 font-mono">
                                            {p.external}:{p.internal}/{p.protocol}
                                          </p>
                                        ))
                                      ) : (
                                        <p className="text-xs text-[#6b7280]">None</p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Networks</span>
                                    <div className="mt-1 space-y-0.5">
                                      {JSON.parse(container.networks || '[]').map((n: string, idx: number) => (
                                        <p key={idx} className="text-xs text-cyan-400 font-mono">
                                          {n}
                                        </p>
                                      ))}
                                      {JSON.parse(container.networks || '[]').length === 0 && (
                                        <p className="text-xs text-[#6b7280]">None</p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">CPU / Memory</span>
                                    <div className="mt-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Cpu className="w-3 h-3 text-cyan-400" />
                                        <div className="flex-1 h-1.5 bg-[#2d2e3d] rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-cyan-400 rounded-full transition-all"
                                            style={{ width: `${Math.min(container.cpuPercent, 100)}%` }}
                                          />
                                        </div>
                                        <span className="text-[10px] text-cyan-400 font-mono">{container.cpuPercent.toFixed(1)}%</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <MemoryStick className="w-3 h-3 text-amber-400" />
                                        <div className="flex-1 h-1.5 bg-[#2d2e3d] rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-amber-400 rounded-full transition-all"
                                            style={{
                                              width: `${container.memoryLimit > 0 ? (container.memoryUsage / container.memoryLimit) * 100 : 0}%`,
                                            }}
                                          />
                                        </div>
                                        <span className="text-[10px] text-amber-400 font-mono">
                                          {container.memoryUsage}/{container.memoryLimit}MB
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Volumes</span>
                                    <div className="mt-1 space-y-0.5">
                                      {JSON.parse(container.volumes || '[]').map((v: string, idx: number) => (
                                        <p key={idx} className="text-xs text-purple-400 font-mono truncate" title={v}>
                                          {v}
                                        </p>
                                      ))}
                                      {JSON.parse(container.volumes || '[]').length === 0 && (
                                        <p className="text-xs text-[#6b7280]">None</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Logs Preview */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-[#6b7280] uppercase tracking-wider flex items-center gap-1.5">
                                      <Terminal className="w-3 h-3" />
                                      Logs
                                    </span>
                                    <button
                                      onClick={() => loadContainerLogs(container.id)}
                                      className="text-[10px] text-[#6b7280] hover:text-emerald-400 transition-colors flex items-center gap-1"
                                    >
                                      <RefreshCw className={`w-3 h-3 ${loadingLogs[container.id] ? 'animate-spin' : ''}`} />
                                      Refresh
                                    </button>
                                  </div>
                                  <div className="bg-[#0a0b0f] border border-[#2d2e3d] rounded-md p-2 max-h-32 overflow-y-auto custom-scrollbar">
                                    <pre className="text-[10px] text-[#9ca3af] font-mono whitespace-pre-wrap">
                                      {containerLogs[container.id] || 'Loading logs...'}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ====== IMAGES TAB ====== */}
        {dockerTab === 'images' && (
          <motion.div
            key="images"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Box className="w-10 h-10 text-[#4b5563] mb-3" />
                <p className="text-[#9ca3af] text-sm">No images found</p>
                <p className="text-[#6b7280] text-xs mt-1">Pull an image from a registry to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredImages.map((image, i) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg p-4 hover:border-[#3d3e4d] transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                          <Box className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white font-mono truncate">{image.name}</p>
                          <p className="text-[10px] text-[#6b7280]">:{image.tag}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#6b7280] flex-shrink-0">{formatBytes(image.size)}</span>
                    </div>

                    <div className="flex items-center gap-3 mb-3 text-[10px] text-[#6b7280]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(image.created).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Container className="w-3 h-3" />
                        {image.containers} container{image.containers !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRunImage(image)}
                        className="flex-1 px-2 py-1.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Run
                      </button>
                      <button
                        onClick={() => handleRemoveImage(image.id, `${image.name}:${image.tag}`)}
                        className="px-2 py-1.5 rounded-md bg-[#252636] border border-[#2d2e3d] text-[#6b7280] text-[10px] hover:text-red-400 hover:border-red-500/30 transition-all flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ====== NETWORKS TAB ====== */}
        {dockerTab === 'networks' && (
          <motion.div
            key="networks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {filteredNetworks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Network className="w-10 h-10 text-[#4b5563] mb-3" />
                <p className="text-[#9ca3af] text-sm">No networks found</p>
              </div>
            ) : (
              <div className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#252636] border-b border-[#2d2e3d] text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Driver</div>
                  <div className="col-span-2">Scope</div>
                  <div className="col-span-2">Containers</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-[#2d2e3d]">
                  {filteredNetworks.map((network, i) => (
                    <motion.div
                      key={network.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-[#252636] transition-colors"
                    >
                      <div className="col-span-3 flex items-center gap-2 min-w-0">
                        <Network className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span className="text-xs text-white font-mono truncate">{network.name}</span>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${driverColors[network.driver] || driverColors.bridge}`}>
                          {network.driver}
                        </span>
                      </div>
                      <div className="col-span-2 text-xs text-[#9ca3af]">{network.scope}</div>
                      <div className="col-span-2 text-xs text-emerald-400 font-mono">{network.containers}</div>
                      <div className="col-span-2 text-xs text-[#6b7280]">
                        {new Date(network.created).toLocaleDateString()}
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <button
                          onClick={() => handleRemoveNetwork(network.id, network.name)}
                          className="p-1.5 rounded-md hover:bg-red-500/20 text-[#6b7280] hover:text-red-400 transition-colors"
                          title="Remove Network"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ====== VOLUMES TAB ====== */}
        {dockerTab === 'volumes' && (
          <motion.div
            key="volumes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {filteredVolumes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <HardDrive className="w-10 h-10 text-[#4b5563] mb-3" />
                <p className="text-[#9ca3af] text-sm">No volumes found</p>
              </div>
            ) : (
              <div className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#252636] border-b border-[#2d2e3d] text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Driver</div>
                  <div className="col-span-3">Mountpoint</div>
                  <div className="col-span-1">Size</div>
                  <div className="col-span-2">Containers</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-[#2d2e3d]">
                  {filteredVolumes.map((volume, i) => (
                    <motion.div
                      key={volume.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-[#252636] transition-colors"
                    >
                      <div className="col-span-3 flex items-center gap-2 min-w-0">
                        <HardDrive className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span className="text-xs text-white font-mono truncate" title={volume.name}>
                          {volume.name}
                        </span>
                      </div>
                      <div className="col-span-2 text-xs text-[#9ca3af]">{volume.driver}</div>
                      <div className="col-span-3 text-xs text-[#6b7280] font-mono truncate" title={volume.mountpoint}>
                        {volume.mountpoint}
                      </div>
                      <div className="col-span-1 text-xs text-amber-400 font-mono">{formatBytes(volume.size)}</div>
                      <div className="col-span-2 text-xs text-emerald-400 font-mono">{volume.containers}</div>
                      <div className="col-span-1 flex items-center justify-end">
                        <button
                          onClick={() => handleRemoveVolume(volume.id, volume.name)}
                          className="p-1.5 rounded-md hover:bg-red-500/20 text-[#6b7280] hover:text-red-400 transition-colors"
                          title="Remove Volume"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== DIALOGS ====== */}

      {/* Pull Image Dialog */}
      <AnimatePresence>
        {showPullImageDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPullImageDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  Pull Image
                </h3>
                <button
                  onClick={() => setShowPullImageDialog(false)}
                  className="p-1.5 rounded-md hover:bg-[#2d2e3d] text-[#6b7280] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 block">Image Name</label>
                  <input
                    type="text"
                    placeholder="e.g. nginx:latest, node:20-alpine"
                    value={pullImageName}
                    onChange={(e) => setPullImageName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePullImage()}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#6b7280] focus:outline-none focus:border-emerald-500/50 font-mono"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#6b7280]">
                  <Info className="w-3 h-3" />
                  <span>Format: name:tag (defaults to :latest if no tag)</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => setShowPullImageDialog(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] text-xs hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePullImage}
                  disabled={!pullImageName.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Download className="w-3 h-3" />
                  Pull
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Network Dialog */}
      <AnimatePresence>
        {showCreateNetworkDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateNetworkDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" />
                  Create Network
                </h3>
                <button
                  onClick={() => setShowCreateNetworkDialog(false)}
                  className="p-1.5 rounded-md hover:bg-[#2d2e3d] text-[#6b7280] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 block">Network Name</label>
                  <input
                    type="text"
                    placeholder="e.g. my-network"
                    value={networkForm.name}
                    onChange={(e) => setNetworkForm((prev) => ({ ...prev, name: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateNetwork()}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#6b7280] focus:outline-none focus:border-emerald-500/50 font-mono"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 block">Driver</label>
                  <select
                    value={networkForm.driver}
                    onChange={(e) => setNetworkForm((prev) => ({ ...prev, driver: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-[#9ca3af] text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="bridge">bridge</option>
                    <option value="overlay">overlay</option>
                    <option value="macvlan">macvlan</option>
                    <option value="host">host</option>
                    <option value="null">null</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => setShowCreateNetworkDialog(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] text-xs hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNetwork}
                  disabled={!networkForm.name.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3" />
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Volume Dialog */}
      <AnimatePresence>
        {showCreateVolumeDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateVolumeDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  Create Volume
                </h3>
                <button
                  onClick={() => setShowCreateVolumeDialog(false)}
                  className="p-1.5 rounded-md hover:bg-[#2d2e3d] text-[#6b7280] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 block">Volume Name</label>
                  <input
                    type="text"
                    placeholder="e.g. my-volume"
                    value={volumeForm.name}
                    onChange={(e) => setVolumeForm((prev) => ({ ...prev, name: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateVolume()}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#6b7280] focus:outline-none focus:border-emerald-500/50 font-mono"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 block">Driver</label>
                  <select
                    value={volumeForm.driver}
                    onChange={(e) => setVolumeForm((prev) => ({ ...prev, driver: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-[#9ca3af] text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="local">local</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => setShowCreateVolumeDialog(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] text-xs hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVolume}
                  disabled={!volumeForm.name.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3" />
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run Container Dialog */}
      <AnimatePresence>
        {showRunContainerDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowRunContainerDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" />
                  {selectedImageForRun ? `Run ${selectedImageForRun.name}:${selectedImageForRun.tag}` : 'New Container'}
                </h3>
                <button
                  onClick={() => setShowRunContainerDialog(false)}
                  className="p-1.5 rounded-md hover:bg-[#2d2e3d] text-[#6b7280] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 block">Container Name</label>
                  <input
                    type="text"
                    placeholder="e.g. my-container"
                    value={runContainerForm.name}
                    onChange={(e) => setRunContainerForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#6b7280] focus:outline-none focus:border-emerald-500/50 font-mono"
                    autoFocus
                  />
                </div>
                {!selectedImageForRun && (
                  <div>
                    <label className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 block">Image</label>
                    <input
                      type="text"
                      placeholder="e.g. nginx:latest"
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#6b7280] focus:outline-none focus:border-emerald-500/50 font-mono"
                      onChange={(e) =>
                        setSelectedImageForRun({
                          id: '',
                          name: e.target.value.split(':')[0],
                          tag: e.target.value.split(':')[1] || 'latest',
                          size: 0,
                          created: new Date().toISOString(),
                          containers: 0,
                        })
                      }
                    />
                  </div>
                )}
                <div>
                  <label className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 block">Port Mappings</label>
                  <input
                    type="text"
                    placeholder="e.g. 8080:80, 8443:443"
                    value={runContainerForm.ports}
                    onChange={(e) => setRunContainerForm((prev) => ({ ...prev, ports: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#6b7280] focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                  <p className="text-[10px] text-[#6b7280] mt-1">Format: host_port:container_port (comma-separated)</p>
                </div>
                <div>
                  <label className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 block">Environment Variables</label>
                  <input
                    type="text"
                    placeholder="e.g. NODE_ENV=production, PORT=3000"
                    value={runContainerForm.envVars}
                    onChange={(e) => setRunContainerForm((prev) => ({ ...prev, envVars: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#6b7280] focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                  <p className="text-[10px] text-[#6b7280] mt-1">Format: KEY=VALUE (comma-separated)</p>
                </div>
                <div>
                  <label className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 block">Networks</label>
                  <input
                    type="text"
                    placeholder="e.g. agentos-network, frontend"
                    value={runContainerForm.networks}
                    onChange={(e) => setRunContainerForm((prev) => ({ ...prev, networks: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#6b7280] focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1 block">Volumes</label>
                  <input
                    type="text"
                    placeholder="e.g. /app/data:/data, /app/logs"
                    value={runContainerForm.volumes}
                    onChange={(e) => setRunContainerForm((prev) => ({ ...prev, volumes: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-white text-xs placeholder:text-[#6b7280] focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => setShowRunContainerDialog(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] text-xs hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateContainer}
                  disabled={!runContainerForm.name.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3" />
                  Run Container
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
