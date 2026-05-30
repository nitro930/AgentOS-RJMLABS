import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const suite = await db.benchmarkSuite.findUnique({
      where: { id },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!suite) {
      return NextResponse.json({ error: 'Benchmark suite not found' }, { status: 404 })
    }

    return NextResponse.json({ suite })
  } catch (error) {
    console.error('Failed to fetch benchmark suite:', error)
    return NextResponse.json({ error: 'Failed to fetch benchmark suite' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.benchmarkSuite.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Benchmark suite not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.description !== undefined) data.description = body.description
    if (body.category !== undefined) data.category = body.category
    if (body.testCases !== undefined) data.testCases = JSON.stringify(body.testCases)
    if (body.passingScore !== undefined) data.passingScore = body.passingScore
    if (body.maxDurationMs !== undefined) data.maxDurationMs = body.maxDurationMs
    if (body.iterations !== undefined) data.iterations = body.iterations
    if (body.status !== undefined) data.status = body.status
    if (body.icon !== undefined) data.icon = body.icon

    const suite = await db.benchmarkSuite.update({
      where: { id },
      data,
    })

    return NextResponse.json({ suite })
  } catch (error) {
    console.error('Failed to update benchmark suite:', error)
    return NextResponse.json({ error: 'Failed to update benchmark suite' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.benchmarkSuite.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Benchmark suite not found' }, { status: 404 })
    }

    // Delete all runs first (cascade)
    await db.benchmarkRun.deleteMany({ where: { suiteId: id } })
    await db.benchmarkSuite.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete benchmark suite:', error)
    return NextResponse.json({ error: 'Failed to delete benchmark suite' }, { status: 500 })
  }
}
