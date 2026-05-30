import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const message = await db.agentMessage.update({
      where: { id },
      data: {
        ...(body.isRead !== undefined && { isRead: body.isRead }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.metadata !== undefined && { metadata: JSON.stringify(body.metadata) }),
        ...(body.messageType !== undefined && { messageType: body.messageType }),
      },
    })
    return NextResponse.json(message)
  } catch {
    return NextResponse.json({ error: 'Failed to update agent message' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.agentMessage.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete agent message' }, { status: 500 })
  }
}
