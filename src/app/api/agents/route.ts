import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const agents = await db.agent.findMany({
      include: { tasks: true, outputs: true, memories: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(agents)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const agent = await db.agent.create({
      data: {
        name: body.name,
        type: body.type || 'custom',
        description: body.description || '',
        status: body.status || 'idle',
        modelId: body.modelId,
        config: JSON.stringify(body.config || {}),
        avatar: body.avatar || '🤖',
        color: body.color || '#10b981',
      },
    })
    return NextResponse.json(agent, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
  }
}
