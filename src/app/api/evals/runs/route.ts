import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const suiteId = searchParams.get('suiteId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (suiteId) where.suiteId = suiteId
    if (status) where.status = status

    const runs = await db.evalRun.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        suite: { select: { name: true, type: true, icon: true } },
        _count: { select: { results: true } },
      },
    })

    return NextResponse.json(runs)
  } catch (error) {
    console.error('Failed to fetch eval runs:', error)
    return NextResponse.json({ error: 'Failed to fetch eval runs' }, { status: 500 })
  }
}
