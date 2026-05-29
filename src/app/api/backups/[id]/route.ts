import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const backup = await db.backup.findUnique({
      where: { id },
    })
    if (!backup) return NextResponse.json({ error: 'Backup not found' }, { status: 404 })
    return NextResponse.json(backup)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch backup' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.backup.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 })
  }
}
