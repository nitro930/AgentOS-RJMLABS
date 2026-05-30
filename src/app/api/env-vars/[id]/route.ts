import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/env-vars/[id] - Get single env var (with reveal option)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const reveal = searchParams.get('reveal') === 'true'

    const envVar = await db.envVar.findUnique({ where: { id } })
    if (!envVar) {
      return NextResponse.json({ error: 'Environment variable not found' }, { status: 404 })
    }

    return NextResponse.json({
      envVar: {
        ...envVar,
        value: envVar.isSecret && !reveal ? '••••••••' : envVar.value,
      },
    })
  } catch (error) {
    console.error('Failed to get env var:', error)
    return NextResponse.json({ error: 'Failed to get env var' }, { status: 500 })
  }
}

// PUT /api/env-vars/[id] - Update env var
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { key, value, type, scope, scopeId, description, isSecret, isRequired, isActive, profileId } = body

    const existing = await db.envVar.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Environment variable not found' }, { status: 404 })
    }

    // If changing key, check for duplicates
    if (key && key !== existing.key) {
      const dupWhere: Record<string, unknown> = { key }
      if (scope || existing.scope) dupWhere.scope = scope || existing.scope
      if (scopeId !== undefined ? scopeId : existing.scopeId) dupWhere.scopeId = scopeId !== undefined ? scopeId : existing.scopeId

      const duplicate = await db.envVar.findFirst({ where: dupWhere })
      if (duplicate) {
        return NextResponse.json({ error: 'Environment variable with this key already exists in this scope' }, { status: 409 })
      }
    }

    const envVar = await db.envVar.update({
      where: { id },
      data: {
        ...(key !== undefined && { key }),
        ...(value !== undefined && { value: String(value) }),
        ...(type !== undefined && { type }),
        ...(scope !== undefined && { scope }),
        ...(scopeId !== undefined && { scopeId }),
        ...(description !== undefined && { description }),
        ...(isSecret !== undefined && { isSecret }),
        ...(isRequired !== undefined && { isRequired }),
        ...(isActive !== undefined && { isActive }),
        ...(profileId !== undefined && { profileId }),
      },
    })

    return NextResponse.json({
      envVar: {
        ...envVar,
        value: envVar.isSecret ? '••••••••' : envVar.value,
      },
    })
  } catch (error) {
    console.error('Failed to update env var:', error)
    return NextResponse.json({ error: 'Failed to update env var' }, { status: 500 })
  }
}

// DELETE /api/env-vars/[id] - Delete env var
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.envVar.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Environment variable not found' }, { status: 404 })
    }

    await db.envVar.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Environment variable deleted' })
  } catch (error) {
    console.error('Failed to delete env var:', error)
    return NextResponse.json({ error: 'Failed to delete env var' }, { status: 500 })
  }
}
