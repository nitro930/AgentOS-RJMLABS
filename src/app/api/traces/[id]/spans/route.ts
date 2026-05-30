import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const spans = await db.traceSpan.findMany({ where: { traceId: id }, orderBy: { startedAt: 'asc' } })
    return NextResponse.json({ spans })
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, parentId, kind, agentId, modelId, input } = body
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const span = await db.traceSpan.create({
      data: { traceId: id, name, parentId: parentId || null, kind: kind || 'internal', agentId: agentId || null, modelId: modelId || null, input: typeof input === 'string' ? input : JSON.stringify(input || {}) },
    })
    await db.trace.update({ where: { id }, data: { totalSpans: { increment: 1 } } })
    return NextResponse.json({ span }, { status: 201 })
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
