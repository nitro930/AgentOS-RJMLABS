import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const team = await db.agentTeam.findUnique({
      where: { id },
      include: {
        members: true,
        channels: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    return NextResponse.json({ team })
  } catch (error) {
    console.error('Failed to fetch team:', error)
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, icon, color, status, objective, leadAgentId, sharedMemory, sharedKnowledgeBaseId, maxMembers, tags } = body

    const team = await db.agentTeam.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(status !== undefined && { status }),
        ...(objective !== undefined && { objective }),
        ...(leadAgentId !== undefined && { leadAgentId }),
        ...(sharedMemory !== undefined && { sharedMemory }),
        ...(sharedKnowledgeBaseId !== undefined && { sharedKnowledgeBaseId }),
        ...(maxMembers !== undefined && { maxMembers }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      },
      include: { members: true, channels: true },
    })
    return NextResponse.json({ team })
  } catch (error) {
    console.error('Failed to update team:', error)
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.agentTeam.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete team:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
