'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  Bot,
  Brain,
  FileOutput,
  Target,
  ArrowRight,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'agent' | 'memory' | 'output' | 'goal'
  section: string
}

const categoryConfig: Record<string, { label: string; icon: typeof Bot; color: string }> = {
  agent: { label: 'Agents', icon: Bot, color: '#10b981' },
  memory: { label: 'Memory', icon: Brain, color: '#3b82f6' },
  output: { label: 'Outputs', icon: FileOutput, color: '#f59e0b' },
  goal: { label: 'Goals', icon: Target, color: '#8b5cf6' },
}

export function GlobalSearch() {
  const {
    globalSearchOpen,
    setGlobalSearchOpen,
    globalSearchQuery,
    setGlobalSearchQuery,
  } = useAgentOSStore()

  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setGlobalSearchOpen(!globalSearchOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [globalSearchOpen, setGlobalSearchOpen])

  // Focus input when opened
  useEffect(() => {
    if (globalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setSelectedIndex(0)
    }
  }, [globalSearchOpen])

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      performSearch(globalSearchQuery)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [globalSearchQuery, performSearch])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const flatResults = results
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault()
      handleSelect(flatResults[selectedIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    }
  }

  const handleSelect = (result: SearchResult) => {
    const sectionMap: Record<string, string> = {
      agent: 'agents',
      memory: 'memory',
      output: 'production',
      goal: 'mission-control',
    }
    // Navigate using the store
    const { setActiveSection } = useAgentOSStore.getState()
    setActiveSection((sectionMap[result.type] || 'mission-control') as import('@/lib/store').SectionId)
    handleClose()
  }

  const handleClose = () => {
    setGlobalSearchOpen(false)
    setGlobalSearchQuery('')
    setResults([])
    setSelectedIndex(0)
  }

  // Group results by category
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    if (!acc[result.type]) acc[result.type] = []
    acc[result.type].push(result)
    return acc
  }, {})

  const categoryOrder = ['agent', 'memory', 'output', 'goal']
  let globalIndex = -1

  return (
    <AnimatePresence>
      {globalSearchOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[90vw] max-w-xl z-50"
          >
            <div className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2e3d]">
                <Search className="w-4 h-4 text-[#6b7280] flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value)
                    setSelectedIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search agents, memory, outputs, goals..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#6b7280] outline-none"
                />
                {isSearching && (
                  <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                )}
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-md bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {globalSearchQuery.trim() === '' ? (
                  <div className="px-4 py-8 text-center">
                    <Search className="w-8 h-8 text-[#6b7280] mx-auto mb-2" />
                    <p className="text-sm text-[#9ca3af]">Start typing to search</p>
                    <p className="text-[11px] text-[#6b7280] mt-1">
                      Search across agents, memory, outputs, and goals
                    </p>
                  </div>
                ) : results.length === 0 && !isSearching ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-[#9ca3af]">No results found</p>
                    <p className="text-[11px] text-[#6b7280] mt-1">
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    {categoryOrder.map((category) => {
                      const categoryResults = groupedResults[category]
                      if (!categoryResults?.length) return null
                      const config = categoryConfig[category]
                      const Icon = config.icon
                      return (
                        <div key={category}>
                          {/* Category Header */}
                          <div className="flex items-center gap-2 px-4 py-1.5">
                            <Icon className="w-3 h-3" style={{ color: config.color }} />
                            <span
                              className="text-[10px] uppercase tracking-wider font-medium"
                              style={{ color: config.color }}
                            >
                              {config.label}
                            </span>
                          </div>
                          {/* Category Results */}
                          {categoryResults.map((result) => {
                            globalIndex++
                            const idx = globalIndex
                            const isSelected = idx === selectedIndex
                            return (
                              <div
                                key={result.id}
                                onClick={() => handleSelect(result)}
                                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                                    : 'hover:bg-[#252636] border-l-2 border-transparent'
                                }`}
                              >
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: `${config.color}15` }}
                                >
                                  <Icon className="w-4 h-4" style={{ color: config.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white font-medium truncate">
                                    {result.title}
                                  </p>
                                  <p className="text-[11px] text-[#6b7280] truncate">
                                    {result.description}
                                  </p>
                                </div>
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
                                  style={{
                                    color: config.color,
                                    backgroundColor: `${config.color}15`,
                                  }}
                                >
                                  {result.type}
                                </span>
                                {isSelected && (
                                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-[#2d2e3d] bg-[#0f1117]/50">
                <div className="flex items-center gap-3 text-[10px] text-[#6b7280]">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-[#252636] text-[9px]">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-[#252636] text-[9px]">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-[#252636] text-[9px]">esc</kbd>
                    Close
                  </span>
                </div>
                <span className="text-[10px] text-[#6b7280]">
                  {results.length > 0 && `${results.length} result${results.length !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
