import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const template = await prisma.workflowTemplate.findUnique({ where: { id } })

    if (!template) {
      return NextResponse.json({ error: 'Workflow template not found' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch workflow template' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.workflowTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Workflow template not found' }, { status: 404 })
    }

    const template = await prisma.workflowTemplate.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.version !== undefined && { version: body.version }),
        ...(body.author !== undefined && { author: body.author }),
        ...(body.steps !== undefined && { steps: JSON.stringify(body.steps) }),
        ...(body.connections !== undefined && { connections: JSON.stringify(body.connections) }),
        ...(body.triggerType !== undefined && { triggerType: body.triggerType }),
        ...(body.triggerConfig !== undefined && { triggerConfig: JSON.stringify(body.triggerConfig) }),
        ...(body.variables !== undefined && { variables: JSON.stringify(body.variables) }),
        ...(body.tags !== undefined && { tags: JSON.stringify(body.tags) }),
        ...(body.isBuiltIn !== undefined && { isBuiltIn: body.isBuiltIn }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.useCount !== undefined && { useCount: body.useCount }),
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.difficulty !== undefined && { difficulty: body.difficulty }),
        ...(body.estimatedTime !== undefined && { estimatedTime: body.estimatedTime }),
        ...(body.requiredAgents !== undefined && { requiredAgents: body.requiredAgents }),
        ...(body.preview !== undefined && { preview: JSON.stringify(body.preview) }),
      },
    })

    return NextResponse.json(template)
  } catch {
    return NextResponse.json({ error: 'Failed to update workflow template' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = await prisma.workflowTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Workflow template not found' }, { status: 404 })
    }

    await prisma.workflowTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete workflow template' }, { status: 500 })
  }
}
