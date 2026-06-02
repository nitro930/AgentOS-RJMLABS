import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const models = await db.modelConfig.findMany({
      orderBy: { priority: 'desc' },
    })
    const routingRules = await db.routingRule.findMany({
      orderBy: { priority: 'desc' },
    })
    return NextResponse.json({ models, routingRules })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const model = await db.modelConfig.create({
      data: {
        name: body.name,
        provider: body.provider,
        providerId: body.providerId || null,
        modelId: body.modelId,
        isActive: body.isActive ?? true,
        costPer1k: Number(body.costPer1k) || 0,
        maxTokens: Number(body.maxTokens) || 4096,
        capabilities: JSON.stringify(body.capabilities || []),
        priority: body.priority ?? 0,
        contextLength: body.contextLength ?? null,
        pricing: JSON.stringify(body.pricing || {}),
      },
    })
    return NextResponse.json(model, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 })
  }
}
