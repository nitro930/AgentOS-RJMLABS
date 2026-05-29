import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const skills = await prisma.agentSkill.findMany({
      orderBy: { useCount: 'desc' },
    })
    const parsed = skills.map(s => ({
      ...s,
      parameters: JSON.parse(s.parameters || '[]'),
      returns: JSON.parse(s.returns || '{}'),
      config: JSON.parse(s.config || '{}'),
    }))
    return NextResponse.json(parsed)
  } catch { return NextResponse.json([]) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const skill = await prisma.agentSkill.create({
      data: {
        name: body.name,
        description: body.description || '',
        type: body.type || 'function',
        icon: body.icon || '⚡',
        config: JSON.stringify(body.config || {}),
        parameters: JSON.stringify(body.parameters || []),
        returns: JSON.stringify(body.returns || {}),
        isActive: body.isActive ?? true,
        isBuiltIn: body.isBuiltIn ?? false,
        agentId: body.agentId || null,
      },
    })
    return NextResponse.json({
      ...skill,
      parameters: JSON.parse(skill.parameters || '[]'),
      returns: JSON.parse(skill.returns || '{}'),
    })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
