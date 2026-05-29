'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Upload,
  FileJson,
  FileText,
  Database,
  Bot,
  GitBranch,
  Settings,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface RecentExport {
  id: string
  format: string
  type: string
  date: string
}

const typeIcons: Record<string, { icon: typeof Database; color: string; label: string }> = {
  full: { icon: Database, color: '#10b981', label: 'Full' },
  memory: { icon: FileJson, color: '#3b82f6', label: 'Memory' },
  agents: { icon: Bot, color: '#f59e0b', label: 'Agents' },
  workflows: { icon: GitBranch, color: '#8b5cf6', label: 'Workflows' },
  config: { icon: Settings, color: '#6b7280', label: 'Config' },
}

export function ExportImport() {
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown'>('json')
  const [exportType, setExportType] = useState<'full' | 'memory' | 'agents' | 'workflows' | 'config'>('full')
  const [isExporting, setIsExporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<unknown>(null)
  const [importFormat, setImportFormat] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<'success' | 'error' | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [recentExports, setRecentExports] = useState<RecentExport[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch(`/api/export?format=${exportFormat}&type=${exportType}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `agentos-${exportType}-${Date.now()}.${exportFormat === 'json' ? 'json' : 'md'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setRecentExports((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          format: exportFormat,
          type: exportType,
          date: new Date().toISOString(),
        },
        ...prev.slice(0, 9),
      ])
    } catch {
      // Error handling
    } finally {
      setIsExporting(false)
    }
  }

  const processFile = useCallback(async (file: File) => {
    setImportFile(file)
    const ext = file.name.split('.').pop()?.toLowerCase()
    const detectedFormat = ext === 'md' ? 'markdown' : 'json'
    setImportFormat(detectedFormat)

    try {
      const text = await file.text()
      const parsed = detectedFormat === 'json' ? JSON.parse(text) : text
      setImportData(parsed)
    } catch {
      setImportData(null)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleImport = async () => {
    if (!importData) return
    setIsImporting(true)
    setImportResult(null)
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData),
      })
      if (res.ok) {
        setImportResult('success')
      } else {
        setImportResult('error')
      }
    } catch {
      setImportResult('error')
    } finally {
      setIsImporting(false)
    }
  }

  const resetImport = () => {
    setImportFile(null)
    setImportData(null)
    setImportFormat('')
    setImportResult(null)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg sm:text-2xl font-bold text-white"
        >
          Export & Import
        </motion.h2>
        <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
          Backup and restore your AgentOS data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Export Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-white">Export Data</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-[#9ca3af] text-xs">Format</Label>
              <div className="flex gap-2 mt-1.5">
                {(['json', 'markdown'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                      exportFormat === fmt
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-[#252636] border-[#2d2e3d] text-[#9ca3af] hover:text-white hover:border-[#3d3e4d]'
                    }`}
                  >
                    {fmt === 'json' ? <FileJson className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    {fmt === 'json' ? 'JSON' : 'Markdown'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-[#9ca3af] text-xs">Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                {Object.entries(typeIcons).map(([key, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <button
                      key={key}
                      onClick={() => setExportType(key as typeof exportType)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs transition-colors ${
                        exportType === key
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

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>

          {/* Recent Exports */}
          {recentExports.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[#2d2e3d]">
              <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-2">Recent Exports</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                {recentExports.map((exp) => {
                  const cfg = typeIcons[exp.type]
                  return (
                    <div
                      key={exp.id}
                      className="flex items-center gap-2 text-[11px] p-2 rounded-lg bg-[#252636]"
                    >
                      <Download className="w-3 h-3 text-[#6b7280] flex-shrink-0" />
                      <span className="text-[#9ca3af] uppercase font-medium">{exp.format}</span>
                      <span className="text-[#6b7280]">·</span>
                      <span style={{ color: cfg.color }}>{cfg.label}</span>
                      <span className="text-[#6b7280] ml-auto flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(exp.date).toLocaleTimeString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Import Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ArrowUpFromLine className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-white">Import Data</h3>
          </div>

          {!importFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-[#2d2e3d] hover:border-[#3d3e4d]'
              }`}
            >
              <Upload className="w-8 h-8 text-[#6b7280] mx-auto mb-3" />
              <p className="text-sm text-[#9ca3af]">Drag & drop a file here</p>
              <p className="text-xs text-[#6b7280] mt-1">or click to browse</p>
              <input
                type="file"
                accept=".json,.md,.markdown"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ position: 'relative', marginTop: '8px' }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#252636] border border-[#2d2e3d]">
                <div className="flex items-center gap-2 min-w-0">
                  {importFormat === 'json' ? (
                    <FileJson className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{importFile.name}</p>
                    <p className="text-[10px] text-[#6b7280]">
                      {(importFile.size / 1024).toFixed(1)} KB · {importFormat.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetImport}
                  className="w-7 h-7 rounded-lg hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {importData && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-[#9ca3af] text-xs">Preview</Label>
                    <button
                      onClick={() => setPreviewOpen(true)}
                      className="flex items-center gap-1 text-[10px] text-[#9ca3af] hover:text-emerald-400 transition-colors"
                    >
                      <Eye className="w-3 h-3" /> Full Preview
                    </button>
                  </div>
                  <div className="rounded-lg bg-[#252636] border border-[#2d2e3d] p-3 max-h-32 overflow-y-auto custom-scrollbar">
                    <pre className="text-[11px] text-[#9ca3af] whitespace-pre-wrap">
                      {importFormat === 'json'
                        ? JSON.stringify(importData, null, 2).substring(0, 500) + '...'
                        : String(importData).substring(0, 500) + '...'}
                    </pre>
                  </div>
                </div>
              )}

              {importResult && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    importResult === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}
                >
                  {importResult === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span
                    className={`text-sm ${
                      importResult === 'success' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {importResult === 'success' ? 'Import completed successfully' : 'Import failed'}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={resetImport}
                  variant="ghost"
                  className="flex-1 text-[#9ca3af] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!importData || isImporting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-[#252636] border border-[#2d2e3d] p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <pre className="text-[11px] text-[#9ca3af] whitespace-pre-wrap">
              {importFormat === 'json'
                ? JSON.stringify(importData, null, 2)
                : String(importData)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
