import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (severity) where.severity = severity

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        timeline: { orderBy: { createdAt: 'desc' } },
        actions: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ incidents })
  } catch (error) {
    console.error('Failed to fetch incidents:', error)
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, severity, type, affectedServices, affectedAgentIds, impactLevel, tags } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const incident = await prisma.incident.create({
      data: {
        title,
        description: description || '',
        severity: severity || 'medium',
        status: 'open',
        type: type || 'operational',
        affectedServices: typeof affectedServices === 'object' ? JSON.stringify(affectedServices || []) : (affectedServices || '[]'),
        affectedAgentIds: typeof affectedAgentIds === 'object' ? JSON.stringify(affectedAgentIds || []) : (affectedAgentIds || '[]'),
        impactLevel: impactLevel || 'partial',
        tags: typeof tags === 'object' ? JSON.stringify(tags || []) : (tags || '[]'),
        detectedAt: new Date(),
      },
    })

    // Create initial timeline event
    await prisma.incidentTimeline.create({
      data: {
        incidentId: incident.id,
        eventType: 'created',
        message: `Incident "${title}" created`,
        source: 'user',
      },
    })

    const result = await prisma.incident.findUnique({
      where: { id: incident.id },
      include: {
        timeline: { orderBy: { createdAt: 'desc' } },
        actions: { orderBy: { createdAt: 'desc' } },
      },
    })

    return NextResponse.json({ incident: result })
  } catch (error) {
    console.error('Failed to create incident:', error)
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 })
  }
}
