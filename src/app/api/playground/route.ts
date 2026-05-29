import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const sessions = await prisma.playgroundSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const parsed = sessions.map(s => ({
      ...s,
      input: JSON.parse(s.input || '{}'),
      output: s.output ? JSON.parse(s.output) : null,
      config: JSON.parse(s.config || '{}'),
      tags: JSON.parse(s.tags || '[]'),
    }))
    return NextResponse.json(parsed)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch playground sessions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const session = await prisma.playgroundSession.create({
      data: {
        name: body.name || 'Untitled Test',
        agentId: body.agentId || null,
        modelId: body.modelId || null,
        status: 'idle',
        input: JSON.stringify(body.input || {}),
        config: JSON.stringify(body.config || {}),
        tags: JSON.stringify(body.tags || []),
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'create',
        resource: 'agent',
        resourceId: session.id,
        details: JSON.stringify({ type: 'playground_session', name: session.name }),
        source: 'user',
        severity: 'info',
      },
    })

    return NextResponse.json({
      ...session,
      input: JSON.parse(session.input || '{}'),
      output: session.output ? JSON.parse(session.output) : null,
      config: JSON.parse(session.config || '{}'),
      tags: JSON.parse(session.tags || '[]'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
