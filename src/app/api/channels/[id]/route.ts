import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const channel = await prisma.notificationChannel.findUnique({
      where: { id },
      include: { channelDeliveries: { take: 20, orderBy: { createdAt: 'desc' } } },
    })
    if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      ...channel,
      config: JSON.parse(channel.config || '{}'),
      triggerEvents: JSON.parse(channel.triggerEvents || '[]'),
    })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    if (body.config) body.config = JSON.stringify(body.config)
    if (body.triggerEvents) body.triggerEvents = JSON.stringify(body.triggerEvents)
    const channel = await prisma.notificationChannel.update({ where: { id }, data: body })
    return NextResponse.json(channel)
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.channelDelivery.deleteMany({ where: { channelId: id } })
    await prisma.notificationChannel.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
