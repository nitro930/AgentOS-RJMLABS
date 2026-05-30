import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const webhooks = await db.webhook.findMany({
      include: { webhookEvents: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(webhooks)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const webhook = await db.webhook.create({
      data: {
        name: body.name,
        url: body.url,
        ...(body.secret !== undefined && { secret: body.secret }),
        ...(body.triggerEvents !== undefined && { triggerEvents: JSON.stringify(body.triggerEvents) }),
        ...(body.sourceType !== undefined && { sourceType: body.sourceType }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.agentId !== undefined && { agentId: body.agentId }),
        ...(body.workflowId !== undefined && { workflowId: body.workflowId }),
        ...(body.headers !== undefined && { headers: JSON.stringify(body.headers) }),
      },
    })
    return NextResponse.json(webhook, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 })
  }
}
