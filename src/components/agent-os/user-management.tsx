'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Shield,
  Key,
  Plus,
  Trash2,
  Edit3,
  Search,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  UserPlus,
  Crown,
  AlertTriangle,
  Lock,
} from 'lucide-react'

// Types
interface RoleInfo {
  id: string
  name: string
  description: string | null
  color: string
  isSystem: boolean
  priority: number
}

interface UserInfo {
  id: string
  username: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
  roleId: string | null
  status: string
  lastLoginAt: string | null
  loginCount: number
  mfaEnabled: boolean
  preferences: string
  createdAt: string
  updatedAt: string
  role: RoleInfo | null
  sessions?: unknown[]
}

interface RolePermissionInfo {
  id: string
  roleId: string
  resource: string
  actions: string
  conditions: string
  createdAt: string
  updatedAt: string
}

interface RoleWithPerms extends RoleInfo {
  permissions: RolePermissionInfo[]
  createdAt: string
  updatedAt: string
  userCount?: number
}

type TabId = 'users' | 'roles' | 'permissions'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

const RESOURCES = [
  'agents', 'memory', 'workflows', 'terminal', 'settings',
  'users', 'audit', 'backups', 'knowledge', 'swarm', 'mcp', 'plugins',
]

const ACTION_LABELS: Record<string, string> = {
  read: 'Read',
  write: 'Write',
  execute: 'Execute',
  admin: 'Admin',
  delete: 'Delete',
}

const ALL_ACTIONS = ['read', 'write', 'execute', 'admin', 'delete']

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

function parseActions(actionsStr: string): string[] {
  try {
    return JSON.parse(actionsStr)
  } catch {
    return []
  }
}

