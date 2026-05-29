import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const notification = await db.notification.update({
      where: { id },
      data: {
        ...(body.isRead !== undefined && { isRead: body.isRead }),
        ...(body.type && { type: body.type }),
        ...(body.title && { title: body.title }),
        ...(body.message && { message: body.message }),
        ...(body.source !== undefined && { source: body.source }),
        ...(body.actionUrl !== undefined && { actionUrl: body.actionUrl }),
      },
    })
    return NextResponse.json(notification)
  } catch {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.notification.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
