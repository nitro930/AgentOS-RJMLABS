import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subscription = await prisma.eventSubscription.findUnique({
      where: { id },
      include: {
        topic: {
          select: { id: true, name: true },
        },
        deliveries: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }
    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Failed to fetch subscription:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const subscription = await prisma.eventSubscription.update({
      where: { id },
      data: {
        ...(body.subscriberType !== undefined && { subscriberType: body.subscriberType }),
        ...(body.subscriberId !== undefined && { subscriberId: body.subscriberId }),
        ...(body.filter !== undefined && { filter: body.filter }),
        ...(body.transform !== undefined && { transform: body.transform }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: {
        topic: {
          select: { id: true, name: true },
        },
      },
    })
    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Failed to update subscription:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.eventDelivery.deleteMany({ where: { subscriptionId: id } })
    await prisma.eventSubscription.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete subscription:', error)
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 })
  }
}
