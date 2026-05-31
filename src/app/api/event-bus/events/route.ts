import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const where: Record<string, unknown> = {}
    if (topicId) where.topicId = topicId
    if (source) where.source = source

    const events = await prisma.eventRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        topic: {
          select: { id: true, name: true },
        },
      },
    })

    const total = await prisma.eventRecord.count({ where })

    return NextResponse.json({ events, total })
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return NextResponse.json({ events: [], total: 0 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const event = await prisma.eventRecord.create({
      data: {
        topicId: body.topicId,
        eventType: body.eventType,
        source: body.source || null,
        payload: body.payload || '{}',
        metadata: body.metadata || '{}',
        isProcessed: false,
      },
      include: {
        topic: {
          select: { id: true, name: true },
        },
      },
    })

    // Update topic counters
    await prisma.eventTopic.update({
      where: { id: body.topicId },
      data: {
        eventCount: { increment: 1 },
        lastEventAt: new Date(),
      },
    })

    // Create deliveries for all active subscriptions on this topic
    const subscriptions = await prisma.eventSubscription.findMany({
      where: { topicId: body.topicId, isActive: true },
    })

    if (subscriptions.length > 0) {
      await prisma.eventDelivery.createMany({
        data: subscriptions.map(sub => ({
          subscriptionId: sub.id,
          eventId: event.id,
          status: 'pending',
          attempts: 0,
        })),
      })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to publish event:', error)
    return NextResponse.json({ error: 'Failed to publish event' }, { status: 500 })
  }
}
