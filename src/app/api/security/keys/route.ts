import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'agentos-default-encryption-key-32b'

function encrypt(text: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16)
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return { encrypted, iv: iv.toString('hex') }
}

export async function GET() {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        provider: true,
        keyPreview: true,
        permissions: true,
        usageCount: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    })
    
    // Parse permissions JSON
    const parsedKeys = keys.map(k => ({
      ...k,
      permissions: JSON.parse(k.permissions || '[]'),
    }))
    
    return NextResponse.json(parsedKeys)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, provider, key, permissions } = body

    if (!name || !key) {
      return NextResponse.json({ error: 'Name and key are required' }, { status: 400 })
    }

    const { encrypted, iv } = encrypt(key)
    const keyPreview = key.slice(-4)

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        provider: provider || 'custom',
        keyPreview,
        keyEncrypted: encrypted,
        keyIV: iv,
        permissions: JSON.stringify(permissions || []),
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'create',
        resource: 'api_key',
        resourceId: apiKey.id,
        details: JSON.stringify({ name, provider }),
        source: 'user',
        severity: 'info',
      },
    })

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      provider: apiKey.provider,
      keyPreview: apiKey.keyPreview,
      permissions: JSON.parse(apiKey.permissions),
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}
