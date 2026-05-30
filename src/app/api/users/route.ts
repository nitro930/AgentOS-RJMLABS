import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const users = await db.user.findMany({
      include: {
        sessions: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch role info separately for users with roleId
    const roles = await db.role.findMany({ include: { permissions: true } })
    const roleMap = new Map(roles.map(r => [r.id, r]))

    const usersWithRole = users.map(user => {
      const { passwordHash, ...safeUser } = user
      const role = user.roleId ? roleMap.get(user.roleId) : null
      return {
        ...safeUser,
        role: role ? { id: role.id, name: role.name, description: role.description, color: role.color, isSystem: role.isSystem, priority: role.priority } : null,
      }
    })

    return NextResponse.json(usersWithRole)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.username || !body.password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    // Check if username already exists
    const existing = await db.user.findUnique({ where: { username: body.username } })
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
    }

    // Check if email already exists (if provided)
    if (body.email) {
      const existingEmail = await db.user.findUnique({ where: { email: body.email } })
      if (existingEmail) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(body.password, salt)

    const user = await db.user.create({
      data: {
        username: body.username,
        email: body.email || null,
        displayName: body.displayName || null,
        avatarUrl: body.avatarUrl || null,
        passwordHash,
        roleId: body.roleId || null,
        status: body.status || 'active',
        mfaEnabled: body.mfaEnabled || false,
        preferences: JSON.stringify(body.preferences || {}),
      },
    })

    // Fetch role info
    const role = user.roleId
      ? await db.role.findUnique({ where: { id: user.roleId } })
      : null

    const { passwordHash: _, ...safeUser } = user
    return NextResponse.json({ ...safeUser, role }, { status: 201 })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
