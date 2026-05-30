import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const totalAgents = await db.agent.count()
    const activeAgents = await db.agent.count({ where: { status: 'running' } })
    const totalTasks = await db.agentTask.count()
    const runningTasks = await db.agentTask.count({ where: { status: 'running' } })
    const completedTasks = await db.agentTask.count({ where: { status: 'completed' } })
    const memoryEntries = await db.memoryEntry.count()
    const pinnedMemories = await db.memoryEntry.count({ where: { pinned: true } })
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const outputsToday = await db.agentOutput.count({
      where: { createdAt: { gte: today } },
    })
    
    const totalGoals = await db.goal.count()
    const activeGoals = await db.goal.count({ where: { status: 'active' } })
    const completedGoals = await db.goal.count({ where: { status: 'completed' } })
    
    const workspaces = await db.workspace.count({ where: { isActive: true } })
    
    const agents = await db.agent.findMany({
      select: { id: true, name: true, status: true, avatar: true, color: true, tasksCompleted: true, tasksFailed: true },
      orderBy: { lastActiveAt: 'desc' },
    })

    const recentActivity = await db.activityEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const recentOutputs = await db.agentOutput.findMany({
      include: { agent: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    const memoryByType = {
      conversation: await db.memoryEntry.count({ where: { type: 'conversation' } }),
      output: await db.memoryEntry.count({ where: { type: 'output' } }),
      insight: await db.memoryEntry.count({ where: { type: 'insight' } }),
      task: await db.memoryEntry.count({ where: { type: 'task' } }),
      reference: await db.memoryEntry.count({ where: { type: 'reference' } }),
    }

    return NextResponse.json({
      agents: { total: totalAgents, active: activeAgents, list: agents },
      tasks: { total: totalTasks, running: runningTasks, completed: completedTasks },
      memory: { total: memoryEntries, pinned: pinnedMemories, byType: memoryByType },
      outputs: { today: outputsToday },
      goals: { total: totalGoals, active: activeGoals, completed: completedGoals },
      workspaces,
      recentActivity,
      recentOutputs,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
