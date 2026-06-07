'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import type { ReactNode } from 'react'
import { useGoogleClientId } from '@/context/GoogleConfigContext'

/**
 * Wraps the app with GoogleOAuthProvider when a client ID is configured.
 * Client ID comes from the server layout (runtime env on Vercel).
 */
export function GoogleAuthShell({ children }: { children: ReactNode }) {
  const clientId = useGoogleClientId()

  if (!clientId) {
    return <>{children}</>
  }

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
}
