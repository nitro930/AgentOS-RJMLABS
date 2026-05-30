import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/agent-versions/[id] — Get single version details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const version = await db.agentVersion.findUnique({
      where: { id },
    })

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    // Get agent info
    const agent = await db.agent.findUnique({
      where: { id: version.agentId },
      select: { id: true, name: true, avatar: true, type: true },
    })

    // Get the previous version for diff context
    const previousVersion = await db.agentVersion.findFirst({
      where: {
        agentId: version.agentId,
        version: { lt: version.version },
      },
      orderBy: { version: 'desc' },
    })

    // Get the next version (for navigation)
    const nextVersion = await db.agentVersion.findFirst({
      where: {
        agentId: version.agentId,
        version: { gt: version.version },
      },
      orderBy: { version: 'asc' },
    })

    // Get total version count for this agent
    const totalVersions = await db.agentVersion.count({
      where: { agentId: version.agentId },
    })

    return NextResponse.json({
      version,
      agent,
      previousVersion: previousVersion ? { id: previousVersion.id, version: previousVersion.version } : null,
      nextVersion: nextVersion ? { id: nextVersion.id, version: nextVersion.version } : null,
      totalVersions,
    })
  } catch (error) {
    console.error('Failed to get version:', error)
    return NextResponse.json(
      { error: 'Failed to get version' },
      { status: 500 }
    )
  }
}

// DELETE /api/agent-versions/[id] — Delete a version
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const version = await db.agentVersion.findUnique({
      where: { id },
    })

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    // Don't allow deleting the current version
    if (version.isCurrent) {
      return NextResponse.json(
        { error: 'Cannot delete the current active version. Restore a different version first.' },
        { status: 400 }
      )
    }

    await db.agentVersion.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, deletedId: id })
  } catch (error) {
    console.error('Failed to delete version:', error)
    return NextResponse.json(
      { error: 'Failed to delete version' },
      { status: 500 }
    )
  }
}
