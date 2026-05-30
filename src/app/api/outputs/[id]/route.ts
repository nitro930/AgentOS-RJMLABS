import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const output = await db.agentOutput.update({
      where: { id },
      data: {
        ...(body.routedTo && { routedTo: JSON.stringify(body.routedTo) }),
        ...(body.memoryId !== undefined && { memoryId: body.memoryId }),
        ...(body.isArchived !== undefined && { isArchived: body.isArchived }),
        ...(body.title && { title: body.title }),
        ...(body.content && { content: body.content }),
      },
    })
    return NextResponse.json(output)
  } catch {
    return NextResponse.json({ error: 'Failed to update output' }, { status: 500 })
  }
}
