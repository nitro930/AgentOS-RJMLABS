'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAgentOSStore, SectionId } from '@/lib/store'
import { Sidebar } from '@/components/agent-os/sidebar'
import { MobileNav } from '@/components/agent-os/mobile-nav'
import { MissionControl } from '@/components/agent-os/mission-control'
import { MemoryVault } from '@/components/agent-os/memory-vault'
import { BrainRouter } from '@/components/agent-os/brain-router'
import { AgentGrid } from '@/components/agent-os/agent-grid'
import { ProductionSurfaces } from '@/components/agent-os/production-surfaces'
import { LoopSystem } from '@/components/agent-os/loop-system'
import { WorkflowBuilder } from '@/components/agent-os/workflow-builder'
import { Scheduler } from '@/components/agent-os/scheduler'
import { AnalyticsDashboard } from '@/components/agent-os/analytics-dashboard'
import { CostTracker } from '@/components/agent-os/cost-tracker'
import { WebhookIntegrations } from '@/components/agent-os/webhook-integrations'
import { AgentMessages } from '@/components/agent-os/agent-messages'
import { ExportImport } from '@/components/agent-os/export-import'
import { KnowledgeGraph } from '@/components/agent-os/knowledge-graph'
import { BackupRecovery } from '@/components/agent-os/backup-recovery'
import { TemplateLibrary } from '@/components/agent-os/template-library'
import { GlobalSearch } from '@/components/agent-os/global-search'
import { NotificationCenter } from '@/components/agent-os/notification-center'
import { KeyboardShortcuts } from '@/components/agent-os/keyboard-shortcuts'
import { ShortcutsProvider } from '@/components/agent-os/shortcuts-provider'
import { VPSTerminal } from '@/components/agent-os/vps-terminal'
import { SecurityVault } from '@/components/agent-os/security-vault'
import { AuditLog } from '@/components/agent-os/audit-log'
import { AgentPlayground } from '@/components/agent-os/agent-playground'
import { PluginSystem } from '@/components/agent-os/plugin-system'
import { SystemHealth } from '@/components/agent-os/system-health'
import { FileManager } from '@/components/agent-os/file-manager'
import { AgentSkills } from '@/components/agent-os/agent-skills'
import { NotificationChannels } from '@/components/agent-os/notification-channels'
import { MCPServers } from '@/components/agent-os/mcp-servers'
import { SettingsPage } from '@/components/agent-os/settings-page'
import { Wifi, WifiOff, Menu, Zap, Bell, Search, HelpCircle } from 'lucide-react'

const sectionComponents: Record<SectionId, React.ComponentType> = {
  'mission-control': MissionControl,
  'memory': MemoryVault,
  'brain': BrainRouter,
  'agents': AgentGrid,
  'production': ProductionSurfaces,
  'loop': LoopSystem,
  'workflows': WorkflowBuilder,
  'scheduler': Scheduler,
  'analytics': AnalyticsDashboard,
  'costs': CostTracker,
  'webhooks': WebhookIntegrations,
  'messages': AgentMessages,
  'export': ExportImport,
  'knowledge-graph': KnowledgeGraph,
  'backups': BackupRecovery,
  'templates': TemplateLibrary,
  'terminal': VPSTerminal,
  'security': SecurityVault,
  'audit-log': AuditLog,
  'playground': AgentPlayground,
  'plugins': PluginSystem,
  'health': SystemHealth,
  'files': FileManager,
  'skills': AgentSkills,
  'channels': NotificationChannels,
  'mcp': MCPServers,
  'settings': SettingsPage,
}

const sectionTitles: Record<SectionId, string> = {
  'mission-control': 'Mission Control',
  'memory': 'Memory Vault',
  'brain': 'Brain Router',
  'agents': 'Agents',
  'production': 'Production Surfaces',
  'loop': 'Loop System',
  'workflows': 'Workflow Builder',
  'scheduler': 'Scheduler',
  'analytics': 'Analytics',
  'costs': 'Cost Tracker',
  'webhooks': 'Webhook Integrations',
  'messages': 'Agent Messages',
  'export': 'Export / Import',
  'knowledge-graph': 'Knowledge Graph',
  'backups': 'Backup & Recovery',
  'templates': 'Template Library',
  'terminal': 'VPS Terminal',
  'security': 'Security Vault',
  'audit-log': 'Audit Log',
  'playground': 'Agent Playground',
  'plugins': 'Plugin System',
  'health': 'System Health',
  'files': 'File Manager',
  'skills': 'Agent Skills',
  'channels': 'Alert Channels',
  'mcp': 'MCP Protocol',
  'settings': 'Settings',
}

