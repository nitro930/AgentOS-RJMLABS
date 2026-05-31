'use client'

import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  GitBranch,
  MessageSquare,
  MoreHorizontal,
  Store,
  Terminal as TerminalIcon,
  Gauge,
} from 'lucide-react'
import { useAgentOSStore, SectionId } from '@/lib/store'

const primaryNavItems: { id: SectionId; label: string; icon: React.ElementType; shortLabel: string }[] = [
  { id: 'mission-control', label: 'Mission Control', icon: LayoutDashboard, shortLabel: 'Home' },
  { id: 'agents', label: 'Agents', icon: Users, shortLabel: 'Agents' },
  { id: 'system-resources', label: 'Resources', icon: Gauge, shortLabel: 'Resources' },
  { id: 'messages', label: 'Agent Chat', icon: MessageSquare, shortLabel: 'Chat' },
  { id: 'terminal', label: 'Terminal', icon: TerminalIcon, shortLabel: 'Terminal' },
]

export function MobileNav() {
  const { activeSection, setActiveSection, setMobileMenuOpen } = useAgentOSStore()

  const handleNavClick = (id: SectionId) => {
    setActiveSection(id)
    // Haptic feedback on supported devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5)
    }
  }

  const handleMoreClick = () => {
    setMobileMenuOpen(true)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f1117]/95 backdrop-blur-lg border-t border-[#2d2e3d] md:hidden safe-area-bottom">
      {/* Subtle gradient top line */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      <div className="flex items-center justify-around px-1 pt-1 pb-1">
        {primaryNavItems.map((item) => {
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-2 min-w-[52px] rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-[#6b7280] active:text-white active:bg-[#1e1f2b]'
              }`}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-emerald-400"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${isActive ? 'text-emerald-400' : ''}`}>
                {item.shortLabel}
              </span>
            </button>
          )
        })}
        <button
          onClick={handleMoreClick}
          className="flex flex-col items-center justify-center py-2 px-2 min-w-[52px] rounded-xl text-[#6b7280] active:text-white active:bg-[#1e1f2b] transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">More</span>
        </button>
      </div>
    </nav>
  )
}
