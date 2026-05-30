import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const teams = await db.agentTeam.findMany({
      include: {
        members: true,
        _count: { select: { members: true, channels: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Failed to fetch teams:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, icon, color, objective, leadAgentId, sharedMemory, sharedKnowledgeBaseId, maxMembers, tags } = body

    if (!name) return NextResponse.json({ error: 'Team name is required' }, { status: 400 })

    const team = await db.agentTeam.create({
      data: {
        name,
        description: description || null,
        icon: icon || '👥',
        color: color || '#8b5cf6',
        objective: objective || null,
        leadAgentId: leadAgentId || null,
        sharedMemory: sharedMemory !== undefined ? sharedMemory : true,
        sharedKnowledgeBaseId: sharedKnowledgeBaseId || null,
        maxMembers: maxMembers || 5,
        tags: tags ? JSON.stringify(tags) : '[]',
      },
      include: { members: true },
    })
    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error('Failed to create team:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}
