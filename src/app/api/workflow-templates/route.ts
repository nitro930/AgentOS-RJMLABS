import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (category) {
      where.category = category
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const templates = await prisma.workflowTemplate.findMany({
      where,
      orderBy: { useCount: 'desc' },
    })

    return NextResponse.json(templates)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch workflow templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    }

    if (!body.description) {
      return NextResponse.json({ error: 'Template description is required' }, { status: 400 })
    }

    const template = await prisma.workflowTemplate.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category || 'automation',
        icon: body.icon || '🔧',
        version: body.version || '1.0.0',
        author: body.author || 'RJMLABS',
        steps: JSON.stringify(body.steps || []),
        connections: JSON.stringify(body.connections || []),
        triggerType: body.triggerType || 'manual',
        triggerConfig: JSON.stringify(body.triggerConfig || {}),
        variables: JSON.stringify(body.variables || []),
        tags: JSON.stringify(body.tags || []),
        isBuiltIn: body.isBuiltIn ?? true,
        isActive: body.isActive ?? true,
        useCount: 0,
        rating: body.rating ?? 0,
        difficulty: body.difficulty || 'beginner',
        estimatedTime: body.estimatedTime || '< 5 min',
        requiredAgents: body.requiredAgents ?? 1,
        preview: body.preview ? JSON.stringify(body.preview) : undefined,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create workflow template' }, { status: 500 })
  }
}
