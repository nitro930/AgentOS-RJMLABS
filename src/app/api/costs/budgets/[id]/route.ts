import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const budget = await db.budgetAlert.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.limitAmount !== undefined && { limitAmount: body.limitAmount }),
        ...(body.currentSpend !== undefined && { currentSpend: body.currentSpend }),
        ...(body.period && { period: body.period }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.alertedAt && { alertedAt: new Date(body.alertedAt) }),
      },
    })
    return NextResponse.json(budget)
  } catch {
    return NextResponse.json({ error: 'Failed to update budget alert' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.budgetAlert.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete budget alert' }, { status: 500 })
  }
}
