import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const postMortem = await prisma.postMortem.findUnique({
      where: { id },
    })

    if (!postMortem) {
      return NextResponse.json({ error: 'Post-mortem not found' }, { status: 404 })
    }

    return NextResponse.json({ postMortem })
  } catch (error) {
    console.error('Failed to fetch post-mortem:', error)
    return NextResponse.json({ error: 'Failed to fetch post-mortem' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, summary, rootCause, contributingFactors, actionItems, lessonsLearned, timeline, isPublished, authoredBy } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (summary !== undefined) updateData.summary = summary
    if (rootCause !== undefined) updateData.rootCause = rootCause
    if (contributingFactors !== undefined) updateData.contributingFactors = typeof contributingFactors === 'object' ? JSON.stringify(contributingFactors) : contributingFactors
    if (actionItems !== undefined) updateData.actionItems = typeof actionItems === 'object' ? JSON.stringify(actionItems) : actionItems
    if (lessonsLearned !== undefined) updateData.lessonsLearned = typeof lessonsLearned === 'object' ? JSON.stringify(lessonsLearned) : lessonsLearned
    if (timeline !== undefined) updateData.timeline = typeof timeline === 'object' ? JSON.stringify(timeline) : timeline
    if (isPublished !== undefined) updateData.isPublished = isPublished
    if (authoredBy !== undefined) updateData.authoredBy = authoredBy

    const postMortem = await prisma.postMortem.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ postMortem })
  } catch (error) {
    console.error('Failed to update post-mortem:', error)
    return NextResponse.json({ error: 'Failed to update post-mortem' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const postMortem = await prisma.postMortem.findUnique({ where: { id } })

    if (postMortem) {
      // Unlink from incident
      await prisma.incident.updateMany({
        where: { postMortemId: id },
        data: { postMortemId: null },
      })
    }

    await prisma.postMortem.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete post-mortem:', error)
    return NextResponse.json({ error: 'Failed to delete post-mortem' }, { status: 500 })
  }
}
