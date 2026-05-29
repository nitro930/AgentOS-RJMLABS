'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

const agentTypes = [
  { value: 'hermes', label: 'Hermes (Research)' },
  { value: 'openclaw', label: 'OpenClaw (Code)' },
  { value: 'claude-code', label: 'Claude Code (Development)' },
  { value: 'sentinel', label: 'Sentinel (Monitoring)' },
  { value: 'custom', label: 'Custom' },
]

const agentAvatars = ['🤖', '🔍', '🦀', '⚡', '🛡️', '🎯', '🔮', '🧠', '💡', '🚀', '🦾', '🌐']
const agentColors = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899', '#06b6d4', '#84cc16']

interface CreateAgentDialogProps {
  onCreated?: () => void
}

export function CreateAgentDialog({ onCreated }: CreateAgentDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('custom')
  const [description, setDescription] = useState('')
  const [avatar, setAvatar] = useState('🤖')
  const [color, setColor] = useState('#10b981')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setIsCreating(true)
    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, description, avatar, color }),
      })
      setOpen(false)
      setName('')
      setType('custom')
      setDescription('')
      setAvatar('🤖')
      setColor('#10b981')
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
          New Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-[#9ca3af] text-xs">Avatar</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {agentAvatars.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                    avatar === a ? 'bg-emerald-500/20 ring-1 ring-emerald-500' : 'bg-[#252636] hover:bg-[#2d2e3d]'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[#9ca3af] text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
              placeholder="Agent name..."
            />
          </div>
          <div>
            <Label className="text-[#9ca3af] text-xs">Type</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
            >
              {agentTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-[#9ca3af] text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
              placeholder="What does this agent do?"
            />
          </div>
          <div>
            <Label className="text-[#9ca3af] text-xs">Color</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {agentColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-colors ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1f2b]' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isCreating ? 'Creating...' : 'Create Agent'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
