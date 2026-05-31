import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prompt = await db.promptTemplate.findUnique({
      where: { id },
    })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    return NextResponse.json(prompt)
  } catch (error) {
    console.error('Failed to fetch prompt:', error)
    return NextResponse.json({ error: 'Failed to fetch prompt' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.promptTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.content !== undefined) updateData.content = body.content
    if (body.variables !== undefined) updateData.variables = JSON.stringify(body.variables)
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags)
    if (body.agentId !== undefined) updateData.agentId = body.agentId
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.useCount !== undefined) updateData.useCount = body.useCount
    if (body.version !== undefined) updateData.version = body.version

    const prompt = await db.promptTemplate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(prompt)
  } catch (error) {
    console.error('Failed to update prompt:', error)
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.promptTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    if (existing.isBuiltIn) {
      return NextResponse.json({ error: 'Cannot delete built-in prompts' }, { status: 403 })
    }

    await db.promptTemplate.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete prompt:', error)
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 })
  }
}
