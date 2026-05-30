import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || '/home'
    
    const files = await prisma.fileEntry.findMany({
      where: path ? { path: { startsWith: path } } : undefined,
      orderBy: [{ type: 'desc' }, { name: 'asc' }],
      take: 100,
    })
    
    const parsed = files.map(f => ({
      ...f,
      tags: JSON.parse(f.tags || '[]'),
    }))
    
    return NextResponse.json(parsed)
  } catch (error) {
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const file = await prisma.fileEntry.create({
      data: {
        name: body.name,
        path: body.path,
        type: body.type || 'file',
        size: body.size || 0,
        mimeType: body.mimeType || null,
        permissions: body.permissions || '644',
        owner: body.owner || 'root',
        isShared: body.isShared ?? false,
        agentId: body.agentId || null,
        tags: JSON.stringify(body.tags || []),
      },
    })
    return NextResponse.json(file)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create file entry' }, { status: 500 })
  }
}
