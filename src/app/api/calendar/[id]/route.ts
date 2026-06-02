import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const event = await prisma.calendarEvent.findUnique({ where: { id } })

    if (!event) {
      return NextResponse.json({ error: 'Calendar event not found' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch calendar event' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.calendarEvent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Calendar event not found' }, { status: 404 })
    }

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.startAt !== undefined && { startAt: new Date(body.startAt) }),
        ...(body.endAt !== undefined && { endAt: body.endAt ? new Date(body.endAt) : null }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.isAllDay !== undefined && { isAllDay: body.isAllDay }),
        ...(body.isRecurring !== undefined && { isRecurring: body.isRecurring }),
        ...(body.recurrence !== undefined && { recurrence: JSON.stringify(body.recurrence) }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.agentId !== undefined && { agentId: body.agentId }),
        ...(body.workflowId !== undefined && { workflowId: body.workflowId }),
        ...(body.taskId !== undefined && { taskId: body.taskId }),
        ...(body.reminders !== undefined && { reminders: JSON.stringify(body.reminders) }),
        ...(body.attendees !== undefined && { attendees: JSON.stringify(body.attendees) }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.completedAt !== undefined && { completedAt: body.completedAt ? new Date(body.completedAt) : null }),
      },
    })

    return NextResponse.json(event)
  } catch {
    return NextResponse.json({ error: 'Failed to update calendar event' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = await prisma.calendarEvent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Calendar event not found' }, { status: 404 })
    }

    await prisma.calendarEvent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete calendar event' }, { status: 500 })
  }
}
