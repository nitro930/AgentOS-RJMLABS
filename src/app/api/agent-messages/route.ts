import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const threadId = searchParams.get('threadId')

    const where: Record<string, unknown> = {}
    if (agentId) {
      where.OR = [
        { fromAgentId: agentId },
        { toAgentId: agentId },
      ]
    }
    if (threadId) {
      where.threadId = threadId
    }

    const messages = await db.agentMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json(messages)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch agent messages' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = await db.agentMessage.create({
      data: {
        fromAgentId: body.fromAgentId,
        toAgentId: body.toAgentId,
        ...(body.messageType !== undefined && { messageType: body.messageType }),
        content: body.content,
        ...(body.threadId !== undefined && { threadId: body.threadId }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.metadata !== undefined && { metadata: JSON.stringify(body.metadata) }),
      },
    })
    return NextResponse.json(message, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create agent message' }, { status: 500 })
  }
}
