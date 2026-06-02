'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Users,
  BarChart3,
  Zap,
  Download,
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Star,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ─── Types ────────────────────────────────────────────────────────

interface AgentMetrics {
  name: string
  avatar: string
  tasksCompleted: number
  tasksFailed: number
  avgDuration: number // seconds
  cost: number // £
  tokensUsed: number
  uptime: number // 0-100
  score: number // 0-100
  trend: number[] // last 7 data points for sparkline
}

interface ReportMetrics {
  tasksCompleted: number
  tasksFailed: number
  avgDuration: number // seconds
  totalCost: number // £
  tokensUsed: number
  uptime: number // 0-100
}

interface TrendComparison {
  metric: string
  current: number
  previous: number
  change: number // percentage
  direction: 'up' | 'down' | 'flat'
}

interface Recommendation {
  id: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
}

interface CostBreakdown {
  byAgent: { name: string; cost: number; color: string }[]
  byModel: { name: string; cost: number }[]
  total: number
}

interface PerformanceReport {
  id: string
  title: string
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom'
  period: { start: string; end: string }
  status: 'completed' | 'generating' | 'scheduled' | 'failed'
  score: number // 0-100
  generatedAt: string
  executiveSummary: string
  metrics: ReportMetrics
  agents: AgentMetrics[]
  costBreakdown: CostBreakdown
  trendComparison: TrendComparison[]
  recommendations: Recommendation[]
}

interface GenerationConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom'
  dateFrom: string
  dateTo: string
  agentSelection: 'all' | string
  includeSummary: boolean
  includeMetrics: boolean
  includeCosts: boolean
  includeTrends: boolean
  includeRecommendations: boolean
  autoGenerate: boolean
}

// ─── Constants ────────────────────────────────────────────────────

const agentColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#ef4444']

const typeColors: Record<string, string> = {
  daily: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  weekly: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  monthly: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
  quarterly: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  custom: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
}

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  completed: { color: 'text-emerald-400', icon: CheckCircle },
  generating: { color: 'text-blue-400', icon: RefreshCw },
  scheduled: { color: 'text-amber-400', icon: Clock },
  failed: { color: 'text-red-400', icon: AlertTriangle },
}

const priorityColors: Record<string, string> = {
  high: 'border-red-500/30 text-red-400 bg-red-500/10',
  medium: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  low: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
}

// ─── Mock Data ────────────────────────────────────────────────────

