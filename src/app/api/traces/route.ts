import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const agentId = searchParams.get('agentId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const where: any = {}
    if (status) where.status = status
    if (agentId) where.agentId = agentId
    const traces = await db.trace.findMany({
      where, include: { spans: { orderBy: { startedAt: 'asc' } } },
      orderBy: { startedAt: 'desc' }, take: limit,
    })
    return NextResponse.json({ traces })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch traces' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, agentId, workflowId, swarmId, metadata } = body
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const trace = await db.trace.create({
      data: { name, description: description || null, agentId: agentId || null, workflowId: workflowId || null, swarmId: swarmId || null, metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {}) },
    })
    // Create root span
    const rootSpan = await db.traceSpan.create({
      data: { traceId: trace.id, name: `${name} - root`, kind: 'internal', status: 'ok' },
    })
    await db.trace.update({ where: { id: trace.id }, data: { rootSpanId: rootSpan.id, totalSpans: 1 } })
    return NextResponse.json({ trace, rootSpan }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create trace' }, { status: 500 })
  }
}
