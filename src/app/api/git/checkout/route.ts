import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function POST(request: Request) {
  try {
    const projectDir = process.env.GIT_PROJECT_DIR || process.cwd()
    const { ref } = await request.json()

    if (!ref) {
      return NextResponse.json({ error: 'Reference (branch/tag/commit) is required' }, { status: 400 })
    }

    const output = execSync(`git checkout "${ref}"`, {
      cwd: projectDir,
      encoding: 'utf-8',
      timeout: 30000,
    })

    return NextResponse.json({ success: true, output, ref })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Checkout failed' },
      { status: 500 }
    )
  }
}
