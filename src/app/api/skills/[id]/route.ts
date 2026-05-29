import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const skill = await prisma.agentSkill.findUnique({ where: { id } })
    if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      ...skill,
      parameters: JSON.parse(skill.parameters || '[]'),
      returns: JSON.parse(skill.returns || '{}'),
    })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    if (body.parameters) body.parameters = JSON.stringify(body.parameters)
    if (body.returns) body.returns = JSON.stringify(body.returns)
    if (body.config) body.config = JSON.stringify(body.config)
    const skill = await prisma.agentSkill.update({ where: { id }, data: body })
    return NextResponse.json(skill)
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.agentSkill.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
