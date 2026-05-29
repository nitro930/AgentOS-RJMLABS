import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const channels = await prisma.notificationChannel.findMany({
      orderBy: { createdAt: 'desc' },
      include: { channelDeliveries: { take: 10, orderBy: { createdAt: 'desc' } } },
    })
    const parsed = channels.map(c => ({
      ...c,
      config: JSON.parse(c.config || '{}'),
      triggerEvents: JSON.parse(c.triggerEvents || '[]'),
      channelDeliveries: c.channelDeliveries.map(d => ({
        ...d,
        payload: JSON.parse(d.payload || '{}'),
        response: d.response ? JSON.parse(d.response) : null,
      })),
    }))
    return NextResponse.json(parsed)
  } catch { return NextResponse.json([]) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const channel = await prisma.notificationChannel.create({
      data: {
        name: body.name,
        type: body.type || 'webhook',
        config: JSON.stringify(body.config || {}),
        isActive: body.isActive ?? true,
        triggerEvents: JSON.stringify(body.triggerEvents || []),
      },
    })
    return NextResponse.json({
      ...channel,
      config: JSON.parse(channel.config || '{}'),
      triggerEvents: JSON.parse(channel.triggerEvents || '[]'),
    })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
