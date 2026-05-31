import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/onboarding - Get onboarding state for user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || 'default'

    let state = await prisma.onboardingState.findFirst({
      where: { userId },
    })

    // If no state exists, create initial state with default steps
    if (!state) {
      state = await prisma.onboardingState.create({
        data: {
          userId,
          currentStep: 0,
          totalSteps: 6,
          isComplete: false,
          skippedSteps: '[]',
          stepData: '{}',
        },
      })

      // Seed default onboarding steps if they don't exist
      const existingSteps = await prisma.onboardingStep.count()
      if (existingSteps === 0) {
        await prisma.onboardingStep.createMany({
          data: [
            {
              stepIndex: 0,
              title: 'Welcome',
              description: 'Set up your system name, organization, and timezone',
              icon: '🚀',
              category: 'setup',
              fields: JSON.stringify(['systemName', 'organizationName', 'timezone']),
              isRequired: true,
            },
            {
              stepIndex: 1,
              title: 'API Keys',
              description: 'Add your LLM provider API keys to get started',
              icon: '🔑',
              category: 'credentials',
              fields: JSON.stringify(['openaiKey', 'anthropicKey', 'googleKey', 'zAiKey']),
              isRequired: false,
            },
            {
              stepIndex: 2,
              title: 'Models',
              description: 'Select preferred models and set routing priorities',
              icon: '🧠',
              category: 'configuration',
              fields: JSON.stringify(['preferredModels', 'routingPriority']),
              isRequired: false,
            },
            {
              stepIndex: 3,
              title: 'Agents',
              description: 'Create your first agent with name, type, and description',
              icon: '🤖',
              category: 'agents',
              fields: JSON.stringify(['agentName', 'agentType', 'agentDescription']),
              isRequired: false,
            },
            {
              stepIndex: 4,
              title: 'Preferences',
              description: 'Customize theme, notifications, and default behaviors',
              icon: '⚙️',
              category: 'preferences',
              fields: JSON.stringify(['theme', 'notifications', 'defaultBehaviors']),
              isRequired: false,
            },
            {
              stepIndex: 5,
              title: 'Complete',
              description: 'Review your setup and start using AgentOS',
              icon: '✅',
              category: 'completion',
              fields: JSON.stringify([]),
              isRequired: true,
            },
          ],
        })
      }
    }

    // Also fetch the step definitions
    const steps = await prisma.onboardingStep.findMany({
      orderBy: { stepIndex: 'asc' },
    })

    return NextResponse.json({
      state: {
        ...state,
        skippedSteps: JSON.parse(state.skippedSteps),
        stepData: JSON.parse(state.stepData),
      },
      steps,
    })
  } catch (error) {
    console.error('Failed to fetch onboarding state:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding state' },
      { status: 500 }
    )
  }
}

// POST /api/onboarding - Update onboarding state
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = 'default', currentStep, stepData, skippedSteps } = body

    let state = await prisma.onboardingState.findFirst({
      where: { userId },
    })

    if (!state) {
      state = await prisma.onboardingState.create({
        data: {
          userId,
          currentStep: currentStep ?? 0,
          totalSteps: 6,
          isComplete: false,
          skippedSteps: JSON.stringify(skippedSteps ?? []),
          stepData: JSON.stringify(stepData ?? {}),
        },
      })
    } else {
      const updateData: Record<string, unknown> = {}

      if (currentStep !== undefined) updateData.currentStep = currentStep
      if (stepData !== undefined) updateData.stepData = JSON.stringify(stepData)
      if (skippedSteps !== undefined) updateData.skippedSteps = JSON.stringify(skippedSteps)

      state = await prisma.onboardingState.update({
        where: { id: state.id },
        data: updateData,
      })
    }

    return NextResponse.json({
      state: {
        ...state,
        skippedSteps: JSON.parse(state.skippedSteps),
        stepData: JSON.parse(state.stepData),
      },
    })
  } catch (error) {
    console.error('Failed to update onboarding state:', error)
    return NextResponse.json(
      { error: 'Failed to update onboarding state' },
      { status: 500 }
    )
  }
}
