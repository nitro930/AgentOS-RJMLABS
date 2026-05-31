import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const actions = await prisma.incidentAction.findMany({
      where: { incidentId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ actions })
  } catch (error) {
    console.error('Failed to fetch actions:', error)
    return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { type, description, assignedTo } = body

    if (!type || !description) {
      return NextResponse.json({ error: 'type and description are required' }, { status: 400 })
    }

    // Verify incident exists
    const incident = await prisma.incident.findUnique({ where: { id } })
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    const action = await prisma.incidentAction.create({
      data: {
        incidentId: id,
        type,
        description,
        status: 'pending',
        assignedTo: assignedTo || null,
      },
    })

    // Add timeline event
    await prisma.incidentTimeline.create({
      data: {
        incidentId: id,
        eventType: 'action_added',
        message: `Action added: ${type} - ${description}`,
        source: 'user',
      },
    })

    return NextResponse.json({ action })
  } catch (error) {
    console.error('Failed to create action:', error)
    return NextResponse.json({ error: 'Failed to create action' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { actionId, status, result, assignedTo } = body

    if (!actionId) {
      return NextResponse.json({ error: 'actionId is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (result !== undefined) updateData.result = result
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo

    if (status === 'in_progress' && !updateData.startedAt) {
      updateData.startedAt = new Date()
    }
    if (status === 'completed') {
      updateData.completedAt = new Date()
    }

    const action = await prisma.incidentAction.update({
      where: { id: actionId },
      data: updateData,
    })

    // Add timeline event
    if (status) {
      await prisma.incidentTimeline.create({
        data: {
          incidentId: id,
          eventType: 'action_updated',
          message: `Action "${action.type}" status changed to ${status}`,
          source: 'user',
        },
      })
    }

    return NextResponse.json({ action })
  } catch (error) {
    console.error('Failed to update action:', error)
    return NextResponse.json({ error: 'Failed to update action' }, { status: 500 })
  }
}
