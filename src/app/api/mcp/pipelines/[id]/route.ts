import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/mcp/pipelines/[id] - Get a specific pipeline
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const pipeline = await prisma.mCPPipeline.findUnique({ where: { id } })
    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 })
    }
    return NextResponse.json({ pipeline })
  } catch (error) {
    console.error('Failed to fetch MCP pipeline:', error)
    return NextResponse.json({ error: 'Failed to fetch MCP pipeline' }, { status: 500 })
  }
}

// PATCH /api/mcp/pipelines/[id] - Update a pipeline
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.steps !== undefined) updateData.steps = typeof body.steps === 'string' ? body.steps : JSON.stringify(body.steps)
    if (body.connections !== undefined) updateData.connections = typeof body.connections === 'string' ? body.connections : JSON.stringify(body.connections)
    if (body.inputSchema !== undefined) updateData.inputSchema = typeof body.inputSchema === 'string' ? body.inputSchema : JSON.stringify(body.inputSchema)
    if (body.outputSchema !== undefined) updateData.outputSchema = typeof body.outputSchema === 'string' ? body.outputSchema : JSON.stringify(body.outputSchema)
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic

    const pipeline = await prisma.mCPPipeline.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json({ pipeline })
  } catch (error) {
    console.error('Failed to update MCP pipeline:', error)
    return NextResponse.json({ error: 'Failed to update MCP pipeline' }, { status: 500 })
  }
}

// DELETE /api/mcp/pipelines/[id] - Delete a pipeline
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.mCPPipeline.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete MCP pipeline:', error)
    return NextResponse.json({ error: 'Failed to delete MCP pipeline' }, { status: 500 })
  }
}
