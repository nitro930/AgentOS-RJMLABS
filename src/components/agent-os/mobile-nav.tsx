'use client'

import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Brain,
  Database,
  Users,
  Monitor,
  RefreshCw,
} from 'lucide-react'
import { useAgentOSStore, SectionId } from '@/lib/store'

const navItems: { id: SectionId; label: string; icon: React.ElementType; shortLabel: string }[] = [
  { id: 'mission-control', label: 'Mission Control', icon: LayoutDashboard, shortLabel: 'Control' },
  { id: 'memory', label: 'Memory Vault', icon: Database, shortLabel: 'Memory' },
  { id: 'brain', label: 'Brain Router', icon: Brain, shortLabel: 'Brain' },
  { id: 'agents', label: 'Agents', icon: Users, shortLabel: 'Agents' },
  { id: 'production', label: 'Production', icon: Monitor, shortLabel: 'Prod' },
  { id: 'loop', label: 'Loop System', icon: RefreshCw, shortLabel: 'Loop' },
]

export function MobileNav() {
  const { activeSection, setActiveSection } = useAgentOSStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f1117]/95 backdrop-blur-lg border-t border-[#2d2e3d] md:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-1 pt-1 pb-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 min-w-[48px] rounded-lg transition-colors ${
                isActive
                  ? 'text-emerald-400'
                  : 'text-[#6b7280] active:text-white'
              }`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{item.shortLabel}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
