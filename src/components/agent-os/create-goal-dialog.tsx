'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

const priorityOptions = [
  { value: 'critical', label: '🔴 Critical', color: '#ef4444' },
  { value: 'high', label: '🟠 High', color: '#f59e0b' },
  { value: 'medium', label: '🟢 Medium', color: '#10b981' },
  { value: 'low', label: '⚪ Low', color: '#6b7280' },
]

interface CreateGoalDialogProps {
  onCreated?: () => void
}

export function CreateGoalDialog({ onCreated }: CreateGoalDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) return
    setIsCreating(true)
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate: dueDate || undefined,
          progress: 0,
          status: 'active',
        }),
      })
      setOpen(false)
      setTitle('')
      setDescription('')
      setPriority('medium')
      setDueDate('')
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
          New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-[#9ca3af] text-xs">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
              placeholder="Goal title..."
            />
          </div>
          <div>
            <Label className="text-[#9ca3af] text-xs">Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none min-h-[60px] resize-none"
              placeholder="What do you want to achieve?"
            />
          </div>
          <div>
            <Label className="text-[#9ca3af] text-xs">Priority</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {priorityOptions.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    priority === p.value ? 'ring-1' : 'bg-[#252636] hover:bg-[#2d2e3d]'
                  }`}
                  style={priority === p.value ? { backgroundColor: `${p.color}20`, color: p.color } : {}}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[#9ca3af] text-xs">Due Date (optional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isCreating ? 'Creating...' : 'Create Goal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
