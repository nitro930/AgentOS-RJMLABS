import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        timeline: { orderBy: { createdAt: 'desc' } },
        actions: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    return NextResponse.json({ incident })
  } catch (error) {
    console.error('Failed to fetch incident:', error)
    return NextResponse.json({ error: 'Failed to fetch incident' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, severity, rootCause, resolution, impactLevel, assignedTo, affectedServices, affectedAgentIds, tags } = body

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (severity !== undefined) updateData.severity = severity
    if (rootCause !== undefined) updateData.rootCause = rootCause
    if (resolution !== undefined) updateData.resolution = resolution
    if (impactLevel !== undefined) updateData.impactLevel = impactLevel
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (affectedServices !== undefined) updateData.affectedServices = typeof affectedServices === 'object' ? JSON.stringify(affectedServices) : affectedServices
    if (affectedAgentIds !== undefined) updateData.affectedAgentIds = typeof affectedAgentIds === 'object' ? JSON.stringify(affectedAgentIds) : affectedAgentIds
    if (tags !== undefined) updateData.tags = typeof tags === 'object' ? JSON.stringify(tags) : tags

    if (status === 'resolved' && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date()
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        timeline: { orderBy: { createdAt: 'desc' } },
        actions: { orderBy: { createdAt: 'desc' } },
      },
    })

    // Create timeline event for status change
    if (status) {
      await prisma.incidentTimeline.create({
        data: {
          incidentId: id,
          eventType: 'status_change',
          message: `Status changed to ${status}`,
          source: 'user',
        },
      })
    }

    return NextResponse.json({ incident })
  } catch (error) {
    console.error('Failed to update incident:', error)
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.incidentTimeline.deleteMany({ where: { incidentId: id } })
    await prisma.incidentAction.deleteMany({ where: { incidentId: id } })
    await prisma.incident.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete incident:', error)
    return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 })
  }
}
