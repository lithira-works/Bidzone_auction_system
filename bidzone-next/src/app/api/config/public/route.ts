import { NextResponse } from 'next/server'
import { getGoogleClientId } from '@/lib/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Public runtime config for the browser (non-secret). */
export async function GET() {
  return NextResponse.json({
    googleClientId: getGoogleClientId(),
  })
}
