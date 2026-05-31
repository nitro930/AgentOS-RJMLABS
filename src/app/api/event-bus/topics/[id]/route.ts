import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const topic = await prisma.eventTopic.findUnique({
      where: { id },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
        events: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }
    return NextResponse.json(topic)
  } catch (error) {
    console.error('Failed to fetch topic:', error)
    return NextResponse.json({ error: 'Failed to fetch topic' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const topic = await prisma.eventTopic.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.schema !== undefined && { schema: body.schema }),
        ...(body.retention !== undefined && { retention: body.retention }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    })
    return NextResponse.json(topic)
  } catch (error) {
    console.error('Failed to update topic:', error)
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.eventDelivery.deleteMany({
      where: { subscription: { topicId: id } },
    })
    await prisma.eventRecord.deleteMany({ where: { topicId: id } })
    await prisma.eventSubscription.deleteMany({ where: { topicId: id } })
    await prisma.eventTopic.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete topic:', error)
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 })
  }
}
