import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/mcp/servers/[id] - Get a specific MCP server
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const server = await prisma.mCPServer.findUnique({
      where: { id },
      include: {
        tools: { orderBy: { useCount: 'desc' } },
        resources: { orderBy: { accessCount: 'desc' } },
        prompts: { orderBy: { useCount: 'desc' } },
        executions: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }
    return NextResponse.json({ server })
  } catch (error) {
    console.error('Failed to fetch MCP server:', error)
    return NextResponse.json({ error: 'Failed to fetch MCP server' }, { status: 500 })
  }
}

// PATCH /api/mcp/servers/[id] - Update a MCP server
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.version !== undefined) updateData.version = body.version
    if (body.transportType !== undefined) updateData.transportType = body.transportType
    if (body.command !== undefined) updateData.command = body.command
    if (body.args !== undefined) updateData.args = typeof body.args === 'string' ? body.args : JSON.stringify(body.args)
    if (body.envVars !== undefined) updateData.envVars = typeof body.envVars === 'string' ? body.envVars : JSON.stringify(body.envVars)
    if (body.url !== undefined) updateData.url = body.url
    if (body.headers !== undefined) updateData.headers = typeof body.headers === 'string' ? body.headers : JSON.stringify(body.headers)
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.autoConnect !== undefined) updateData.autoConnect = body.autoConnect
    if (body.tags !== undefined) updateData.tags = typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags)
    if (body.icon !== undefined) updateData.icon = body.icon

    const server = await prisma.mCPServer.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json({ server })
  } catch (error) {
    console.error('Failed to update MCP server:', error)
    return NextResponse.json({ error: 'Failed to update MCP server' }, { status: 500 })
  }
}

// DELETE /api/mcp/servers/[id] - Delete a MCP server
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Delete related records first
    await prisma.mCPExecution.deleteMany({ where: { serverId: id } })
    await prisma.mCPTool.deleteMany({ where: { serverId: id } })
    await prisma.mCPResource.deleteMany({ where: { serverId: id } })
    await prisma.mCPPrompt.deleteMany({ where: { serverId: id } })
    await prisma.mCPServer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete MCP server:', error)
    return NextResponse.json({ error: 'Failed to delete MCP server' }, { status: 500 })
  }
}
