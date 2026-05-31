import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const timeline = await prisma.incidentTimeline.findMany({
      where: { incidentId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ timeline })
  } catch (error) {
    console.error('Failed to fetch timeline:', error)
    return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { eventType, message, source, sourceId, metadata } = body

    if (!eventType || !message) {
      return NextResponse.json({ error: 'eventType and message are required' }, { status: 400 })
    }

    // Verify incident exists
    const incident = await prisma.incident.findUnique({ where: { id } })
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    const event = await prisma.incidentTimeline.create({
      data: {
        incidentId: id,
        eventType,
        message,
        source: source || 'user',
        sourceId: sourceId || null,
        metadata: typeof metadata === 'object' ? JSON.stringify(metadata || {}) : (metadata || '{}'),
      },
    })

    // Update incident status based on event type
    if (eventType === 'status_change') {
      const newStatus = message.match(/to (\w+)/)?.[1]
      if (newStatus) {
        await prisma.incident.update({
          where: { id },
          data: {
            status: newStatus,
            ...(newStatus === 'resolved' ? { resolvedAt: new Date() } : {}),
          },
        })
      }
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Failed to create timeline event:', error)
    return NextResponse.json({ error: 'Failed to create timeline event' }, { status: 500 })
  }
}