const sectionLayers: Record<SectionId, string> = {
  'mission-control': 'L5',
  'memory': 'L2',
  'brain': 'L3',
  'agents': 'L4',
  'production': 'L6',
  'loop': 'L7',
  'workflows': 'L4+',
  'scheduler': 'L5+',
  'analytics': 'L8',
  'costs': 'L8+',
  'webhooks': 'L5+',
  'messages': 'L4+',
  'export': 'L9',
  'knowledge-graph': 'L2+',
  'backups': 'L9+',
  'templates': 'L9+',
  'terminal': 'L1',
  'security': 'L0',
  'audit-log': 'L0+',
  'playground': 'L4+',
  'plugins': 'L10',
  'health': 'L0',
  'files': 'L1+',
  'skills': 'L4++',
  'channels': 'L5++',
  'mcp': 'L4+',
  'settings': 'SYS',
}

export default function Home() {
  const { 
    activeSection, toasts, removeToast, mobileMenuOpen, setMobileMenuOpen,
    setGlobalSearchOpen, notificationPanelOpen, setNotificationPanelOpen,
    notificationCount, setNotificationCount, shortcutsHelpOpen, setShortcutsHelpOpen
  } = useAgentOSStore()
  const [isSeeded, setIsSeeded] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  // Seed the database on first load
  useEffect(() => {
    const seedDatabase = async () => {
      try {
        const res = await fetch('/api/seed', { method: 'POST' })
        if (res.ok) {
          setIsSeeded(true)
        }
      } catch {
        setIsSeeded(true)
      }
    }
    if (!isSeeded) {
      seedDatabase()
    }
  }, [isSeeded])

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Fetch notification count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications?unread=true')
        if (res.ok) {
          const data = await res.json()
          setNotificationCount(data.notifications?.length || data.length || 0)
        }
      } catch {}
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [setNotificationCount])

  // Close mobile menu on section change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [activeSection, setMobileMenuOpen])

  const ActiveSection = sectionComponents[activeSection]

  return (
    <ShortcutsProvider>
      <div className="flex h-screen bg-[#0f1117] overflow-hidden">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Drawer Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-[280px] md:hidden"
              >
                <Sidebar isMobile />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Status Bar */}
          <header className="h-12 flex items-center justify-between px-3 sm:px-4 border-b border-[#2d2e3d] bg-[#0f1117] flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden w-10 h-10 -ml-1 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b] transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="md:hidden flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#6b7280] hidden sm:inline">{sectionLayers[activeSection]}</span>
              <h1 className="text-sm font-semibold text-white truncate">{sectionTitles[activeSection]}</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setGlobalSearchOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-white hover:bg-[#1e1f2b] transition-colors"
                title="Search (⌘K)"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-white hover:bg-[#1e1f2b] transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShortcutsHelpOpen(true)}
                className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg text-[#6b7280] hover:text-white hover:bg-[#1e1f2b] transition-colors"
                title="Keyboard Shortcuts (?)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <div className="hidden sm:flex items-center gap-1.5 ml-1">
                {isOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className="text-[10px] text-[#6b7280]">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-green" />
              <span className="text-[10px] text-emerald-400 font-medium hidden sm:inline">Operational</span>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-0">
            <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ActiveSection />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Overlay Panels */}
        <GlobalSearch />
        <NotificationCenter />
        <KeyboardShortcuts />

        {/* Mobile Bottom Navigation */}
        <MobileNav />

        {/* Toast Notifications */}
        <div className="fixed bottom-16 sm:bottom-4 right-4 z-30 space-y-2">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className={`px-4 py-3 rounded-lg shadow-lg text-sm max-w-[calc(100vw-2rem)] ${
                  toast.type === 'success'
                    ? 'bg-emerald-600 text-white'
                    : toast.type === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-[#1e1f2b] text-white border border-[#2d2e3d]'
                }`}
                onClick={() => removeToast(toast.id)}
              >
                {toast.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ShortcutsProvider>
  )
}
