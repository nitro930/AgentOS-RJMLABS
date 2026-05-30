import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customName } = body

    const marketplaceAgent = await db.marketplaceAgent.findUnique({
      where: { id },
    })

    if (!marketplaceAgent) {
      return NextResponse.json({ error: 'Marketplace agent not found' }, { status: 404 })
    }

    if (marketplaceAgent.status !== 'published') {
      return NextResponse.json({ error: 'This agent is not available for installation' }, { status: 400 })
    }

    // Increment install count
    await db.marketplaceAgent.update({
      where: { id },
      data: { installCount: { increment: 1 } },
    })

    // Create an Agent from the marketplace template
    const agentName = customName || `${marketplaceAgent.name}`
    
    // Check if agent with same name exists
    const existing = await db.agent.findUnique({ where: { name: agentName } })
    const finalName = existing ? `${agentName}-${Date.now().toString(36)}` : agentName

    const agentConfig = marketplaceAgent.config || '{}'
    const parsedConfig = (() => {
      try { return JSON.parse(agentConfig) } catch { return {} }
    })()

    const agent = await db.agent.create({
      data: {
        name: finalName,
        type: parsedConfig.type || 'custom',
        description: marketplaceAgent.description,
        config: marketplaceAgent.config,
        avatar: marketplaceAgent.icon,
        color: parsedConfig.color || '#10b981',
        status: 'idle',
      },
    })

    return NextResponse.json({ agent, marketplaceAgent }, { status: 201 })
  } catch (error) {
    console.error('Failed to install marketplace agent:', error)
    return NextResponse.json({ error: 'Failed to install marketplace agent' }, { status: 500 })
  }
}
