import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/agent-versions — List all agent versions (with agentId filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const changeType = searchParams.get('changeType')
    const author = searchParams.get('author')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (agentId) where.agentId = agentId
    if (changeType) where.changeType = changeType
    if (author) where.author = author

    const versions = await db.agentVersion.findMany({
      where,
      orderBy: [
        { agentId: 'asc' },
        { version: 'desc' },
      ],
      take: limit,
      skip: offset,
    })

    const total = await db.agentVersion.count({ where })

    // Get unique agent IDs to return agent info
    const agentIds = [...new Set(versions.map(v => v.agentId))]
    const agents = await db.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true, avatar: true, type: true },
    })

    return NextResponse.json({
      versions,
      agents,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Failed to list agent versions:', error)
    return NextResponse.json(
      { error: 'Failed to list agent versions' },
      { status: 500 }
    )
  }
}

// POST /api/agent-versions — Create a new version
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, config, changeSummary, changeType, author, diffFrom } = body

    if (!agentId || !config) {
      return NextResponse.json(
        { error: 'agentId and config are required' },
        { status: 400 }
      )
    }

    // Get the current max version for this agent
    const latestVersion = await db.agentVersion.findFirst({
      where: { agentId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })

    const newVersion = (latestVersion?.version || 0) + 1

    // Mark previous current versions as not current
    await db.agentVersion.updateMany({
      where: { agentId, isCurrent: true },
      data: { isCurrent: false },
    })

    // Create new version as current
    const version = await db.agentVersion.create({
      data: {
        agentId,
        version: newVersion,
        config: typeof config === 'string' ? config : JSON.stringify(config),
        changeSummary: changeSummary || '',
        changeType: changeType || 'update',
        diffFrom: diffFrom ? (typeof diffFrom === 'string' ? diffFrom : JSON.stringify(diffFrom)) : '{}',
        author: author || 'user',
        isCurrent: true,
      },
    })

    return NextResponse.json({ version }, { status: 201 })
  } catch (error) {
    console.error('Failed to create agent version:', error)
    return NextResponse.json(
      { error: 'Failed to create agent version' },
      { status: 500 }
    )
  }
}
