import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const documents = await db.knowledgeDocument.findMany({ where: { baseId: id }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ documents })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { title, source, sourceUrl, content, mimeType, metadata, uploadedBy } = await request.json()
    if (!title || !content) return NextResponse.json({ error: 'Title and content required' }, { status: 400 })

    const base = await db.knowledgeBase.findUnique({ where: { id } })
    if (!base) return NextResponse.json({ error: 'Base not found' }, { status: 404 })

    // Create document
    const doc = await db.knowledgeDocument.create({
      data: {
        baseId: id,
        title,
        source: source || 'upload',
        sourceUrl,
        content,
        mimeType: mimeType || 'text/plain',
        metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {}),
        uploadedBy,
      },
    })

    // Chunk the document (simplified fixed chunking)
    const chunkSize = base.chunkSize || 512
    const overlap = base.chunkOverlap || 50
    const words = content.split(/\s+/)
    const chunks: string[] = []
    let i = 0
    while (i < words.length) {
      chunks.push(words.slice(i, i + chunkSize).join(' '))
      i += chunkSize - overlap
    }

    // Create chunks
    for (let idx = 0; idx < chunks.length; idx++) {
      await db.knowledgeChunk.create({
        data: {
          documentId: doc.id,
          baseId: id,
          content: chunks[idx],
          chunkIndex: idx,
          tokenCount: chunks[idx].split(/\s+/).length,
          metadata: JSON.stringify({ chunkIndex: idx, totalChunks: chunks.length }),
        },
      })
    }

    // Update counts
    await db.knowledgeDocument.update({
      where: { id: doc.id },
      data: { chunkCount: chunks.length, tokenCount: words.length, status: 'ready' },
    })
    await db.knowledgeBase.update({
      where: { id },
      data: {
        documentCount: { increment: 1 },
        chunkCount: { increment: chunks.length },
        totalTokens: { increment: words.length },
      },
    })

    return NextResponse.json({ document: doc, chunkCount: chunks.length }, { status: 201 })
  } catch (error) {
    console.error('Failed to add document:', error)
    return NextResponse.json({ error: 'Failed to add document' }, { status: 500 })
  }
}
