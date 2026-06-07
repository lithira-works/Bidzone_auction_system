'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import type { ReactNode } from 'react'
import { googleOAuthClientId } from '@/lib/googleAuth'

/**
 * Wraps the app with GoogleOAuthProvider when a client ID is configured.
 * When missing, children render without Google OAuth (email/password login still works).
 */
export function GoogleAuthShell({ children }: { children: ReactNode }) {
  const clientId = googleOAuthClientId()

  if (!clientId) {
    return <>{children}</>
  }

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
}
