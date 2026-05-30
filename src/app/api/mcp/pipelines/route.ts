import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/mcp/pipelines - List all MCP pipelines
export async function GET() {
  try {
    const pipelines = await prisma.mCPPipeline.findMany({
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ pipelines })
  } catch (error) {
    console.error('Failed to fetch MCP pipelines:', error)
    return NextResponse.json({ error: 'Failed to fetch MCP pipelines' }, { status: 500 })
  }
}

// POST /api/mcp/pipelines - Create a new MCP pipeline
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, steps, connections, inputSchema, outputSchema, isPublic } = body

    if (!name) {
      return NextResponse.json({ error: 'Pipeline name is required' }, { status: 400 })
    }

    const pipeline = await prisma.mCPPipeline.create({
      data: {
        name,
        description: description || null,
        steps: typeof steps === 'string' ? steps : JSON.stringify(steps || []),
        connections: typeof connections === 'string' ? connections : JSON.stringify(connections || []),
        inputSchema: typeof inputSchema === 'string' ? inputSchema : JSON.stringify(inputSchema || {}),
        outputSchema: typeof outputSchema === 'string' ? outputSchema : JSON.stringify(outputSchema || {}),
        isPublic: isPublic || false,
      },
    })

    return NextResponse.json({ pipeline }, { status: 201 })
  } catch (error) {
    console.error('Failed to create MCP pipeline:', error)
    return NextResponse.json({ error: 'Failed to create MCP pipeline' }, { status: 500 })
  }
}
