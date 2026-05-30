import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const suiteId = searchParams.get('suiteId')
    const agentId = searchParams.get('agentId')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'startedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (suiteId) where.suiteId = suiteId
    if (agentId) where.agentId = agentId
    if (status) where.status = status

    const validSortFields = ['startedAt', 'score', 'avgDurationMs', 'totalTests', 'passedTests']
    const validSortOrders = ['asc', 'desc']
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'startedAt'
    const orderDirection = validSortOrders.includes(sortOrder) ? sortOrder : 'desc'

    const [runs, total] = await Promise.all([
      db.benchmarkRun.findMany({
        where,
        include: {
          suite: {
            select: {
              id: true,
              name: true,
              category: true,
              icon: true,
              passingScore: true,
            },
          },
        },
        orderBy: { [orderField]: orderDirection },
        take: limit,
        skip: offset,
      }),
      db.benchmarkRun.count({ where }),
    ])

    return NextResponse.json({ runs, total })
  } catch (error) {
    console.error('Failed to fetch benchmark runs:', error)
    return NextResponse.json({ error: 'Failed to fetch benchmark runs' }, { status: 500 })
  }
}
