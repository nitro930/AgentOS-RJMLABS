'use client'

import { useEffect } from 'react'
import { useAgentOSStore, type SectionId } from '@/lib/store'

const quickNavMap: Record<string, SectionId> = {
  '1': 'mission-control',
  '2': 'memory',
  '3': 'brain',
  '4': 'agents',
  '5': 'production',
  '6': 'loop',
}

const modNavMap: Record<string, SectionId> = {
  '1': 'workflows',
  '2': 'scheduler',
  '3': 'analytics',
  '4': 'costs',
  '5': 'webhooks',
  '6': 'messages',
  '7': 'export',
  '8': 'knowledge-graph',
  '9': 'backups',
  '0': 'templates',
}

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const {
    setActiveSection,
    setGlobalSearchOpen,
    setShortcutsHelpOpen,
    globalSearchOpen,
    shortcutsHelpOpen,
    notificationPanelOpen,
    setNotificationPanelOpen,
  } = useAgentOSStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Cmd/Ctrl + K → Global Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setGlobalSearchOpen(!globalSearchOpen)
        return
      }

      // Cmd/Ctrl + N → Create new
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        // Could trigger a create action based on current section
        return
      }

      // Cmd/Ctrl + 1-0 → Section navigation (10 sections)
      if (e.metaKey || e.ctrlKey) {
        const section = modNavMap[e.key]
        if (section) {
          e.preventDefault()
          setActiveSection(section)
          return
        }
      }

      // ? → Show shortcuts
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (isInput) return
        e.preventDefault()
        setShortcutsHelpOpen(!shortcutsHelpOpen)
        return
      }

      // Esc → Close modals
      if (e.key === 'Escape') {
        if (shortcutsHelpOpen) {
          setShortcutsHelpOpen(false)
          return
        }
        if (globalSearchOpen) {
          setGlobalSearchOpen(false)
          return
        }
        if (notificationPanelOpen) {
          setNotificationPanelOpen(false)
          return
        }
        return
      }

      // 1-6 → Quick section navigation (only when not in input)
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const section = quickNavMap[e.key]
        if (section) {
          e.preventDefault()
          setActiveSection(section)
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    setActiveSection,
    setGlobalSearchOpen,
    setShortcutsHelpOpen,
    globalSearchOpen,
    shortcutsHelpOpen,
    notificationPanelOpen,
    setNotificationPanelOpen,
  ])

  return <>{children}</>
}
