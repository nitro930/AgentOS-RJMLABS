import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    if (!q.trim()) {
      return NextResponse.json({ agents: [], memories: [], outputs: [], goals: [] })
    }

    const [agents, memories, outputs, goals] = await Promise.all([
      db.agent.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
            { type: { contains: q } },
          ],
        },
        take: 20,
      }),
      db.memoryEntry.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
            { tags: { contains: q } },
          ],
        },
        include: { agent: true },
        take: 20,
      }),
      db.agentOutput.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
          ],
        },
        include: { agent: true },
        take: 20,
      }),
      db.goal.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        },
        take: 20,
      }),
    ])

    return NextResponse.json({ agents, memories, outputs, goals })
  } catch {
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}
