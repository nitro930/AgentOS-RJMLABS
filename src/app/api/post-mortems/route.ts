import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPublished = searchParams.get('isPublished')

    const where: Record<string, unknown> = {}
    if (isPublished !== null) where.isPublished = isPublished === 'true'

    const postMortems = await prisma.postMortem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ postMortems })
  } catch (error) {
    console.error('Failed to fetch post-mortems:', error)
    return NextResponse.json({ error: 'Failed to fetch post-mortems' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { incidentId, title, summary, rootCause, contributingFactors, actionItems, lessonsLearned, timeline, authoredBy } = body

    if (!incidentId || !title) {
      return NextResponse.json({ error: 'incidentId and title are required' }, { status: 400 })
    }

    // Verify incident exists
    const incident = await prisma.incident.findUnique({ where: { id: incidentId } })
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    const postMortem = await prisma.postMortem.create({
      data: {
        incidentId,
        title,
        summary: summary || '',
        rootCause: rootCause || '',
        contributingFactors: typeof contributingFactors === 'object' ? JSON.stringify(contributingFactors || []) : (contributingFactors || '[]'),
        actionItems: typeof actionItems === 'object' ? JSON.stringify(actionItems || []) : (actionItems || '[]'),
        lessonsLearned: typeof lessonsLearned === 'object' ? JSON.stringify(lessonsLearned || []) : (lessonsLearned || '[]'),
        timeline: typeof timeline === 'object' ? JSON.stringify(timeline || []) : (timeline || '[]'),
        authoredBy: authoredBy || null,
      },
    })

    // Link incident to post-mortem
    await prisma.incident.update({
      where: { id: incidentId },
      data: { postMortemId: postMortem.id },
    })

    return NextResponse.json({ postMortem })
  } catch (error) {
    console.error('Failed to create post-mortem:', error)
    return NextResponse.json({ error: 'Failed to create post-mortem' }, { status: 500 })
  }
}
