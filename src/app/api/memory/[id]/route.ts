import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const memory = await db.memoryEntry.findUnique({
      where: { id },
      include: { agent: true },
    })
    if (!memory) return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
    return NextResponse.json(memory)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch memory' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const memory = await db.memoryEntry.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.content && { content: body.content }),
        ...(body.type && { type: body.type }),
        ...(body.tags && { tags: JSON.stringify(body.tags) }),
        ...(body.source !== undefined && { source: body.source }),
        ...(body.path && { path: body.path }),
        ...(body.pinned !== undefined && { pinned: body.pinned }),
      },
    })
    return NextResponse.json(memory)
  } catch {
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.memoryEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 })
  }
}
