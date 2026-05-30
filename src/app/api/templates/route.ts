import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (category) where.category = category

    const templates = await db.template.findMany({
      where,
      orderBy: { useCount: 'desc' },
    })
    return NextResponse.json(templates)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const template = await db.template.create({
      data: {
        name: body.name,
        description: body.description,
        ...(body.category !== undefined && { category: body.category }),
        ...(body.icon !== undefined && { icon: body.icon }),
        config: JSON.stringify(body.config),
        ...(body.tags !== undefined && { tags: JSON.stringify(body.tags) }),
        ...(body.isBuiltIn !== undefined && { isBuiltIn: body.isBuiltIn }),
      },
    })
    return NextResponse.json(template, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
