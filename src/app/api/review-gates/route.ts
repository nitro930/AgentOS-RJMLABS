import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const gates = await prisma.reviewGate.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(gates)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch review gates' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const gate = await prisma.reviewGate.create({
      data: {
        name: body.name,
        description: body.description || null,
        triggerType: body.triggerType || 'always',
        triggerConfig: JSON.stringify(body.triggerConfig || {}),
        actionTypes: JSON.stringify(body.actionTypes || []),
        riskThreshold: body.riskThreshold ?? 0.5,
        costThreshold: body.costThreshold ?? 100,
        requireApproval: body.requireApproval ?? true,
        autoExpireHours: body.autoExpireHours ?? 24,
        escalationChain: JSON.stringify(body.escalationChain || []),
        isActive: body.isActive ?? true,
        agentId: body.agentId || null,
      },
    })
    return NextResponse.json(gate, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create review gate' }, { status: 500 })
  }
}
