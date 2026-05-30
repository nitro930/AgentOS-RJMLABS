import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (status) where.status = status

    const suites = await db.benchmarkSuite.findMany({
      where,
      include: {
        _count: { select: { runs: true } },
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            score: true,
            avgDurationMs: true,
            startedAt: true,
            agentId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = suites.map((suite) => {
      const lastRun = suite.runs[0]
      return {
        id: suite.id,
        name: suite.name,
        description: suite.description,
        category: suite.category,
        testCases: suite.testCases,
        passingScore: suite.passingScore,
        maxDurationMs: suite.maxDurationMs,
        iterations: suite.iterations,
        status: suite.status,
        icon: suite.icon,
        createdAt: suite.createdAt,
        updatedAt: suite.updatedAt,
        runCount: suite._count.runs,
        lastRun: lastRun || null,
      }
    })

    return NextResponse.json({ suites: result })
  } catch (error) {
    console.error('Failed to fetch benchmark suites:', error)
    return NextResponse.json({ error: 'Failed to fetch benchmark suites' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const suite = await db.benchmarkSuite.create({
      data: {
        name: body.name,
        description: body.description || null,
        category: body.category || 'performance',
        testCases: body.testCases ? JSON.stringify(body.testCases) : '[]',
        passingScore: body.passingScore ?? 0.8,
        maxDurationMs: body.maxDurationMs ?? 60000,
        iterations: body.iterations ?? 1,
        status: body.status || 'active',
        icon: body.icon || '🏆',
      },
    })

    return NextResponse.json({ suite }, { status: 201 })
  } catch (error) {
    console.error('Failed to create benchmark suite:', error)
    return NextResponse.json({ error: 'Failed to create benchmark suite' }, { status: 500 })
  }
}
