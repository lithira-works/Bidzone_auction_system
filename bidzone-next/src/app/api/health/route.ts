import { NextResponse } from 'next/server'
import { getGoogleClientId, validateServerEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Public health check — shows whether required env vars are present (not their values). */
export async function GET() {
  const issues = validateServerEnv()
  const ok = issues.length === 0

  return NextResponse.json(
    {
      ok,
      issues: issues.map((i) => ({ code: i.code, variable: i.variable })),
      googleOAuthConfigured: Boolean(getGoogleClientId()),
      hint: ok
        ? undefined
        : 'Fix env in Vercel or .env.local, then redeploy. See bidzone-next/.env.example',
    },
    { status: ok ? 200 : 503 },
  )
}
