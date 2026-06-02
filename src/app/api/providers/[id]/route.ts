import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const provider = await db.providerConfig.findUnique({ where: { id } })
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }
    return NextResponse.json(provider)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if this is a "keep existing key" request
    const updateData: Record<string, unknown> = {}
    if (body.displayName !== undefined) updateData.displayName = body.displayName
    if (body.baseUrl !== undefined) updateData.baseUrl = body.baseUrl
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.isBuiltIn !== undefined) updateData.isBuiltIn = body.isBuiltIn
    if (body.models !== undefined) updateData.models = JSON.stringify(body.models)
    if (body.config !== undefined) updateData.config = JSON.stringify(body.config)
    if (body.lastSyncAt !== undefined) updateData.lastSyncAt = body.lastSyncAt

    // Only update apiKey if explicitly provided, non-empty, and not the masked version
    if (body.apiKey !== undefined && body.apiKey.length > 0 && !body.apiKey.includes('•')) {
      updateData.apiKey = body.apiKey
    }

    const provider = await db.providerConfig.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(provider)
  } catch {
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.providerConfig.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 })
  }
}