export function UserManagement() {
  const [activeTab, setActiveTab] = useState<TabId>('users')
  const [users, setUsers] = useState<UserInfo[]>([])
  const [roles, setRoles] = useState<RoleWithPerms[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Dialog states
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState<UserInfo | null>(null)
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [showEditRole, setShowEditRole] = useState<RoleWithPerms | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // User form
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    displayName: '',
    password: '',
    roleId: '',
    status: 'active',
  })

  // Role form
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    color: '#10b981',
    priority: 0,
    permissions: [] as { resource: string; actions: string[] }[],
  })

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch {}
  }, [])

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/roles')
      if (res.ok) {
        const data = await res.json()
        setRoles(data)
      }
    } catch {}
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchUsers(), fetchRoles()]).finally(() => setLoading(false))
  }, [fetchUsers, fetchRoles])

  // User CRUD
  const handleCreateUser = async () => {
    if (!userForm.username || !userForm.password) return
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userForm.username,
          email: userForm.email || null,
          displayName: userForm.displayName || null,
          password: userForm.password,
          roleId: userForm.roleId || null,
          status: userForm.status,
        }),
      })
      if (res.ok) {
        setShowCreateUser(false)
        setUserForm({ username: '', email: '', displayName: '', password: '', roleId: '', status: 'active' })
        await fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create user')
      }
    } catch {}
  }

  const handleUpdateUser = async () => {
    if (!showEditUser) return
    setActionLoading(showEditUser.id)
    try {
      const res = await fetch(`/api/users/${showEditUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userForm.username,
          email: userForm.email || null,
          displayName: userForm.displayName || null,
          password: userForm.password || undefined,
          roleId: userForm.roleId || null,
          status: userForm.status,
        }),
      })
      if (res.ok) {
        setShowEditUser(null)
        setUserForm({ username: '', email: '', displayName: '', password: '', roleId: '', status: 'active' })
        await fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update user')
      }
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    setActionLoading(id)
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchUsers()
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const handleToggleUserStatus = async (user: UserInfo) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    setActionLoading(user.id)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) await fetchUsers()
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const openEditUser = (user: UserInfo) => {
    setUserForm({
      username: user.username,
      email: user.email || '',
      displayName: user.displayName || '',
      password: '',
      roleId: user.roleId || '',
      status: user.status,
    })
    setShowEditUser(user)
  }

  // Role CRUD
  const handleCreateRole = async () => {
    if (!roleForm.name) return
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleForm.name,
          description: roleForm.description || null,
          color: roleForm.color,
          priority: roleForm.priority,
          permissions: roleForm.permissions,
        }),
      })
      if (res.ok) {
        setShowCreateRole(false)
        setRoleForm({ name: '', description: '', color: '#10b981', priority: 0, permissions: [] })
        await fetchRoles()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create role')
      }
    } catch {}
  }

  const handleUpdateRole = async () => {
    if (!showEditRole) return
    setActionLoading(showEditRole.id)
    try {
      const res = await fetch(`/api/roles/${showEditRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleForm.name,
          description: roleForm.description || null,
          color: roleForm.color,
          priority: roleForm.priority,
          permissions: roleForm.permissions,
        }),
      })
      if (res.ok) {
        setShowEditRole(null)
        setRoleForm({ name: '', description: '', color: '#10b981', priority: 0, permissions: [] })
        await fetchRoles()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update role')
      }
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return
    setActionLoading(id)
    try {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchRoles()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete role')
      }
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const openEditRole = (role: RoleWithPerms) => {
    setRoleForm({
      name: role.name,
      description: role.description || '',
      color: role.color,
      priority: role.priority,
      permissions: role.permissions.map(p => ({
        resource: p.resource,
        actions: parseActions(p.actions),
      })),
    })
    setShowEditRole(role)
  }

  // Role permission helpers
  const togglePermissionAction = (resource: string, action: string) => {
    setRoleForm(prev => {
      const existing = prev.permissions.find(p => p.resource === resource)
      if (existing) {
        const actions = existing.actions.includes(action)
          ? existing.actions.filter(a => a !== action)
          : [...existing.actions, action]
        if (actions.length === 0) {
          return { ...prev, permissions: prev.permissions.filter(p => p.resource !== resource) }
        }
        return {
          ...prev,
          permissions: prev.permissions.map(p =>
            p.resource === resource ? { ...p, actions } : p
          ),
        }
      } else {
        return {
          ...prev,
          permissions: [...prev.permissions, { resource, actions: [action] }],
        }
      }
    })
  }

  const getPermissionActions = (resource: string): string[] => {
    const perm = roleForm.permissions.find(p => p.resource === resource)
    return perm ? perm.actions : []
  }

  // Stats
  const activeUsers = users.filter(u => u.status === 'active').length
  const totalUsers = users.length
  const totalRoles = roles.length
  const systemRoles = roles.filter(r => r.isSystem).length

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            User Management
          </h2>
          <p className="text-sm text-[#6b7280] mt-1">Multi-user access control, RBAC & permissions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-[#6b7280]">Active Users</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{activeUsers}</p>
          <p className="text-[10px] text-[#6b7280] mt-1">of {totalUsers} total</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-[#6b7280]">Roles</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">{totalRoles}</p>
          <p className="text-[10px] text-[#6b7280] mt-1">{systemRoles} system roles</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-[#6b7280]">Permissions</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {roles.reduce((sum, r) => sum + r.permissions.length, 0)}
          </p>
          <p className="text-[10px] text-[#6b7280] mt-1">across all roles</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-[#6b7280]">MFA Enabled</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{users.filter(u => u.mfaEnabled).length}</p>
          <p className="text-[10px] text-[#6b7280] mt-1">of {totalUsers} users</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a1b2e] p-1 rounded-lg border border-[#2d2e3d]">
        {([
          { id: 'users' as TabId, label: 'Users', icon: Users },
          { id: 'roles' as TabId, label: 'Roles', icon: Shield },
          { id: 'permissions' as TabId, label: 'Permissions', icon: Key },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                : 'text-[#6b7280] hover:text-white hover:bg-[#252636]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ==================== USERS TAB ==================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search + Create */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#6b7280] flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full px-3 py-1.5 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {['all', 'active', 'inactive', 'suspended'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all capitalize ${
                      statusFilter === s
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-[#6b7280] hover:text-white hover:bg-[#252636] border border-transparent'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setUserForm({ username: '', email: '', displayName: '', password: '', roleId: '', status: 'active' })
                  setShowCreateUser(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors flex-shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add User
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_1fr_120px_80px_100px_80px] gap-2 px-4 py-2.5 border-b border-[#2d2e3d] text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Last Login</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Table Body */}
            <div className="max-h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-[#6b7280]">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No users found</p>
                  <p className="text-xs mt-1">Create a user to get started</p>
                </div>
              ) : (
                filteredUsers.map((user, idx) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="grid grid-cols-[1fr_1fr_120px_80px_100px_80px] gap-2 px-4 py-3 border-b border-[#2d2e3d]/50 hover:bg-[#252636]/50 transition-colors items-center"
                  >
                    {/* User */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{ backgroundColor: (user.role?.color || '#6366f1') + '33', color: user.role?.color || '#6366f1' }}
                      >
                        {(user.displayName || user.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{user.displayName || user.username}</p>
                        <p className="text-[10px] text-[#6b7280] truncate">@{user.username}</p>
                      </div>
                    </div>

                    {/* Email */}
                    <p className="text-xs text-[#9ca3af] truncate">{user.email || '—'}</p>

                    {/* Role */}
                    <div className="min-w-0">
                      {user.role ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full font-medium truncate"
                          style={{ backgroundColor: (user.role?.color || '#6b7280') + '22', color: user.role?.color || '#6b7280', border: `1px solid ${(user.role?.color || '#6b7280')}44` }}
                        >
                          {user.role?.isSystem && <Crown className="w-2.5 h-2.5" />}
                          {user.role?.name || 'No role'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#6b7280]">No role</span>
                      )}
                    </div>

                    {/* Status */}
                    <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium w-fit ${STATUS_COLORS[user.status] || STATUS_COLORS.inactive}`}>
                      {user.status}
                    </span>

                    {/* Last Login */}
                    <span className="text-[10px] text-[#6b7280] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {user.lastLoginAt ? timeAgo(user.lastLoginAt) : 'Never'}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => handleToggleUserStatus(user)}
                        disabled={actionLoading === user.id}
                        className="p-1 hover:bg-[#252636] rounded transition-colors disabled:opacity-50"
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="w-3.5 h-3.5 text-[#6b7280] animate-spin" />
                        ) : user.status === 'active' ? (
                          <ToggleRight className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-3.5 h-3.5 text-[#6b7280]" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditUser(user)}
                        className="p-1 text-[#6b7280] hover:text-cyan-400 hover:bg-cyan-500/20 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={actionLoading === user.id}
                        className="p-1 text-[#6b7280] hover:text-red-400 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== ROLES TAB ==================== */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6b7280]">Define roles and assign resource permissions</p>
            <button
              onClick={() => {
                setRoleForm({ name: '', description: '', color: '#10b981', priority: 0, permissions: [] })
                setShowCreateRole(true)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Role
            </button>
          </div>

          <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar pr-1">
            {roles.length === 0 ? (
              <div className="text-center py-12 text-[#6b7280]">
                <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No roles defined</p>
                <p className="text-xs mt-1">Create a role to manage access control</p>
              </div>
            ) : (
              roles.map((role, idx) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: role.color + '33' }}
                        >
                          <Shield className="w-3.5 h-3.5" style={{ color: role.color }} />
                        </div>
                        <h3 className="text-sm font-semibold text-white">{role.name}</h3>
                        {role.isSystem && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Crown className="w-2.5 h-2.5" /> System
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          Priority: {role.priority}
                        </span>
                      </div>
                      {role.description && <p className="text-xs text-[#9ca3af] mb-2">{role.description}</p>}

                      {/* Permission chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {role.permissions.length === 0 ? (
                          <span className="text-[10px] text-[#6b7280] italic">No permissions assigned</span>
                        ) : (
                          role.permissions.map(perm => {
                            const actions = parseActions(perm.actions)
                            return (
                              <div
                                key={perm.id}
                                className="flex items-center gap-1 px-2 py-1 bg-[#0f1117] rounded-md border border-[#2d2e3d]"
                              >
                                <span className="text-[10px] font-medium text-[#9ca3af]">{perm.resource}</span>
                                <div className="flex gap-0.5">
                                  {actions.map(a => (
                                    <span
                                      key={a}
                                      className={`px-1 py-0.5 text-[8px] rounded font-medium ${
                                        a === 'admin' ? 'bg-red-500/20 text-red-400' :
                                        a === 'delete' ? 'bg-orange-500/20 text-orange-400' :
                                        a === 'write' ? 'bg-blue-500/20 text-blue-400' :
                                        a === 'execute' ? 'bg-purple-500/20 text-purple-400' :
                                        'bg-emerald-500/20 text-emerald-400'
                                      }`}
                                    >
                                      {a.slice(0, 3).toUpperCase()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-[#6b7280] mt-2">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {users.filter(u => u.roleId === role.id).length} user(s)
                        </span>
                        <span className="flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          {role.permissions.length} resource(s)
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => openEditRole(role)}
                        className="p-1.5 text-[#6b7280] hover:text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
                        title="Edit role"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {!role.isSystem && (
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={actionLoading === role.id}
                          className="p-1.5 text-[#6b7280] hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete role"
                        >
                          {actionLoading === role.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== PERMISSIONS TAB ==================== */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6b7280]">Visual permission matrix — roles vs. resources</p>
          </div>

          <div className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl overflow-hidden">
            {/* Matrix Header */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#2d2e3d]">
                    <th className="text-left text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider px-4 py-3 sticky left-0 bg-[#1a1b2e] z-10 min-w-[140px]">
                      Resource
                    </th>
                    {roles.map(role => (
                      <th key={role.id} className="text-center px-3 py-3 min-w-[100px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: role.color + '33' }}
                          >
                            <Shield className="w-3 h-3" style={{ color: role.color }} />
                          </div>
                          <span className="text-[10px] font-medium text-white truncate max-w-[80px]">{role.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RESOURCES.map((resource, idx) => (
                    <tr
                      key={resource}
                      className={`border-b border-[#2d2e3d]/50 ${idx % 2 === 0 ? 'bg-[#1a1b2e]' : 'bg-[#16172a]'}`}
                    >
                      <td className="text-left text-xs text-[#9ca3af] font-medium px-4 py-2.5 sticky left-0 bg-inherit z-10">
                        {resource}
                      </td>
                      {roles.map(role => {
                        const perm = role.permissions.find(p => p.resource === resource)
                        const actions = perm ? parseActions(perm.actions) : []

                        return (
                          <td key={role.id} className="text-center px-2 py-2">
                            {actions.length > 0 ? (
                              <div className="flex flex-wrap items-center justify-center gap-0.5">
                                {actions.map(a => (
                                  <span
                                    key={a}
                                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-[8px] font-bold ${
                                      a === 'admin' ? 'bg-red-500/20 text-red-400' :
                                      a === 'delete' ? 'bg-orange-500/20 text-orange-400' :
                                      a === 'write' ? 'bg-blue-500/20 text-blue-400' :
                                      a === 'execute' ? 'bg-purple-500/20 text-purple-400' :
                                      'bg-emerald-500/20 text-emerald-400'
                                    }`}
                                    title={ACTION_LABELS[a] || a}
                                  >
                                    {a.charAt(0).toUpperCase()}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#2d2e3d]">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap px-1">
            <span className="text-[10px] text-[#6b7280] font-semibold">Actions:</span>
            {[
              { key: 'read', label: 'Read', cls: 'bg-emerald-500/20 text-emerald-400' },
              { key: 'write', label: 'Write', cls: 'bg-blue-500/20 text-blue-400' },
              { key: 'execute', label: 'Execute', cls: 'bg-purple-500/20 text-purple-400' },
              { key: 'admin', label: 'Admin', cls: 'bg-red-500/20 text-red-400' },
              { key: 'delete', label: 'Delete', cls: 'bg-orange-500/20 text-orange-400' },
            ].map(item => (
              <span key={item.key} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${item.cls}`}>
                {item.key.charAt(0).toUpperCase()}
                <span className="text-[#6b7280]">{item.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ==================== CREATE/EDIT USER DIALOG ==================== */}
      <AnimatePresence>
        {(showCreateUser || showEditUser) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setShowCreateUser(false); setShowEditUser(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                {showEditUser ? <Edit3 className="w-5 h-5 text-cyan-400" /> : <UserPlus className="w-5 h-5 text-emerald-400" />}
                {showEditUser ? 'Edit User' : 'Create User'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Username *</label>
                  <input
                    value={userForm.username}
                    onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    placeholder="Username"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Display Name</label>
                  <input
                    value={userForm.displayName}
                    onChange={e => setUserForm({ ...userForm, displayName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    placeholder="Display name"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">{showEditUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={userForm.password}
                      onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full px-3 py-2 pr-10 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                      placeholder={showEditUser ? 'New password (optional)' : 'Password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6b7280] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Role</label>
                  <select
                    value={userForm.roleId}
                    onChange={e => setUserForm({ ...userForm, roleId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">No role assigned</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Status</label>
                  <select
                    value={userForm.status}
                    onChange={e => setUserForm({ ...userForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  onClick={() => { setShowCreateUser(false); setShowEditUser(null) }}
                  className="px-4 py-2 text-sm text-[#6b7280] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={showEditUser ? handleUpdateUser : handleCreateUser}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {showEditUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== CREATE/EDIT ROLE DIALOG ==================== */}
      <AnimatePresence>
        {(showCreateRole || showEditRole) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setShowCreateRole(false); setShowEditRole(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b2e] border border-[#2d2e3d] rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                {showEditRole ? <Edit3 className="w-5 h-5 text-cyan-400" /> : <Plus className="w-5 h-5 text-emerald-400" />}
                {showEditRole ? 'Edit Role' : 'Create Role'}
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Role Name *</label>
                    <input
                      value={roleForm.name}
                      onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                      placeholder="e.g. admin, operator"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Priority</label>
                    <input
                      type="number"
                      value={roleForm.priority}
                      onChange={e => setRoleForm({ ...roleForm, priority: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Description</label>
                  <input
                    value={roleForm.description}
                    onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500/50"
                    placeholder="Role description"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={roleForm.color}
                      onChange={e => setRoleForm({ ...roleForm, color: e.target.value })}
                      className="w-8 h-8 rounded border border-[#2d2e3d] bg-transparent cursor-pointer"
                    />
                    <input
                      value={roleForm.color}
                      onChange={e => setRoleForm({ ...roleForm, color: e.target.value })}
                      className="w-32 px-3 py-2 bg-[#0f1117] border border-[#2d2e3d] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                </div>

                {/* Permission Grid */}
                <div className="mt-4">
                  <label className="text-xs text-[#6b7280] mb-2 block font-semibold">Permissions</label>
                  <div className="bg-[#0f1117] border border-[#2d2e3d] rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_repeat(5,48px)] gap-1 px-3 py-2 border-b border-[#2d2e3d] text-[9px] font-semibold text-[#6b7280] uppercase tracking-wider">
                      <span>Resource</span>
                      {ALL_ACTIONS.map(a => (
                        <span key={a} className="text-center">{a.slice(0, 3).toUpperCase()}</span>
                      ))}
                    </div>
                    {/* Rows */}
                    {RESOURCES.map(resource => (
                      <div
                        key={resource}
                        className="grid grid-cols-[1fr_repeat(5,48px)] gap-1 px-3 py-1.5 border-b border-[#2d2e3d]/30 hover:bg-[#1a1b2e] transition-colors items-center"
                      >
                        <span className="text-xs text-[#9ca3af] font-medium">{resource}</span>
                        {ALL_ACTIONS.map(action => {
                          const active = getPermissionActions(resource).includes(action)
                          return (
                            <button
                              key={action}
                              onClick={() => togglePermissionAction(resource, action)}
                              className={`w-8 h-6 mx-auto rounded text-[9px] font-bold transition-all ${
                                active
                                  ? action === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    action === 'delete' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                    action === 'write' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                    action === 'execute' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-[#1a1b2e] text-[#2d2e3d] border border-transparent hover:border-[#2d2e3d]'
                              }`}
                            >
                              {active ? '✓' : '—'}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  onClick={() => { setShowCreateRole(false); setShowEditRole(null) }}
                  className="px-4 py-2 text-sm text-[#6b7280] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={showEditRole ? handleUpdateRole : handleCreateRole}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {showEditRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
