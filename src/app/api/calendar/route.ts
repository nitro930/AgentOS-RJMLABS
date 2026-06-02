import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const agentId = searchParams.get('agentId')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}

    if (start || end) {
      where.startAt = {}
      if (start) (where.startAt as Record<string, unknown>).gte = new Date(start)
      if (end) (where.startAt as Record<string, unknown>).lte = new Date(end)
    }

    if (agentId) {
      where.agentId = agentId
    }

    if (type) {
      where.type = type
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startAt: 'asc' },
    })

    return NextResponse.json(events)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json({ error: 'Event title is required' }, { status: 400 })
    }

    if (!body.startAt) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 })
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title: body.title,
        description: body.description,
        type: body.type || 'task',
        status: body.status || 'scheduled',
        priority: body.priority || 'medium',
        startAt: new Date(body.startAt),
        endAt: body.endAt ? new Date(body.endAt) : undefined,
        duration: body.duration ?? 0,
        isAllDay: body.isAllDay ?? false,
        isRecurring: body.isRecurring ?? false,
        recurrence: JSON.stringify(body.recurrence || {}),
        location: body.location,
        color: body.color || '#6366f1',
        icon: body.icon || '📅',
        agentId: body.agentId,
        workflowId: body.workflowId,
        taskId: body.taskId,
        reminders: JSON.stringify(body.reminders || []),
        attendees: JSON.stringify(body.attendees || []),
        notes: body.notes,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 })
  }
}
