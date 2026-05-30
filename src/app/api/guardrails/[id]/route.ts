import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const guardrail = await db.guardrail.findUnique({
      where: { id },
      include: { violations: { orderBy: { createdAt: 'desc' }, take: 20 } },
    })

    if (!guardrail) {
      return NextResponse.json({ error: 'Guardrail not found' }, { status: 404 })
    }

    return NextResponse.json(guardrail)
  } catch (error) {
    console.error('Failed to fetch guardrail:', error)
    return NextResponse.json({ error: 'Failed to fetch guardrail' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.description !== undefined) data.description = body.description
    if (body.type !== undefined) data.type = body.type
    if (body.category !== undefined) data.category = body.category
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.severity !== undefined) data.severity = body.severity
    if (body.action !== undefined) data.action = body.action
    if (body.conditions !== undefined) data.conditions = typeof body.conditions === 'string' ? body.conditions : JSON.stringify(body.conditions)
    if (body.patterns !== undefined) data.patterns = typeof body.patterns === 'string' ? body.patterns : JSON.stringify(body.patterns)
    if (body.rateLimitRps !== undefined) data.rateLimitRps = body.rateLimitRps
    if (body.rateLimitRpm !== undefined) data.rateLimitRpm = body.rateLimitRpm
    if (body.dailyLimit !== undefined) data.dailyLimit = body.dailyLimit
    if (body.redirectTarget !== undefined) data.redirectTarget = body.redirectTarget
    if (body.agentId !== undefined) data.agentId = body.agentId
    if (body.tags !== undefined) data.tags = typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags)
    if (body.hitCount !== undefined) data.hitCount = body.hitCount
    if (body.lastHitAt !== undefined) data.lastHitAt = body.lastHitAt

    const guardrail = await db.guardrail.update({
      where: { id },
      data,
    })

    return NextResponse.json(guardrail)
  } catch (error) {
    console.error('Failed to update guardrail:', error)
    return NextResponse.json({ error: 'Failed to update guardrail' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete violations first
    await db.guardrailViolation.deleteMany({ where: { guardrailId: id } })
    await db.guardrail.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete guardrail:', error)
    return NextResponse.json({ error: 'Failed to delete guardrail' }, { status: 500 })
  }
}
