import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const rule = await db.automationRule.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!rule) {
      return NextResponse.json({ error: 'Automation rule not found' }, { status: 404 })
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Failed to fetch automation rule:', error)
    return NextResponse.json({ error: 'Failed to fetch automation rule' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.description !== undefined) data.description = body.description
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.triggerType !== undefined) data.triggerType = body.triggerType
    if (body.triggerConfig !== undefined) data.triggerConfig = typeof body.triggerConfig === 'string' ? body.triggerConfig : JSON.stringify(body.triggerConfig)
    if (body.conditions !== undefined) data.conditions = typeof body.conditions === 'string' ? body.conditions : JSON.stringify(body.conditions)
    if (body.actions !== undefined) data.actions = typeof body.actions === 'string' ? body.actions : JSON.stringify(body.actions)
    if (body.cooldownMs !== undefined) data.cooldownMs = body.cooldownMs
    if (body.maxExecutions !== undefined) data.maxExecutions = body.maxExecutions
    if (body.priority !== undefined) data.priority = body.priority
    if (body.tags !== undefined) data.tags = typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags)
    if (body.executionCount !== undefined) data.executionCount = body.executionCount
    if (body.lastTriggeredAt !== undefined) data.lastTriggeredAt = body.lastTriggeredAt
    if (body.lastExecutionStatus !== undefined) data.lastExecutionStatus = body.lastExecutionStatus

    const rule = await db.automationRule.update({
      where: { id },
      data,
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Failed to update automation rule:', error)
    return NextResponse.json({ error: 'Failed to update automation rule' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.automationExecution.deleteMany({ where: { ruleId: id } })
    await db.automationRule.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete automation rule:', error)
    return NextResponse.json({ error: 'Failed to delete automation rule' }, { status: 500 })
  }
}
