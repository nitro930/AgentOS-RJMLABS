import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')
    
    const where = topicId ? { topicId } : {}
    
    const subscriptions = await prisma.eventSubscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        topic: {
          select: { id: true, name: true },
        },
        _count: {
          select: { deliveries: true },
        },
      },
    })
    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error)
    return NextResponse.json({ subscriptions: [] })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const subscription = await prisma.eventSubscription.create({
      data: {
        topicId: body.topicId,
        subscriberType: body.subscriberType,
        subscriberId: body.subscriberId || null,
        filter: body.filter || '{}',
        transform: body.transform || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
      include: {
        topic: {
          select: { id: true, name: true },
        },
      },
    })
    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Failed to create subscription:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
