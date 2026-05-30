import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const chain = await prisma.agentChain.findUnique({
      where: { id },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 20,
        },
      },
    })
    if (!chain) {
      return NextResponse.json({ error: 'Chain not found' }, { status: 404 })
    }
    return NextResponse.json({ chain })
  } catch (error) {
    console.error('Failed to fetch chain:', error)
    return NextResponse.json({ error: 'Failed to fetch chain' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.chainType !== undefined) updateData.chainType = body.chainType
    if (body.steps !== undefined) updateData.steps = typeof body.steps === 'string' ? body.steps : JSON.stringify(body.steps)
    if (body.connections !== undefined) updateData.connections = typeof body.connections === 'string' ? body.connections : JSON.stringify(body.connections)
    if (body.inputSchema !== undefined) updateData.inputSchema = typeof body.inputSchema === 'string' ? body.inputSchema : JSON.stringify(body.inputSchema)
    if (body.outputSchema !== undefined) updateData.outputSchema = typeof body.outputSchema === 'string' ? body.outputSchema : JSON.stringify(body.outputSchema)
    if (body.errorStrategy !== undefined) updateData.errorStrategy = body.errorStrategy
    if (body.maxRetries !== undefined) updateData.maxRetries = body.maxRetries
    if (body.timeout !== undefined) updateData.timeout = body.timeout
    if (body.lastRunAt !== undefined) updateData.lastRunAt = body.lastRunAt
    if (body.runCount !== undefined) updateData.runCount = body.runCount
    if (body.successCount !== undefined) updateData.successCount = body.successCount
    if (body.avgDuration !== undefined) updateData.avgDuration = body.avgDuration

    const chain = await prisma.agentChain.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json({ chain })
  } catch (error) {
    console.error('Failed to update chain:', error)
    return NextResponse.json({ error: 'Failed to update chain' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Delete associated runs first
    await prisma.chainRun.deleteMany({ where: { chainId: id } })
    await prisma.agentChain.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete chain:', error)
    return NextResponse.json({ error: 'Failed to delete chain' }, { status: 500 })
  }
}
