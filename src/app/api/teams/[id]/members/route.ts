import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const members = await db.teamMember.findMany({
      where: { teamId: id },
      orderBy: { joinedAt: 'desc' },
    })
    return NextResponse.json({ members })
  } catch (error) {
    console.error('Failed to fetch team members:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { agentId, role } = body

    if (!agentId) return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 })

    // Check team exists
    const team = await db.agentTeam.findUnique({ where: { id }, include: { members: true } })
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

    // Check member limit
    if (team.members.length >= team.maxMembers) {
      return NextResponse.json({ error: `Team has reached max members (${team.maxMembers})` }, { status: 400 })
    }

    // Check if already a member
    const existing = await db.teamMember.findFirst({
      where: { teamId: id, agentId, status: 'active' },
    })
    if (existing) return NextResponse.json({ error: 'Agent is already a member' }, { status: 400 })

    const member = await db.teamMember.create({
      data: {
        teamId: id,
        agentId,
        role: role || 'member',
      },
    })
    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('Failed to add team member:', error)
    return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { agentId, memberId } = body

    if (memberId) {
      await db.teamMember.delete({ where: { id: memberId } })
    } else if (agentId) {
      const member = await db.teamMember.findFirst({
        where: { teamId: id, agentId },
      })
      if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
      await db.teamMember.delete({ where: { id: member.id } })
    } else {
      return NextResponse.json({ error: 'Provide memberId or agentId' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove team member:', error)
    return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 })
  }
}
