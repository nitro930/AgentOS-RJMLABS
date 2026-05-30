import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/env-vars - List all env vars with optional scope filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope')
    const scopeId = searchParams.get('scopeId')
    const profileId = searchParams.get('profileId')
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (scope) where.scope = scope
    if (scopeId) where.scopeId = scopeId
    if (profileId) where.profileId = profileId
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === 'true'

    const envVars = await db.envVar.findMany({
      where,
      orderBy: [{ key: 'asc' }],
    })

    // Mask secret values in list response
    const masked = envVars.map((v) => ({
      ...v,
      value: v.isSecret ? '••••••••' : v.value,
    }))

    return NextResponse.json({ envVars: masked, total: masked.length })
  } catch (error) {
    console.error('Failed to list env vars:', error)
    return NextResponse.json({ error: 'Failed to list env vars' }, { status: 500 })
  }
}

// POST /api/env-vars - Create new env var
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value, type, scope, scopeId, description, isSecret, isRequired, profileId } = body

    if (!key || value === undefined || value === null) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }

    // Check for duplicate key within the same scope
    const where: Record<string, unknown> = { key }
    if (scope) where.scope = scope
    if (scopeId) where.scopeId = scopeId

    const existing = await db.envVar.findFirst({ where })
    if (existing) {
      return NextResponse.json({ error: 'Environment variable with this key already exists in this scope' }, { status: 409 })
    }

    const envVar = await db.envVar.create({
      data: {
        key,
        value: String(value),
        type: type || 'string',
        scope: scope || 'global',
        scopeId: scopeId || null,
        description: description || null,
        isSecret: isSecret || type === 'secret' || false,
        isRequired: isRequired || false,
        isActive: true,
        profileId: profileId || null,
      },
    })

    return NextResponse.json({
      envVar: {
        ...envVar,
        value: envVar.isSecret ? '••••••••' : envVar.value,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create env var:', error)
    return NextResponse.json({ error: 'Failed to create env var' }, { status: 500 })
  }
}
