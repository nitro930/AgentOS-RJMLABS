'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Database,
  Plus,
  Trash2,
  RotateCcw,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Backup {
  id: string
  name: string
  description?: string
  type: 'full' | 'memory' | 'agents' | 'workflows' | 'config'
  size: number
  isAuto: boolean
  createdAt: string
}

const typeConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  full: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Full' },
  memory: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Memory' },
  agents: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Agents' },
  workflows: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Workflows' },
  config: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'Config' },
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function BackupRecovery() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newType, setNewType] = useState<Backup['type']>('full')
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [restoreProgress, setRestoreProgress] = useState(0)
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null)
  const [restoreResult, setRestoreResult] = useState<'success' | 'error' | null>(null)

  const fetchBackups = useCallback(async () => {
    try {
      const res = await fetch('/api/backups')
      const data = await res.json()
      setBackups(data)
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBackups()
    const interval = setInterval(fetchBackups, 15000)
    return () => clearInterval(interval)
  }, [fetchBackups])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setIsCreating(true)
    try {
      await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
          type: newType,
        }),
      })
      setCreateOpen(false)
      setNewName('')
      setNewDescription('')
      setNewType('full')
      fetchBackups()
    } catch {
      // Error handling
    } finally {
      setIsCreating(false)
    }
  }

  const handleRestore = async (id: string) => {
    setConfirmRestoreId(null)
    setRestoringId(id)
    setRestoreProgress(0)
    setRestoreResult(null)

    // Simulate progress
    const steps = [10, 25, 45, 65, 80, 95]
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 400))
      setRestoreProgress(step)
    }

    try {
      await fetch(`/api/backups/${id}/restore`, { method: 'POST' })
      setRestoreProgress(100)
      setRestoreResult('success')
      fetchBackups()
    } catch {
      setRestoreResult('error')
    } finally {
      setTimeout(() => {
        setRestoringId(null)
        setRestoreProgress(0)
        setRestoreResult(null)
      }, 2000)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/backups/${id}`, { method: 'DELETE' })
    fetchBackups()
  }

  const stats = {
    total: backups.length,
    totalSize: backups.reduce((sum, b) => sum + b.size, 0),
    lastBackup: backups.length > 0
      ? backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : null,
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
            Backup & Recovery
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Protect your data with scheduled and manual backups
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
              <Plus className="w-4 h-4" />
              Create Backup
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Backup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-[#9ca3af] text-xs">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                  placeholder="Backup name..."
                />
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Description (optional)</Label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                  placeholder="Describe this backup..."
                />
              </div>
              <div>
                <Label className="text-[#9ca3af] text-xs">Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                  {Object.entries(typeConfig).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setNewType(key as Backup['type'])}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs transition-colors ${
                        newType === key
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-[#252636] border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d]'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isCreating ? 'Creating...' : 'Create Backup'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Backups', value: stats.total, icon: Shield, color: '#10b981' },
          { label: 'Total Size', value: formatBytes(stats.totalSize), icon: HardDrive, color: '#3b82f6' },
          {
            label: 'Last Backup',
            value: stats.lastBackup
              ? new Date(stats.lastBackup).toLocaleDateString()
              : 'Never',
            icon: Clock,
            color: '#f59e0b',
          },
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

      {/* Backup Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-5 animate-pulse">
              <div className="h-4 w-32 bg-[#252636] rounded mb-3" />
              <div className="h-3 w-48 bg-[#252636] rounded mb-2" />
              <div className="h-3 w-24 bg-[#252636] rounded" />
            </div>
          ))}
        </div>
      ) : backups.length === 0 ? (
        <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-8 sm:p-12 text-center">
          <Shield className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
          <p className="text-sm text-[#9ca3af]">No backups yet</p>
          <p className="text-xs text-[#6b7280] mt-1">Create your first backup to protect your data</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {backups.map((backup) => {
            const tc = typeConfig[backup.type] || typeConfig.full
            const isRestoring = restoringId === backup.id
            return (
              <motion.div
                key={backup.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={!isRestoring ? { y: -2, transition: { duration: 0.2 } } : {}}
                className={`rounded-xl border bg-[#1e1f2b] p-4 sm:p-5 transition-colors ${
                  isRestoring ? 'border-emerald-500/30' : 'border-[#2d2e3d] hover:border-[#3d3e4d]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#252636] border border-[#2d2e3d] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Database className="w-4 h-4 text-[#9ca3af]" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-white">{backup.name}</h3>
                      {backup.description && (
                        <p className="text-[11px] text-[#6b7280] mt-0.5">{backup.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setConfirmRestoreId(backup.id)}
                      disabled={isRestoring}
                      className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-blue-500/10 flex items-center justify-center text-[#6b7280] hover:text-blue-400 transition-colors disabled:opacity-50"
                      title="Restore"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(backup.id)}
                      disabled={isRestoring}
                      className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-red-500/10 flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full ${tc.bg} ${tc.border} border ${tc.color}`}
                  >
                    {tc.label}
                  </span>
                  <span className="text-[11px] text-[#6b7280] flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {formatBytes(backup.size)}
                  </span>
                  <span className="text-[11px] text-[#6b7280] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(backup.createdAt).toLocaleDateString()}
                  </span>
                  {backup.isAuto && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#252636] border border-[#2d2e3d] text-[#6b7280]">
                      Auto
                    </span>
                  )}
                </div>

                {/* Restore Progress */}
                <AnimatePresence>
                  {isRestoring && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-[#2d2e3d]">
                        <div className="flex items-center gap-2 mb-2">
                          {restoreResult === null ? (
                            <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                          ) : restoreResult === 'success' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          )}
                          <span className="text-[11px] text-[#9ca3af]">
                            {restoreResult === null
                              ? 'Restoring...'
                              : restoreResult === 'success'
                              ? 'Restore complete!'
                              : 'Restore failed'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#252636] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-emerald-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${restoreProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <Dialog open={!!confirmRestoreId} onOpenChange={(open) => !open && setConfirmRestoreId(null)}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Restore</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#9ca3af] pt-2">
            This will overwrite your current data with the backup. This action cannot be undone. Are you sure?
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="ghost"
              className="flex-1 text-[#9ca3af] hover:text-white"
              onClick={() => setConfirmRestoreId(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => confirmRestoreId && handleRestore(confirmRestoreId)}
            >
              Restore
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
