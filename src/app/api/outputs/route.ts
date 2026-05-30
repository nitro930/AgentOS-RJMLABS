import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const outputs = await db.agentOutput.findMany({
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(outputs)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch outputs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const output = await db.agentOutput.create({
      data: {
        agentId: body.agentId,
        type: body.type || 'text',
        title: body.title,
        content: body.content,
        routedTo: JSON.stringify(body.routedTo || []),
        memoryId: body.memoryId,
        isArchived: body.isArchived || false,
      },
    })
    return NextResponse.json(output, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create output' }, { status: 500 })
  }
}
