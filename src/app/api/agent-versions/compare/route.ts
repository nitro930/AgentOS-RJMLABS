import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/agent-versions/compare — Compare two versions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { versionA, versionB } = body

    if (!versionA || !versionB) {
      return NextResponse.json(
        { error: 'versionA and versionB IDs are required' },
        { status: 400 }
      )
    }

    const [vA, vB] = await Promise.all([
      db.agentVersion.findUnique({ where: { id: versionA } }),
      db.agentVersion.findUnique({ where: { id: versionB } }),
    ])

    if (!vA) {
      return NextResponse.json(
        { error: `Version ${versionA} not found` },
        { status: 404 }
      )
    }

    if (!vB) {
      return NextResponse.json(
        { error: `Version ${versionB} not found` },
        { status: 404 }
      )
    }

    // Parse configs
    let configA: Record<string, unknown>
    let configB: Record<string, unknown>
    try {
      configA = JSON.parse(vA.config)
    } catch {
      configA = { raw: vA.config }
    }
    try {
      configB = JSON.parse(vB.config)
    } catch {
      configB = { raw: vB.config }
    }

    // Compute deep diff
    const diff = computeDeepDiff(configA, configB)

    // Get agent info
    const agent = await db.agent.findUnique({
      where: { id: vA.agentId },
      select: { id: true, name: true, avatar: true, type: true },
    })

    // Summary stats
    const stats = {
      totalKeys: new Set([...Object.keys(configA), ...Object.keys(configB)]).size,
      added: diff.filter(d => d.type === 'added').length,
      removed: diff.filter(d => d.type === 'removed').length,
      modified: diff.filter(d => d.type === 'modified').length,
      unchanged: diff.filter(d => d.type === 'unchanged').length,
    }

    return NextResponse.json({
      versionA: {
        id: vA.id,
        version: vA.version,
        changeSummary: vA.changeSummary,
        changeType: vA.changeType,
        author: vA.author,
        createdAt: vA.createdAt,
      },
      versionB: {
        id: vB.id,
        version: vB.version,
        changeSummary: vB.changeSummary,
        changeType: vB.changeType,
        author: vB.author,
        createdAt: vB.createdAt,
      },
      agent,
      diff,
      stats,
      configA,
      configB,
    })
  } catch (error) {
    console.error('Failed to compare versions:', error)
    return NextResponse.json(
      { error: 'Failed to compare versions' },
      { status: 500 }
    )
  }
}

interface DiffEntry {
  path: string
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  valueA?: unknown
  valueB?: unknown
}

function computeDeepDiff(
  objA: Record<string, unknown>,
  objB: Record<string, unknown>,
  path = ''
): DiffEntry[] {
  const result: DiffEntry[] = []
  const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)])

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key
    const hasA = key in objA
    const hasB = key in objB

    if (!hasA && hasB) {
      result.push({ path: currentPath, type: 'added', valueB: objB[key] })
    } else if (hasA && !hasB) {
      result.push({ path: currentPath, type: 'removed', valueA: objA[key] })
    } else {
      const valA = objA[key]
      const valB = objB[key]

      if (JSON.stringify(valA) === JSON.stringify(valB)) {
        result.push({ path: currentPath, type: 'unchanged', valueA: valA, valueB: valB })
      } else if (typeof valA === 'object' && valA !== null && !Array.isArray(valA) &&
                 typeof valB === 'object' && valB !== null && !Array.isArray(valB)) {
        // Recurse into nested objects
        result.push(...computeDeepDiff(
          valA as Record<string, unknown>,
          valB as Record<string, unknown>,
          currentPath
        ))
      } else {
        result.push({ path: currentPath, type: 'modified', valueA: valA, valueB: valB })
      }
    }
  }

  return result
}
