import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get all agents that could have been installed from marketplace
    // We match agents whose avatar matches a marketplace agent icon
    const agents = await db.agent.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Get all marketplace agents for cross-referencing
    const marketplaceAgents = await db.marketplaceAgent.findMany({
      where: { status: 'published' },
    })

    // Map marketplace info onto installed agents
    const installed = agents.map(agent => {
      // Try to find a matching marketplace template by icon+name pattern
      const template = marketplaceAgents.find(
        mp => agent.avatar === mp.icon && agent.name.startsWith(mp.name)
      )
      return {
        ...agent,
        marketplaceId: template?.id || null,
        marketplaceVersion: template?.version || null,
        marketplaceAuthor: template?.author || null,
        hasUpdate: template ? template.version !== '1.0.0' : false, // Simplified update check
      }
    })

    return NextResponse.json({ installed })
  } catch (error) {
    console.error('Failed to fetch installed agents:', error)
    return NextResponse.json({ error: 'Failed to fetch installed agents' }, { status: 500 })
  }
}
