import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/onboarding/complete - Mark onboarding as complete
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = 'default' } = body

    let state = await prisma.onboardingState.findFirst({
      where: { userId },
    })

    if (!state) {
      // Create a completed state if none exists
      state = await prisma.onboardingState.create({
        data: {
          userId,
          currentStep: 5,
          totalSteps: 6,
          isComplete: true,
          skippedSteps: '[]',
          stepData: '{}',
          completedAt: new Date(),
        },
      })
    } else {
      state = await prisma.onboardingState.update({
        where: { id: state.id },
        data: {
          isComplete: true,
          completedAt: new Date(),
          currentStep: 5,
        },
      })
    }

    return NextResponse.json({
      state: {
        ...state,
        skippedSteps: JSON.parse(state.skippedSteps),
        stepData: JSON.parse(state.stepData),
      },
      message: 'Onboarding completed successfully',
    })
  } catch (error) {
    console.error('Failed to complete onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
