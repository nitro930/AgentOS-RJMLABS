import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const rules = await prisma.accessRule.findMany({
      orderBy: { createdAt: 'desc' },
    })
    const parsedRules = rules.map(r => ({
      ...r,
      conditions: JSON.parse(r.conditions || '{}'),
    }))
    return NextResponse.json(parsedRules)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch access rules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rule = await prisma.accessRule.create({
      data: {
        name: body.name,
        resource: body.resource,
        action: body.action,
        agentId: body.agentId || null,
        isAllowed: body.isAllowed ?? true,
        conditions: JSON.stringify(body.conditions || {}),
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'create',
        resource: 'api_key',
        resourceId: rule.id,
        details: JSON.stringify({ ruleName: body.name, resource: body.resource, action: body.action, isAllowed: body.isAllowed }),
        source: 'user',
        severity: 'info',
      },
    })

    return NextResponse.json({
      ...rule,
      conditions: JSON.parse(rule.conditions || '{}'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
  }
}
