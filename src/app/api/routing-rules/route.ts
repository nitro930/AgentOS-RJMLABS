import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const rules = await db.routingRule.findMany({
      orderBy: { priority: 'desc' },
    })
    return NextResponse.json(rules)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch routing rules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rule = await db.routingRule.create({
      data: {
        name: body.name,
        condition: JSON.stringify(body.condition || {}),
        modelId: body.modelId,
        isActive: body.isActive ?? true,
        priority: body.priority ?? 0,
      },
    })
    return NextResponse.json(rule, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create routing rule' }, { status: 500 })
  }
}
