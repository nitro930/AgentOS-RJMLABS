'use client'

import { ActivityEvent } from '@/lib/types'

interface ActivityTimelineProps {
  events: ActivityEvent[]
  isLoading?: boolean
}

const typeIcons: Record<string, string> = {
  agent_start: '🟢',
  agent_complete: '✅',
  agent_error: '🔴',
  agent_pause: '⏸️',
  memory_write: '💾',
  memory_pin: '📌',
  output_route: '🔀',
  system_alert: '⚠️',
  command: '⌨️',
}

const typeLabels: Record<string, string> = {
  agent_start: 'Agent Started',
  agent_complete: 'Task Completed',
  agent_error: 'Agent Error',
  agent_pause: 'Agent Paused',
  memory_write: 'Memory Written',
  memory_pin: 'Memory Pinned',
  output_route: 'Output Routed',
  system_alert: 'System Alert',
  command: 'Command Executed',
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function ActivityTimeline({ events, isLoading }: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#252636]" />
            <div className="flex-1 h-4 bg-[#252636] rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-[#6b7280]">
        <p className="text-sm">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
      {events.map((event, index) => {
        const detail = (() => {
          try { return JSON.parse(event.detail || '{}') } catch { return {} }
        })()

        return (
          <div
            key={event.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#252636]/50 transition-colors"
          >
            <span className="text-sm flex-shrink-0 mt-0.5">
              {typeIcons[event.type] || '📋'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-white truncate">
                  {typeLabels[event.type] || event.type}
                </p>
                <span className="text-[10px] text-[#6b7280] flex-shrink-0">
                  {formatTimeAgo(event.createdAt)}
                </span>
              </div>
              {detail.agent && (
                <p className="text-[11px] text-[#9ca3af] truncate">
                  {detail.agent} {detail.task ? `— ${detail.task}` : ''}
                </p>
              )}
              {detail.entry && (
                <p className="text-[11px] text-[#9ca3af] truncate">{detail.entry}</p>
              )}
              {detail.command && (
                <p className="text-[11px] text-[#9ca3af] truncate font-mono">{detail.command}</p>
              )}
              {detail.alert && (
                <p className="text-[11px] text-[#9ca3af] truncate">{detail.alert}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
