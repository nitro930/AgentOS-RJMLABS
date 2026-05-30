'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Search, FileText, Layers, Database, Upload, Plus, Trash2,
  Loader2, CheckCircle2, XCircle, Eye, ChevronRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAgentOSStore } from '@/lib/store'

interface KnowledgeBaseData {
  id: string
  name: string
  description?: string
  type: string
  embeddingModel: string
  chunkStrategy: string
  chunkSize: number
  chunkOverlap: number
  documentCount: number
  chunkCount: number
  totalTokens: number
  isActive: boolean
  icon: string
  createdAt: string
  updatedAt: string
  _count?: { documents: number; chunks: number }
  documents?: KnowledgeDocumentData[]
}

interface KnowledgeDocumentData {
  id: string
  baseId: string
  title: string
  source: string
  sourceUrl?: string
  mimeType: string
  content: string
  summary?: string
  metadata: string
  chunkCount: number
  tokenCount: number
  status: string
  error?: string
  uploadedBy?: string
  createdAt: string
  updatedAt: string
  chunks?: KnowledgeChunkData[]
}

interface KnowledgeChunkData {
  id: string
  documentId: string
  baseId: string
  content: string
  chunkIndex: number
  tokenCount: number
  embedding?: string
  metadata: string
  relevance: number
  accessCount: number
  createdAt: string
  score?: number
}

interface RetrievalQueryData {
  id: string
  baseId: string
  query: string
  results: string
  topK: number
  threshold: number
  strategy: string
  agentId?: string
  duration: number
  createdAt: string
}

const typeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  general: { label: 'General', color: 'text-emerald-400', icon: BookOpen },
  code: { label: 'Code', color: 'text-blue-400', icon: FileText },
  documentation: { label: 'Documentation', color: 'text-purple-400', icon: FileText },
  research: { label: 'Research', color: 'text-orange-400', icon: Search },
  policies: { label: 'Policies', color: 'text-yellow-400', icon: Layers },
}

const statusColors: Record<string, string> = {
  processing: 'text-yellow-400',
  ready: 'text-emerald-400',
  error: 'text-red-400',
  archived: 'text-[#4b5563]',
}

const statusBgColors: Record<string, string> = {
  processing: 'border-yellow-500/30 text-yellow-400',
  ready: 'border-emerald-500/30 text-emerald-400',
  error: 'border-red-500/30 text-red-400',
  archived: 'border-[#2d2e3d] text-[#6b7280]',
}

