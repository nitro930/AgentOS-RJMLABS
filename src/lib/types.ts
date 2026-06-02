export interface Agent {
  id: string
  name: string
  type: string
  description: string
  status: string
  modelId: string | null
  config: string
  avatar: string | null
  color: string
  tasksCompleted: number
  tasksFailed: number
  lastActiveAt: string | null
  createdAt: string
  updatedAt: string
  tasks?: AgentTask[]
  outputs?: AgentOutput[]
  memories?: MemoryEntry[]
}

export interface AgentTask {
  id: string
  agentId: string
  title: string
  description: string
  status: string
  priority: string
  input: string
  output: string | null
  error: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface MemoryEntry {
  id: string
  type: string
  title: string
  content: string
  tags: string
  source: string | null
  agentId: string | null
  path: string | null
  pinned: boolean
  createdAt: string
  updatedAt: string
  agent?: { name: string; avatar: string | null } | null
}

export interface ProviderConfig {
  id: string
  name: string
  displayName: string
  provider: string
  apiKey: string
  baseUrl: string
  isActive: boolean
  isBuiltIn: boolean
  models: string
  config: string
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ModelConfig {
  id: string
  name: string
  provider: string
  providerId: string | null
  modelId: string
  isActive: boolean
  costPer1k: number
  maxTokens: number
  capabilities: string
  priority: number
  contextLength: number | null
  pricing: string
  createdAt: string
  updatedAt: string
}

export interface RoutingRule {
  id: string
  name: string
  condition: string
  modelId: string
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

export interface AgentOutput {
  id: string
  agentId: string
  type: string
  title: string
  content: string
  routedTo: string
  memoryId: string | null
  isArchived: boolean
  createdAt: string
  agent?: { name: string; avatar: string | null } | null
}

export interface Goal {
  id: string
  title: string
  description: string
  status: string
  progress: number
  priority: string
  dueDate: string | null
  workspaceId: string | null
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  name: string
  type: string
  description: string | null
  config: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ActivityEvent {
  id: string
  type: string
  source: string | null
  detail: string | null
  createdAt: string
}

export interface DashboardStats {
  agents: { total: number; active: number; list: Agent[] }
  tasks: { total: number; running: number; completed: number }
  memory: { total: number; pinned: number; byType: Record<string, number> }
  outputs: { today: number }
  goals: { total: number; active: number; completed: number }
  workspaces: number
  recentActivity: ActivityEvent[]
  recentOutputs: AgentOutput[]
}
