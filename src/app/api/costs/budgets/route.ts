import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const budgets = await db.budgetAlert.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(budgets)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch budget alerts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const budget = await db.budgetAlert.create({
      data: {
        name: body.name,
        limitAmount: body.limitAmount,
        period: body.period || 'monthly',
      },
    })
    return NextResponse.json(budget, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create budget alert' }, { status: 500 })
  }
}
