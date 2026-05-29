import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const workspaces = await db.workspace.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(workspaces)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const workspace = await db.workspace.create({
      data: {
        name: body.name,
        type: body.type || 'workspace',
        description: body.description,
        config: JSON.stringify(body.config || {}),
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json(workspace, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }
}
