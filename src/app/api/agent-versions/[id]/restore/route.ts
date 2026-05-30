import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/agent-versions/[id]/restore — Restore a specific version
export async function POST(
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
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Get the current version to compute diff
    const currentVersion = await db.agentVersion.findFirst({
      where: { agentId: version.agentId, isCurrent: true },
    })

    // Compute a simple diff description
    let diffDescription = '{}'
    if (currentVersion) {
      try {
        const oldConfig = JSON.parse(currentVersion.config)
        const newConfig = JSON.parse(version.config)
        const diff: Record<string, { from: unknown; to: unknown }> = {}
        const allKeys = new Set([...Object.keys(oldConfig), ...Object.keys(newConfig)])
        for (const key of allKeys) {
          if (JSON.stringify(oldConfig[key]) !== JSON.stringify(newConfig[key])) {
            diff[key] = { from: oldConfig[key], to: newConfig[key] }
          }
        }
        diffDescription = JSON.stringify(diff)
      } catch {
        diffDescription = '{}'
      }
    }

    // Get the next version number
    const latestVersion = await db.agentVersion.findFirst({
      where: { agentId: version.agentId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })

    const newVersionNumber = (latestVersion?.version || 0) + 1

    // Mark previous current versions as not current
    await db.agentVersion.updateMany({
      where: { agentId: version.agentId, isCurrent: true },
      data: { isCurrent: false },
    })

    // Update the agent's config
    await db.agent.update({
      where: { id: version.agentId },
      data: { config: version.config },
    })

    // Create a new version entry as a restore
    const restoredVersion = await db.agentVersion.create({
      data: {
        agentId: version.agentId,
        version: newVersionNumber,
        config: version.config,
        changeSummary: `Restored from v${version.version}: ${version.changeSummary || 'No summary'}`,
        changeType: 'restore',
        diffFrom: diffDescription,
        author: 'user',
        isCurrent: true,
      },
    })

    return NextResponse.json({
      version: restoredVersion,
      restoredFrom: {
        id: version.id,
        version: version.version,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to restore version:', error)
    return NextResponse.json(
      { error: 'Failed to restore version' },
      { status: 500 }
    )
  }
}