const mockReports: PerformanceReport[] = [
  {
    id: 'rpt-1',
    title: 'Week 9 Performance Report',
    type: 'weekly',
    period: { start: '2026-02-23', end: '2026-03-01' },
    status: 'completed',
    score: 87,
    generatedAt: '2026-03-01T23:59:00Z',
    executiveSummary:
      'Overall agent performance remained strong this week with a composite score of 87/100. Task completion rates improved by 4.2% compared to the previous week. Hermes and Atlas were the top performers, while Sentinel showed increased failure rates in long-running tasks. Cost efficiency improved with a 12% reduction in token waste. Recommended actions include reviewing Sentinel\'s timeout configuration and expanding Hermes\'s task allocation.',
    metrics: {
      tasksCompleted: 342,
      tasksFailed: 18,
      avgDuration: 14.3,
      totalCost: 127.45,
      tokensUsed: 2847560,
      uptime: 99.2,
    },
    agents: [
      { name: 'Hermes', avatar: '⚡', tasksCompleted: 98, tasksFailed: 2, avgDuration: 8.2, cost: 34.20, tokensUsed: 820000, uptime: 99.8, score: 94, trend: [78, 82, 85, 88, 90, 92, 94] },
      { name: 'Atlas', avatar: '🌐', tasksCompleted: 87, tasksFailed: 3, avgDuration: 12.1, cost: 31.50, tokensUsed: 680000, uptime: 99.5, score: 91, trend: [75, 79, 83, 85, 88, 89, 91] },
      { name: 'Sentinel', avatar: '🛡️', tasksCompleted: 72, tasksFailed: 8, avgDuration: 22.5, cost: 28.30, tokensUsed: 560000, uptime: 97.8, score: 76, trend: [80, 78, 74, 76, 79, 77, 76] },
      { name: 'Nexus', avatar: '🔗', tasksCompleted: 55, tasksFailed: 3, avgDuration: 16.8, cost: 22.10, tokensUsed: 445000, uptime: 99.1, score: 83, trend: [70, 73, 76, 78, 80, 82, 83] },
      { name: 'Prism', avatar: '💎', tasksCompleted: 30, tasksFailed: 2, avgDuration: 18.4, cost: 11.35, tokensUsed: 342560, uptime: 98.5, score: 79, trend: [65, 68, 72, 74, 76, 78, 79] },
    ],
    costBreakdown: {
      byAgent: [
        { name: 'Hermes', cost: 34.20, color: '#10b981' },
        { name: 'Atlas', cost: 31.50, color: '#3b82f6' },
        { name: 'Sentinel', cost: 28.30, color: '#f59e0b' },
        { name: 'Nexus', cost: 22.10, color: '#8b5cf6' },
        { name: 'Prism', cost: 11.35, color: '#ec4899' },
      ],
      byModel: [
        { name: 'GPT-4o', cost: 52.80 },
        { name: 'Claude 3.5 Sonnet', cost: 38.45 },
        { name: 'GPT-4o-mini', cost: 21.20 },
        { name: 'Llama 3.1 70B', cost: 15.00 },
      ],
      total: 127.45,
    },
    trendComparison: [
      { metric: 'Tasks Completed', current: 342, previous: 328, change: 4.3, direction: 'up' },
      { metric: 'Failure Rate', current: 5.0, previous: 6.8, change: -26.5, direction: 'up' },
      { metric: 'Avg Duration', current: 14.3, previous: 15.8, change: -9.5, direction: 'up' },
      { metric: 'Total Cost', current: 127.45, previous: 144.80, change: -12.0, direction: 'up' },
      { metric: 'Token Efficiency', current: 89.2, previous: 84.1, change: 6.1, direction: 'up' },
      { metric: 'Uptime', current: 99.2, previous: 98.8, change: 0.4, direction: 'up' },
    ],
    recommendations: [
      { id: 'rec-1', priority: 'high', title: 'Review Sentinel Timeout Config', description: 'Sentinel\'s failure rate spiked on long-running tasks (>30s). Consider increasing timeout thresholds and adding retry logic.', impact: 'Could reduce failures by ~40%' },
      { id: 'rec-2', priority: 'medium', title: 'Expand Hermes Task Allocation', description: 'Hermes has the highest efficiency score (94/100) with surplus capacity. Route more complex tasks to Hermes.', impact: 'Estimated 15% throughput increase' },
      { id: 'rec-3', priority: 'medium', title: 'Optimize Token Usage for Prism', description: 'Prism\'s token-per-task ratio is 30% above average. Review prompt templates for compression opportunities.', impact: 'Potential £3.40/week savings' },
      { id: 'rec-4', priority: 'low', title: 'Schedule Atlas Maintenance Window', description: 'Atlas showed minor latency spikes during peak hours. A brief maintenance window could stabilise performance.', impact: 'Minimal; 2-3% latency improvement' },
    ],
  },
  {
    id: 'rpt-2',
    title: 'Week 8 Performance Report',
    type: 'weekly',
    period: { start: '2026-02-16', end: '2026-02-22' },
    status: 'completed',
    score: 82,
    generatedAt: '2026-02-22T23:59:00Z',
    executiveSummary:
      'Week 8 saw a composite score of 82/100, a moderate improvement from the prior week. Atlas handled the highest volume of tasks. Cost increased by 8% due to elevated GPT-4o usage. Network latency contributed to several Sentinel timeouts.',
    metrics: {
      tasksCompleted: 328,
      tasksFailed: 24,
      avgDuration: 15.8,
      totalCost: 144.80,
      tokensUsed: 2654000,
      uptime: 98.8,
    },
    agents: [
      { name: 'Hermes', avatar: '⚡', tasksCompleted: 85, tasksFailed: 4, avgDuration: 9.1, cost: 38.10, tokensUsed: 790000, uptime: 99.6, score: 89, trend: [72, 76, 79, 82, 85, 87, 89] },
      { name: 'Atlas', avatar: '🌐', tasksCompleted: 92, tasksFailed: 5, avgDuration: 13.5, cost: 35.80, tokensUsed: 720000, uptime: 99.2, score: 86, trend: [68, 72, 75, 78, 80, 83, 86] },
      { name: 'Sentinel', avatar: '🛡️', tasksCompleted: 68, tasksFailed: 10, avgDuration: 24.2, cost: 32.50, tokensUsed: 530000, uptime: 96.5, score: 70, trend: [77, 75, 72, 70, 73, 71, 70] },
      { name: 'Nexus', avatar: '🔗', tasksCompleted: 50, tasksFailed: 3, avgDuration: 17.9, cost: 24.20, tokensUsed: 380000, uptime: 98.9, score: 80, trend: [66, 69, 72, 74, 76, 78, 80] },
      { name: 'Prism', avatar: '💎', tasksCompleted: 33, tasksFailed: 2, avgDuration: 19.6, cost: 14.20, tokensUsed: 234000, uptime: 97.2, score: 75, trend: [62, 65, 68, 70, 72, 74, 75] },
    ],
    costBreakdown: {
      byAgent: [
        { name: 'Atlas', cost: 35.80, color: '#3b82f6' },
        { name: 'Hermes', cost: 38.10, color: '#10b981' },
        { name: 'Sentinel', cost: 32.50, color: '#f59e0b' },
        { name: 'Nexus', cost: 24.20, color: '#8b5cf6' },
        { name: 'Prism', cost: 14.20, color: '#ec4899' },
      ],
      byModel: [
        { name: 'GPT-4o', cost: 62.30 },
        { name: 'Claude 3.5 Sonnet', cost: 42.10 },
        { name: 'GPT-4o-mini', cost: 24.50 },
        { name: 'Llama 3.1 70B', cost: 15.90 },
      ],
      total: 144.80,
    },
    trendComparison: [
      { metric: 'Tasks Completed', current: 328, previous: 310, change: 5.8, direction: 'up' },
      { metric: 'Failure Rate', current: 6.8, previous: 8.2, change: -17.1, direction: 'up' },
      { metric: 'Avg Duration', current: 15.8, previous: 17.2, change: -8.1, direction: 'up' },
      { metric: 'Total Cost', current: 144.80, previous: 134.10, change: 8.0, direction: 'down' },
      { metric: 'Token Efficiency', current: 84.1, previous: 80.5, change: 4.5, direction: 'up' },
      { metric: 'Uptime', current: 98.8, previous: 97.9, change: 0.9, direction: 'up' },
    ],
    recommendations: [
      { id: 'rec-5', priority: 'high', title: 'Investigate Network Latency', description: 'Several Sentinel timeouts correlated with network latency spikes during 14:00-16:00 UTC.', impact: 'Could improve uptime by 1.5%' },
      { id: 'rec-6', priority: 'medium', title: 'Shift GPT-4o to GPT-4o-mini', description: '30% of GPT-4o calls could use GPT-4o-mini without quality loss.', impact: 'Estimated £8.20/week savings' },
    ],
  },
  {
    id: 'rpt-3',
    title: 'February 2026 Monthly Report',
    type: 'monthly',
    period: { start: '2026-02-01', end: '2026-02-28' },
    status: 'completed',
    score: 84,
    generatedAt: '2026-02-28T23:59:00Z',
    executiveSummary:
      'February demonstrated consistent performance with a composite score of 84/100. Total tasks completed surpassed 1,400, a 12% increase over January. Cost per task decreased from £0.42 to £0.38, reflecting improved efficiency. Hermes maintained the highest uptime at 99.7%. Two incidents caused brief downtime for Sentinel, which are addressed in recommendations.',
    metrics: {
      tasksCompleted: 1426,
      tasksFailed: 78,
      avgDuration: 15.1,
      totalCost: 542.30,
      tokensUsed: 11820000,
      uptime: 98.6,
    },
    agents: [
      { name: 'Hermes', avatar: '⚡', tasksCompleted: 420, tasksFailed: 12, avgDuration: 8.6, cost: 145.80, tokensUsed: 3500000, uptime: 99.7, score: 92, trend: [80, 82, 85, 87, 89, 91, 92] },
      { name: 'Atlas', avatar: '🌐', tasksCompleted: 380, tasksFailed: 18, avgDuration: 12.8, cost: 138.50, tokensUsed: 2900000, uptime: 99.3, score: 88, trend: [74, 77, 80, 83, 85, 87, 88] },
      { name: 'Sentinel', avatar: '🛡️', tasksCompleted: 298, tasksFailed: 32, avgDuration: 23.4, cost: 112.00, tokensUsed: 2300000, uptime: 96.2, score: 72, trend: [76, 74, 72, 70, 73, 71, 72] },
      { name: 'Nexus', avatar: '🔗', tasksCompleted: 210, tasksFailed: 10, avgDuration: 17.2, cost: 92.00, tokensUsed: 1780000, uptime: 98.8, score: 81, trend: [68, 71, 74, 76, 78, 80, 81] },
      { name: 'Prism', avatar: '💎', tasksCompleted: 118, tasksFailed: 6, avgDuration: 19.1, cost: 54.00, tokensUsed: 1340000, uptime: 97.0, score: 76, trend: [63, 66, 69, 72, 74, 75, 76] },
    ],
    costBreakdown: {
      byAgent: [
        { name: 'Hermes', cost: 145.80, color: '#10b981' },
        { name: 'Atlas', cost: 138.50, color: '#3b82f6' },
        { name: 'Sentinel', cost: 112.00, color: '#f59e0b' },
        { name: 'Nexus', cost: 92.00, color: '#8b5cf6' },
        { name: 'Prism', cost: 54.00, color: '#ec4899' },
      ],
      byModel: [
        { name: 'GPT-4o', cost: 225.40 },
        { name: 'Claude 3.5 Sonnet', cost: 162.80 },
        { name: 'GPT-4o-mini', cost: 98.60 },
        { name: 'Llama 3.1 70B', cost: 55.50 },
      ],
      total: 542.30,
    },
    trendComparison: [
      { metric: 'Tasks Completed', current: 1426, previous: 1270, change: 12.3, direction: 'up' },
      { metric: 'Failure Rate', current: 5.2, previous: 7.1, change: -26.8, direction: 'up' },
      { metric: 'Avg Duration', current: 15.1, previous: 16.9, change: -10.7, direction: 'up' },
      { metric: 'Total Cost', current: 542.30, previous: 530.70, change: 2.2, direction: 'down' },
      { metric: 'Token Efficiency', current: 86.5, previous: 82.0, change: 5.5, direction: 'up' },
      { metric: 'Uptime', current: 98.6, previous: 97.8, change: 0.8, direction: 'up' },
    ],
    recommendations: [
      { id: 'rec-7', priority: 'high', title: 'Fix Sentinel Incident Recurrence', description: 'Two incidents this month affected Sentinel. Root cause: memory leaks in long-running sessions. Deploy patch v2.3.1.', impact: 'Could bring uptime to 99%+' },
      { id: 'rec-8', priority: 'medium', title: 'Rebalance Agent Workload', description: 'Hermes handles 29% of tasks but has capacity for 40%. Redistribute from Sentinel to Hermes.', impact: 'Estimated 18% throughput gain' },
      { id: 'rec-9', priority: 'low', title: 'Upgrade Llama Model', description: 'Switch from Llama 3.1 70B to Llama 3.3 70B for improved quality at same cost.', impact: 'Minor quality improvement at no extra cost' },
    ],
  },
  {
    id: 'rpt-4',
    title: 'January 2026 Monthly Report',
    type: 'monthly',
    period: { start: '2026-01-01', end: '2026-01-31' },
    status: 'completed',
    score: 78,
    generatedAt: '2026-01-31T23:59:00Z',
    executiveSummary:
      'January performance scored 78/100, reflecting growing pains as the agent fleet expanded. New agents Nexus and Prism were onboarded mid-month, causing temporary efficiency dips. Overall task volume increased 25%, but cost per task rose to £0.42. Focus areas: onboarding optimisation and cost management.',
    metrics: {
      tasksCompleted: 1270,
      tasksFailed: 97,
      avgDuration: 16.9,
      totalCost: 530.70,
      tokensUsed: 10540000,
      uptime: 97.8,
    },
    agents: [
      { name: 'Hermes', avatar: '⚡', tasksCompleted: 390, tasksFailed: 15, avgDuration: 9.4, cost: 140.20, tokensUsed: 3200000, uptime: 99.5, score: 88, trend: [75, 78, 80, 82, 84, 86, 88] },
      { name: 'Atlas', avatar: '🌐', tasksCompleted: 350, tasksFailed: 22, avgDuration: 13.9, cost: 132.50, tokensUsed: 2700000, uptime: 99.0, score: 83, trend: [68, 72, 75, 77, 79, 81, 83] },
      { name: 'Sentinel', avatar: '🛡️', tasksCompleted: 280, tasksFailed: 40, avgDuration: 25.1, cost: 108.00, tokensUsed: 2100000, uptime: 95.5, score: 68, trend: [74, 72, 70, 68, 70, 67, 68] },
      { name: 'Nexus', avatar: '🔗', tasksCompleted: 150, tasksFailed: 12, avgDuration: 18.5, cost: 85.00, tokensUsed: 1500000, uptime: 97.5, score: 74, trend: [55, 60, 64, 67, 70, 72, 74] },
      { name: 'Prism', avatar: '💎', tasksCompleted: 100, tasksFailed: 8, avgDuration: 20.8, cost: 65.00, tokensUsed: 1040000, uptime: 95.8, score: 70, trend: [50, 55, 58, 62, 65, 68, 70] },
    ],
    costBreakdown: {
      byAgent: [
        { name: 'Hermes', cost: 140.20, color: '#10b981' },
        { name: 'Atlas', cost: 132.50, color: '#3b82f6' },
        { name: 'Sentinel', cost: 108.00, color: '#f59e0b' },
        { name: 'Nexus', cost: 85.00, color: '#8b5cf6' },
        { name: 'Prism', cost: 65.00, color: '#ec4899' },
      ],
      byModel: [
        { name: 'GPT-4o', cost: 218.00 },
        { name: 'Claude 3.5 Sonnet', cost: 155.20 },
        { name: 'GPT-4o-mini', cost: 98.50 },
        { name: 'Llama 3.1 70B', cost: 59.00 },
      ],
      total: 530.70,
    },
    trendComparison: [
      { metric: 'Tasks Completed', current: 1270, previous: 1015, change: 25.1, direction: 'up' },
      { metric: 'Failure Rate', current: 7.1, previous: 5.5, change: 29.1, direction: 'down' },
      { metric: 'Avg Duration', current: 16.9, previous: 14.2, change: 19.0, direction: 'down' },
      { metric: 'Total Cost', current: 530.70, previous: 380.20, change: 39.6, direction: 'down' },
      { metric: 'Token Efficiency', current: 82.0, previous: 86.5, change: -5.2, direction: 'down' },
      { metric: 'Uptime', current: 97.8, previous: 99.1, change: -1.3, direction: 'down' },
    ],
    recommendations: [
      { id: 'rec-10', priority: 'high', title: 'Accelerate Agent Onboarding', description: 'New agents Nexus and Prism took 2+ weeks to reach stable performance. Implement structured onboarding protocols.', impact: 'Reduce ramp-up time by 50%' },
      { id: 'rec-11', priority: 'high', title: 'Cost Alert Thresholds', description: 'Monthly spend exceeded budget by 6%. Set per-agent cost caps and real-time alerts.', impact: 'Prevent budget overruns' },
    ],
  },
  {
    id: 'rpt-5',
    title: 'Q4 2025 Quarterly Review',
    type: 'quarterly',
    period: { start: '2025-10-01', end: '2025-12-31' },
    status: 'completed',
    score: 79,
    generatedAt: '2025-12-31T23:59:00Z',
    executiveSummary:
      'Q4 2025 delivered a composite score of 79/100. The quarter saw significant fleet expansion from 2 to 5 agents, with corresponding growing pains. Task throughput increased 180% while costs rose 145%. December showed marked improvement as new agents stabilised. Key wins: Hermes achieved 99.5% uptime for the quarter. Key concern: Sentinel reliability declining quarter-over-quarter.',
    metrics: {
      tasksCompleted: 3840,
      tasksFailed: 312,
      avgDuration: 17.8,
      totalCost: 1680.50,
      tokensUsed: 32500000,
      uptime: 97.2,
    },
    agents: [
      { name: 'Hermes', avatar: '⚡', tasksCompleted: 1120, tasksFailed: 35, avgDuration: 9.8, cost: 430.00, tokensUsed: 9200000, uptime: 99.5, score: 90, trend: [78, 80, 83, 85, 87, 89, 90] },
      { name: 'Atlas', avatar: '🌐', tasksCompleted: 980, tasksFailed: 55, avgDuration: 15.2, cost: 410.00, tokensUsed: 8100000, uptime: 98.8, score: 84, trend: [70, 74, 76, 79, 81, 83, 84] },
      { name: 'Sentinel', avatar: '🛡️', tasksCompleted: 820, tasksFailed: 120, avgDuration: 27.5, cost: 380.00, tokensUsed: 6800000, uptime: 93.5, score: 64, trend: [72, 70, 68, 66, 65, 63, 64] },
      { name: 'Nexus', avatar: '🔗', tasksCompleted: 560, tasksFailed: 62, avgDuration: 19.8, cost: 280.00, tokensUsed: 4800000, uptime: 96.8, score: 72, trend: [48, 55, 60, 64, 68, 70, 72] },
      { name: 'Prism', avatar: '💎', tasksCompleted: 360, tasksFailed: 40, avgDuration: 22.1, cost: 180.50, tokensUsed: 3600000, uptime: 94.2, score: 68, trend: [42, 48, 53, 58, 62, 66, 68] },
    ],
    costBreakdown: {
      byAgent: [
        { name: 'Hermes', cost: 430.00, color: '#10b981' },
        { name: 'Atlas', cost: 410.00, color: '#3b82f6' },
        { name: 'Sentinel', cost: 380.00, color: '#f59e0b' },
        { name: 'Nexus', cost: 280.00, color: '#8b5cf6' },
        { name: 'Prism', cost: 180.50, color: '#ec4899' },
      ],
      byModel: [
        { name: 'GPT-4o', cost: 680.00 },
        { name: 'Claude 3.5 Sonnet', cost: 510.50 },
        { name: 'GPT-4o-mini', cost: 310.00 },
        { name: 'Llama 3.1 70B', cost: 180.00 },
      ],
      total: 1680.50,
    },
    trendComparison: [
      { metric: 'Tasks Completed', current: 3840, previous: 1370, change: 180.3, direction: 'up' },
      { metric: 'Failure Rate', current: 7.5, previous: 4.8, change: 56.3, direction: 'down' },
      { metric: 'Avg Duration', current: 17.8, previous: 12.5, change: 42.4, direction: 'down' },
      { metric: 'Total Cost', current: 1680.50, previous: 686.00, change: 145.0, direction: 'down' },
      { metric: 'Token Efficiency', current: 80.2, previous: 88.5, change: -9.4, direction: 'down' },
      { metric: 'Uptime', current: 97.2, previous: 99.5, change: -2.3, direction: 'down' },
    ],
    recommendations: [
      { id: 'rec-12', priority: 'high', title: 'Sentinel Reliability Overhaul', description: 'Sentinel\'s uptime dropped below 94%. Conduct full reliability audit and consider infrastructure upgrades.', impact: 'Critical: could prevent potential data loss' },
      { id: 'rec-13', priority: 'medium', title: 'Implement Cost Scaling Policies', description: 'With fleet expansion, costs grew disproportionately. Implement auto-scaling policies tied to task demand.', impact: 'Could reduce Q1 costs by 20%+' },
      { id: 'rec-14', priority: 'low', title: 'Standardise Agent Frameworks', description: 'Different agents use varying model configurations. Standardise for better comparability and maintenance.', impact: 'Long-term maintainability improvement' },
    ],
  },
  {
    id: 'rpt-6',
    title: 'Daily Report — 28 Feb 2026',
    type: 'daily',
    period: { start: '2026-02-28', end: '2026-02-28' },
    status: 'completed',
    score: 91,
    generatedAt: '2026-02-28T23:59:00Z',
    executiveSummary:
      'An excellent day with a composite score of 91/100. All agents performed within expected parameters. Hermes achieved a perfect 100% task completion rate. Total cost was £18.50, under the daily budget of £22. No incidents reported.',
    metrics: {
      tasksCompleted: 52,
      tasksFailed: 1,
      avgDuration: 11.2,
      totalCost: 18.50,
      tokensUsed: 412000,
      uptime: 99.9,
    },
    agents: [
      { name: 'Hermes', avatar: '⚡', tasksCompleted: 18, tasksFailed: 0, avgDuration: 6.8, cost: 5.20, tokensUsed: 120000, uptime: 100, score: 98, trend: [88, 90, 92, 94, 95, 97, 98] },
      { name: 'Atlas', avatar: '🌐', tasksCompleted: 14, tasksFailed: 0, avgDuration: 10.5, cost: 4.80, tokensUsed: 105000, uptime: 100, score: 95, trend: [82, 85, 87, 90, 92, 94, 95] },
      { name: 'Sentinel', avatar: '🛡️', tasksCompleted: 8, tasksFailed: 1, avgDuration: 18.2, cost: 3.60, tokensUsed: 72000, uptime: 99.5, score: 82, trend: [75, 78, 79, 80, 81, 80, 82] },
      { name: 'Nexus', avatar: '🔗', tasksCompleted: 7, tasksFailed: 0, avgDuration: 12.1, cost: 2.90, tokensUsed: 65000, uptime: 100, score: 90, trend: [78, 80, 83, 85, 87, 89, 90] },
      { name: 'Prism', avatar: '💎', tasksCompleted: 5, tasksFailed: 0, avgDuration: 14.5, cost: 2.00, tokensUsed: 50000, uptime: 99.8, score: 85, trend: [72, 75, 78, 80, 82, 84, 85] },
    ],
    costBreakdown: {
      byAgent: [
        { name: 'Hermes', cost: 5.20, color: '#10b981' },
        { name: 'Atlas', cost: 4.80, color: '#3b82f6' },
        { name: 'Sentinel', cost: 3.60, color: '#f59e0b' },
        { name: 'Nexus', cost: 2.90, color: '#8b5cf6' },
        { name: 'Prism', cost: 2.00, color: '#ec4899' },
      ],
      byModel: [
        { name: 'GPT-4o', cost: 8.20 },
        { name: 'Claude 3.5 Sonnet', cost: 5.80 },
        { name: 'GPT-4o-mini', cost: 3.00 },
        { name: 'Llama 3.1 70B', cost: 1.50 },
      ],
      total: 18.50,
    },
    trendComparison: [
      { metric: 'Tasks Completed', current: 52, previous: 48, change: 8.3, direction: 'up' },
      { metric: 'Failure Rate', current: 1.9, previous: 3.8, change: -50.0, direction: 'up' },
      { metric: 'Avg Duration', current: 11.2, previous: 13.5, change: -17.0, direction: 'up' },
      { metric: 'Total Cost', current: 18.50, previous: 21.30, change: -13.1, direction: 'up' },
      { metric: 'Token Efficiency', current: 92.5, previous: 88.0, change: 5.1, direction: 'up' },
      { metric: 'Uptime', current: 99.9, previous: 99.4, change: 0.5, direction: 'up' },
    ],
    recommendations: [
      { id: 'rec-15', priority: 'low', title: 'Maintain Current Configuration', description: 'Today\'s performance exceeded targets. No immediate changes needed. Continue monitoring.', impact: 'N/A — maintenance mode' },
    ],
  },
]

