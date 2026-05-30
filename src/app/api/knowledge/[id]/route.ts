import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const base = await db.knowledgeBase.findUnique({
      where: { id },
      include: {
        documents: { include: { chunks: { take: 3 } }, orderBy: { createdAt: 'desc' } },
        _count: { select: { chunks: true } },
      },
    })
    if (!base) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ base })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const updateData: Record<string, unknown> = {}
    for (const f of ['name', 'description', 'type', 'embeddingModel', 'chunkStrategy', 'chunkSize', 'chunkOverlap', 'isActive', 'icon'] as const) {
      if (body[f] !== undefined) updateData[f] = body[f]
    }
    const base = await db.knowledgeBase.update({ where: { id }, data: updateData })
    return NextResponse.json({ base })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Delete in order: chunks, documents, queries, base
    await db.knowledgeChunk.deleteMany({ where: { baseId: id } })
    await db.retrievalQuery.deleteMany({ where: { baseId: id } })
    // Delete document chunks first
    const docs = await db.knowledgeDocument.findMany({ where: { baseId: id } })
    for (const doc of docs) {
      await db.knowledgeChunk.deleteMany({ where: { documentId: doc.id } })
    }
    await db.knowledgeDocument.deleteMany({ where: { baseId: id } })
    await db.knowledgeBase.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
