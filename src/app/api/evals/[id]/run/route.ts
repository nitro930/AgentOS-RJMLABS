import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // Get suite with cases
    const suite = await db.evalSuite.findUnique({
      where: { id },
      include: { cases: true },
    })

    if (!suite) {
      return NextResponse.json({ error: 'Suite not found' }, { status: 404 })
    }

    // Update suite status to running
    await db.evalSuite.update({
      where: { id },
      data: { status: 'running' },
    })

    // Create a new run
    const run = await db.evalRun.create({
      data: {
        suiteId: id,
        agentId: body.agentId || suite.agentId || null,
        status: 'running',
        totalCases: suite.cases.length,
        config: body.config ? JSON.stringify(body.config) : '{}',
      },
    })

    // Simulate evaluation with mock scoring
    let passedCases = 0
    let failedCases = 0
    const startTime = Date.now()

    for (const evalCase of suite.cases) {
      // Simulate a score between 0 and 1 with some randomness
      const baseScore = suite.type === 'safety' ? 0.85 : suite.type === 'performance' ? 0.75 : 0.80
      const variance = (Math.random() - 0.5) * 0.4
      const caseScore = Math.max(0, Math.min(1, baseScore + variance))
      const passed = caseScore >= suite.passingScore

      if (passed) passedCases++
      else failedCases++

      // Simulate metrics
      const metrics: Record<string, number> = {
        accuracy: Math.max(0, Math.min(1, baseScore + (Math.random() - 0.5) * 0.3)),
        relevance: Math.max(0, Math.min(1, 0.8 + (Math.random() - 0.5) * 0.3)),
        coherence: Math.max(0, Math.min(1, 0.85 + (Math.random() - 0.5) * 0.2)),
        latency: Math.floor(50 + Math.random() * 200),
      }

      await db.evalResult.create({
        data: {
          runId: run.id,
          caseId: evalCase.id,
          status: passed ? 'passed' : 'failed',
          actualOutput: JSON.stringify({ result: `Simulated output for: ${evalCase.name}`, score: caseScore }),
          score: caseScore,
          metrics: JSON.stringify(metrics),
          duration: Math.floor(20 + Math.random() * 180),
        },
      })
    }

    const duration = Date.now() - startTime
    const overallScore = suite.cases.length > 0 ? passedCases / suite.cases.length : 0

    // Update run with results
    await db.evalRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        passedCases,
        failedCases,
        score: overallScore,
        duration,
        completedAt: new Date(),
      },
    })

    // Update suite stats
    const allRuns = await db.evalRun.findMany({
      where: { suiteId: id, status: 'completed' },
      select: { score: true },
    })
    const scores = allRuns.map(r => r.score)
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0
    const worstScore = scores.length > 0 ? Math.min(...scores) : 1

    await db.evalSuite.update({
      where: { id },
      data: {
        status: 'completed',
        lastRunAt: new Date(),
        lastScore: overallScore,
        runCount: { increment: 1 },
        avgScore,
        bestScore,
        worstScore,
      },
    })

    // Fetch complete run with results
    const completeRun = await db.evalRun.findUnique({
      where: { id: run.id },
      include: { results: true },
    })

    return NextResponse.json(completeRun)
  } catch (error) {
    console.error('Failed to run eval suite:', error)
    return NextResponse.json({ error: 'Failed to run eval suite' }, { status: 500 })
  }
}
