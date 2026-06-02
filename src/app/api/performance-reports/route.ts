import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (type) {
      where.type = type
    }

    const reports = await prisma.performanceReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reports)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch performance reports' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json({ error: 'Report title is required' }, { status: 400 })
    }

    if (!body.periodStart || !body.periodEnd) {
      return NextResponse.json({ error: 'Period start and end dates are required' }, { status: 400 })
    }

    const report = await prisma.performanceReport.create({
      data: {
        title: body.title,
        type: body.type || 'weekly',
        status: body.status || 'draft',
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        summary: body.summary,
        metrics: JSON.stringify(body.metrics || {}),
        agentReports: JSON.stringify(body.agentReports || []),
        costBreakdown: JSON.stringify(body.costBreakdown || {}),
        trendData: JSON.stringify(body.trendData || {}),
        recommendations: JSON.stringify(body.recommendations || []),
        score: body.score ?? 0,
        totalTasks: body.totalTasks ?? 0,
        completedTasks: body.completedTasks ?? 0,
        failedTasks: body.failedTasks ?? 0,
        avgDuration: body.avgDuration ?? 0,
        totalCost: body.totalCost ?? 0,
        totalTokensIn: body.totalTokensIn ?? 0,
        totalTokensOut: body.totalTokensOut ?? 0,
        uptime: body.uptime ?? 100,
        generatedAt: body.status === 'generated' ? new Date() : undefined,
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to generate performance report' }, { status: 500 })
  }
}
