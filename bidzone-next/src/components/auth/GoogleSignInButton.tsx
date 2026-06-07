'use client'

import { useGoogleLogin } from '@react-oauth/google'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { googleOAuthClientId } from '@/lib/googleAuth'

function GoogleColorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="20"
      height="20"
      aria-hidden
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

type UserInfoResponse = {
  email?: string
  name?: string
  email_verified?: boolean
  picture?: string
}

/** Uses Google OAuth hooks — must render inside GoogleOAuthProvider only. */
function GoogleSignInButtonInner() {
  const { loginWithGoogleProfile } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        if (!res.ok) throw new Error('userinfo_failed')
        const info = (await res.json()) as UserInfoResponse
        if (!info.email || info.email_verified === false) throw new Error('unverified')
        const r = await loginWithGoogleProfile({
          email: info.email,
          name: info.name,
          picture: info.picture,
        })
        if (r === 'ok') {
          router.replace('/home')
        } else if (r === 'database_unavailable') {
          setError(t('login.errDatabase'))
        } else {
          setError(t('login.errGoogle'))
        }
      } catch {
        setError(t('login.errGoogle'))
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      setError(t('login.errGoogle'))
      setLoading(false)
    },
  })

  function handleClick() {
    setError(null)
    setLoading(true)
    googleLogin()
  }

  return (
    <div className="lp__google-section-inner">
      <button
        type="button"
        className={`lp__g-btn${loading ? ' lp__g-btn--loading' : ''}`}
        onClick={handleClick}
        disabled={loading}
        aria-label="Continue with Google"
      >
        <span className="lp__g-btn__icon-slot">
          {loading ? (
            <span className="lp__g-btn__spinner" aria-hidden />
          ) : (
            <GoogleColorIcon />
          )}
        </span>
        <span className="lp__g-btn__label">
          {loading ? 'Signing in…' : 'Continue with Google'}
        </span>
      </button>
      {error && (
        <p role="alert" className="lp__google-error">
          {error}
        </p>
      )}
    </div>
  )
}

export function GoogleSignInButton() {
  const { t } = useI18n()
  const clientId = googleOAuthClientId()

  if (!clientId) {
    return (
      <p className="lp__google-hint" role="status">
        {t('login.googleNotConfigured')}
      </p>
    )
  }

  return <GoogleSignInButtonInner />
}
