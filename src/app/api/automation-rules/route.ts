import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const triggerType = searchParams.get('triggerType')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (triggerType) where.triggerType = triggerType
    if (isActive !== null) where.isActive = isActive === 'true'

    const rules = await db.automationRule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { executions: true } },
      },
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('Failed to fetch automation rules:', error)
    return NextResponse.json({ error: 'Failed to fetch automation rules' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const rule = await db.automationRule.create({
      data: {
        name: body.name,
        description: body.description || null,
        isActive: body.isActive ?? true,
        triggerType: body.triggerType,
        triggerConfig: body.triggerConfig ? JSON.stringify(body.triggerConfig) : '{}',
        conditions: body.conditions ? JSON.stringify(body.conditions) : '[]',
        actions: body.actions ? JSON.stringify(body.actions) : '[]',
        cooldownMs: body.cooldownMs ?? 0,
        maxExecutions: body.maxExecutions ?? null,
        priority: body.priority ?? 0,
        tags: body.tags ? JSON.stringify(body.tags) : '[]',
      },
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    console.error('Failed to create automation rule:', error)
    return NextResponse.json({ error: 'Failed to create automation rule' }, { status: 500 })
  }
}
