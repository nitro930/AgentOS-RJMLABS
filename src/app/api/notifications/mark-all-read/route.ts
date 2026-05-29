import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH() {
  try {
    const result = await db.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    })
    return NextResponse.json({ success: true, updated: result.count })
  } catch {
    return NextResponse.json({ error: 'Failed to mark all notifications as read' }, { status: 500 })
  }
}
