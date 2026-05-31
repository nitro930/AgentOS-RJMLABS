'use client'

import { ChevronRight } from 'lucide-react'
import { useAgentOSStore, SectionId } from '@/lib/store'

// Map sections to their group for breadcrumb display
const sectionGroups: Record<SectionId, string> = {
  'mission-control': 'Core',
  'memory': 'Core',
  'brain': 'Core',
  'agents': 'Core',
  'production': 'Core',
  'loop': 'Core',
  'workflows': 'Core',
  'scheduler': 'Core',
  'swarm': 'Core',
  'teams': 'Core',
  'chains': 'Core',
  'versioning': 'Core',
  'delegation': 'Core',
  'consensus': 'Core',
  'marketplace': 'Core',
  'environment': 'Core',
  'analytics': 'Tools',
  'costs': 'Tools',
  'resource-quotas': 'Tools',
  'webhooks': 'Tools',
  'messages': 'Tools',
  'knowledge-graph': 'Tools',
  'knowledge-base': 'Tools',
  'terminal': 'Tools',
  'playground': 'Tools',
  'plugins': 'Tools',
  'health': 'Tools',
  'files': 'Tools',
  'skills': 'Tools',
  'channels': 'Tools',
  'mcp': 'Tools',
  'feature-flags': 'Tools',
  'system-resources': 'Tools',
  'network-monitor': 'Tools',
  'benchmarking': 'Tools',
  'docker': 'Tools',
  'prompt-library': 'Tools',
  'automation-rules': 'Tools',
  'event-bus': 'Tools',
  'incidents': 'Tools',
  'guardrails': 'Tools',
  'evals': 'Tools',
  'observability': 'Tools',
  'security': 'System',
  'audit-log': 'System',
  'hitl': 'System',
  'user-management': 'System',
  'dashboard-customizer': 'System',
  'settings': 'System',
  'export': 'System',
  'backups': 'System',
  'templates': 'System',
  'onboarding': 'System',
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
  'swarm': 'Agent Swarm',
  'teams': 'Agent Teams',
  'chains': 'Agent Chains',
  'delegation': 'Delegation',
  'consensus': 'Consensus',
  'knowledge-base': 'Knowledge Base',
  'hitl': 'Approvals',
  'guardrails': 'Guardrails',
  'evals': 'Evals',
  'observability': 'Observability',
  'user-management': 'User Management',
  'versioning': 'Agent Versioning',
  'dashboard-customizer': 'Dashboard Customizer',
  'environment': 'Environment',
  'benchmarking': 'Benchmarking',
  'feature-flags': 'Feature Flags',
  'network-monitor': 'Network Monitor',
  'docker': 'Docker',
  'prompt-library': 'Prompt Library',
  'incidents': 'Incidents',
  'automation-rules': 'Automation Rules',
  'resource-quotas': 'Resource Quotas',
  'event-bus': 'Event Bus',
  'onboarding': 'Onboarding',
  'marketplace': 'Marketplace',
  'settings': 'Settings',
  'system-resources': 'System Resources',
}

export function BreadcrumbNav() {
  const { activeSection } = useAgentOSStore()
  const group = sectionGroups[activeSection] || 'Core'
  const title = sectionTitles[activeSection] || activeSection

  return (
    <nav className="hidden sm:flex items-center gap-1 text-[11px] min-w-0" aria-label="Breadcrumb">
      <span className="text-[#6b7280] font-medium">AgentOS</span>
      <ChevronRight className="w-3 h-3 text-[#4b5563] flex-shrink-0" />
      <span className="text-[#9ca3af]">{group}</span>
      <ChevronRight className="w-3 h-3 text-[#4b5563] flex-shrink-0" />
      <span className="text-emerald-400 font-semibold truncate">{title}</span>
    </nav>
  )
}
