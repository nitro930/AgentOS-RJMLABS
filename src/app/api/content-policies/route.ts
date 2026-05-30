import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === 'true'

    const policies = await db.contentPolicy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(policies)
  } catch (error) {
    console.error('Failed to fetch content policies:', error)
    return NextResponse.json({ error: 'Failed to fetch content policies' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const policy = await db.contentPolicy.create({
      data: {
        name: body.name,
        description: body.description || null,
        type: body.type || 'blocklist',
        rules: body.rules ? JSON.stringify(body.rules) : '[]',
        isActive: body.isActive ?? true,
        agentId: body.agentId || null,
      },
    })

    return NextResponse.json(policy, { status: 201 })
  } catch (error) {
    console.error('Failed to create content policy:', error)
    return NextResponse.json({ error: 'Failed to create content policy' }, { status: 500 })
  }
}
