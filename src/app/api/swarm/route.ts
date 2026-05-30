import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const swarms = await db.swarm.findMany({
      include: {
        members: true,
        swarmTasks: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: { select: { members: true, swarmTasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ swarms })
  } catch (error) {
    console.error('Failed to fetch swarms:', error)
    return NextResponse.json({ error: 'Failed to fetch swarms' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, strategy, queenAgentId, maxAgents, taskDecomposition, consensusThreshold, sharedMemory, autoScale } = body
    if (!name) return NextResponse.json({ error: 'Swarm name is required' }, { status: 400 })
    const swarm = await db.swarm.create({
      data: {
        name,
        description: description || null,
        strategy: strategy || 'queen',
        queenAgentId: queenAgentId || null,
        maxAgents: maxAgents || 5,
        taskDecomposition: taskDecomposition || 'auto',
        consensusThreshold: consensusThreshold || 0.6,
        sharedMemory: sharedMemory !== undefined ? sharedMemory : true,
        autoScale: autoScale || false,
      },
    })
    return NextResponse.json({ swarm }, { status: 201 })
  } catch (error) {
    console.error('Failed to create swarm:', error)
    return NextResponse.json({ error: 'Failed to create swarm' }, { status: 500 })
  }
}
