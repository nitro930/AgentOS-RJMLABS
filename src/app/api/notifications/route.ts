import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    const where: Record<string, unknown> = {}
    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(notifications)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const notification = await db.notification.create({
      data: {
        type: body.type,
        title: body.title,
        message: body.message,
        source: body.source,
        actionUrl: body.actionUrl,
      },
    })
    return NextResponse.json(notification, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
