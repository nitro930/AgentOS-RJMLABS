import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [nodes, edges] = await Promise.all([
      db.serviceGraph.findMany({ orderBy: { requestCount: 'desc' } }),
      db.serviceEdge.findMany(),
    ])
    return NextResponse.json({ nodes, edges })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type, status, metadata } = await request.json()
    if (!name || !type) return NextResponse.json({ error: 'Name and type required' }, { status: 400 })
    const node = await db.serviceGraph.create({
      data: { name, type, status: status || 'healthy', metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {}) },
    })
    return NextResponse.json({ node }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
