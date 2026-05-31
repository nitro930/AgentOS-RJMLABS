import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ruleId = searchParams.get('ruleId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (ruleId) where.ruleId = ruleId
    if (status) where.status = status

    const executions = await db.automationExecution.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        rule: {
          select: {
            id: true,
            name: true,
            triggerType: true,
          },
        },
      },
    })

    return NextResponse.json(executions)
  } catch (error) {
    console.error('Failed to fetch automation executions:', error)
    return NextResponse.json({ error: 'Failed to fetch automation executions' }, { status: 500 })
  }
}
