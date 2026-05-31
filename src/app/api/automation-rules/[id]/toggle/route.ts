import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const rule = await db.automationRule.findUnique({ where: { id } })
    if (!rule) {
      return NextResponse.json({ error: 'Automation rule not found' }, { status: 404 })
    }

    const updated = await db.automationRule.update({
      where: { id },
      data: { isActive: !rule.isActive },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to toggle automation rule:', error)
    return NextResponse.json({ error: 'Failed to toggle automation rule' }, { status: 500 })
  }
}
