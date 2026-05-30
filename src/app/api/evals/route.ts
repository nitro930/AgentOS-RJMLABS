import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const agentId = searchParams.get('agentId')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (status) where.status = status
    if (agentId) where.agentId = agentId

    const suites = await db.evalSuite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { cases: true, runs: true } },
      },
    })

    return NextResponse.json(suites)
  } catch (error) {
    console.error('Failed to fetch eval suites:', error)
    return NextResponse.json({ error: 'Failed to fetch eval suites' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const suite = await db.evalSuite.create({
      data: {
        name: body.name,
        description: body.description || null,
        type: body.type || 'quality',
        status: body.status || 'draft',
        agentId: body.agentId || null,
        passingScore: body.passingScore ?? 0.8,
        isBuiltIn: body.isBuiltIn ?? false,
        icon: body.icon || '🧪',
      },
    })

    return NextResponse.json(suite, { status: 201 })
  } catch (error) {
    console.error('Failed to create eval suite:', error)
    return NextResponse.json({ error: 'Failed to create eval suite' }, { status: 500 })
  }
}
