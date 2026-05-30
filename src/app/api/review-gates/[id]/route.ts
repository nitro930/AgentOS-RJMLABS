import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data: Record<string, unknown> = { updatedAt: new Date() }

    if (body.name !== undefined) data.name = body.name
    if (body.description !== undefined) data.description = body.description
    if (body.triggerType !== undefined) data.triggerType = body.triggerType
    if (body.triggerConfig !== undefined) data.triggerConfig = JSON.stringify(body.triggerConfig)
    if (body.actionTypes !== undefined) data.actionTypes = JSON.stringify(body.actionTypes)
    if (body.riskThreshold !== undefined) data.riskThreshold = body.riskThreshold
    if (body.costThreshold !== undefined) data.costThreshold = body.costThreshold
    if (body.requireApproval !== undefined) data.requireApproval = body.requireApproval
    if (body.autoExpireHours !== undefined) data.autoExpireHours = body.autoExpireHours
    if (body.escalationChain !== undefined) data.escalationChain = JSON.stringify(body.escalationChain)
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.agentId !== undefined) data.agentId = body.agentId

    const gate = await prisma.reviewGate.update({ where: { id }, data })
    return NextResponse.json(gate)
  } catch {
    return NextResponse.json({ error: 'Failed to update review gate' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.reviewGate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete review gate' }, { status: 500 })
  }
}
