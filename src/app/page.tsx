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
import { Wifi, WifiOff, Menu, Zap } from 'lucide-react'

const sectionComponents: Record<SectionId, React.ComponentType> = {
  'mission-control': MissionControl,
  'memory': MemoryVault,
  'brain': BrainRouter,
  'agents': AgentGrid,
  'production': ProductionSurfaces,
  'loop': LoopSystem,
}

const sectionTitles: Record<SectionId, string> = {
  'mission-control': 'Mission Control',
  'memory': 'Memory Vault',
  'brain': 'Brain Router',
  'agents': 'Agents',
  'production': 'Production Surfaces',
  'loop': 'Loop System',
}

const sectionLayers: Record<SectionId, string> = {
  'mission-control': 'L5',
  'memory': 'L2',
  'brain': 'L3',
  'agents': 'L4',
  'production': 'L6',
  'loop': 'L7',
}

export default function Home() {
  const { activeSection, toasts, removeToast, mobileMenuOpen, setMobileMenuOpen } = useAgentOSStore()
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

  // Close mobile menu on section change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [activeSection, setMobileMenuOpen])

  const ActiveSection = sectionComponents[activeSection]

  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
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
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 -ml-1 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1e1f2b] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Mobile logo */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#6b7280] hidden sm:inline">{sectionLayers[activeSection]}</span>
            <h1 className="text-sm font-semibold text-white truncate">{sectionTitles[activeSection]}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
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

        {/* Page Content - with bottom padding for mobile nav */}
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
  )
}
