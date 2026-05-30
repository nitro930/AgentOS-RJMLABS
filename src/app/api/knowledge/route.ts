import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const bases = await db.knowledgeBase.findMany({
      include: { _count: { select: { documents: true, chunks: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ bases })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch knowledge bases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, type, embeddingModel, chunkStrategy, chunkSize, chunkOverlap, icon } = body
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const base = await db.knowledgeBase.create({
      data: {
        name,
        description: description || null,
        type: type || 'general',
        embeddingModel: embeddingModel || 'text-embedding-3-small',
        chunkStrategy: chunkStrategy || 'semantic',
        chunkSize: chunkSize || 512,
        chunkOverlap: chunkOverlap || 50,
        icon: icon || '📚',
      },
    })
    return NextResponse.json({ base }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create knowledge base' }, { status: 500 })
  }
}
