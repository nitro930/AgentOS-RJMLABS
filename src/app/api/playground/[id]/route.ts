import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await prisma.playgroundSession.findUnique({ where: { id } })
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    return NextResponse.json({
      ...session,
      input: JSON.parse(session.input || '{}'),
      output: session.output ? JSON.parse(session.output) : null,
      config: JSON.parse(session.config || '{}'),
      tags: JSON.parse(session.tags || '[]'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const session = await prisma.playgroundSession.update({
      where: { id },
      data: body,
    })
    return NextResponse.json({
      ...session,
      input: JSON.parse(session.input || '{}'),
      output: session.output ? JSON.parse(session.output) : null,
      config: JSON.parse(session.config || '{}'),
      tags: JSON.parse(session.tags || '[]'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.playgroundSession.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
