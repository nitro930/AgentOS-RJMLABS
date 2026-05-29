'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderOpen,
  File,
  Folder,
  ChevronRight,
  ChevronDown,
  Upload,
  Download,
  Trash2,
  Copy,
  FileText,
  FileCode,
  Image,
  Film,
  Music,
  Archive,
  Search,
  RefreshCcw,
  MoreHorizontal,
  Share2,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface FileEntry {
  id: string
  name: string
  path: string
  type: string
  size: number
  mimeType: string | null
  permissions: string
  owner: string
  isShared: boolean
  agentId: string | null
  tags: string[]
  createdAt: string
}

export function FileManager() {
  const { addToast } = useAgentOSStore()
  const [files, setFiles] = useState<FileEntry[]>([])
  const [currentPath, setCurrentPath] = useState('/home')
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchFiles()
  }, [currentPath])

  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`)
      if (res.ok) {
        const data = await res.json()
        setFiles(data.length > 0 ? data : getDefaultFiles())
      } else {
        setFiles(getDefaultFiles())
      }
    } catch {
      setFiles(getDefaultFiles())
    }
  }

  const getDefaultFiles = (): FileEntry[] => [
    { id: '1', name: 'agents', path: '/home/agents', type: 'directory', size: 0, mimeType: null, permissions: '755', owner: 'root', isShared: true, agentId: null, tags: ['agents', 'config'], createdAt: new Date().toISOString() },
    { id: '2', name: 'workflows', path: '/home/workflows', type: 'directory', size: 0, mimeType: null, permissions: '755', owner: 'root', isShared: true, agentId: null, tags: ['workflows'], createdAt: new Date().toISOString() },
    { id: '3', name: 'outputs', path: '/home/outputs', type: 'directory', size: 0, mimeType: null, permissions: '755', owner: 'root', isShared: true, agentId: null, tags: ['outputs'], createdAt: new Date().toISOString() },
    { id: '4', name: 'config.json', path: '/home/config.json', type: 'file', size: 2048, mimeType: 'application/json', permissions: '644', owner: 'root', isShared: false, agentId: null, tags: ['config'], createdAt: new Date().toISOString() },
    { id: '5', name: 'agent-config.yaml', path: '/home/agent-config.yaml', type: 'file', size: 1024, mimeType: 'text/yaml', permissions: '644', owner: 'root', isShared: true, agentId: 'hermes', tags: ['agent', 'config'], createdAt: new Date().toISOString() },
    { id: '6', name: 'deploy.sh', path: '/home/deploy.sh', type: 'file', size: 512, mimeType: 'text/x-shellscript', permissions: '755', owner: 'root', isShared: false, agentId: null, tags: ['deploy', 'script'], createdAt: new Date().toISOString() },
    { id: '7', name: 'README.md', path: '/home/README.md', type: 'file', size: 4096, mimeType: 'text/markdown', permissions: '644', owner: 'root', isShared: true, agentId: null, tags: ['docs'], createdAt: new Date().toISOString() },
    { id: '8', name: 'logs', path: '/home/logs', type: 'directory', size: 0, mimeType: null, permissions: '755', owner: 'root', isShared: false, agentId: null, tags: ['logs'], createdAt: new Date().toISOString() },
    { id: '9', name: '.env', path: '/home/.env', type: 'file', size: 256, mimeType: 'text/plain', permissions: '600', owner: 'root', isShared: false, agentId: null, tags: ['env', 'secret'], createdAt: new Date().toISOString() },
    { id: '10', name: 'docker-compose.yml', path: '/home/docker-compose.yml', type: 'file', size: 1536, mimeType: 'text/yaml', permissions: '644', owner: 'root', isShared: false, agentId: null, tags: ['docker', 'deploy'], createdAt: new Date().toISOString() },
  ]

  const getFileIcon = (file: FileEntry) => {
    if (file.type === 'directory') return Folder
    const mime = file.mimeType || ''
    if (mime.includes('json') || mime.includes('yaml') || mime.includes('javascript') || mime.includes('typescript')) return FileCode
    if (mime.includes('image')) return Image
    if (mime.includes('video')) return Film
    if (mime.includes('audio')) return Music
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('gzip')) return Archive
    if (mime.includes('markdown') || mime.includes('text')) return FileText
    return File
  }

  const getFileColor = (file: FileEntry) => {
    if (file.type === 'directory') return 'text-emerald-400'
    const mime = file.mimeType || ''
    if (mime.includes('json') || mime.includes('javascript')) return 'text-amber-400'
    if (mime.includes('yaml')) return 'text-violet-400'
    if (mime.includes('shellscript')) return 'text-cyan-400'
    if (mime.includes('markdown')) return 'text-blue-400'
    return 'text-[#9ca3af]'
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '—'
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / 1048576).toFixed(1)}MB`
  }

  const pathParts = currentPath.split('/').filter(Boolean)

  const filteredFiles = files.filter((f) =>
    !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const directories = filteredFiles.filter((f) => f.type === 'directory')
  const regularFiles = filteredFiles.filter((f) => f.type !== 'directory')
  const sortedFiles = [...directories, ...regularFiles]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-emerald-400" />
            File Manager
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">Browse and manage files on your VPS</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => addToast('Upload coming soon', 'info')}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <button onClick={fetchFiles} className="p-2 bg-[#1e1f2b] text-[#9ca3af] hover:text-white rounded-lg border border-[#2d2e3d] transition-colors">
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg px-3 py-2">
        <button onClick={() => setCurrentPath('/')} className="text-[#6b7280] hover:text-white transition-colors">/</button>
        {pathParts.map((part, i) => (
          <div key={i} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-[#4b5563]" />
            <button
              onClick={() => setCurrentPath('/' + pathParts.slice(0, i + 1).join('/'))}
              className={`${i === pathParts.length - 1 ? 'text-white font-medium' : 'text-[#9ca3af] hover:text-white'} transition-colors`}
            >
              {part}
            </button>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg text-white text-sm outline-none focus:border-emerald-500"
          placeholder="Search files..."
        />
      </div>

      {/* File Table */}
      <div className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_100px_80px_80px_60px] gap-2 px-4 py-2 text-[10px] text-[#6b7280] uppercase tracking-wider border-b border-[#2d2e3d]">
          <span>Name</span>
          <span>Size</span>
          <span>Owner</span>
          <span>Perms</span>
          <span>Share</span>
        </div>
        {/* Rows */}
        <div className="divide-y divide-[#2d2e3d]">
          {currentPath !== '/' && (
            <button
              onClick={() => {
                const parent = '/' + pathParts.slice(0, -1).join('/')
                setCurrentPath(parent || '/')
              }}
              className="w-full grid grid-cols-[1fr_100px_80px_80px_60px] gap-2 px-4 py-2.5 text-left hover:bg-[#252636] transition-colors items-center"
            >
              <span className="text-sm text-[#6b7280] flex items-center gap-2">
                <ChevronDown className="w-4 h-4 rotate-90" />
                ..
              </span>
              <span /><span /><span /><span />
            </button>
          )}
          {sortedFiles.map((file) => {
            const Icon = getFileIcon(file)
            const color = getFileColor(file)
            return (
              <button
                key={file.id}
                onClick={() => {
                  if (file.type === 'directory') {
                    setCurrentPath(file.path)
                  } else {
                    setSelectedFile(selectedFile?.id === file.id ? null : file)
                  }
                }}
                className={`w-full grid grid-cols-[1fr_100px_80px_80px_60px] gap-2 px-4 py-2.5 text-left transition-colors items-center ${
                  selectedFile?.id === file.id ? 'bg-emerald-500/10' : 'hover:bg-[#252636]'
                }`}
              >
                <span className={`text-sm flex items-center gap-2 ${color}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                  {file.type === 'directory' && <ChevronRight className="w-3 h-3 text-[#4b5563] ml-auto" />}
                </span>
                <span className="text-xs text-[#6b7280] font-mono">{formatSize(file.size)}</span>
                <span className="text-xs text-[#6b7280]">{file.owner}</span>
                <span className="text-xs text-[#6b7280] font-mono">{file.permissions}</span>
                <span>
                  {file.isShared && <Share2 className="w-3 h-3 text-emerald-400" />}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* File Details Panel */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#1e1f2b] border border-[#2d2e3d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white">{selectedFile.name}</h4>
              <div className="flex gap-1">
                <button onClick={() => addToast('File copied', 'success')} className="p-1.5 text-[#6b7280] hover:text-white transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                <button onClick={() => addToast('File downloaded', 'success')} className="p-1.5 text-[#6b7280] hover:text-white transition-colors"><Download className="w-3.5 h-3.5" /></button>
                <button onClick={() => { setSelectedFile(null); addToast('File deleted', 'success') }} className="p-1.5 text-[#6b7280] hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><span className="text-[#6b7280]">Path:</span> <code className="text-emerald-400 font-mono ml-1">{selectedFile.path}</code></div>
              <div><span className="text-[#6b7280]">Type:</span> <span className="text-white ml-1">{selectedFile.mimeType || selectedFile.type}</span></div>
              <div><span className="text-[#6b7280]">Size:</span> <span className="text-white ml-1">{formatSize(selectedFile.size)}</span></div>
              <div><span className="text-[#6b7280]">Owner:</span> <span className="text-white ml-1">{selectedFile.owner}</span></div>
              <div><span className="text-[#6b7280]">Permissions:</span> <code className="text-amber-400 font-mono ml-1">{selectedFile.permissions}</code></div>
              <div><span className="text-[#6b7280]">Shared:</span> <span className={`ml-1 ${selectedFile.isShared ? 'text-emerald-400' : 'text-[#6b7280]'}`}>{selectedFile.isShared ? 'Yes' : 'No'}</span></div>
              <div><span className="text-[#6b7280]">Tags:</span> <span className="ml-1">{selectedFile.tags.map((t) => (
                <span key={t} className="inline-block px-1.5 py-0.5 bg-[#252636] rounded text-[9px] text-[#9ca3af] mr-1">{t}</span>
              ))}</span></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
