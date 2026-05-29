'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X, Navigation, Zap, Settings } from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface ShortcutItem {
  keys: string[]
  description: string
}

interface ShortcutGroup {
  title: string
  icon: typeof Navigation
  shortcuts: ShortcutItem[]
}

const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
const modKey = isMac ? '⌘' : 'Ctrl'

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    icon: Navigation,
    shortcuts: [
      { keys: [modKey, 'K'], description: 'Global Search' },
      { keys: ['1'], description: 'Mission Control' },
      { keys: ['2'], description: 'Memory' },
      { keys: ['3'], description: 'Brain' },
      { keys: ['4'], description: 'Agents' },
      { keys: ['5'], description: 'Production' },
      { keys: ['6'], description: 'Loop' },
      { keys: [modKey, '1'], description: 'Workflows' },
      { keys: [modKey, '2'], description: 'Scheduler' },
      { keys: [modKey, '3'], description: 'Analytics' },
      { keys: [modKey, '4'], description: 'Costs' },
      { keys: [modKey, '5'], description: 'Webhooks' },
      { keys: [modKey, '6'], description: 'Messages' },
      { keys: [modKey, '7'], description: 'Export' },
      { keys: [modKey, '8'], description: 'Knowledge Graph' },
      { keys: [modKey, '9'], description: 'Backups' },
      { keys: [modKey, '0'], description: 'Templates' },
    ],
  },
  {
    title: 'Actions',
    icon: Zap,
    shortcuts: [
      { keys: [modKey, 'N'], description: 'Create New (agent/memory)' },
    ],
  },
  {
    title: 'General',
    icon: Settings,
    shortcuts: [
      { keys: ['?'], description: 'Show Shortcuts' },
      { keys: ['Esc'], description: 'Close Panel / Modal' },
    ],
  },
]

export function KeyboardShortcuts() {
  const { shortcutsHelpOpen, setShortcutsHelpOpen } = useAgentOSStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
        e.preventDefault()
        setShortcutsHelpOpen(!shortcutsHelpOpen)
      }
      if (e.key === 'Escape' && shortcutsHelpOpen) {
        setShortcutsHelpOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcutsHelpOpen, setShortcutsHelpOpen])

  return (
    <AnimatePresence>
      {shortcutsHelpOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShortcutsHelpOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-2xl border border-[#2d2e3d] bg-[#1a1b2e] shadow-2xl max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2e3d]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Keyboard className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setShortcutsHelpOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto custom-scrollbar max-h-[calc(85vh-60px)]">
              <div className="space-y-6">
                {shortcutGroups.map((group) => {
                  const GroupIcon = group.icon
                  return (
                    <div key={group.title}>
                      <div className="flex items-center gap-2 mb-3">
                        <GroupIcon className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-semibold text-white">{group.title}</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.shortcuts.map((shortcut) => (
                          <div
                            key={shortcut.description}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#1e1f2b] border border-[#2d2e3d] hover:border-[#3d3e4d] transition-colors"
                          >
                            <span className="text-xs text-[#9ca3af]">{shortcut.description}</span>
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((key, i) => (
                                <span key={i} className="flex items-center gap-1">
                                  <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-[#252636] border border-[#2d2e3d] text-[11px] font-mono text-[#d1d5db] shadow-sm">
                                    {key}
                                  </kbd>
                                  {i < shortcut.keys.length - 1 && (
                                    <span className="text-[10px] text-[#6b7280]">+</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
