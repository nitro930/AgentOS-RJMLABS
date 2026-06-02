import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const template = await prisma.workflowTemplate.findUnique({ where: { id } })
    if (!template) {
      return NextResponse.json({ error: 'Workflow template not found' }, { status: 404 })
    }

    // Increment the template useCount
    await prisma.workflowTemplate.update({
      where: { id },
      data: { useCount: { increment: 1 } },
    })

    // Create a Workflow from the template
    const workflow = await prisma.workflow.create({
      data: {
        name: body.name || `${template.name} (from template)`,
        description: body.description || template.description,
        status: 'draft',
        steps: template.steps,
        triggerType: body.triggerType || template.triggerType,
        triggerConfig: body.triggerConfig
          ? JSON.stringify(body.triggerConfig)
          : template.triggerConfig,
      },
    })

    return NextResponse.json(workflow, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to instantiate workflow from template' }, { status: 500 })
  }
}
