'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Bot,
  Settings,
} from 'lucide-react'
import { useAgentOSStore } from '@/lib/store'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'agent' | 'system'
  title: string
  message: string
  read: boolean
  isRead?: boolean
  createdAt: string
}

const typeConfig: Record<string, { icon: typeof Info; color: string; bg: string; border: string }> = {
  info: { icon: Info, color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  success: { icon: CheckCircle2, color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  error: { icon: AlertCircle, color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  agent: { icon: Bot, color: '#8b5cf6', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  system: { icon: Settings, color: '#6b7280', bg: 'bg-[#252636]', border: 'border-[#2d2e3d]' },
}

function formatTimeAgo(dateStr: string): string {
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7) return `${diffDay}d ago`
    return date.toLocaleDateString()
  } catch {
    return dateStr
  }
}

export function NotificationCenter() {
  const {
    notificationPanelOpen,
    setNotificationPanelOpen,
    notificationCount,
    setNotificationCount,
  } = useAgentOSStore()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      // Map DB field isRead -> frontend field read
      const mapped = (Array.isArray(data) ? data : []).map((n: any) => ({
        ...n,
        read: n.isRead !== undefined ? n.isRead : (n.read || false),
      }))
      setNotifications(mapped)
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?unread=true')
      const data = await res.json()
      setNotificationCount(Array.isArray(data) ? data.length : 0)
    } catch {
      // Error handling
    }
  }, [setNotificationCount])

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
    const interval = setInterval(() => {
      fetchNotifications()
      fetchUnreadCount()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchNotifications, fetchUnreadCount])

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setNotificationCount(Math.max(0, notificationCount - 1))
    } catch {
      // Error handling
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setNotificationCount(0)
    } catch {
      // Error handling
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      const notification = notifications.find((n) => n.id === id)
      if (notification && !notification.read) {
        setNotificationCount(Math.max(0, notificationCount - 1))
      }
    } catch {
      // Error handling
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <>
      {/* Notification Bell Button (can be placed in sidebar/header) */}
      <button
        onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
        className="relative w-10 h-10 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#9ca3af] hover:text-white transition-colors"
      >
        <Bell className="w-4 h-4" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      {/* Slide-in Panel */}
      <AnimatePresence>
        {notificationPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setNotificationPanelOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[#1a1b2e] border-l border-[#2d2e3d] z-50 flex flex-col shadow-2xl"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#2d2e3d]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 rounded-md hover:bg-emerald-500/10"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Mark all</span>
                    </button>
                  )}
                  <button
                    onClick={() => setNotificationPanelOpen(false)}
                    className="w-8 h-8 rounded-lg bg-[#252636] hover:bg-[#2d2e3d] flex items-center justify-center text-[#6b7280] hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="rounded-lg bg-[#252636] p-3 animate-pulse">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded bg-[#2d2e3d]" />
                          <div className="h-3 w-24 bg-[#2d2e3d] rounded" />
                        </div>
                        <div className="h-3 w-full bg-[#2d2e3d] rounded mb-1" />
                        <div className="h-3 w-3/4 bg-[#2d2e3d] rounded" />
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 text-[#6b7280] mx-auto mb-2" />
                    <p className="text-sm text-[#9ca3af]">No notifications</p>
                    <p className="text-[11px] text-[#6b7280] mt-1">You&apos;re all caught up</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {notifications.map((notification) => {
                      const config = typeConfig[notification.type] || typeConfig.info
                      const Icon = config.icon
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`relative rounded-lg border p-3 transition-colors ${
                            notification.read
                              ? 'bg-[#1e1f2b]/50 border-[#2d2e3d]/50'
                              : `${config.bg} ${config.border}`
                          }`}
                        >
                          {/* Unread dot */}
                          {!notification.read && (
                            <div
                              className="absolute top-3 right-3 w-2 h-2 rounded-full"
                              style={{ backgroundColor: config.color }}
                            />
                          )}

                          <div className="flex items-start gap-2.5">
                            {/* Type Icon */}
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${config.color}15` }}
                            >
                              <Icon className="w-4 h-4" style={{ color: config.color }} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${
                                  notification.read ? 'text-[#9ca3af]' : 'text-white'
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-[11px] text-[#6b7280] mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-[10px] text-[#6b7280] mt-1">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.read && (
                                <button
                                  onClick={() => handleMarkRead(notification.id)}
                                  className="w-7 h-7 rounded-md hover:bg-[#252636] flex items-center justify-center text-[#6b7280] hover:text-emerald-400 transition-colors"
                                  title="Mark as read"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                className="w-7 h-7 rounded-md hover:bg-red-500/10 flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