// ─── Sub-components ───────────────────────────────────────────────

function ScoreGauge({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const center = size / 2

  const getColor = (s: number) => {
    if (s >= 90) return '#10b981'
    if (s >= 75) return '#3b82f6'
    if (s >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const color = getColor(score)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#252636"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-[9px] text-[#9ca3af] uppercase tracking-wider">Score</span>
      </div>
    </div>
  )
}

function Sparkline({ data, color = '#10b981', width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 2

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (v - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const pathD = `M${points.join(' L')}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  )
}

function TrendIndicator({ direction, change }: { direction: 'up' | 'down' | 'flat'; change: number }) {
  const isPositive = direction === 'up'
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(change).toFixed(1)}%
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────

export function PerformanceReports() {
  const [activeTab, setActiveTab] = useState('reports')
  const [selectedReport, setSelectedReport] = useState<PerformanceReport | null>(null)
  const [hoveredReportId, setHoveredReportId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [genConfig, setGenConfig] = useState<GenerationConfig>({
    type: 'weekly',
    dateFrom: '',
    dateTo: '',
    agentSelection: 'all',
    includeSummary: true,
    includeMetrics: true,
    includeCosts: true,
    includeTrends: true,
    includeRecommendations: true,
    autoGenerate: false,
  })

  const handleGenerateReport = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setActiveTab('reports')
    }, 2500)
  }

  const formatCurrency = (val: number) => `£${val.toFixed(2)}`
  const formatNumber = (val: number) => val.toLocaleString()
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    return `${(seconds / 60).toFixed(1)}m`
  }
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  // ─── Report Detail View ────────────────────────────────────────

  if (selectedReport) {
    const report = selectedReport

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Back Button & Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#9ca3af] hover:text-white hover:bg-[#252636]"
            onClick={() => setSelectedReport(null)}
          >
            ← Back
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg sm:text-2xl font-bold text-white"
            >
              {report.title}
            </motion.h2>
            <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
              {formatDate(report.period.start)} — {formatDate(report.period.end)} · Generated {formatDate(report.generatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={typeColors[report.type]}>
              {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
            </Badge>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
            <Button size="sm" variant="ghost" className="text-[#9ca3af] hover:text-white border border-[#2d2e3d]">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Executive Summary + Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4 sm:p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Executive Summary
            </h3>
            <p className="text-sm text-[#9ca3af] leading-relaxed">{report.executiveSummary}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4 sm:p-5 flex flex-col items-center justify-center"
          >
            <ScoreGauge score={report.score} size={140} />
            <p className="text-xs text-[#9ca3af] mt-2">Performance Score</p>
          </motion.div>
        </div>

        {/* Key Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Tasks Completed', value: formatNumber(report.metrics.tasksCompleted), icon: CheckCircle, color: '#10b981' },
              { label: 'Tasks Failed', value: formatNumber(report.metrics.tasksFailed), icon: AlertTriangle, color: '#ef4444' },
              { label: 'Avg Duration', value: formatDuration(report.metrics.avgDuration), icon: Clock, color: '#3b82f6' },
              { label: 'Total Cost', value: formatCurrency(report.metrics.totalCost), icon: DollarSign, color: '#f59e0b' },
              { label: 'Tokens Used', value: formatNumber(report.metrics.tokensUsed), icon: Zap, color: '#8b5cf6' },
              { label: 'Uptime', value: `${report.metrics.uptime}%`, icon: TrendingUp, color: '#06b6d4' },
            ].map((metric) => (
              <motion.div
                key={metric.label}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-3 sm:p-4 hover:border-[#3d3e4d] transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${metric.color}15` }}
                  >
                    <metric.icon className="w-3.5 h-3.5" style={{ color: metric.color }} />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-[#9ca3af] truncate">{metric.label}</p>
                <p className="text-sm sm:text-lg font-bold text-white">{metric.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Agent Breakdown Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Agent Breakdown
          </h3>
          <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2d2e3d]">
                  <th className="text-left py-2.5 px-2 text-[#6b7280] font-medium">Agent</th>
                  <th className="text-right py-2.5 px-2 text-[#6b7280] font-medium">Score</th>
                  <th className="text-right py-2.5 px-2 text-[#6b7280] font-medium">Completed</th>
                  <th className="text-right py-2.5 px-2 text-[#6b7280] font-medium">Failed</th>
                  <th className="text-right py-2.5 px-2 text-[#6b7280] font-medium">Avg Duration</th>
                  <th className="text-right py-2.5 px-2 text-[#6b7280] font-medium">Cost</th>
                  <th className="text-right py-2.5 px-2 text-[#6b7280] font-medium">Uptime</th>
                  <th className="text-center py-2.5 px-2 text-[#6b7280] font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {report.agents.map((agent, i) => {
                  const sparkColor = agent.score >= 85 ? '#10b981' : agent.score >= 70 ? '#3b82f6' : '#f59e0b'
                  return (
                    <tr
                      key={agent.name}
                      className="border-b border-[#2d2e3d]/50 hover:bg-[#252636]/50 transition-colors"
                    >
                      <td className="py-2.5 px-2 text-white font-medium">
                        <span className="flex items-center gap-1.5">
                          <span>{agent.avatar}</span>
                          <span>{agent.name}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className={`font-bold ${agent.score >= 85 ? 'text-emerald-400' : agent.score >= 70 ? 'text-blue-400' : 'text-amber-400'}`}>
                          {agent.score}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right text-[#9ca3af]">{agent.tasksCompleted}</td>
                      <td className="py-2.5 px-2 text-right text-[#9ca3af]">{agent.tasksFailed}</td>
                      <td className="py-2.5 px-2 text-right text-[#9ca3af]">{formatDuration(agent.avgDuration)}</td>
                      <td className="py-2.5 px-2 text-right text-emerald-400 font-medium">{formatCurrency(agent.cost)}</td>
                      <td className="py-2.5 px-2 text-right text-[#9ca3af]">{agent.uptime}%</td>
                      <td className="py-2.5 px-2">
                        <div className="flex justify-center">
                          <Sparkline data={agent.trend} color={sparkColor} width={64} height={22} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Cost Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4 sm:p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Cost by Agent
            </h3>
            <div className="space-y-3">
              {report.costBreakdown.byAgent.map((item, i) => {
                const maxCost = Math.max(...report.costBreakdown.byAgent.map((a) => a.cost), 1)
                const percentage = (item.cost / maxCost) * 100
                const color = item.color || agentColors[i % agentColors.length]
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#9ca3af]">{item.name}</span>
                      <span className="text-xs font-medium text-white">{formatCurrency(item.cost)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#252636] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
              <div className="pt-2 mt-2 border-t border-[#2d2e3d] flex items-center justify-between">
                <span className="text-xs font-medium text-white">Total</span>
                <span className="text-sm font-bold text-emerald-400">{formatCurrency(report.costBreakdown.total)}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4 sm:p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Cost by Model
            </h3>
            <div className="space-y-3">
              {report.costBreakdown.byModel.map((item, i) => {
                const maxCost = Math.max(...report.costBreakdown.byModel.map((m) => m.cost), 1)
                const percentage = (item.cost / maxCost) * 100
                const color = agentColors[(i + 2) % agentColors.length]
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#9ca3af]">{item.name}</span>
                      <span className="text-xs font-medium text-white">{formatCurrency(item.cost)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#252636] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Trend Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Trend Comparison vs Previous Period
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {report.trendComparison.map((trend) => (
              <div
                key={trend.metric}
                className="rounded-lg border border-[#2d2e3d] bg-[#0f1117] p-3"
              >
                <p className="text-[10px] text-[#6b7280] mb-1 truncate">{trend.metric}</p>
                <p className="text-sm font-bold text-white">{trend.current.toLocaleString()}</p>
                <div className="mt-1">
                  <TrendIndicator direction={trend.direction} change={trend.change} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-emerald-400" />
            AI Recommendations
          </h3>
          <div className="space-y-3">
            {report.recommendations.map((rec, i) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="rounded-lg border border-[#2d2e3d] bg-[#0f1117] p-3 sm:p-4 hover:border-[#3d3e4d] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Target className="w-4 h-4 text-[#9ca3af]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-medium text-white">{rec.title}</h4>
                      <Badge variant="outline" className={`text-[9px] ${priorityColors[rec.priority]}`}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-1 leading-relaxed">{rec.description}</p>
                    <p className="text-[10px] text-emerald-400 mt-1.5 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Impact: {rec.impact}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // ─── Main View (Tabs) ─────────────────────────────────────────

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg sm:text-2xl font-bold text-white"
          >
            Performance Reports
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Weekly & monthly reports on agent productivity and costs
          </p>
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
          onClick={() => setActiveTab('generate')}
        >
          <FileText className="w-3.5 h-3.5" />
          Generate Report
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1a1b2e] border border-[#2d2e3d] w-full justify-start overflow-x-auto">
          <TabsTrigger
            value="reports"
            className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Reports
          </TabsTrigger>
          <TabsTrigger
            value="generate"
            className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
          >
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Generate
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            History
          </TabsTrigger>
        </TabsList>

        {/* ─── REPORTS TAB ──────────────────────────────────────── */}
        <TabsContent value="reports" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockReports.map((report, i) => {
              const StatusIcon = statusConfig[report.status]?.icon || CheckCircle
              const statusColor = statusConfig[report.status]?.color || 'text-emerald-400'
              const isHovered = hoveredReportId === report.id

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  onHoverStart={() => setHoveredReportId(report.id)}
                  onHoverEnd={() => setHoveredReportId(null)}
                  onClick={() => setSelectedReport(report)}
                  className="cursor-pointer rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4 sm:p-5 hover:border-emerald-500/20 transition-all relative overflow-hidden"
                >
                  {/* Hover Preview Overlay */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-[#0f1117]/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4"
                      >
                        <ScoreGauge score={report.score} size={80} />
                        <div className="grid grid-cols-3 gap-2 mt-3 w-full text-center">
                          <div>
                            <p className="text-[10px] text-[#9ca3af]">Tasks</p>
                            <p className="text-xs font-bold text-white">{formatNumber(report.metrics.tasksCompleted)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#9ca3af]">Cost</p>
                            <p className="text-xs font-bold text-emerald-400">{formatCurrency(report.metrics.totalCost)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#9ca3af]">Uptime</p>
                            <p className="text-xs font-bold text-white">{report.metrics.uptime}%</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-emerald-400 mt-2">Click to view full report →</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Card Content */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{report.title}</h4>
                      <p className="text-[11px] text-[#9ca3af] mt-0.5">
                        {formatDate(report.period.start)} — {formatDate(report.period.end)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <Badge variant="outline" className={`text-[9px] ${typeColors[report.type]}`}>
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-10 h-10">
                        <svg width={40} height={40} className="-rotate-90">
                          <circle cx={20} cy={20} r={16} fill="none" stroke="#252636" strokeWidth={4} />
                          <circle
                            cx={20}
                            cy={20}
                            r={16}
                            fill="none"
                            stroke={report.score >= 85 ? '#10b981' : report.score >= 70 ? '#3b82f6' : '#f59e0b'}
                            strokeWidth={4}
                            strokeLinecap="round"
                            strokeDasharray={`${(report.score / 100) * 2 * Math.PI * 16} ${2 * Math.PI * 16}`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">{report.score}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                      <div className="flex items-center gap-1 text-[#9ca3af]">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>{report.metrics.tasksCompleted} tasks</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#9ca3af]">
                        <DollarSign className="w-3 h-3 text-amber-400" />
                        <span>{formatCurrency(report.metrics.totalCost)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#9ca3af]">
                        <TrendingUp className="w-3 h-3 text-blue-400" />
                        <span>{report.metrics.uptime}% up</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#9ca3af]">
                        <Clock className="w-3 h-3 text-purple-400" />
                        <span>{formatDuration(report.metrics.avgDuration)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#2d2e3d]">
                    <div className="flex items-center gap-1">
                      <StatusIcon className={`w-3 h-3 ${statusColor}`} />
                      <span className={`text-[10px] font-medium ${statusColor} capitalize`}>{report.status}</span>
                    </div>
                    <span className="text-[10px] text-[#6b7280]">
                      {formatDate(report.generatedAt)}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* ─── GENERATE TAB ─────────────────────────────────────── */}
        <TabsContent value="generate" className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-4 sm:p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Generate New Report</h3>
                <p className="text-xs text-[#9ca3af]">Configure and generate a performance report</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Report Type */}
              <div>
                <label className="text-xs text-[#9ca3af] mb-2 block">Report Type</label>
                <div className="flex flex-wrap gap-2">
                  {(['daily', 'weekly', 'monthly', 'quarterly', 'custom'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setGenConfig((prev) => ({ ...prev, type: t }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        genConfig.type === t
                          ? `${typeColors[t]} border`
                          : 'bg-[#252636] text-[#9ca3af] border border-[#2d2e3d] hover:text-white'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">From</label>
                  <Input
                    type="date"
                    value={genConfig.dateFrom}
                    onChange={(e) => setGenConfig((prev) => ({ ...prev, dateFrom: e.target.value }))}
                    className="bg-[#252636] border-[#2d2e3d] text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] mb-1 block">To</label>
                  <Input
                    type="date"
                    value={genConfig.dateTo}
                    onChange={(e) => setGenConfig((prev) => ({ ...prev, dateTo: e.target.value }))}
                    className="bg-[#252636] border-[#2d2e3d] text-white text-xs"
                  />
                </div>
              </div>

              {/* Agent Selection */}
              <div>
                <label className="text-xs text-[#9ca3af] mb-2 block">Agent Selection</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setGenConfig((prev) => ({ ...prev, agentSelection: 'all' }))}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      genConfig.agentSelection === 'all'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#252636] text-[#9ca3af] border border-[#2d2e3d] hover:text-white'
                    }`}
                  >
                    <Users className="w-3 h-3 inline mr-1" />
                    All Agents
                  </button>
                  {['Hermes', 'Atlas', 'Sentinel', 'Nexus', 'Prism'].map((name) => (
                    <button
                      key={name}
                      onClick={() => setGenConfig((prev) => ({ ...prev, agentSelection: name }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        genConfig.agentSelection === name
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#252636] text-[#9ca3af] border border-[#2d2e3d] hover:text-white'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Include Sections */}
              <div>
                <label className="text-xs text-[#9ca3af] mb-2 block">Include Sections</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {([
                    { key: 'includeSummary', label: 'Summary', icon: FileText },
                    { key: 'includeMetrics', label: 'Metrics', icon: BarChart3 },
                    { key: 'includeCosts', label: 'Costs', icon: DollarSign },
                    { key: 'includeTrends', label: 'Trends', icon: TrendingUp },
                    { key: 'includeRecommendations', label: 'Recommendations', icon: Star },
                  ] as const).map((section) => (
                    <button
                      key={section.key}
                      onClick={() =>
                        setGenConfig((prev) => ({
                          ...prev,
                          [section.key]: !prev[section.key],
                        }))
                      }
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors border ${
                        genConfig[section.key]
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-[#252636] text-[#9ca3af] border-[#2d2e3d] hover:text-white'
                      }`}
                    >
                      <section.icon className="w-3 h-3" />
                      {section.label}
                      {genConfig[section.key] && <CheckCircle className="w-3 h-3 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-generate Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-[#2d2e3d] bg-[#0f1117] p-3">
                <div>
                  <p className="text-xs font-medium text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Auto-Generate
                  </p>
                  <p className="text-[10px] text-[#6b7280] mt-0.5">Schedule this report to run automatically</p>
                </div>
                <button
                  onClick={() => setGenConfig((prev) => ({ ...prev, autoGenerate: !prev.autoGenerate }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    genConfig.autoGenerate ? 'bg-emerald-500' : 'bg-[#252636]'
                  }`}
                >
                  <motion.div
                    animate={{ x: genConfig.autoGenerate ? 20 : 2 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                  />
                </button>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Report...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Generate Report
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* ─── HISTORY TAB ──────────────────────────────────────── */}
        <TabsContent value="history" className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1a1b2e] p-0 overflow-hidden"
          >
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[#2d2e3d] text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">
              <div className="col-span-4">Report</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Score</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Generated</div>
            </div>
            {/* Table Body */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {mockReports.map((report, i) => {
                const StatusIcon = statusConfig[report.status]?.icon || CheckCircle
                const statusColor = statusConfig[report.status]?.color || 'text-emerald-400'

                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedReport(report)}
                    className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-[#2d2e3d]/50 hover:bg-[#252636]/50 transition-colors items-center cursor-pointer"
                  >
                    <div className="col-span-4 text-xs text-white font-medium truncate flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#6b7280] flex-shrink-0" />
                      <span className="truncate">{report.title}</span>
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline" className={`text-[9px] ${typeColors[report.type]}`}>
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-xs font-bold ${report.score >= 85 ? 'text-emerald-400' : report.score >= 70 ? 'text-blue-400' : 'text-amber-400'}`}>
                        {report.score}/100
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <StatusIcon className={`w-3 h-3 ${statusColor}`} />
                      <span className={`text-[11px] ${statusColor} capitalize`}>{report.status}</span>
                    </div>
                    <div className="col-span-2 text-xs text-[#9ca3af]">
                      {formatDate(report.generatedAt)}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
