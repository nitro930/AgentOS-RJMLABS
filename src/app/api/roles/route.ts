import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const roles = await db.role.findMany({
      include: { permissions: true },
      orderBy: { priority: 'desc' },
    })
    return NextResponse.json(roles)
  } catch (error) {
    console.error('Failed to fetch roles:', error)
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
    }

    // Check uniqueness
    const existing = await db.role.findUnique({ where: { name: body.name } })
    if (existing) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 409 })
    }

    // Create role
    const role = await db.role.create({
      data: {
        name: body.name,
        description: body.description || null,
        color: body.color || '#6366f1',
        isSystem: body.isSystem || false,
        priority: body.priority || 0,
      },
    })

    // Create permissions if provided
    if (body.permissions && Array.isArray(body.permissions)) {
      for (const perm of body.permissions) {
        if (perm.resource && perm.actions) {
          await db.rolePermission.create({
            data: {
              roleId: role.id,
              resource: perm.resource,
              actions: JSON.stringify(perm.actions),
              conditions: JSON.stringify(perm.conditions || {}),
            },
          })
        }
      }
    }

    // Return with permissions
    const roleWithPerms = await db.role.findUnique({
      where: { id: role.id },
      include: { permissions: true },
    })

    return NextResponse.json(roleWithPerms, { status: 201 })
  } catch (error) {
    console.error('Failed to create role:', error)
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
  }
}
