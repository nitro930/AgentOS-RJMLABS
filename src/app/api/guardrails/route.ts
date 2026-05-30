import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const agentId = searchParams.get('agentId')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (category) where.category = category
    if (isActive !== null) where.isActive = isActive === 'true'
    if (agentId) where.agentId = agentId

    const guardrails = await db.guardrail.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { violations: true } } },
    })

    return NextResponse.json(guardrails)
  } catch (error) {
    console.error('Failed to fetch guardrails:', error)
    return NextResponse.json({ error: 'Failed to fetch guardrails' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const guardrail = await db.guardrail.create({
      data: {
        name: body.name,
        description: body.description || null,
        type: body.type,
        category: body.category || 'safety',
        isActive: body.isActive ?? true,
        severity: body.severity || 'medium',
        action: body.action || 'block',
        conditions: body.conditions ? JSON.stringify(body.conditions) : '{}',
        patterns: body.patterns ? JSON.stringify(body.patterns) : '[]',
        rateLimitRps: body.rateLimitRps ?? null,
        rateLimitRpm: body.rateLimitRpm ?? null,
        dailyLimit: body.dailyLimit ?? null,
        redirectTarget: body.redirectTarget || null,
        agentId: body.agentId || null,
        tags: body.tags ? JSON.stringify(body.tags) : '[]',
      },
    })

    return NextResponse.json(guardrail, { status: 201 })
  } catch (error) {
    console.error('Failed to create guardrail:', error)
    return NextResponse.json({ error: 'Failed to create guardrail' }, { status: 500 })
  }
}
