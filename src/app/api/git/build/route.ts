import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function POST(request: Request) {
  try {
    const projectDir = process.env.GIT_PROJECT_DIR || process.cwd()
    const { install = true, migrate = true } = await request.json().catch(() => ({}))

    const steps: { step: string; output: string; success: boolean }[] = []

    // Step 1: Install dependencies
    if (install) {
      try {
        const installOutput = execSync('npm install', {
          cwd: projectDir,
          encoding: 'utf-8',
          timeout: 120000,
        })
        steps.push({ step: 'npm install', output: installOutput.slice(-500), success: true })
      } catch (err: any) {
        steps.push({ step: 'npm install', output: err.message?.slice(-500) || 'Install failed', success: false })
      }
    }

    // Step 2: Run Prisma migrations
    if (migrate) {
      try {
        const migrateOutput = execSync('npx prisma db push', {
          cwd: projectDir,
          encoding: 'utf-8',
          timeout: 60000,
        })
        steps.push({ step: 'prisma db push', output: migrateOutput.slice(-500), success: true })
      } catch (err: any) {
        steps.push({ step: 'prisma db push', output: err.message?.slice(-500) || 'Migration failed', success: false })
      }
    }

    // Step 3: Build the application
    try {
      const buildOutput = execSync('npm run build', {
        cwd: projectDir,
        encoding: 'utf-8',
        timeout: 300000,
      })
      steps.push({ step: 'npm run build', output: buildOutput.slice(-500), success: true })
    } catch (err: any) {
      steps.push({ step: 'npm run build', output: err.message?.slice(-500) || 'Build failed', success: false })
      return NextResponse.json({
        success: false,
        steps,
        error: 'Build failed',
      }, { status: 500 })
    }

    // Step 4: Seed the database
    try {
      const seedOutput = execSync('curl -s -X POST http://localhost:3000/api/seed', {
        cwd: projectDir,
        encoding: 'utf-8',
        timeout: 30000,
      })
      steps.push({ step: 'database seed', output: seedOutput.slice(-200), success: true })
    } catch {
      steps.push({ step: 'database seed', output: 'Skipped (will auto-seed on next startup)', success: true })
    }

    const allSuccess = steps.every(s => s.success)

    return NextResponse.json({
      success: allSuccess,
      steps,
      message: allSuccess ? 'Build completed successfully' : 'Build completed with errors',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Build process failed', steps: [] },
      { status: 500 }
    )
  }
}
