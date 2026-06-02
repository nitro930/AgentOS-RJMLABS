import { create } from 'zustand'

export type SectionId = 
  | 'mission-control' 
  | 'memory' 
  | 'brain' 
  | 'agents' 
  | 'production' 
  | 'loop'
  | 'workflows'
  | 'scheduler'
  | 'analytics'
  | 'costs'
  | 'webhooks'
  | 'messages'
  | 'export'
  | 'knowledge-graph'
  | 'backups'
  | 'templates'
  | 'terminal'
  | 'security'
  | 'audit-log'
  | 'playground'
  | 'plugins'
  | 'health'
  | 'files'
  | 'skills'
  | 'channels'
  | 'mcp'
  | 'swarm'
  | 'knowledge-base'
  | 'hitl'
  | 'guardrails'
  | 'evals'
  | 'observability'
  | 'chains'
  | 'consensus'
  | 'delegation'
  | 'user-management'
  | 'teams'
  | 'marketplace'
  | 'versioning'
  | 'dashboard-customizer'
  | 'environment'
  | 'benchmarking'
  | 'feature-flags'
  | 'network-monitor'
  | 'docker'
  | 'prompt-library'
  | 'incidents'
  | 'automation-rules'
  | 'resource-quotas'
  | 'event-bus'
  | 'onboarding'
  | 'settings'
  | 'system-resources'
  | 'help-center'
  | 'git-sync'
  | 'sandbox'
  | 'dependency-graph'
  | 'kanban'
  | 'activity-timeline'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface AgentOSStore {
  // Navigation
  activeSection: SectionId
  setActiveSection: (section: SectionId) => void
  
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Mobile menu
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  
  // Agent selection
  selectedAgentId: string | null
  setSelectedAgentId: (id: string | null) => void
  
  // Memory search & filters
  memorySearchQuery: string
  setMemorySearchQuery: (query: string) => void
  memoryTypeFilter: string
  setMemoryTypeFilter: (type: string) => void
  memoryPathFilter: string
  setMemoryPathFilter: (path: string) => void
  
  // Production tab
  productionTab: string
  setProductionTab: (tab: string) => void
  
  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  
  // Chat
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChatMessages: () => void
  isChatLoading: boolean
  setIsChatLoading: (loading: boolean) => void

  // Brain Router
  brainTab: 'models' | 'providers' | 'browser' | 'rules' | 'chat'
  setBrainTab: (tab: 'models' | 'providers' | 'browser' | 'rules' | 'chat') => void
  
  // Command terminal
  commandHistory: string[]
  addCommandToHistory: (command: string) => void
  
  // Toasts
  toasts: Toast[]
  addToast: (message: string, type: Toast['type']) => void
  removeToast: (id: string) => void

  // Global search
  globalSearchOpen: boolean
  setGlobalSearchOpen: (open: boolean) => void
  globalSearchQuery: string
  setGlobalSearchQuery: (query: string) => void

  // Notifications
  notificationCount: number
  setNotificationCount: (count: number) => void
  notificationPanelOpen: boolean
  setNotificationPanelOpen: (open: boolean) => void

  // Keyboard shortcuts
  shortcutsHelpOpen: boolean
  setShortcutsHelpOpen: (open: boolean) => void

  // MCP
  mcpTab: string
  setMcpTab: (tab: string) => void
  mcpSelectedServer: string | null
  setMcpSelectedServer: (id: string | null) => void

  // Swarm
  swarmTab: string
  setSwarmTab: (tab: string) => void

  // Knowledge Base
  knowledgeBaseTab: string
  setKnowledgeBaseTab: (tab: string) => void

  // Observability
  observabilityTab: string
  setObservabilityTab: (tab: string) => void

  // Chains
  chainsTab: string
  setChainsTab: (tab: string) => void

  // Consensus
  consensusTab: string
  setConsensusTab: (tab: string) => void

  // Delegation
  delegationTab: string
  setDelegationTab: (tab: string) => void

  // Teams
  teamsTab: string
  setTeamsTab: (tab: string) => void

  // Marketplace
  marketplaceTab: string
  setMarketplaceTab: (tab: string) => void

  // Versioning
  versioningTab: string
  setVersioningTab: (tab: string) => void

  // Dashboard Customizer
  dashboardTab: string
  setDashboardTab: (tab: string) => void

  // Environment
  envTab: string
  setEnvTab: (tab: string) => void

  // Benchmarking
  benchmarkingTab: string
  setBenchmarkingTab: (tab: string) => void

  // Feature Flags
  featureFlagsTab: string
  setFeatureFlagsTab: (tab: string) => void

  // Network Monitor
  networkTab: string
  setNetworkTab: (tab: string) => void

  // Docker
  dockerTab: string
  setDockerTab: (tab: string) => void

  // Prompt Library
  promptLibraryTab: string
  setPromptLibraryTab: (tab: string) => void

  // Automation Rules
  automationTab: string
  setAutomationTab: (tab: string) => void

  // Resource Quotas
  quotasTab: string
  setQuotasTab: (tab: string) => void

  // Incidents
  incidentTab: string
  setIncidentTab: (tab: string) => void

  // Event Bus
  eventBusTab: string
  setEventBusTab: (tab: string) => void

  // Onboarding
  onboardingStep: number
  setOnboardingStep: (step: number) => void

  // System Resources
  systemResourcesTab: 'overview' | 'processes' | 'network'
  setSystemResourcesTab: (tab: 'overview' | 'processes' | 'network') => void

  // Git Sync
  gitSyncTab: 'status' | 'pull' | 'history' | 'config'
  setGitSyncTab: (tab: 'status' | 'pull' | 'history' | 'config') => void

  // Sandbox
  sandboxTab: 'files' | 'processes' | 'output'
  setSandboxTab: (tab: 'files' | 'processes' | 'output') => void

  // Activity Timeline
  activityTab: 'all' | 'running' | 'today'
  setActivityTab: (tab: 'all' | 'running' | 'today') => void
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: string
}

