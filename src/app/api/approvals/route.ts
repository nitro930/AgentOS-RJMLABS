import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.type = type
    if (priority) where.priority = priority

    const approvals = await prisma.approvalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(approvals)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const approval = await prisma.approvalRequest.create({
      data: {
        title: body.title,
        description: body.description || '',
        type: body.type || 'action',
        priority: body.priority || 'medium',
        status: 'pending',
        agentId: body.agentId,
        workflowId: body.workflowId,
        actionData: JSON.stringify(body.actionData || {}),
        riskLevel: body.riskLevel || 'medium',
        autoApprove: body.autoApprove || false,
        autoReject: body.autoReject || false,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        escalationLevel: body.escalationLevel || 0,
      },
    })
    return NextResponse.json(approval, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create approval request' }, { status: 500 })
  }
}
