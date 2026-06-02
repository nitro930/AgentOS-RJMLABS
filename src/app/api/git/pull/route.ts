import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function POST(request: Request) {
  try {
    const projectDir = process.env.GIT_PROJECT_DIR || process.cwd()
    const body = await request.json().catch(() => ({}))
    const branch = body.branch || undefined

    // Stash any local changes first
    let stashed = false
    try {
      const statusOutput = execSync('git status --porcelain', {
        cwd: projectDir,
        encoding: 'utf-8',
      })
      if (statusOutput.trim()) {
        execSync('git stash push -m "AgentOS auto-stash before pull"', {
          cwd: projectDir,
          encoding: 'utf-8',
          timeout: 30000,
        })
        stashed = true
      }
    } catch {}

    // Pull changes
    const pullCmd = branch ? `git pull origin ${branch}` : 'git pull'
    const pullOutput = execSync(pullCmd, {
      cwd: projectDir,
      encoding: 'utf-8',
      timeout: 60000,
    })

    // Restore stashed changes
    let stashResult = ''
    if (stashed) {
      try {
        stashResult = execSync('git stash pop', {
          cwd: projectDir,
          encoding: 'utf-8',
          timeout: 30000,
        })
      } catch (stashError: any) {
        return NextResponse.json({
          success: true,
          output: pullOutput,
          warning: 'Pull succeeded but stash pop had conflicts. Manual resolution may be needed.',
          stashConflict: true,
        })
      }
    }

    // Get new commit info after pull
    const newHash = execSync('git rev-parse --short HEAD', {
      cwd: projectDir,
      encoding: 'utf-8',
    }).trim()

    return NextResponse.json({
      success: true,
      output: pullOutput,
      stashOutput: stashResult || undefined,
      wasStashed: stashed,
      newCommitHash: newHash,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Pull failed' },
      { status: 500 }
    )
  }
}
