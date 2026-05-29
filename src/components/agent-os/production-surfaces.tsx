'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Palette, Search, Target, FolderOpen, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GoalCard } from './goal-card'
import { CreateGoalDialog } from './create-goal-dialog'
import { useAgentOSStore } from '@/lib/store'
import { AgentOutput, Goal, Workspace } from '@/lib/types'

export function ProductionSurfaces() {
  const [outputs, setOutputs] = useState<AgentOutput[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { productionTab, setProductionTab } = useAgentOSStore()

  const fetchData = useCallback(async () => {
    try {
      const [outputsRes, goalsRes, workspacesRes] = await Promise.all([
        fetch('/api/outputs'),
        fetch('/api/goals'),
        fetch('/api/workspaces'),
      ])
      const outputsData = await outputsRes.json()
      const goalsData = await goalsRes.json()
      const workspacesData = await workspacesRes.json()
      setOutputs(outputsData || [])
      setGoals(goalsData || [])
      setWorkspaces(workspacesData || [])
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleGoalProgress = async (id: string, progress: number) => {
    const newProgress = Math.min(progress + 10, 100)
    const status = newProgress >= 100 ? 'completed' : 'active'
    await fetch(`/api/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: newProgress, status }),
    })
    fetchData()
  }

  const handleDeleteGoal = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleArchiveOutput = async (id: string) => {
    await fetch(`/api/outputs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: true }),
    })
    fetchData()
  }

  const workspaceIcons: Record<string, string> = {
    studio: '🎨',
    seo: '🔍',
    goals: '🎯',
    workspace: '📁',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl sm:text-2xl font-bold text-white"
        >
          Production Surfaces
        </motion.h2>
        <p className="text-sm text-[#9ca3af] mt-1">Studio, SEO, Goals, and Workspace management</p>
      </div>

      {/* Tabs */}
      <Tabs value={productionTab} onValueChange={setProductionTab}>
        <TabsList className="bg-[#1e1f2b] border border-[#2d2e3d]">
          <TabsTrigger value="studio" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[#9ca3af]">
            <Palette className="w-3.5 h-3.5 mr-1.5" />
            Studio
          </TabsTrigger>
          <TabsTrigger value="seo" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[#9ca3af]">
            <Search className="w-3.5 h-3.5 mr-1.5" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[#9ca3af]">
            <Target className="w-3.5 h-3.5 mr-1.5" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="workspaces" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[#9ca3af]">
            <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
            Workspaces
          </TabsTrigger>
        </TabsList>

        {/* Studio Tab */}
        <TabsContent value="studio" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Recent Outputs</h3>
              <span className="text-xs text-[#6b7280]">{outputs.filter(o => !o.isArchived).length} active</span>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 animate-pulse">
                    <div className="h-4 w-32 bg-[#252636] rounded mb-2" />
                    <div className="h-3 w-full bg-[#252636] rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {outputs
                  .filter((o) => !o.isArchived)
                  .map((output) => {
                    const typeColors: Record<string, string> = {
                      text: '#10b981',
                      code: '#8b5cf6',
                      file: '#f59e0b',
                      insight: '#06b6d4',
                      action: '#ef4444',
                    }
                    const color = typeColors[output.type] || '#6b7280'
                    return (
                      <motion.div
                        key={output.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 hover:border-[#3d3e4d] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${color}20`, color }}
                            >
                              {output.type}
                            </span>
                          </div>
                          <button
                            onClick={() => handleArchiveOutput(output.id)}
                            className="text-[10px] text-[#6b7280] hover:text-white transition-colors flex-shrink-0"
                          >
                            Archive
                          </button>
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-1 truncate">{output.title}</h4>
                        <p className="text-xs text-[#9ca3af] line-clamp-2 mb-2">{output.content}</p>
                        {output.agent && (
                          <div className="flex items-center gap-1 text-[10px] text-[#6b7280]">
                            <span>{output.agent.avatar || '🤖'}</span>
                            <span>{output.agent.name}</span>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="mt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">SEO & Content Optimization</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {outputs
                .filter((o) => o.content?.toLowerCase().includes('seo') || o.title?.toLowerCase().includes('seo'))
                .map((output) => (
                  <div
                    key={output.id}
                    className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4"
                  >
                    <h4 className="text-sm font-semibold text-white mb-1">{output.title}</h4>
                    <p className="text-xs text-[#9ca3af] line-clamp-3">{output.content}</p>
                  </div>
                ))}
              {outputs.filter((o) => o.content?.toLowerCase().includes('seo') || o.title?.toLowerCase().includes('seo')).length === 0 && (
                <div className="col-span-2 text-center py-8 text-[#6b7280]">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No SEO content yet</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Goals & Progress</h3>
              <CreateGoalDialog onCreated={fetchData} />
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 animate-pulse">
                    <div className="h-4 w-32 bg-[#252636] rounded mb-2" />
                    <div className="h-2 w-full bg-[#252636] rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onProgressChange={(progress) => handleGoalProgress(goal.id, progress)}
                    onDelete={() => handleDeleteGoal(goal.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Workspaces Tab */}
        <TabsContent value="workspaces" className="mt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Workspaces</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {workspaces.map((ws) => {
                const config = (() => {
                  try { return JSON.parse(ws.config || '{}') } catch { return {} }
                })()
                return (
                  <motion.div
                    key={ws.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 hover:border-[#3d3e4d] transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{workspaceIcons[ws.type] || '📁'}</span>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{ws.name}</h4>
                        <p className="text-[10px] text-[#6b7280] uppercase">{ws.type}</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#9ca3af] mb-3">{ws.description}</p>
                    <div className="flex items-center justify-between">
                      <div className={`w-2 h-2 rounded-full ${ws.isActive ? 'bg-emerald-500' : 'bg-[#4b5563]'}`} />
                      <span className="text-[10px] text-[#6b7280]">
                        {ws.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
