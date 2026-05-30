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
    if (body.level !== undefined) data.level = body.level
    if (body.triggerAfterMinutes !== undefined) data.triggerAfterMinutes = body.triggerAfterMinutes
    if (body.notifyChannel !== undefined) data.notifyChannel = body.notifyChannel
    if (body.notifyUsers !== undefined) data.notifyUsers = JSON.stringify(body.notifyUsers)
    if (body.autoAction !== undefined) data.autoAction = body.autoAction
    if (body.isActive !== undefined) data.isActive = body.isActive

    const policy = await prisma.escalationPolicy.update({ where: { id }, data })
    return NextResponse.json(policy)
  } catch {
    return NextResponse.json({ error: 'Failed to update escalation policy' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.escalationPolicy.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete escalation policy' }, { status: 500 })
  }
}
