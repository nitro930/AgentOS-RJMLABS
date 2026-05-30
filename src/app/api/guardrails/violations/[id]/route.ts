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
    if (body.isResolved !== undefined) data.isResolved = body.isResolved
    if (body.resolvedBy !== undefined) data.resolvedBy = body.resolvedBy
    if (body.isResolved) data.resolvedAt = new Date()

    const violation = await db.guardrailViolation.update({
      where: { id },
      data,
    })

    return NextResponse.json(violation)
  } catch (error) {
    console.error('Failed to update violation:', error)
    return NextResponse.json({ error: 'Failed to update violation' }, { status: 500 })
  }
}
