import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const path = searchParams.get('path') || ''
    const pinned = searchParams.get('pinned')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (path) {
      where.path = { contains: path }
    }

    if (pinned === 'true') {
      where.pinned = true
    }

    const memories = await db.memoryEntry.findMany({
      where,
      include: { agent: true },
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    })

    const stats = {
      total: await db.memoryEntry.count(),
      byType: {
        conversation: await db.memoryEntry.count({ where: { type: 'conversation' } }),
        output: await db.memoryEntry.count({ where: { type: 'output' } }),
        insight: await db.memoryEntry.count({ where: { type: 'insight' } }),
        task: await db.memoryEntry.count({ where: { type: 'task' } }),
        reference: await db.memoryEntry.count({ where: { type: 'reference' } }),
      },
      pinned: await db.memoryEntry.count({ where: { pinned: true } }),
    }

    return NextResponse.json({ memories, stats })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const memory = await db.memoryEntry.create({
      data: {
        type: body.type || 'reference',
        title: body.title,
        content: body.content,
        tags: JSON.stringify(body.tags || []),
        source: body.source,
        agentId: body.agentId,
        path: body.path || 'vault/root',
        pinned: body.pinned || false,
      },
    })
    return NextResponse.json(memory, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 })
  }
}
