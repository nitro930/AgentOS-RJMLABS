import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.username || !body.password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    // Find user
    const user = await db.user.findUnique({ where: { username: body.username } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Check status
    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 })
    }

    // Verify password
    const valid = await bcrypt.compare(body.password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Create session token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create session
    const session = await db.userSession.create({
      data: {
        userId: user.id,
        token,
        ipAddress: body.ipAddress || null,
        userAgent: body.userAgent || null,
        expiresAt,
      },
    })

    // Update user login info
    await db.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    })

    // Fetch role info
    const role = user.roleId
      ? await db.role.findUnique({
          where: { id: user.roleId },
          include: { permissions: true },
        })
      : null

    const { passwordHash, ...safeUser } = user

    return NextResponse.json({
      user: { ...safeUser, role },
      session: { id: session.id, token: session.token, expiresAt: session.expiresAt },
    })
  } catch (error) {
    console.error('Login failed:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Session token is required' }, { status: 400 })
    }

    // Find and delete session
    const session = await db.userSession.findUnique({ where: { token } })
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    await db.userSession.delete({ where: { id: session.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout failed:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
