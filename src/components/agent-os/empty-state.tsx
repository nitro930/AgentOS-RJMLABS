'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: React.ElementType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Animated icon with subtle pulse */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-16 h-16 rounded-2xl bg-[#1e1f2b] border border-[#2d2e3d] flex items-center justify-center mb-5"
      >
        <Icon className="w-7 h-7 text-emerald-400/70" />
      </motion.div>

      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#6b7280] max-w-sm leading-relaxed mb-6">{description}</p>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-5 h-9 rounded-lg transition-colors"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}
