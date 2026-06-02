import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function POST(request: Request) {
  try {
    const projectDir = process.env.GIT_PROJECT_DIR || process.cwd()
    const { tags: pushTags, branch } = await request.json().catch(() => ({}))

    let output = ''

    if (pushTags) {
      output = execSync('git push origin --tags', {
        cwd: projectDir,
        encoding: 'utf-8',
        timeout: 60000,
      })
    } else {
      const pushCmd = branch ? `git push origin ${branch}` : 'git push origin'
      output = execSync(pushCmd, {
        cwd: projectDir,
        encoding: 'utf-8',
        timeout: 60000,
      })
    }

    return NextResponse.json({ success: true, output })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Push failed' },
      { status: 500 }
    )
  }
}
