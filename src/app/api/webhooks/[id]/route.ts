import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const webhook = await db.webhook.findUnique({
      where: { id },
      include: { webhookEvents: true },
    })
    if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    return NextResponse.json(webhook)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch webhook' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const webhook = await db.webhook.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.url !== undefined && { url: body.url }),
        ...(body.secret !== undefined && { secret: body.secret }),
        ...(body.triggerEvents !== undefined && { triggerEvents: JSON.stringify(body.triggerEvents) }),
        ...(body.sourceType !== undefined && { sourceType: body.sourceType }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.agentId !== undefined && { agentId: body.agentId }),
        ...(body.workflowId !== undefined && { workflowId: body.workflowId }),
        ...(body.headers !== undefined && { headers: JSON.stringify(body.headers) }),
      },
    })
    return NextResponse.json(webhook)
  } catch {
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Delete events first (cascade), then the webhook
    await db.webhookEvent.deleteMany({ where: { webhookId: id } })
    await db.webhook.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 })
  }
}
