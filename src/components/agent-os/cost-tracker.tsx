'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  PoundSterling,
  Plus,
  Trash2,
  TrendingUp,
  Calendar,
  Coins,
  BarChart3,
  AlertTriangle,
  Cpu,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CostEntry {
  id: string
  agent: string
  model: string
  tokensIn: number
  tokensOut: number
  cost: number
  createdAt: string
}

interface Budget {
  id: string
  name: string
  limit: number
  currentSpend: number
  period: string
  agentId: string | null
}

interface CostByAgent {
  name: string
  cost: number
  color: string
}

interface CostByModel {
  name: string
  cost: number
}

const agentColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#ef4444']

export function CostTracker() {
  const [entries, setEntries] = useState<CostEntry[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [costByAgent, setCostByAgent] = useState<CostByAgent[]>([])
  const [costByModel, setCostByModel] = useState<CostByModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  // Budget form
  const [budgetName, setBudgetName] = useState('')
  const [budgetLimit, setBudgetLimit] = useState('')
  const [budgetPeriod, setBudgetPeriod] = useState('monthly')
  const [budgetAgentId, setBudgetAgentId] = useState('')
  const [isCreatingBudget, setIsCreatingBudget] = useState(false)

  // Log cost form
  const [logAgent, setLogAgent] = useState('')
  const [logModel, setLogModel] = useState('')
  const [logTokensIn, setLogTokensIn] = useState('')
  const [logTokensOut, setLogTokensOut] = useState('')
  const [logCost, setLogCost] = useState('')
  const [isLoggingCost, setIsLoggingCost] = useState(false)

  const fetchCosts = useCallback(async () => {
    try {
      const [costsRes, budgetsRes] = await Promise.all([
        fetch('/api/costs'),
        fetch('/api/costs/budgets'),
      ])
      const costsData = await costsRes.json()
      const budgetsData = await budgetsRes.json()

      setEntries(costsData.entries || costsData || [])
      setBudgets(budgetsData.budgets || budgetsData || [])
      setCostByAgent(costsData.byAgent || [])
      setCostByModel(costsData.byModel || [])
    } catch {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCosts()
    const interval = setInterval(fetchCosts, 15000)
    return () => clearInterval(interval)
  }, [fetchCosts])

  const handleCreateBudget = async () => {
    if (!budgetName.trim() || !budgetLimit) return
    setIsCreatingBudget(true)
    try {
      await fetch('/api/costs/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: budgetName,
          limit: parseFloat(budgetLimit),
          period: budgetPeriod,
          agentId: budgetAgentId || null,
        }),
      })
      setBudgetOpen(false)
      setBudgetName('')
      setBudgetLimit('')
      setBudgetPeriod('monthly')
      setBudgetAgentId('')
      fetchCosts()
    } catch {
      // Error handling
    } finally {
      setIsCreatingBudget(false)
    }
  }

  const handleLogCost = async () => {
    if (!logAgent.trim() || !logCost) return
    setIsLoggingCost(true)
    try {
      await fetch('/api/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: logAgent,
          model: logModel || 'unknown',
          tokensIn: parseInt(logTokensIn) || 0,
          tokensOut: parseInt(logTokensOut) || 0,
          cost: parseFloat(logCost),
        }),
      })
      setLogOpen(false)
      setLogAgent('')
      setLogModel('')
      setLogTokensIn('')
      setLogTokensOut('')
      setLogCost('')
      fetchCosts()
    } catch {
      // Error handling
    } finally {
      setIsLoggingCost(false)
    }
  }

  const handleDeleteBudget = async (id: string) => {
    await fetch(`/api/costs/budgets/${id}`, { method: 'DELETE' })
    fetchCosts()
  }

  // Compute stats
  const now = new Date()
  const thisMonth = entries.filter((e) => {
    const d = new Date(e.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const thisWeek = entries.filter((e) => {
    const d = new Date(e.createdAt)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  })
  const today = entries.filter((e) => {
    const d = new Date(e.createdAt)
    return d.toDateString() === now.toDateString()
  })

  const totalSpend = entries.reduce((sum, e) => sum + (Number(e.cost) || 0), 0)
  const monthSpend = thisMonth.reduce((sum, e) => sum + (Number(e.cost) || 0), 0)
  const weekSpend = thisWeek.reduce((sum, e) => sum + (Number(e.cost) || 0), 0)
  const todaySpend = today.reduce((sum, e) => sum + (Number(e.cost) || 0), 0)
  const totalTokens = entries.reduce((sum, e) => sum + (Number(e.tokensIn) || 0) + (Number(e.tokensOut) || 0), 0)

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
            Cost Tracker
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
            Monitor spending, budgets, and token usage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={logOpen} onOpenChange={setLogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-[#9ca3af] hover:text-white gap-1 border border-[#2d2e3d]">
                <Coins className="w-4 h-4" />
                Log Cost
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log Manual Cost Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-[#9ca3af] text-xs">Agent</Label>
                  <Input
                    value={logAgent}
                    onChange={(e) => setLogAgent(e.target.value)}
                    className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                    placeholder="Agent name..."
                  />
                </div>
                <div>
                  <Label className="text-[#9ca3af] text-xs">Model</Label>
                  <Input
                    value={logModel}
                    onChange={(e) => setLogModel(e.target.value)}
                    className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                    placeholder="e.g., gpt-4, claude-3..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[#9ca3af] text-xs">Tokens In</Label>
                    <Input
                      value={logTokensIn}
                      onChange={(e) => setLogTokensIn(e.target.value)}
                      className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                      type="number"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-[#9ca3af] text-xs">Tokens Out</Label>
                    <Input
                      value={logTokensOut}
                      onChange={(e) => setLogTokensOut(e.target.value)}
                      className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                      type="number"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[#9ca3af] text-xs">Cost (£)</Label>
                  <Input
                    value={logCost}
                    onChange={(e) => setLogCost(e.target.value)}
                    className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <Button
                  onClick={handleLogCost}
                  disabled={!logAgent.trim() || !logCost || isLoggingCost}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLoggingCost ? 'Logging...' : 'Log Cost'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                <Plus className="w-4 h-4" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e1f2b] border-[#2d2e3d] text-white max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Budget Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-[#9ca3af] text-xs">Budget Name</Label>
                  <Input
                    value={budgetName}
                    onChange={(e) => setBudgetName(e.target.value)}
                    className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                    placeholder="e.g., Monthly API Budget"
                  />
                </div>
                <div>
                  <Label className="text-[#9ca3af] text-xs">Limit (£)</Label>
                  <Input
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                  />
                </div>
                <div>
                  <Label className="text-[#9ca3af] text-xs">Period</Label>
                  <select
                    value={budgetPeriod}
                    onChange={(e) => setBudgetPeriod(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[#252636] border border-[#2d2e3d] rounded-md text-sm text-white outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[#9ca3af] text-xs">Agent (optional)</Label>
                  <Input
                    value={budgetAgentId}
                    onChange={(e) => setBudgetAgentId(e.target.value)}
                    className="bg-[#252636] border-[#2d2e3d] text-white mt-1"
                    placeholder="Leave empty for global"
                  />
                </div>
                <Button
                  onClick={handleCreateBudget}
                  disabled={!budgetName.trim() || !budgetLimit || isCreatingBudget}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isCreatingBudget ? 'Creating...' : 'Create Budget'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Spend', value: `£${(totalSpend || 0).toFixed(2)}`, icon: PoundSterling, color: '#10b981' },
          { label: 'This Month', value: `£${(monthSpend || 0).toFixed(2)}`, icon: Calendar, color: '#3b82f6' },
          { label: 'This Week', value: `£${(weekSpend || 0).toFixed(2)}`, icon: TrendingUp, color: '#f59e0b' },
          { label: 'Today', value: `£${(todaySpend || 0).toFixed(2)}`, icon: BarChart3, color: '#8b5cf6' },
          { label: 'Total Tokens', value: totalTokens.toLocaleString(), icon: Cpu, color: '#06b6d4' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-3 sm:p-4 hover:border-[#3d3e4d] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-[#9ca3af] truncate">{stat.label}</p>
                <p className="text-base sm:text-xl font-bold text-white">{stat.value}</p>
              </div>
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cost by Agent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Cost by Agent
          </h3>
          <div className="space-y-3">
            {costByAgent.length === 0 ? (
              <p className="text-xs text-[#6b7280] text-center py-4">No cost data by agent</p>
            ) : (
              costByAgent.map((item, i) => {
                const maxCost = Math.max(...costByAgent.map((a) => a.cost), 1)
                const percentage = (item.cost / maxCost) * 100
                const color = item.color || agentColors[i % agentColors.length]
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#9ca3af]">{item.name}</span>
                      <span className="text-xs font-medium text-white">£${(Number(item.cost)||0).toFixed(2)}</span>
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
              })
            )}
          </div>
        </motion.div>

        {/* Cost by Model */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Cost by Model
          </h3>
          <div className="space-y-3">
            {costByModel.length === 0 ? (
              <p className="text-xs text-[#6b7280] text-center py-4">No cost data by model</p>
            ) : (
              costByModel.map((item, i) => {
                const maxCost = Math.max(...costByModel.map((m) => m.cost), 1)
                const percentage = (item.cost / maxCost) * 100
                const color = agentColors[(i + 2) % agentColors.length]
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#9ca3af]">{item.name}</span>
                      <span className="text-xs font-medium text-white">£${(Number(item.cost)||0).toFixed(2)}</span>
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
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Budget Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5"
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-emerald-400" />
          Budget Alerts
        </h3>
        {budgets.length === 0 ? (
          <p className="text-xs text-[#6b7280] text-center py-4">
            No budget alerts configured
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {budgets.map((budget) => {
              const percentage = budget.limit > 0 ? Math.min((budget.currentSpend / budget.limit) * 100, 100) : 0
              const isOverBudget = budget.currentSpend >= budget.limit
              const isNearBudget = percentage >= 80 && !isOverBudget
              const barColor = isOverBudget
                ? '#ef4444'
                : isNearBudget
                  ? '#f59e0b'
                  : '#10b981'
              return (
                <div
                  key={budget.id}
                  className={`rounded-lg border p-4 ${
                    isOverBudget
                      ? 'bg-red-500/5 border-red-500/20'
                      : isNearBudget
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-[#252636] border-[#2d2e3d]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{budget.name}</p>
                      <p className="text-[11px] text-[#6b7280] capitalize">{budget.period}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="w-7 h-7 rounded-md hover:bg-red-500/10 flex items-center justify-center text-[#6b7280] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#9ca3af]">
                      £${(Number(budget.currentSpend)||0).toFixed(2)} / £${(Number(budget.limit)||0).toFixed(2)}
                    </span>
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: barColor }}
                    >
                      {percentage.toFixed(0)}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-[#1e1f2b] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: barColor }}
                    />
                  </div>

                  {isOverBudget && (
                    <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Over budget!
                    </p>
                  )}
                  {isNearBudget && (
                    <p className="text-[10px] text-amber-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Approaching limit
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Recent Cost Entries Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-[#2d2e3d] bg-[#1e1f2b] p-4 sm:p-5"
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <PoundSterling className="w-4 h-4 text-emerald-400" />
          Recent Cost Entries
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-[#252636] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-xs text-[#6b7280] text-center py-4">No cost entries yet</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2d2e3d]">
                  <th className="text-left py-2.5 px-2 text-[#6b7280] font-medium">Agent</th>
                  <th className="text-left py-2.5 px-2 text-[#6b7280] font-medium">Model</th>
                  <th className="text-right py-2.5 px-2 text-[#6b7280] font-medium">Tokens In</th>
                  <th className="text-right py-2.5 px-2 text-[#6b7280] font-medium">Tokens Out</th>
                  <th className="text-right py-2.5 px-2 text-[#6b7280] font-medium">Cost</th>
                  <th className="text-right py-2.5 px-2 text-[#6b7280] font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 20).map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-[#2d2e3d]/50 hover:bg-[#252636]/50 transition-colors"
                  >
                    <td className="py-2.5 px-2 text-white font-medium">{entry.agent}</td>
                    <td className="py-2.5 px-2 text-[#9ca3af]">{entry.model}</td>
                    <td className="py-2.5 px-2 text-right text-[#9ca3af]">
                      {entry.tokensIn.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#9ca3af]">
                      {entry.tokensOut.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-400 font-medium">
                      £${(Number(entry.cost)||0).toFixed(4)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#6b7280]">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
