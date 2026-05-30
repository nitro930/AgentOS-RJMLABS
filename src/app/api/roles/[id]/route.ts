import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const role = await db.role.findUnique({
      where: { id },
      include: { permissions: true },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Count users with this role
    const userCount = await db.user.count({ where: { roleId: id } })

    return NextResponse.json({ ...role, userCount })
  } catch (error) {
    console.error('Failed to fetch role:', error)
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.role.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check name uniqueness if changing
    if (body.name && body.name !== existing.name) {
      const dup = await db.role.findUnique({ where: { name: body.name } })
      if (dup) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 409 })
      }
    }

    // Update role basic fields
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.color !== undefined) updateData.color = body.color
    if (body.priority !== undefined) updateData.priority = body.priority

    if (Object.keys(updateData).length > 0) {
      await db.role.update({ where: { id }, data: updateData })
    }

    // Update permissions if provided
    if (body.permissions && Array.isArray(body.permissions)) {
      // Delete existing permissions
      await db.rolePermission.deleteMany({ where: { roleId: id } })

      // Create new permissions
      for (const perm of body.permissions) {
        if (perm.resource) {
          await db.rolePermission.create({
            data: {
              roleId: id,
              resource: perm.resource,
              actions: JSON.stringify(perm.actions || []),
              conditions: JSON.stringify(perm.conditions || {}),
            },
          })
        }
      }
    }

    // Return updated role
    const role = await db.role.findUnique({
      where: { id },
      include: { permissions: true },
    })

    return NextResponse.json(role)
  } catch (error) {
    console.error('Failed to update role:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.role.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Prevent deleting system roles
    if (existing.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 403 })
    }

    // Check if any users have this role
    const usersWithRole = await db.user.count({ where: { roleId: id } })
    if (usersWithRole > 0) {
      return NextResponse.json(
        { error: `Cannot delete role: ${usersWithRole} user(s) assigned. Reassign users first.` },
        { status: 409 }
      )
    }

    // Delete permissions first
    await db.rolePermission.deleteMany({ where: { roleId: id } })

    // Delete role
    await db.role.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete role:', error)
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
  }
}
