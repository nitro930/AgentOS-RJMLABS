'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutTemplate,
  Bot,
  GitBranch,
  FileJson,
  Settings,
  Eye,
  Trash2,
  Plus,
  Star,
  Users,
  BarChart3,
  X,
  Layers,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Template {
  id: string
  name: string
  description: string
  category: 'agent' | 'workflow' | 'memory' | 'config'
  config: Record<string, unknown>
  useCount: number
  isBuiltIn: boolean
  createdAt: string
}

const categoryConfig: Record<string, { color: string; bg: string; border: string; label: string; icon: typeof Bot }> = {
  agent: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Agent', icon: Bot },
  workflow: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Workflow', icon: GitBranch },
  memory: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Memory', icon: FileJson },
  config: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'Config', icon: Settings },
}

const categoryTabs = ['all', 'agent', 'workflow', 'memory', 'config'] as const

export function TemplateLibrary() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState<Template['category']>('agent')
  const [newConfig, setNewConfig] = useState('{}')

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/templates')
      const data = await res.json()
      setTemplates(data)
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
    const interval = setInterval(fetchTemplates, 15000)
    return () => clearInterval(interval)
  }, [fetchTemplates])

  const filteredTemplates = activeTab === 'all'
    ? templates
    : templates.filter((t) => t.category === activeTab)

  const handleUseTemplate = async (template: Template) => {
    try {
      await fetch('/api/templates/' + template.id + '/use', { method: 'POST' })
      fetchTemplates()
    } catch {
      // Error handling
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    fetchTemplates()
    if (previewTemplate?.id === id) setPreviewTemplate(null)
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    let parsedConfig = {}
    try {
      parsedConfig = JSON.parse(newConfig)
    } catch {
      parsedConfig = { raw: newConfig }
    }
    setIsCreating(true)
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
          category: newCategory,
          config: parsedConfig,
        }),
      })
      setCreateOpen(false)
      setNewName('')
      setNewDescription('')
      setNewCategory('agent')
      setNewConfig('{}')
      fetchTemplates()
    } catch {
      // Error handling
    } finally {
      setIsCreating(false)
    }
  }

  const categoryBreakdown = templates.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1
    return acc
  }, {})

  const stats = {
    total: templates.length,
    categoryBreakdown,
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
            Template Library
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Pre-built templates for agents, workflows, and configurations
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
              <Plus className="w-4 h-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-[#9ca3af] text-xs">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                  placeholder="Template name..."
                />
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Description</Label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                  placeholder="What does this template do..."
                />
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Category</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                  {Object.entries(categoryConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button
                        key={key}
                        onClick={() => setNewCategory(key as Template['category'])}
                        className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs transition-colors ${
                          newCategory === key
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-[#252636] border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Config (JSON)</Label>
                <textarea
                  value={newConfig}
                  onChange={(e) => setNewConfig(e.target.value)}
                  rows={5}
                  className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-xs text-white outline-none resize-none font-mono"
                  placeholder='{"key": "value"}'
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isCreating ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Templates', value: stats.total, icon: LayoutTemplate, color: '#10b981' },
          { label: 'Agent', value: categoryBreakdown.agent || 0, icon: Bot, color: '#10b981' },
          { label: 'Workflow', value: categoryBreakdown.workflow || 0, icon: GitBranch, color: '#8b5cf6' },
          { label: 'Built-in', value: templates.filter((t) => t.isBuiltIn).length, icon: Star, color: '#f59e0b' },
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

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categoryTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-[#252636] border border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d]'
            }`}
          >
            {tab === 'all' ? (
              <Layers className="w-3.5 h-3.5" />
            ) : (
              (() => {
                const Icon = categoryConfig[tab]?.icon
                return Icon ? <Icon className="w-3.5 h-3.5" /> : null
              })()
            )}
            {tab === 'all' ? 'All' : categoryConfig[tab]?.label}
            {tab !== 'all' && categoryBreakdown[tab] && (
              <span className="text-[10px] text-[#6b7280]">({categoryBreakdown[tab]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Template Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-5 animate-pulse">
              <div className="h-4 w-24 bg-[#252636] rounded mb-3" />
              <div className="h-3 w-full bg-[#252636] rounded mb-2" />
              <div className="h-3 w-32 bg-[#252636] rounded" />
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-8 sm:p-12 text-center">
          <LayoutTemplate className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
          <p className="text-sm text-[#9ca3af]">No templates found</p>
          <p className="text-xs text-[#6b7280] mt-1">
            {activeTab !== 'all' ? `No ${categoryConfig[activeTab]?.label} templates yet` : 'Create your first template'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredTemplates.map((template) => {
            const cc = categoryConfig[template.category] || categoryConfig.agent
            const CategoryIcon = cc.icon
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5 hover:border-[#3d3e4d] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cc.color === 'text-emerald-400' ? '#10b981' : cc.color === 'text-purple-400' ? '#8b5cf6' : cc.color === 'text-blue-400' ? '#3b82f6' : '#6b7280'}15` }}
                    >
                      <CategoryIcon
                        className="w-4 h-4"
                        style={{
                          color:
                            cc.color === 'text-emerald-400'
                              ? '#10b981'
                              : cc.color === 'text-purple-400'
                              ? '#8b5cf6'
                              : cc.color === 'text-blue-400'
                              ? '#3b82f6'
                              : '#6b7280',
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{template.name}</h3>
                      {template.isBuiltIn && (
                        <span className="text-[9px] text-amber-400 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5" /> Built-in
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="w-7 h-7 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-[11px] text-[#9ca3af] line-clamp-2 mb-3">{template.description}</p>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full ${cc.bg} ${cc.border} border ${cc.color}`}
                  >
                    {cc.label}
                  </span>
                  <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {template.useCount} uses
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleUseTemplate(template)}
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                  >
                    Use Template
                  </Button>
                  {!template.isBuiltIn && (
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-red-500/10 flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{previewTemplate?.name}</DialogTitle>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="w-7 h-7 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <p className="text-sm text-[#9ca3af]">{previewTemplate.description}</p>
              <div className="flex items-center gap-2">
                {(() => {
                  const cc = categoryConfig[previewTemplate.category]
                  return (
                    <span
                      className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full ${cc.bg} ${cc.border} border ${cc.color}`}
                    >
                      {cc.label}
                    </span>
                  )
                })()}
                <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {previewTemplate.useCount} uses
                </span>
                {previewTemplate.isBuiltIn && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                    <Star className="w-3 h-3" /> Built-in
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs text-[#6b7280] uppercase tracking-wider mb-2">Template Config</p>
                <div className="rounded-lg bg-[#252636] border border-[#2d2e3d] p-4 max-h-60 overflow-y-auto custom-scrollbar">
                  <pre className="text-[11px] text-[#9ca3af] whitespace-pre-wrap font-mono">
                    {JSON.stringify(previewTemplate.config, null, 2)}
                  </pre>
                </div>
              </div>
              <Button
                onClick={() => {
                  handleUseTemplate(previewTemplate)
                  setPreviewTemplate(null)
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Use This Template
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
