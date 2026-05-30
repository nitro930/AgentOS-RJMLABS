import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const approval = await prisma.approvalRequest.findUnique({ where: { id } })
    if (!approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }
    return NextResponse.json(approval)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch approval' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data: Record<string, unknown> = { updatedAt: new Date() }

    if (body.status) data.status = body.status
    if (body.reviewedBy) data.reviewedBy = body.reviewedBy
    if (body.reviewNotes !== undefined) data.reviewNotes = body.reviewNotes
    if (body.rejectionReason !== undefined) data.rejectionReason = body.rejectionReason
    if (body.escalationLevel !== undefined) data.escalationLevel = body.escalationLevel

    if (body.status === 'approved' || body.status === 'rejected') {
      data.reviewedAt = new Date()
    }

    const approval = await prisma.approvalRequest.update({
      where: { id },
      data,
    })
    return NextResponse.json(approval)
  } catch {
    return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const approval = await prisma.approvalRequest.update({
      where: { id },
      data: { status: 'cancelled', updatedAt: new Date() },
    })
    return NextResponse.json(approval)
  } catch {
    return NextResponse.json({ error: 'Failed to cancel approval' }, { status: 500 })
  }
}
