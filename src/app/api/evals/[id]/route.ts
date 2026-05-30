import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const suite = await db.evalSuite.findUnique({
      where: { id },
      include: {
        cases: { orderBy: { order: 'asc' } },
        runs: { orderBy: { startedAt: 'desc' }, take: 10 },
      },
    })

    if (!suite) {
      return NextResponse.json({ error: 'Suite not found' }, { status: 404 })
    }

    return NextResponse.json(suite)
  } catch (error) {
    console.error('Failed to fetch eval suite:', error)
    return NextResponse.json({ error: 'Failed to fetch eval suite' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const suite = await db.evalSuite.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.agentId !== undefined && { agentId: body.agentId }),
        ...(body.passingScore !== undefined && { passingScore: body.passingScore }),
        ...(body.icon !== undefined && { icon: body.icon }),
      },
    })

    return NextResponse.json(suite)
  } catch (error) {
    console.error('Failed to update eval suite:', error)
    return NextResponse.json({ error: 'Failed to update eval suite' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Delete related results first
    const runs = await db.evalRun.findMany({ where: { suiteId: id }, select: { id: true } })
    if (runs.length > 0) {
      await db.evalResult.deleteMany({ where: { runId: { in: runs.map(r => r.id) } } })
    }
    await db.evalRun.deleteMany({ where: { suiteId: id } })
    await db.evalCase.deleteMany({ where: { suiteId: id } })
    await db.evalSuite.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete eval suite:', error)
    return NextResponse.json({ error: 'Failed to delete eval suite' }, { status: 500 })
  }
}
