import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const alerts = await prisma.healthAlert.findMany({
      where: { isResolved: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return NextResponse.json(alerts)
  } catch (error) {
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const alert = await prisma.healthAlert.create({
      data: {
        metric: body.metric,
        condition: body.condition || 'gt',
        threshold: body.threshold,
        current: body.current,
        severity: body.severity || 'warning',
        message: body.message,
      },
    })
    return NextResponse.json(alert)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}
