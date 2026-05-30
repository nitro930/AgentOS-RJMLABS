'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: string
  isLoading?: boolean
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = '#10b981', isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-4 w-20 rounded bg-[#2d2e3d] mb-3" />
          <div className="h-8 w-16 rounded bg-[#2d2e3d] mb-2" />
          <div className="h-3 w-24 rounded bg-[#2d2e3d]" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-6 hover:border-[#3d3e4d] transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-[#9ca3af] font-medium truncate">{title}</p>
          <p className="text-xl sm:text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-[#6b7280] mt-1 truncate">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-[#6b7280]">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color }} />
        </div>
      </div>
    </motion.div>
  )
}
