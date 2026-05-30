import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const swarm = await db.swarm.findUnique({
      where: { id },
      include: {
        members: true,
        swarmTasks: { orderBy: { createdAt: 'desc' } },
        decisions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })
    if (!swarm) return NextResponse.json({ error: 'Swarm not found' }, { status: 404 })
    return NextResponse.json({ swarm })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch swarm' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const updateData: Record<string, unknown> = {}
    const allowedFields = ['name', 'description', 'status', 'strategy', 'queenAgentId', 'maxAgents', 'taskDecomposition', 'consensusThreshold', 'sharedMemory', 'autoScale']
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }
    const swarm = await db.swarm.update({ where: { id }, data: updateData })
    return NextResponse.json({ swarm })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update swarm' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.swarmDecision.deleteMany({ where: { swarmId: id } })
    await db.swarmTask.deleteMany({ where: { swarmId: id } })
    await db.swarmMember.deleteMany({ where: { swarmId: id } })
    await db.swarm.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete swarm' }, { status: 500 })
  }
}