export function KnowledgeBase() {
  const { knowledgeBaseTab, setKnowledgeBaseTab } = useAgentOSStore()
  const [bases, setBases] = useState<KnowledgeBaseData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBase, setSelectedBase] = useState<KnowledgeBaseData | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [addDocDialogOpen, setAddDocDialogOpen] = useState(false)
  const [chunkDialogOpen, setChunkDialogOpen] = useState(false)
  const [selectedDocChunks, setSelectedDocChunks] = useState<KnowledgeChunkData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<KnowledgeChunkData[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTopK, setSearchTopK] = useState(5)
  const [searchThreshold, setSearchThreshold] = useState(0.3)
  const [searchDuration, setSearchDuration] = useState(0)
  const [queries, setQueries] = useState<RetrievalQueryData[]>([])

  const [newBase, setNewBase] = useState({
    name: '',
    description: '',
    type: 'general',
    embeddingModel: 'text-embedding-3-small',
    chunkStrategy: 'semantic',
    chunkSize: 512,
    chunkOverlap: 50,
    icon: '📚',
  })

  const [newDoc, setNewDoc] = useState({
    title: '',
    source: 'upload',
    content: '',
    mimeType: 'text/plain',
  })

  const fetchBases = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge')
      if (res.ok) {
        const data = await res.json()
        setBases(data.bases || [])
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchBaseDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedBase(data.base)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchQueries = useCallback(async (baseId: string) => {
    try {
      // We'll get queries from the base detail or a separate endpoint
      // For now, we can just fetch them via the base detail
      // Since we don't have a dedicated queries endpoint, we'll skip for now
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchBases()
      setLoading(false)
    }
    load()
  }, [fetchBases])

  const handleCreateBase = async () => {
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBase),
      })
      if (res.ok) {
        await fetchBases()
        setCreateDialogOpen(false)
        setNewBase({
          name: '',
          description: '',
          type: 'general',
          embeddingModel: 'text-embedding-3-small',
          chunkStrategy: 'semantic',
          chunkSize: 512,
          chunkOverlap: 50,
          icon: '📚',
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteBase = async (id: string) => {
    try {
      await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
      await fetchBases()
      if (selectedBase?.id === id) setSelectedBase(null)
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddDocument = async () => {
    if (!selectedBase) return
    try {
      const res = await fetch(`/api/knowledge/${selectedBase.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc),
      })
      if (res.ok) {
        await fetchBaseDetail(selectedBase.id)
        await fetchBases()
        setAddDocDialogOpen(false)
        setNewDoc({ title: '', source: 'upload', content: '', mimeType: 'text/plain' })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSearch = async () => {
    if (!selectedBase || !searchQuery.trim()) return
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/knowledge/${selectedBase.id}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          topK: searchTopK,
          threshold: searchThreshold,
          strategy: 'keyword',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results || [])
        setSearchDuration(data.duration || 0)
        // Refresh queries
        await fetchBaseDetail(selectedBase.id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleViewChunks = async (docId: string) => {
    if (!selectedBase) return
    try {
      // Fetch all chunks for this document via the base detail
      const res = await fetch(`/api/knowledge/${selectedBase.id}`)
      if (res.ok) {
        const data = await res.json()
        const doc = data.base?.documents?.find((d: KnowledgeDocumentData) => d.id === docId)
        if (doc?.chunks) {
          setSelectedDocChunks(doc.chunks)
        }
        // If doc doesn't have enough chunks, we need to fetch them separately
        // For now we show what we have
      }
      setChunkDialogOpen(true)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  // Detail view
  if (selectedBase) {
    const typeInfo = typeConfig[selectedBase.type] || typeConfig.general
    const totalDocs = selectedBase.documentCount
    const totalChunks = selectedBase.chunkCount
    const totalTokens = selectedBase.totalTokens

    return (
      <div className="space-y-6">
        {/* Back button + header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b]"
              onClick={() => {
                setSelectedBase(null)
                setSearchResults([])
                setSearchQuery('')
                setQueries([])
              }}
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg">
                {selectedBase.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedBase.name}</h2>
                <div className="flex items-center gap-2">
                  <typeInfo.icon className={`w-3.5 h-3.5 ${typeInfo.color}`} />
                  <span className="text-xs text-[#6b7280]">{typeInfo.label}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      selectedBase.isActive
                        ? 'border-emerald-500/30 text-emerald-400'
                        : 'border-[#2d2e3d] text-[#6b7280]'
                    }`}
                  >
                    {selectedBase.isActive ? 'active' : 'inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setAddDocDialogOpen(true)}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />Add Document
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-[#2d2e3d] text-red-400 hover:bg-red-500/10"
              onClick={() => handleDeleteBase(selectedBase.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {selectedBase.description && (
          <p className="text-sm text-[#9ca3af] -mt-2">{selectedBase.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Documents', value: totalDocs, icon: FileText, color: 'text-blue-400' },
            { label: 'Chunks', value: totalChunks, icon: Layers, color: 'text-emerald-400' },
            { label: 'Total Tokens', value: totalTokens.toLocaleString(), icon: Database, color: 'text-purple-400' },
            { label: 'Embedding', value: selectedBase.embeddingModel.split('-').pop() || selectedBase.embeddingModel, icon: BookOpen, color: 'text-orange-400' },
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

        {/* Config info */}
        <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap text-xs text-[#6b7280]">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Chunk Strategy: <span className="text-white">{selectedBase.chunkStrategy}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-purple-400" />
                Chunk Size: <span className="text-white">{selectedBase.chunkSize} tokens</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-orange-400" />
                Overlap: <span className="text-white">{selectedBase.chunkOverlap} tokens</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Detail Tabs */}
        <Tabs value={knowledgeBaseTab} onValueChange={setKnowledgeBaseTab}>
          <TabsList className="bg-[#1e1f2b] border border-[#2d2e3d] w-full justify-start overflow-x-auto">
            <TabsTrigger value="documents" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <FileText className="w-3.5 h-3.5 mr-1.5" />Documents
            </TabsTrigger>
            <TabsTrigger value="chunks" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <Layers className="w-3.5 h-3.5 mr-1.5" />Chunks
            </TabsTrigger>
            <TabsTrigger value="search" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <Search className="w-3.5 h-3.5 mr-1.5" />Search
            </TabsTrigger>
            <TabsTrigger value="queries" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <Database className="w-3.5 h-3.5 mr-1.5" />Queries
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4">
            {(!selectedBase.documents || selectedBase.documents.length === 0) ? (
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-8 text-center">
                  <FileText className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280] mb-3">No documents in this knowledge base yet.</p>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAddDocDialogOpen(true)}>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />Add Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {selectedBase.documents.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-medium text-white">{doc.title}</h4>
                              <Badge variant="outline" className={`text-[9px] ${statusBgColors[doc.status] || 'border-[#2d2e3d] text-[#6b7280]'}`}>
                                {doc.status}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#6b7280]">
                                {doc.source}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1.5 text-[10px] text-[#6b7280]">
                              <span>{doc.chunkCount} chunks</span>
                              <span>{doc.tokenCount.toLocaleString()} tokens</span>
                              <span>{doc.mimeType}</span>
                              <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            </div>
                            {doc.error && (
                              <p className="text-xs text-red-400 mt-1">{doc.error}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#9ca3af] hover:text-emerald-400 hover:bg-emerald-500/10 h-7"
                            onClick={() => handleViewChunks(doc.id)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span className="text-xs">Chunks</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Chunks Tab */}
          <TabsContent value="chunks" className="mt-4">
            {(!selectedBase.documents || selectedBase.documents.length === 0) ? (
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-8 text-center">
                  <Layers className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280]">No chunks available. Add documents to generate chunks.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {selectedBase.documents.map(doc => (
                  doc.chunks && doc.chunks.length > 0 ? (
                    <div key={doc.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-3.5 h-3.5 text-[#6b7280]" />
                        <span className="text-xs font-medium text-white">{doc.title}</span>
                        <Badge variant="outline" className="text-[9px] border-[#2d2e3d] text-[#6b7280]">
                          {doc.chunkCount} chunks
                        </Badge>
                      </div>
                      <div className="space-y-1.5 ml-5">
                        {doc.chunks.map((chunk, ci) => (
                          <motion.div
                            key={chunk.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: ci * 0.02 }}
                          >
                            <Card className="bg-[#0f1117] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">
                                      #{chunk.chunkIndex}
                                    </Badge>
                                    <span className="text-[10px] text-[#6b7280]">{chunk.tokenCount} tokens</span>
                                    {chunk.relevance > 0 && (
                                      <span className="text-[10px] text-purple-400">
                                        rel: {(chunk.relevance * 100).toFixed(0)}%
                                      </span>
                                    )}
                                    {chunk.accessCount > 0 && (
                                      <span className="text-[10px] text-[#4b5563]">
                                        accessed {chunk.accessCount}x
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-[#9ca3af] line-clamp-3 font-mono leading-relaxed">
                                  {chunk.content.substring(0, 300)}{chunk.content.length > 300 ? '...' : ''}
                                </p>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="mt-4">
            <div className="space-y-4">
              <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                      <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Search knowledge base..."
                        className="pl-10 bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleSearch}
                      disabled={searchLoading || !searchQuery.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {searchLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[#6b7280]">Top K:</label>
                      <Input
                        type="number"
                        value={searchTopK}
                        onChange={e => setSearchTopK(Number(e.target.value))}
                        min={1}
                        max={20}
                        className="w-16 bg-[#0f1117] border-[#2d2e3d] text-white text-xs text-center h-7"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[#6b7280]">Threshold:</label>
                      <Input
                        type="number"
                        value={searchThreshold}
                        onChange={e => setSearchThreshold(Number(e.target.value))}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-16 bg-[#0f1117] border-[#2d2e3d] text-white text-xs text-center h-7"
                      />
                    </div>
                    {searchDuration > 0 && (
                      <span className="text-[10px] text-emerald-400">
                        {searchDuration}ms
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Search Results */}
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6b7280]">{searchResults.length} results found</span>
                  </div>
                  {searchResults.map((result, i) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/20 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">
                                Chunk #{result.chunkIndex}
                              </Badge>
                              <span className="text-[10px] text-[#6b7280]">{result.tokenCount} tokens</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(result.score || 0) * 100}%` }}
                                  transition={{ duration: 0.5 }}
                                  className="h-full bg-emerald-500 rounded-full"
                                />
                              </div>
                              <span className="text-xs font-mono text-emerald-400">
                                {((result.score || 0) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-[#9ca3af] font-mono leading-relaxed whitespace-pre-wrap">
                            {result.content.substring(0, 500)}{result.content.length > 500 ? '...' : ''}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-[#4b5563]">
                            <span>Accessed {result.accessCount}x</span>
                            <span>Relevance: {(result.relevance * 100).toFixed(0)}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : searchQuery && !searchLoading ? (
                <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                  <CardContent className="p-8 text-center">
                    <Search className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                    <p className="text-sm text-[#6b7280]">No results found. Try adjusting your query or threshold.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
                  <CardContent className="p-8 text-center">
                    <Search className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                    <p className="text-sm text-[#6b7280]">Enter a query to search this knowledge base using RAG retrieval.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Queries Tab */}
          <TabsContent value="queries" className="mt-4">
            <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
              <CardContent className="p-8 text-center">
                <Database className="w-10 h-10 text-[#2d2e3d] mx-auto mb-3" />
                <p className="text-sm text-[#6b7280]">
                  Recent retrieval queries will appear here after you perform searches. Use the Search tab to query the knowledge base.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Document Dialog */}
        <Dialog open={addDocDialogOpen} onOpenChange={setAddDocDialogOpen}>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Add Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Title</label>
                <Input
                  value={newDoc.title}
                  onChange={e => setNewDoc(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. API Documentation"
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Source</label>
                <Select value={newDoc.source} onValueChange={v => setNewDoc(p => ({ ...p, source: v }))}>
                  <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                    <SelectItem value="upload">Upload (Paste Text)</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="memory">Memory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Content</label>
                <Textarea
                  value={newDoc.content}
                  onChange={e => setNewDoc(p => ({ ...p, content: e.target.value }))}
                  placeholder="Paste your document content here..."
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm min-h-[200px] font-mono"
                />
              </div>
              <Button
                onClick={handleAddDocument}
                disabled={!newDoc.title || !newDoc.content}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />Add Document
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Chunk Viewer Dialog */}
        <Dialog open={chunkDialogOpen} onOpenChange={setChunkDialogOpen}>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Document Chunks</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              {selectedDocChunks.length === 0 ? (
                <p className="text-sm text-[#6b7280] text-center py-8">No chunks available for preview.</p>
              ) : (
                selectedDocChunks.map((chunk, i) => (
                  <Card key={chunk.id} className="bg-[#0f1117] border-[#2d2e3d]">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">
                          Chunk #{chunk.chunkIndex}
                        </Badge>
                        <span className="text-[10px] text-[#6b7280]">{chunk.tokenCount} tokens</span>
                      </div>
                      <p className="text-xs text-[#9ca3af] font-mono leading-relaxed whitespace-pre-wrap">
                        {chunk.content}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // List view
  const totalBases = bases.length
  const totalDocuments = bases.reduce((sum, b) => sum + b.documentCount, 0)
  const totalChunks = bases.reduce((sum, b) => sum + b.chunkCount, 0)
  const totalTokensAll = bases.reduce((sum, b) => sum + b.totalTokens, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Knowledge Base</h2>
              <p className="text-xs text-[#6b7280]">RAG-powered retrieval with intelligent chunking</p>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />Create Knowledge Base
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Knowledge Bases', value: totalBases, icon: BookOpen, color: 'text-emerald-400' },
          { label: 'Documents', value: totalDocuments, icon: FileText, color: 'text-blue-400' },
          { label: 'Chunks', value: totalChunks, icon: Layers, color: 'text-purple-400' },
          { label: 'Total Tokens', value: totalTokensAll.toLocaleString(), icon: Database, color: 'text-orange-400' },
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

      {/* Knowledge Base Cards */}
      {bases.length === 0 ? (
        <Card className="bg-[#1e1f2b] border-[#2d2e3d]">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-[#2d2e3d] mx-auto mb-3" />
            <h3 className="text-sm font-medium text-white mb-1">No Knowledge Bases</h3>
            <p className="text-xs text-[#6b7280] mb-4">
              Create your first knowledge base to start building RAG-powered retrieval.
            </p>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />Create Knowledge Base
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bases.map((base, i) => {
            const typeInfo = typeConfig[base.type] || typeConfig.general
            return (
              <motion.div
                key={base.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="bg-[#1e1f2b] border-[#2d2e3d] hover:border-emerald-500/30 transition-all cursor-pointer group"
                  onClick={() => {
                    setKnowledgeBaseTab('documents')
                    fetchBaseDetail(base.id)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-base">
                          {base.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                            {base.name}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            <typeInfo.icon className={`w-3 h-3 ${typeInfo.color}`} />
                            <span className="text-[10px] text-[#6b7280]">{typeInfo.label}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => {
                          e.stopPropagation()
                          handleDeleteBase(base.id)
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {base.description && (
                      <p className="text-xs text-[#6b7280] line-clamp-2 mb-3">{base.description}</p>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-1.5 rounded bg-[#0f1117] text-center">
                        <p className="text-xs font-bold text-blue-400">{base.documentCount}</p>
                        <p className="text-[9px] text-[#6b7280]">docs</p>
                      </div>
                      <div className="p-1.5 rounded bg-[#0f1117] text-center">
                        <p className="text-xs font-bold text-purple-400">{base.chunkCount}</p>
                        <p className="text-[9px] text-[#6b7280]">chunks</p>
                      </div>
                      <div className="p-1.5 rounded bg-[#0f1117] text-center">
                        <p className="text-xs font-bold text-orange-400">{base.totalTokens > 1000 ? `${(base.totalTokens / 1000).toFixed(1)}k` : base.totalTokens}</p>
                        <p className="text-[9px] text-[#6b7280]">tokens</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${
                            base.isActive
                              ? 'border-emerald-500/30 text-emerald-400'
                              : 'border-[#2d2e3d] text-[#6b7280]'
                          }`}
                        >
                          {base.isActive ? 'active' : 'inactive'}
                        </Badge>
                        <span className="text-[10px] text-[#4b5563]">{base.chunkStrategy}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#4b5563] group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Knowledge Base Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create Knowledge Base</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Name</label>
              <Input
                value={newBase.name}
                onChange={e => setNewBase(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Product Documentation"
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Description</label>
              <Input
                value={newBase.description}
                onChange={e => setNewBase(p => ({ ...p, description: e.target.value }))}
                placeholder="Optional description..."
                className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Type</label>
                <Select value={newBase.type} onValueChange={v => setNewBase(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                    {Object.entries(typeConfig).map(([key, cfg]) => (
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
                <label className="text-xs text-[#9ca3af] mb-1 block">Chunking Strategy</label>
                <Select value={newBase.chunkStrategy} onValueChange={v => setNewBase(p => ({ ...p, chunkStrategy: v }))}>
                  <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                    <SelectItem value="fixed">Fixed Size</SelectItem>
                    <SelectItem value="semantic">Semantic</SelectItem>
                    <SelectItem value="sentence">Sentence</SelectItem>
                    <SelectItem value="paragraph">Paragraph</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Chunk Size (tokens)</label>
                <Input
                  type="number"
                  value={newBase.chunkSize}
                  onChange={e => setNewBase(p => ({ ...p, chunkSize: Number(e.target.value) }))}
                  min={64}
                  max={2048}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">Overlap (tokens)</label>
                <Input
                  type="number"
                  value={newBase.chunkOverlap}
                  onChange={e => setNewBase(p => ({ ...p, chunkOverlap: Number(e.target.value) }))}
                  min={0}
                  max={256}
                  className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Embedding Model</label>
              <Select value={newBase.embeddingModel} onValueChange={v => setNewBase(p => ({ ...p, embeddingModel: v }))}>
                <SelectTrigger className="bg-[#0f1117] border-[#2d2e3d] text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1f2b] border-[#2d2e3d]">
                  <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                  <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
                  <SelectItem value="text-embedding-ada-002">text-embedding-ada-002</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCreateBase}
              disabled={!newBase.name}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />Create Knowledge Base
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
