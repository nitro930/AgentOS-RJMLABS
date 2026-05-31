import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const rule = await db.automationRule.findUnique({ where: { id } })
    if (!rule) {
      return NextResponse.json({ error: 'Automation rule not found' }, { status: 404 })
    }

    // Create execution record
    const execution = await db.automationExecution.create({
      data: {
        ruleId: id,
        triggerData: JSON.stringify(body.triggerData || { type: 'manual' }),
        actionsData: rule.actions,
        status: 'running',
        startedAt: new Date(),
      },
    })

    // Simulate execution - mark as completed
    const completedAt = new Date()
    const duration = Math.floor(completedAt.getTime() - execution.startedAt.getTime())

    const updatedExecution = await db.automationExecution.update({
      where: { id: execution.id },
      data: {
        status: 'completed',
        duration,
        completedAt,
      },
    })

    // Update rule stats
    await db.automationRule.update({
      where: { id },
      data: {
        executionCount: { increment: 1 },
        lastTriggeredAt: new Date(),
        lastExecutionStatus: 'success',
      },
    })

    return NextResponse.json(updatedExecution)
  } catch (error) {
    console.error('Failed to execute automation rule:', error)
    return NextResponse.json({ error: 'Failed to execute automation rule' }, { status: 500 })
  }
}
