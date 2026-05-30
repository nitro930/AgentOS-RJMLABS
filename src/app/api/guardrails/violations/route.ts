import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const guardrailId = searchParams.get('guardrailId')
    const agentId = searchParams.get('agentId')
    const severity = searchParams.get('severity')
    const isResolved = searchParams.get('isResolved')

    const where: Record<string, unknown> = {}
    if (guardrailId) where.guardrailId = guardrailId
    if (agentId) where.agentId = agentId
    if (severity) where.severity = severity
    if (isResolved !== null) where.isResolved = isResolved === 'true'

    const violations = await db.guardrailViolation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { guardrail: { select: { name: true, type: true } } },
    })

    return NextResponse.json(violations)
  } catch (error) {
    console.error('Failed to fetch violations:', error)
    return NextResponse.json({ error: 'Failed to fetch violations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const violation = await db.guardrailViolation.create({
      data: {
        guardrailId: body.guardrailId,
        agentId: body.agentId || null,
        type: body.type,
        input: body.input || null,
        output: body.output || null,
        action: body.action,
        severity: body.severity || 'medium',
        isResolved: false,
        metadata: body.metadata ? JSON.stringify(body.metadata) : '{}',
      },
    })

    // Update guardrail hit count and lastHitAt
    await db.guardrail.update({
      where: { id: body.guardrailId },
      data: {
        hitCount: { increment: 1 },
        lastHitAt: new Date(),
      },
    })

    return NextResponse.json(violation, { status: 201 })
  } catch (error) {
    console.error('Failed to create violation:', error)
    return NextResponse.json({ error: 'Failed to create violation' }, { status: 500 })
  }
}
