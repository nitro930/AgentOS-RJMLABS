import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscriptionId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (subscriptionId) where.subscriptionId = subscriptionId
    if (status) where.status = status

    const deliveries = await prisma.eventDelivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        subscription: {
          select: {
            id: true,
            subscriberType: true,
            subscriberId: true,
            topic: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    const total = await prisma.eventDelivery.count({ where })

    return NextResponse.json({ deliveries, total })
  } catch (error) {
    console.error('Failed to fetch deliveries:', error)
    return NextResponse.json({ deliveries: [], total: 0 })
  }
}
