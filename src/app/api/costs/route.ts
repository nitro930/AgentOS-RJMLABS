import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const modelId = searchParams.get('modelId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Record<string, unknown> = {}
    if (agentId) where.agentId = agentId
    if (modelId) where.modelId = modelId
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      }
    }

    const entries = await db.costEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const stats = {
      totalCost: entries.reduce((sum, e) => sum + e.cost, 0),
      totalTokensIn: entries.reduce((sum, e) => sum + e.tokensIn, 0),
      totalTokensOut: entries.reduce((sum, e) => sum + e.tokensOut, 0),
      count: entries.length,
    }

    return NextResponse.json({ entries, stats })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch cost entries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const entry = await db.costEntry.create({
      data: {
        agentId: body.agentId,
        modelId: body.modelId,
        tokensIn: body.tokensIn || 0,
        tokensOut: body.tokensOut || 0,
        cost: body.cost || 0,
        taskType: body.taskType,
        metadata: JSON.stringify(body.metadata || {}),
      },
    })
    return NextResponse.json(entry, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create cost entry' }, { status: 500 })
  }
}
