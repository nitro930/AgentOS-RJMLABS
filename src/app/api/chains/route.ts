import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function GET() {
  try {
    const chains = await prisma.agentChain.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    })
    return NextResponse.json({ chains })
  } catch (error) {
    console.error('Failed to fetch chains:', error)
    return NextResponse.json({ error: 'Failed to fetch chains' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const chain = await prisma.agentChain.create({
      data: {
        name: body.name || 'Untitled Chain',
        description: body.description || null,
        status: body.status || 'draft',
        chainType: body.chainType || 'sequential',
        steps: body.steps ? JSON.stringify(body.steps) : '[]',
        connections: body.connections ? JSON.stringify(body.connections) : '[]',
        inputSchema: body.inputSchema ? JSON.stringify(body.inputSchema) : '{}',
        outputSchema: body.outputSchema ? JSON.stringify(body.outputSchema) : '{}',
        errorStrategy: body.errorStrategy || 'stop',
        maxRetries: body.maxRetries ?? 1,
        timeout: body.timeout ?? 300000,
      },
    })
    return NextResponse.json({ chain }, { status: 201 })
  } catch (error) {
    console.error('Failed to create chain:', error)
    return NextResponse.json({ error: 'Failed to create chain' }, { status: 500 })
  }
}
