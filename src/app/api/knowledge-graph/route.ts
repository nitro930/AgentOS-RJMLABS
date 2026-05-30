import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [agents, memories, outputs, goals] = await Promise.all([
      db.agent.findMany({ take: 50, orderBy: { createdAt: 'desc' } }),
      db.memoryEntry.findMany({ take: 50, orderBy: { createdAt: 'desc' } }),
      db.agentOutput.findMany({ take: 50, orderBy: { createdAt: 'desc' } }),
      db.goal.findMany({ take: 50, orderBy: { createdAt: 'desc' } }),
    ])

    // Build nodes
    const nodes = [
      ...agents.map((a) => ({
        id: a.id,
        label: a.name,
        type: 'agent',
        color: a.color,
      })),
      ...memories.map((m) => ({
        id: m.id,
        label: m.title,
        type: 'memory',
        color: '#10b981',
      })),
      ...outputs.map((o) => ({
        id: o.id,
        label: o.title,
        type: 'output',
        color: '#f59e0b',
      })),
      ...goals.map((g) => ({
        id: g.id,
        label: g.title,
        type: 'goal',
        color: '#8b5cf6',
      })),
    ]

    // Build edges
    const edges = [
      // Agent → Memory
      ...memories.filter((m) => m.agentId).map((m) => ({
        source: m.agentId!,
        target: m.id,
        label: 'has memory',
      })),
      // Agent → Output
      ...outputs.map((o) => ({
        source: o.agentId,
        target: o.id,
        label: 'produced',
      })),
      // Agent → Task (via agentId on tasks)
      ...(await db.agentTask.findMany({ take: 50, orderBy: { createdAt: 'desc' } })).map((t) => ({
        source: t.agentId,
        target: t.id,
        label: 'assigned',
      })),
      // Memory → Output (via memoryId on output)
      ...outputs.filter((o) => o.memoryId).map((o) => ({
        source: o.memoryId!,
        target: o.id,
        label: 'written to',
      })),
    ]

    // Add task nodes for edges that reference them
    const tasks = await db.agentTask.findMany({ take: 50, orderBy: { createdAt: 'desc' } })
    for (const t of tasks) {
      if (!nodes.find((n) => n.id === t.id)) {
        nodes.push({
          id: t.id,
          label: t.title,
          type: 'task',
          color: '#ef4444',
        })
      }
    }

    return NextResponse.json({ nodes, edges })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch knowledge graph' }, { status: 500 })
  }
}
