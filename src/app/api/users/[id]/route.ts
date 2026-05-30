import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      include: { sessions: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const role = user.roleId
      ? await db.role.findUnique({
          where: { id: user.roleId },
          include: { permissions: true },
        })
      : null

    const { passwordHash, ...safeUser } = user
    return NextResponse.json({ ...safeUser, role })
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if user exists
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check username uniqueness if changing
    if (body.username && body.username !== existing.username) {
      const dup = await db.user.findUnique({ where: { username: body.username } })
      if (dup) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
      }
    }

    // Check email uniqueness if changing
    if (body.email && body.email !== existing.email) {
      const dup = await db.user.findUnique({ where: { email: body.email } })
      if (dup) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (body.username !== undefined) updateData.username = body.username
    if (body.email !== undefined) updateData.email = body.email || null
    if (body.displayName !== undefined) updateData.displayName = body.displayName || null
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl || null
    if (body.roleId !== undefined) updateData.roleId = body.roleId || null
    if (body.status !== undefined) updateData.status = body.status
    if (body.mfaEnabled !== undefined) updateData.mfaEnabled = body.mfaEnabled
    if (body.preferences !== undefined) updateData.preferences = JSON.stringify(body.preferences)

    // Handle password change
    if (body.password) {
      const salt = await bcrypt.genSalt(12)
      updateData.passwordHash = await bcrypt.hash(body.password, salt)
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
    })

    const role = user.roleId
      ? await db.role.findUnique({ where: { id: user.roleId } })
      : null

    const { passwordHash, ...safeUser } = user
    return NextResponse.json({ ...safeUser, role })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if user exists
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete sessions first
    await db.userSession.deleteMany({ where: { userId: id } })

    // Delete user
    await db.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
