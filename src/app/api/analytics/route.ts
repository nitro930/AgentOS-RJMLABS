import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Agent stats
    const totalAgents = await db.agent.count()
    const runningAgents = await db.agent.count({ where: { status: 'running' } })
    const idleAgents = await db.agent.count({ where: { status: 'idle' } })
    const errorAgents = await db.agent.count({ where: { status: 'error' } })
    const pausedAgents = await db.agent.count({ where: { status: 'paused' } })

    const agentAgg = await db.agent.aggregate({
      _sum: { tasksCompleted: true, tasksFailed: true },
    })
    const totalTasks = (agentAgg._sum.tasksCompleted || 0) + (agentAgg._sum.tasksFailed || 0)
    const completedTasks = agentAgg._sum.tasksCompleted || 0
    const failedTasks = agentAgg._sum.tasksFailed || 0
    const avgSuccessRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Memory stats
    const totalMemories = await db.memoryEntry.count()
    const memoryTypes = await db.memoryEntry.groupBy({ by: ['type'], _count: true })
    const byType: Record<string, number> = {}
    for (const mt of memoryTypes) {
      byType[mt.type] = mt._count
    }
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    const recentGrowth = await db.memoryEntry.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })

    // Cost stats
    const costAgg = await db.costEntry.aggregate({
      _sum: { cost: true },
    })
    const totalCost = costAgg._sum.cost || 0

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [monthAgg, weekAgg, dayAgg] = await Promise.all([
      db.costEntry.aggregate({ _sum: { cost: true }, where: { createdAt: { gte: startOfMonth } } }),
      db.costEntry.aggregate({ _sum: { cost: true }, where: { createdAt: { gte: startOfWeek } } }),
      db.costEntry.aggregate({ _sum: { cost: true }, where: { createdAt: { gte: startOfDay } } }),
    ])

    const byAgent = await db.costEntry.groupBy({
      by: ['agentId'],
      _sum: { cost: true },
      where: { agentId: { not: null } },
    })

    const byModel = await db.costEntry.groupBy({
      by: ['modelId'],
      _sum: { cost: true },
      where: { modelId: { not: null } },
    })

    // Task stats
    const tasksByStatus = await db.agentTask.groupBy({ by: ['status'], _count: true })
    const byStatus: Record<string, number> = {}
    for (const ts of tasksByStatus) {
      byStatus[ts.status] = ts._count
    }

    const tasksByPriority = await db.agentTask.groupBy({ by: ['priority'], _count: true })
    const byPriority: Record<string, number> = {}
    for (const tp of tasksByPriority) {
      byPriority[tp.priority] = tp._count
    }

    const completedTasksWithTimes = await db.agentTask.findMany({
      where: { status: 'completed', startedAt: { not: null }, completedAt: { not: null } },
      select: { startedAt: true, completedAt: true },
    })
    let avgCompletionTime = 0
    if (completedTasksWithTimes.length > 0) {
      const totalTime = completedTasksWithTimes.reduce((sum, t) => {
        if (t.startedAt && t.completedAt) {
          return sum + (t.completedAt.getTime() - t.startedAt.getTime())
        }
        return sum
      }, 0)
      avgCompletionTime = totalTime / completedTasksWithTimes.length / 1000 // in seconds
    }

    // Activity trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    const events = await db.activityEvent.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    })

    const activityTrend: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - (29 - i) * 86400000)
      const key = date.toISOString().split('T')[0]
      activityTrend[key] = 0
    }
    for (const event of events) {
      const key = event.createdAt.toISOString().split('T')[0]
      if (key in activityTrend) {
        activityTrend[key]++
      }
    }

    return NextResponse.json({
      agentStats: {
        total: totalAgents,
        running: runningAgents,
        idle: idleAgents,
        error: errorAgents,
        paused: pausedAgents,
        totalTasks,
        completedTasks,
        failedTasks,
        avgSuccessRate: Math.round(avgSuccessRate * 100) / 100,
      },
      memoryStats: {
        total: totalMemories,
        byType,
        recentGrowth,
      },
      costStats: {
        totalCost,
        thisMonthCost: monthAgg._sum.cost || 0,
        thisWeekCost: weekAgg._sum.cost || 0,
        todayCost: dayAgg._sum.cost || 0,
        byAgent: byAgent.map(a => ({ agentId: a.agentId, cost: a._sum.cost || 0 })),
        byModel: byModel.map(m => ({ modelId: m.modelId, cost: m._sum.cost || 0 })),
      },
      taskStats: {
        byStatus,
        byPriority,
        avgCompletionTime: Math.round(avgCompletionTime),
      },
      activityTrend,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
