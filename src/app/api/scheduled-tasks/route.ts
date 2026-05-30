import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function calculateNextRun(cronExpr: string): Date {
  const now = new Date()
  const parts = cronExpr.trim().split(/\s+/)

  // Simple cron parser approximation for common patterns
  if (parts.length === 5) {
    const [_minute, hour, dayOfMonth, month, dayOfWeek] = parts

    // Every N minutes: */N * * * *
    const minuteMatch = parts[0].match(/^\*\/(\d+)$/)
    if (minuteMatch && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const interval = parseInt(minuteMatch[1])
      const next = new Date(now)
      next.setMinutes(next.getMinutes() + interval, 0, 0)
      return next
    }

    // Specific hour: 0 9 * * 1-5 (weekday at 9)
    if (parts[0] !== '*' && hour !== '*') {
      const targetHour = parseInt(hour)
      const targetMinute = parseInt(parts[0])
      const next = new Date(now)
      next.setHours(targetHour, targetMinute, 0, 0)
      if (next <= now) {
        next.setDate(next.getDate() + 1)
      }
      return next
    }

    // Every hour: 0 * * * *
    if (parts[0] !== '*' && hour === '*') {
      const targetMinute = parseInt(parts[0])
      const next = new Date(now)
      next.setHours(next.getHours() + 1, targetMinute, 0, 0)
      return next
    }
  }

  // Default: add 1 hour as fallback
  const next = new Date(now)
  next.setHours(next.getHours() + 1)
  return next
}

export async function GET() {
  try {
    const tasks = await db.scheduledTask.findMany({
      orderBy: { nextRunAt: 'asc' },
    })
    return NextResponse.json(tasks)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch scheduled tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const nextRunAt = calculateNextRun(body.cronExpr)
    const task = await db.scheduledTask.create({
      data: {
        name: body.name,
        agentId: body.agentId,
        workflowId: body.workflowId,
        cronExpr: body.cronExpr,
        taskType: body.taskType || 'agent',
        taskConfig: JSON.stringify(body.taskConfig || {}),
        nextRunAt,
      },
    })
    return NextResponse.json(task, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create scheduled task' }, { status: 500 })
  }
}
