import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const model = await db.modelConfig.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.provider && { provider: body.provider }),
        ...(body.providerId !== undefined && { providerId: body.providerId }),
        ...(body.modelId && { modelId: body.modelId }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.costPer1k !== undefined && { costPer1k: body.costPer1k }),
        ...(body.maxTokens !== undefined && { maxTokens: body.maxTokens }),
        ...(body.capabilities && { capabilities: JSON.stringify(body.capabilities) }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.contextLength !== undefined && { contextLength: body.contextLength }),
        ...(body.pricing !== undefined && { pricing: JSON.stringify(body.pricing) }),
      },
    })
    return NextResponse.json(model)
  } catch {
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.modelConfig.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete model' }, { status: 500 })
  }
}
