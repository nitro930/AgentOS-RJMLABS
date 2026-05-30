import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const agentId = body.agentId

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    // Verify the suite exists
    const suite = await db.benchmarkSuite.findUnique({ where: { id } })
    if (!suite) {
      return NextResponse.json({ error: 'Benchmark suite not found' }, { status: 404 })
    }

    // Parse test cases
    let testCases: Array<{ input: string; expectedOutput: string; evaluationCriteria: string; weight: number }> = []
    try {
      testCases = JSON.parse(suite.testCases || '[]')
    } catch {
      testCases = []
    }

    // If no test cases defined, generate some based on category
    if (testCases.length === 0) {
      testCases = [
        { input: 'Standard input test', expectedOutput: 'Valid response', evaluationCriteria: 'Correctness', weight: 1.0 },
        { input: 'Edge case input', expectedOutput: 'Error handled', evaluationCriteria: 'Error handling', weight: 0.8 },
        { input: 'Performance test input', expectedOutput: 'Within time limit', evaluationCriteria: 'Latency', weight: 0.6 },
        { input: 'Accuracy validation', expectedOutput: 'Accurate result', evaluationCriteria: 'Accuracy', weight: 1.0 },
        { input: 'Reliability test', expectedOutput: 'Consistent output', evaluationCriteria: 'Consistency', weight: 0.9 },
      ]
    }

    const totalTests = testCases.length * suite.iterations

    // Simulate benchmark run
    const run = await db.benchmarkRun.create({
      data: {
        suiteId: id,
        agentId,
        status: 'running',
        totalTests,
        passedTests: 0,
        failedTests: 0,
        score: 0,
        avgDurationMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        tokenUsage: 0,
        costUsd: 0,
        results: '[]',
        startedAt: new Date(),
      },
    })

    // Simulate running the benchmark
    const results: Array<{ testCase: string; passed: boolean; score: number; duration: number; output: string }> = []
    let totalPassed = 0
    let totalFailed = 0
    let totalScore = 0
    let totalDuration = 0
    const durations: number[] = []

    for (const tc of testCases) {
      for (let iter = 0; iter < suite.iterations; iter++) {
        // Simulate test execution with random results
        const duration = Math.floor(Math.random() * suite.maxDurationMs * 0.8) + Math.floor(suite.maxDurationMs * 0.1)
        const score = Math.random() * 0.4 + 0.6 // 0.6-1.0 range
        const passed = score >= suite.passingScore

        if (passed) totalPassed++
        else totalFailed++

        totalScore += score * (tc.weight || 1)
        totalDuration += duration
        durations.push(duration)

        results.push({
          testCase: tc.input,
          passed,
          score: Math.round(score * 100) / 100,
          duration,
          output: passed ? tc.expectedOutput : 'Failed to meet criteria',
        })
      }
    }

    // Sort durations for percentile calculation
    durations.sort((a, b) => a - b)
    const p50Index = Math.floor(durations.length * 0.5)
    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)

    const avgDuration = totalTests > 0 ? Math.round(totalDuration / totalTests) : 0
    const finalScore = totalTests > 0 ? Math.round((totalScore / totalTests) * 100) / 100 : 0
    const tokenUsage = Math.floor(Math.random() * 5000) + 500
    const costUsd = Math.round((tokenUsage * 0.00003) * 1000) / 1000

    // Update the run with results
    const completedRun = await db.benchmarkRun.update({
      where: { id: run.id },
      data: {
        status: finalScore >= suite.passingScore ? 'completed' : 'failed',
        totalTests,
        passedTests: totalPassed,
        failedTests: totalFailed,
        score: finalScore,
        avgDurationMs: avgDuration,
        p50LatencyMs: durations[p50Index] || 0,
        p95LatencyMs: durations[p95Index] || 0,
        p99LatencyMs: durations[p99Index] || 0,
        tokenUsage,
        costUsd,
        results: JSON.stringify(results),
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ run: completedRun })
  } catch (error) {
    console.error('Failed to run benchmark:', error)
    return NextResponse.json({ error: 'Failed to run benchmark' }, { status: 500 })
  }
}
