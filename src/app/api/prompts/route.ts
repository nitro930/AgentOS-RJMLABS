import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    const where: Prisma.PromptTemplateWhereInput = {}

    if (category && category !== 'all') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    const prompts = await db.promptTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(prompts)
  } catch (error) {
    console.error('Failed to fetch prompts:', error)
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const prompt = await db.promptTemplate.create({
      data: {
        name: body.name,
        description: body.description || null,
        category: body.category || 'system',
        content: body.content || '',
        variables: JSON.stringify(body.variables || []),
        tags: JSON.stringify(body.tags || []),
        agentId: body.agentId || null,
        isBuiltIn: body.isBuiltIn || false,
        version: body.version || 1,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    })

    return NextResponse.json(prompt, { status: 201 })
  } catch (error) {
    console.error('Failed to create prompt:', error)
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 })
  }
}
