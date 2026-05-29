import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const events = await db.webhookEvent.findMany({
      where: { webhookId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(events)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch webhook events' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const event = await db.webhookEvent.create({
      data: {
        webhookId: id,
        direction: body.direction,
        payload: JSON.stringify(body.payload || {}),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.response !== undefined && { response: JSON.stringify(body.response) }),
      },
    })

    // Update webhook lastTriggeredAt and triggerCount
    await db.webhook.update({
      where: { id },
      data: {
        lastTriggeredAt: new Date(),
        triggerCount: { increment: 1 },
        ...(body.status === 'failed' && { failCount: { increment: 1 } }),
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create webhook event' }, { status: 500 })
  }
}
