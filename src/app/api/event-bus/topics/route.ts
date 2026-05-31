import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const topics = await prisma.eventTopic.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { subscriptions: true, events: true },
        },
      },
    })
    return NextResponse.json({ topics })
  } catch (error) {
    console.error('Failed to fetch topics:', error)
    return NextResponse.json({ topics: [] })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const topic = await prisma.eventTopic.create({
      data: {
        name: body.name,
        description: body.description || null,
        schema: body.schema || '{}',
        retention: body.retention || 168,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    })
    return NextResponse.json(topic)
  } catch (error: unknown) {
    console.error('Failed to create topic:', error)
    const message = error instanceof Error && error.message.includes('Unique') 
      ? 'Topic name already exists' 
      : 'Failed to create topic'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
