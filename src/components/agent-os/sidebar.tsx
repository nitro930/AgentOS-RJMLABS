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
  Webhook,
  MessageSquare,
  Download,
  Network,
  Shield,
  BookOpen,
  Terminal,
  Lock,
  ScrollText,
  FlaskConical,
  Puzzle,
  Activity,
  FolderOpen,
  Wrench,
  Megaphone,
  Cable,
  Bug,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Radio,
  UserCog,
  Send,
  Vote,
} from 'lucide-react'
import { useAgentOSStore, SectionId } from '@/lib/store'

const navItems: { id: SectionId; label: string; icon: React.ElementType; layer: string; group: string }[] = [
  // Core Layers
  { id: 'mission-control', label: 'Mission Control', icon: LayoutDashboard, layer: 'L5', group: 'core' },
  { id: 'memory', label: 'Memory Vault', icon: Database, layer: 'L2', group: 'core' },
  { id: 'brain', label: 'Brain Router', icon: Brain, layer: 'L3', group: 'core' },
  { id: 'agents', label: 'Agents', icon: Users, layer: 'L4', group: 'core' },
  { id: 'workflows', label: 'Workflows', icon: GitBranch, layer: 'L4+', group: 'core' },
  { id: 'scheduler', label: 'Scheduler', icon: Clock, layer: 'L5+', group: 'core' },
  { id: 'production', label: 'Production', icon: Monitor, layer: 'L6', group: 'core' },
  { id: 'loop', label: 'Loop System', icon: RefreshCw, layer: 'L7', group: 'core' },
  { id: 'swarm', label: 'Agent Swarm', icon: Bug, layer: 'L4++', group: 'core' },
  { id: 'teams', label: 'Agent Teams', icon: UserCog, layer: 'L4++', group: 'core' },
  { id: 'chains', label: 'Agent Chains', icon: GitBranch, layer: 'L4++', group: 'core' },
  { id: 'delegation', label: 'Delegation', icon: Send, layer: 'L4++', group: 'core' },
  { id: 'consensus', label: 'Consensus', icon: Vote, layer: 'L4++', group: 'core' },
  // Tools & Integrations
  { id: 'analytics', label: 'Analytics', icon: BarChart3, layer: 'L8', group: 'tools' },
  { id: 'costs', label: 'Cost Tracker', icon: DollarSign, layer: 'L8+', group: 'tools' },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook, layer: 'L5+', group: 'tools' },
  { id: 'messages', label: 'Agent Chat', icon: MessageSquare, layer: 'L4+', group: 'tools' },
  { id: 'knowledge-graph', label: 'Knowledge Graph', icon: Network, layer: 'L2+', group: 'tools' },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: BookOpen, layer: 'L2+', group: 'tools' },
  { id: 'terminal', label: 'VPS Terminal', icon: Terminal, layer: 'L1', group: 'tools' },
  { id: 'playground', label: 'Playground', icon: FlaskConical, layer: 'L4+', group: 'tools' },
  { id: 'plugins', label: 'Plugins', icon: Puzzle, layer: 'L10', group: 'tools' },
  { id: 'health', label: 'System Health', icon: Activity, layer: 'L0', group: 'tools' },
  { id: 'files', label: 'File Manager', icon: FolderOpen, layer: 'L1+', group: 'tools' },
  { id: 'skills', label: 'Agent Skills', icon: Wrench, layer: 'L4++', group: 'tools' },
  { id: 'channels', label: 'Alert Channels', icon: Megaphone, layer: 'L5++', group: 'tools' },
  { id: 'mcp', label: 'MCP', icon: Cable, layer: 'L4+', group: 'tools' },
  // System
  { id: 'security', label: 'Security Vault', icon: Lock, layer: 'L0', group: 'system' },
  { id: 'audit-log', label: 'Audit Log', icon: ScrollText, layer: 'L0+', group: 'system' },
  { id: 'hitl', label: 'Approvals', icon: ShieldCheck, layer: 'L0+', group: 'system' },
  { id: 'guardrails', label: 'Guardrails', icon: ShieldAlert, layer: 'L0+', group: 'tools' },
  { id: 'evals', label: 'Evals', icon: FlaskConical, layer: 'L4+', group: 'tools' },
  { id: 'observability', label: 'Observability', icon: Radio, layer: 'L8+', group: 'tools' },
  { id: 'user-management', label: 'User Management', icon: UserCog, layer: 'L0', group: 'system' },
  { id: 'settings', label: 'Settings', icon: Settings, layer: 'SYS', group: 'system' },
  { id: 'export', label: 'Export/Import', icon: Download, layer: 'L9', group: 'system' },
  { id: 'backups', label: 'Backups', icon: Shield, layer: 'L9+', group: 'system' },
  { id: 'templates', label: 'Templates', icon: BookOpen, layer: 'L9+', group: 'system' },
]

const groupLabels: Record<string, string> = {
  core: 'Core Layers',
  tools: 'Tools & Integrations',
  system: 'System',
}

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

  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {} as Record<string, typeof navItems>)

  return (
    <motion.aside
      initial={false}
      animate={{ width: isMobile ? 280 : (sidebarCollapsed ? 64 : 240) }}
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
      <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {Object.entries(groupedItems).map(([group, items]) => (
          <div key={group}>
            {(!sidebarCollapsed || isMobile) && (
              <p className="text-[10px] font-semibold text-[#4b5563] uppercase tracking-wider px-2 mt-3 mb-1.5">
                {groupLabels[group] || group}
              </p>
            )}
            {items.map((item) => {
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-150 group ${
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
          </div>
        ))}
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
