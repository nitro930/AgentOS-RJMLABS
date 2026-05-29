'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

const memoryTypes = [
  { value: 'conversation', label: '💬 Conversation', color: '#8b5cf6' },
  { value: 'output', label: '📤 Output', color: '#3b82f6' },
  { value: 'insight', label: '💡 Insight', color: '#f59e0b' },
  { value: 'task', label: '✅ Task', color: '#10b981' },
  { value: 'reference', label: '📚 Reference', color: '#ec4899' },
]

interface CreateMemoryDialogProps {
  onCreated?: () => void
}

export function CreateMemoryDialog({ onCreated }: CreateMemoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('reference')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [path, setPath] = useState('vault/root')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return
    setIsCreating(true)
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, content, tags, path, source: 'user' }),
      })
      setOpen(false)
      setType('reference')
      setTitle('')
      setContent('')
      setTagsInput('')
      setPath('vault/root')
      onCreated?.()
    } catch {
      // Error handling
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
        >
          <Plus className="w-4 h-4" />
          New Memory
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Create Memory Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-[#9ca3af] text-xs">Type</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {memoryTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    type === t.value ? 'ring-1' : 'bg-[#252636] hover:bg-[#2d2e3d]'
                  }`}
                  style={type === t.value ? { backgroundColor: `${t.color}20`, color: t.color, ringColor: t.color } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[#9ca3af] text-xs">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
              placeholder="Memory title..."
            />
          </div>
          <div>
            <Label className="text-[#9ca3af] text-xs">Content</Label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none min-h-[80px] resize-none"
              placeholder="Memory content..."
            />
          </div>
          <div>
            <Label className="text-[#9ca3af] text-xs">Tags (comma-separated)</Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
              placeholder="e.g. strategy, product, research"
            />
          </div>
          <div>
            <Label className="text-[#9ca3af] text-xs">Vault Path</Label>
            <Input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
              placeholder="vault/path"
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || !content.trim() || isCreating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isCreating ? 'Creating...' : 'Save to Memory'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
