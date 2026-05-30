import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const trace = await db.trace.findUnique({
      where: { id },
      include: { spans: { orderBy: { startedAt: 'asc' } } },
    })
    if (!trace) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ trace })
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const trace = await db.trace.update({ where: { id }, data: body })
    return NextResponse.json({ trace })
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.traceSpan.deleteMany({ where: { traceId: id } })
    await db.trace.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
