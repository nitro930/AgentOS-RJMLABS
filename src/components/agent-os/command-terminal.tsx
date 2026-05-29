'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Terminal } from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

export function CommandTerminal() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<Array<{ type: 'input' | 'output'; text: string }>>([
    { type: 'output', text: 'AgentOS Terminal v1.0.0 — Type "help" for available commands.' },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)
  const { addCommandToHistory } = useAgentOSStore()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [output])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cmd = input.trim()
    if (!cmd) return

    setInput('')
    addCommandToHistory(cmd)
    setOutput((prev) => [...prev, { type: 'input', text: cmd }])

    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, source: 'user' }),
      })
      const data = await res.json()
      setOutput((prev) => [
        ...prev,
        { type: 'output', text: data.result || data.error || 'Command executed' },
      ])
    } catch {
      setOutput((prev) => [
        ...prev,
        { type: 'output', text: 'Error: Failed to execute command' },
      ])
    }
  }

  return (
    <div className="rounded-xl border border-[#2d2e3d] bg-[#0f1117] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2d2e3d] bg-[#1e1f2b]">
        <Terminal className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-white">Terminal</span>
        <div className="flex gap-1 ml-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <div className="w-2 h-2 rounded-full bg-red-500" />
        </div>
      </div>
      <div
        ref={scrollRef}
        className="h-32 sm:h-40 overflow-y-auto p-3 font-mono text-xs space-y-1 custom-scrollbar"
      >
        {output.map((line, i) => (
          <div key={i} className={line.type === 'input' ? 'text-emerald-400' : 'text-[#9ca3af]'}>
            {line.type === 'input' ? (
              <span>
                <span className="text-emerald-500">$</span> {line.text}
              </span>
            ) : (
              line.text
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center border-t border-[#2d2e3d]">
        <span className="px-3 text-emerald-500 font-mono text-sm">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent py-3 text-xs text-white font-mono outline-none placeholder:text-[#4b5563]"
          placeholder="Enter command..."
          autoFocus={false}
        />
        <button
          type="submit"
          className="w-10 h-10 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