export const useAgentOSStore = create<AgentOSStore>((set) => ({
  // Navigation
  activeSection: 'mission-control',
  setActiveSection: (section) => set({ activeSection: section }),
  
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Mobile menu
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  
  // Agent selection
  selectedAgentId: null,
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
  
  // Memory search & filters
  memorySearchQuery: '',
  setMemorySearchQuery: (query) => set({ memorySearchQuery: query }),
  memoryTypeFilter: 'all',
  setMemoryTypeFilter: (type) => set({ memoryTypeFilter: type }),
  memoryPathFilter: '',
  setMemoryPathFilter: (path) => set({ memoryPathFilter: path }),
  
  // Production tab
  productionTab: 'studio',
  setProductionTab: (tab) => set({ productionTab: tab }),
  
  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  // Chat
  chatMessages: [],
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChatMessages: () => set({ chatMessages: [] }),
  isChatLoading: false,
  setIsChatLoading: (loading) => set({ isChatLoading: loading }),

  // Brain Router
  brainTab: 'models',
  setBrainTab: (tab) => set({ brainTab: tab }),
  
  // Command terminal
  commandHistory: [],
  addCommandToHistory: (command) => set((state) => ({
    commandHistory: [...state.commandHistory.slice(-49), command]
  })),
  
  // Toasts
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  // Global search
  globalSearchOpen: false,
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  globalSearchQuery: '',
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),

  // Notifications
  notificationCount: 0,
  setNotificationCount: (count) => set({ notificationCount: count }),
  notificationPanelOpen: false,
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),

  // Keyboard shortcuts
  shortcutsHelpOpen: false,
  setShortcutsHelpOpen: (open) => set({ shortcutsHelpOpen: open }),

  // MCP
  mcpTab: 'servers',
  setMcpTab: (tab) => set({ mcpTab: tab }),
  mcpSelectedServer: null,
  setMcpSelectedServer: (id) => set({ mcpSelectedServer: id }),

  // Swarm
  swarmTab: 'swarms',
  setSwarmTab: (tab) => set({ swarmTab: tab }),

  // Knowledge Base
  knowledgeBaseTab: 'bases',
  setKnowledgeBaseTab: (tab) => set({ knowledgeBaseTab: tab }),

  // Observability
  observabilityTab: 'traces',
  setObservabilityTab: (tab) => set({ observabilityTab: tab }),

  // Chains
  chainsTab: 'chains',
  setChainsTab: (tab) => set({ chainsTab: tab }),

  // Consensus
  consensusTab: 'rounds',
  setConsensusTab: (tab) => set({ consensusTab: tab }),

  // Delegation
  delegationTab: 'active',
  setDelegationTab: (tab) => set({ delegationTab: tab }),

  // Teams
  teamsTab: 'teams',
  setTeamsTab: (tab) => set({ teamsTab: tab }),

  // Marketplace
  marketplaceTab: 'browse',
  setMarketplaceTab: (tab) => set({ marketplaceTab: tab }),

  // Versioning
  versioningTab: 'versions',
  setVersioningTab: (tab) => set({ versioningTab: tab }),

  // Dashboard Customizer
  dashboardTab: 'widgets',
  setDashboardTab: (tab) => set({ dashboardTab: tab }),

  // Environment
  envTab: 'variables',
  setEnvTab: (tab) => set({ envTab: tab }),

  // Benchmarking
  benchmarkingTab: 'benchmarks',
  setBenchmarkingTab: (tab) => set({ benchmarkingTab: tab }),

  // Docker
  dockerTab: 'containers',
  setDockerTab: (tab) => set({ dockerTab: tab }),

  // Feature Flags
  featureFlagsTab: 'flags',
  setFeatureFlagsTab: (tab) => set({ featureFlagsTab: tab }),

  // Network Monitor
  networkTab: 'overview',
  setNetworkTab: (tab) => set({ networkTab: tab }),

  // Prompt Library
  promptLibraryTab: 'prompts',
  setPromptLibraryTab: (tab) => set({ promptLibraryTab: tab }),

  // Automation Rules
  automationTab: 'rules',
  setAutomationTab: (tab) => set({ automationTab: tab }),

  // Resource Quotas
  quotasTab: 'quotas',
  setQuotasTab: (tab) => set({ quotasTab: tab }),

  // Incidents
  incidentTab: 'active',
  setIncidentTab: (tab) => set({ incidentTab: tab }),

  // Event Bus
  eventBusTab: 'topics',
  setEventBusTab: (tab) => set({ eventBusTab: tab }),

  // Onboarding
  onboardingStep: 0,
  setOnboardingStep: (step) => set({ onboardingStep: step }),

  // System Resources
  systemResourcesTab: 'overview',
  setSystemResourcesTab: (tab) => set({ systemResourcesTab: tab }),

  // Git Sync
  gitSyncTab: 'status',
  setGitSyncTab: (tab) => set({ gitSyncTab: tab }),

  // Sandbox
  sandboxTab: 'files',
  setSandboxTab: (tab) => set({ sandboxTab: tab }),

  // Activity Timeline
  activityTab: 'all',
  setActivityTab: (tab) => set({ activityTab: tab }),
}))
