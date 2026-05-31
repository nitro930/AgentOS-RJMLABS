# Task 2-a: Onboarding Wizard Component

## Task
Build the Onboarding Wizard component for the RJMLABS.CO.UK AgentOS project

## Work Completed

### Component: `/src/components/agent-os/onboarding-wizard.tsx`
- 'use client' component
- 6-step wizard: Welcome → API Keys → Models → Agents → Preferences → Complete
- Progress bar with step indicators and connecting lines
- Step 1 (Welcome): System name, organization name, timezone selector
- Step 2 (API Keys): LLM provider keys (OpenAI, Anthropic, Google, Z-AI) with masked input, eye toggle
- Step 3 (Models): 8 model options with multi-select, capability badges, routing priority selector
- Step 4 (Agents): Agent name, type selector (4 types), description, live preview
- Step 5 (Preferences): Theme selector (4 themes), notification toggles, behavior toggles
- Step 6 (Complete): Celebration header, confetti animation, configuration summary, "Go to Dashboard" button
- Skip step functionality for optional steps (2-4)
- Back/Next navigation buttons
- RJMLABS.CO.UK branding in header
- State managed locally with useState hooks
- API calls to /api/onboarding endpoints for persistence

### API Routes
- `/api/onboarding/route.ts` - GET onboarding state (seeds step definitions if none exist), POST update state
- `/api/onboarding/complete/route.ts` - POST mark onboarding complete

### Supporting Files
- `/src/lib/prisma.ts` - Re-exports db as prisma from @/lib/db
- Updated `/src/lib/db.ts` schema version to 'onboarding-v1'

### Prisma Models
- OnboardingState and OnboardingStep already existed in schema (removed duplicate definition)

### Styling
- Dark cyberpunk theme: bg-[#0f1117], border-[#2d2e3d], bg-[#1e1f2b] for cards
- Emerald-400/500 accents for interactive elements
- framer-motion animations with AnimatePresence
- Lucide icons throughout
