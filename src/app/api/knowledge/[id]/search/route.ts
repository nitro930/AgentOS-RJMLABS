import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { query, topK, threshold, strategy, agentId } = await request.json()
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    const startTime = Date.now()
    const k = topK || 5
    const thresh = threshold || 0.3

    // Simplified keyword search (production would use vector similarity)
    const chunks = await db.knowledgeChunk.findMany({ where: { baseId: id } })
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)

    const scored = chunks
      .map(chunk => {
        const contentLower = chunk.content.toLowerCase()
        let score = 0
        for (const word of queryWords) {
          const regex = new RegExp(word, 'gi')
          const matches = contentLower.match(regex)
          if (matches) score += matches.length
        }
        // Normalize score
        score = Math.min(score / (queryWords.length * 3), 1)
        return { ...chunk, score }
      })
      .filter(c => c.score >= thresh)
      .sort((a, b) => b.score - a.score)
      .slice(0, k)

    // Update access counts
    for (const chunk of scored) {
      await db.knowledgeChunk.update({
        where: { id: chunk.id },
        data: { accessCount: { increment: 1 }, relevance: chunk.score },
      })
    }

    const duration = Date.now() - startTime

    // Log the query
    await db.retrievalQuery.create({
      data: {
        baseId: id,
        query,
        results: JSON.stringify(
          scored.map(s => ({ chunkId: s.id, score: s.score, content: s.content.substring(0, 200) }))
        ),
        topK: k,
        threshold: thresh,
        strategy: strategy || 'keyword',
        agentId,
        duration,
      },
    })

    return NextResponse.json({ results: scored, duration, total: scored.length })
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
