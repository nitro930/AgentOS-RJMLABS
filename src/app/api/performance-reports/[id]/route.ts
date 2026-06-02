import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const report = await prisma.performanceReport.findUnique({ where: { id } })

    if (!report) {
      return NextResponse.json({ error: 'Performance report not found' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch performance report' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.performanceReport.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Performance report not found' }, { status: 404 })
    }

    const report = await prisma.performanceReport.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.status !== undefined && {
          status: body.status,
          ...(body.status === 'generated' && { generatedAt: new Date() }),
          ...(body.status === 'sent' && { sentAt: new Date() }),
        }),
        ...(body.periodStart !== undefined && { periodStart: new Date(body.periodStart) }),
        ...(body.periodEnd !== undefined && { periodEnd: new Date(body.periodEnd) }),
        ...(body.summary !== undefined && { summary: body.summary }),
        ...(body.metrics !== undefined && { metrics: JSON.stringify(body.metrics) }),
        ...(body.agentReports !== undefined && { agentReports: JSON.stringify(body.agentReports) }),
        ...(body.costBreakdown !== undefined && { costBreakdown: JSON.stringify(body.costBreakdown) }),
        ...(body.trendData !== undefined && { trendData: JSON.stringify(body.trendData) }),
        ...(body.recommendations !== undefined && { recommendations: JSON.stringify(body.recommendations) }),
        ...(body.score !== undefined && { score: body.score }),
        ...(body.totalTasks !== undefined && { totalTasks: body.totalTasks }),
        ...(body.completedTasks !== undefined && { completedTasks: body.completedTasks }),
        ...(body.failedTasks !== undefined && { failedTasks: body.failedTasks }),
        ...(body.avgDuration !== undefined && { avgDuration: body.avgDuration }),
        ...(body.totalCost !== undefined && { totalCost: body.totalCost }),
        ...(body.totalTokensIn !== undefined && { totalTokensIn: body.totalTokensIn }),
        ...(body.totalTokensOut !== undefined && { totalTokensOut: body.totalTokensOut }),
        ...(body.uptime !== undefined && { uptime: body.uptime }),
      },
    })

    return NextResponse.json(report)
  } catch {
    return NextResponse.json({ error: 'Failed to update performance report' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = await prisma.performanceReport.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Performance report not found' }, { status: 404 })
    }

    await prisma.performanceReport.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete performance report' }, { status: 500 })
  }
}
