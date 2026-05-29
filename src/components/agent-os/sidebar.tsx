'use client'

import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Brain,
  Database,
  Users,
  Monitor,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
  GitBranch,
  Clock,
  BarChart3,
  DollarSign,
} from 'lucide-react'
import { useAgentOSStore, SectionId } from '@/lib/store'

const navItems: { id: SectionId; label: string; icon: React.ElementType; layer: string }[] = [
  { id: 'mission-control', label: 'Mission Control', icon: LayoutDashboard, layer: 'L5' },
  { id: 'memory', label: 'Memory Vault', icon: Database, layer: 'L2' },
  { id: 'brain', label: 'Brain Router', icon: Brain, layer: 'L3' },
  { id: 'agents', label: 'Agents', icon: Users, layer: 'L4' },
  { id: 'workflows', label: 'Workflows', icon: GitBranch, layer: 'L4+' },
  { id: 'scheduler', label: 'Scheduler', icon: Clock, layer: 'L5+' },
  { id: 'production', label: 'Production', icon: Monitor, layer: 'L6' },
  { id: 'loop', label: 'Loop System', icon: RefreshCw, layer: 'L7' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, layer: 'L8' },
  { id: 'costs', label: 'Cost Tracker', icon: DollarSign, layer: 'L8+' },
]

interface SidebarProps {
  isMobile?: boolean
}

export function Sidebar({ isMobile = false }: SidebarProps) {
  const { activeSection, setActiveSection, sidebarCollapsed, toggleSidebar, setMobileMenuOpen } = useAgentOSStore()

  const handleNavClick = (id: SectionId) => {
    setActiveSection(id)
    if (isMobile) {
      setMobileMenuOpen(false)
    }
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isMobile ? 280 : (sidebarCollapsed ? 64 : 220) }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={`h-screen bg-[#0f1117] border-r border-[#2d2e3d] flex flex-col flex-shrink-0 overflow-hidden ${
        isMobile ? 'rounded-r-2xl' : ''
      }`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-3 border-b border-[#2d2e3d] flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="truncate"
            >
              <h1 className="text-sm font-bold text-white">AgentOS</h1>
              <p className="text-[10px] text-[#6b7280]">Mission Control</p>
            </motion.div>
          )}
        </div>
        {/* Close button for mobile drawer */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-white hover:bg-[#1e1f2b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {(!sidebarCollapsed || isMobile) && (
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider px-2 mb-2">
            Navigation
          </p>
        )}
        {navItems.map((item) => {
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-2 py-3 rounded-lg transition-all duration-150 group ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-[#9ca3af] hover:bg-[#1e1f2b] hover:text-white active:bg-[#252636]'
              }`}
              title={sidebarCollapsed && !isMobile ? item.label : undefined}
            >
              <div className="flex items-center justify-center w-7 flex-shrink-0 relative">
                <item.icon className="w-4 h-4" />
                {isActive && (
                  <motion.div
                    layoutId={isMobile ? 'mobile-sidebar-active' : 'sidebar-active'}
                    className="absolute -left-1 top-0 bottom-0 w-0.5 bg-emerald-400 rounded-full"
                  />
                )}
              </div>
              {(!sidebarCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between flex-1 min-w-0"
                >
                  <span className="text-sm truncate">{item.label}</span>
                  <span className="text-[10px] text-[#6b7280] font-mono flex-shrink-0">{item.layer}</span>
                </motion.div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle - desktop only */}
      {!isMobile && (
        <div className="p-2 border-t border-[#2d2e3d] flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-[#6b7280] hover:bg-[#1e1f2b] hover:text-white transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </motion.aside>
  )
}
