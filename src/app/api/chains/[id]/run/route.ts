import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const chain = await prisma.agentChain.findUnique({ where: { id } })
    if (!chain) {
      return NextResponse.json({ error: 'Chain not found' }, { status: 404 })
    }

    const steps = JSON.parse(chain.steps || '[]')
    const totalSteps = steps.length

    // Simulate sequential step execution
    const stepResults: Array<{
      stepIndex: number
      agentId: string
      input: string
      output: string
      duration: number
      status: string
    }> = []

    let overallStatus = 'completed'
    let totalTokens = 0
    let totalDuration = 0

    for (let i = 0; i < totalSteps; i++) {
      const step = steps[i]
      const stepDuration = Math.floor(Math.random() * 2000) + 500
      const stepTokens = Math.floor(Math.random() * 500) + 100
      const succeeded = Math.random() > 0.15 // 85% success rate simulation

      totalDuration += stepDuration
      totalTokens += stepTokens

      stepResults.push({
        stepIndex: i,
        agentId: step.agentId || 'unknown',
        input: step.inputMapping ? JSON.stringify(step.inputMapping) : '{}',
        output: succeeded
          ? JSON.stringify({ result: `Step ${i + 1} output`, tokens: stepTokens })
          : '{}',
        duration: stepDuration,
        status: succeeded ? 'completed' : 'failed',
      })

      if (!succeeded) {
        if (chain.errorStrategy === 'stop') {
          overallStatus = 'failed'
          break
        } else if (chain.errorStrategy === 'skip') {
          continue
        } else if (chain.errorStrategy === 'retry') {
          // Simulate retry
          const retrySucceeded = Math.random() > 0.3
          if (retrySucceeded) {
            stepResults[i].status = 'completed'
            stepResults[i].output = JSON.stringify({ result: `Step ${i + 1} output (retry)`, tokens: stepTokens })
          } else {
            overallStatus = 'failed'
            break
          }
        }
      }
    }

    const completedSteps = stepResults.filter(s => s.status === 'completed').length
    const successCount = chain.successCount + (overallStatus === 'completed' ? 1 : 0)
    const newRunCount = chain.runCount + 1

    // Create the run record
    const run = await prisma.chainRun.create({
      data: {
        chainId: id,
        status: overallStatus,
        input: body.input ? JSON.stringify(body.input) : '{}',
        output: JSON.stringify({ completedSteps, totalSteps }),
        error: overallStatus === 'failed' ? 'One or more steps failed' : null,
        stepResults: JSON.stringify(stepResults),
        currentStep: stepResults.length,
        totalSteps,
        tokensUsed: totalTokens,
        duration: totalDuration,
        completedAt: new Date(),
      },
    })

    // Update chain stats
    const avgDuration = chain.avgDuration > 0
      ? Math.round((chain.avgDuration * (newRunCount - 1) + totalDuration) / newRunCount)
      : totalDuration

    await prisma.agentChain.update({
      where: { id },
      data: {
        status: overallStatus === 'completed' ? 'active' : 'error',
        lastRunAt: new Date(),
        runCount: newRunCount,
        successCount,
        avgDuration,
      },
    })

    return NextResponse.json({ run }, { status: 201 })
  } catch (error) {
    console.error('Failed to execute chain run:', error)
    return NextResponse.json({ error: 'Failed to execute chain run' }, { status: 500 })
  }
}
