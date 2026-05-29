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
  | 'settings'

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
}))
