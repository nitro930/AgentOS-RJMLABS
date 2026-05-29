import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const file = await prisma.fileEntry.findUnique({ where: { id } })
    if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ...file, tags: JSON.parse(file.tags || '[]') })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    if (body.tags) body.tags = JSON.stringify(body.tags)
    const file = await prisma.fileEntry.update({ where: { id }, data: body })
    return NextResponse.json(file)
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.fileEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
