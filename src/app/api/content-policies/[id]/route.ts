import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
    if (body.rules !== undefined) data.rules = typeof body.rules === 'string' ? body.rules : JSON.stringify(body.rules)
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.agentId !== undefined) data.agentId = body.agentId
    if (body.violationCount !== undefined) data.violationCount = body.violationCount
    if (body.lastViolationAt !== undefined) data.lastViolationAt = body.lastViolationAt

    const policy = await db.contentPolicy.update({
      where: { id },
      data,
    })

    return NextResponse.json(policy)
  } catch (error) {
    console.error('Failed to update content policy:', error)
    return NextResponse.json({ error: 'Failed to update content policy' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.contentPolicy.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete content policy:', error)
    return NextResponse.json({ error: 'Failed to delete content policy' }, { status: 500 })
  }
}
