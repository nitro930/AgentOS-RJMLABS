import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const policies = await prisma.escalationPolicy.findMany({
      orderBy: [{ level: 'asc' }, { triggerAfterMinutes: 'asc' }],
    })
    return NextResponse.json(policies)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch escalation policies' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const policy = await prisma.escalationPolicy.create({
      data: {
        name: body.name,
        description: body.description || null,
        level: body.level ?? 1,
        triggerAfterMinutes: body.triggerAfterMinutes ?? 30,
        notifyChannel: body.notifyChannel || null,
        notifyUsers: JSON.stringify(body.notifyUsers || []),
        autoAction: body.autoAction || 'none',
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json(policy, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create escalation policy' }, { status: 500 })
  }
}
