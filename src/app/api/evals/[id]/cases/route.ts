import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cases = await db.evalCase.findMany({
      where: { suiteId: id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(cases)
  } catch (error) {
    console.error('Failed to fetch eval cases:', error)
    return NextResponse.json({ error: 'Failed to fetch eval cases' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const evalCase = await db.evalCase.create({
      data: {
        suiteId: id,
        name: body.name,
        description: body.description || null,
        input: body.input ? JSON.stringify(body.input) : '{}',
        expectedOutput: body.expectedOutput ? JSON.stringify(body.expectedOutput) : '{}',
        evalCriteria: body.evalCriteria ? JSON.stringify(body.evalCriteria) : '[]',
        category: body.category || 'general',
        difficulty: body.difficulty || 'medium',
        isRequired: body.isRequired ?? true,
        order: body.order ?? 0,
      },
    })

    return NextResponse.json(evalCase, { status: 201 })
  } catch (error) {
    console.error('Failed to create eval case:', error)
    return NextResponse.json({ error: 'Failed to create eval case' }, { status: 500 })
  }
}
