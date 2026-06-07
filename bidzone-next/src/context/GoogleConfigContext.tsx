'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type GoogleConfig = {
  clientId: string
  /** False until server prop, boot script, or /api/config/public has been checked. */
  ready: boolean
}

const GoogleConfigContext = createContext<GoogleConfig>({ clientId: '', ready: false })

function readBootClientId(): string {
  if (typeof window === 'undefined') return ''
  const boot = (
    window as Window & { __BZ_CONFIG__?: { googleClientId?: string } }
  ).__BZ_CONFIG__
  return boot?.googleClientId?.trim() ?? ''
}

export function GoogleConfigProvider({
  clientId: serverClientId,
  children,
}: {
  clientId: string
  children: ReactNode
}) {
  const [clientId, setClientId] = useState(() => serverClientId || readBootClientId())
  const [ready, setReady] = useState(() => Boolean(serverClientId || readBootClientId()))

  useEffect(() => {
    const fromServer = serverClientId.trim()
    if (fromServer) {
      setClientId(fromServer)
      setReady(true)
      return
    }

    const fromBoot = readBootClientId()
    if (fromBoot) {
      setClientId(fromBoot)
      setReady(true)
      return
    }

    let cancelled = false
    fetch('/api/config/public')
      .then((r) => (r.ok ? r.json() : { googleClientId: '' }))
      .then((data: { googleClientId?: string }) => {
        if (cancelled) return
        const id = data.googleClientId?.trim() ?? ''
        if (id) setClientId(id)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [serverClientId])

  const value = useMemo(() => ({ clientId, ready }), [clientId, ready])

  return (
    <GoogleConfigContext.Provider value={value}>{children}</GoogleConfigContext.Provider>
  )
}

export function useGoogleConfig(): GoogleConfig {
  return useContext(GoogleConfigContext)
}

/** Google OAuth client ID from server runtime env (works on Vercel after redeploy). */
export function useGoogleClientId(): string {
  return useContext(GoogleConfigContext).clientId
}
