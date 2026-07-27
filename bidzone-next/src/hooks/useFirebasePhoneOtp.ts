'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase/client'
import { normalizePhoneE164 } from '@/lib/phoneFormat'

const RECAPTCHA_CONTAINER_ID = 'firebase-recaptcha-container'

function firebaseErrorMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : ''
  const message =
    err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : ''

  if (code === 'auth/invalid-phone-number') {
    return 'That phone number is not valid for the selected country. Check the number and country code.'
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (code === 'auth/captcha-check-failed' || code === 'auth/missing-app-credential') {
    return 'Security verification failed. Complete the reCAPTCHA box below, then try again.'
  }
  if (code === 'auth/quota-exceeded') {
    return 'SMS quota exceeded on Firebase. Try again later or contact support.'
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Phone sign-in is not enabled. In Firebase Console → Authentication → Sign-in method, enable Phone.'
  }
  if (message.includes('reCAPTCHA')) {
    return 'reCAPTCHA could not load. Refresh the page and ensure localhost is in Firebase authorized domains.'
  }
  return 'Could not send the verification code. Check the number, complete reCAPTCHA, and try again.'
}

export function useFirebasePhoneOtp() {
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null)
  const [recaptchaReady, setRecaptchaReady] = useState(false)

  const configured = isFirebaseConfigured()

  const clearRecaptcha = useCallback(() => {
    try {
      recaptchaRef.current?.clear()
    } catch {
      /* ignore */
    }
    recaptchaRef.current = null
    setRecaptchaReady(false)
  }, [])

  useEffect(() => {
    return () => {
      clearRecaptcha()
      confirmationRef.current = null
    }
  }, [clearRecaptcha])

  /** Pre-render visible reCAPTCHA when the phone step mounts (more reliable than invisible). */
  const initRecaptcha = useCallback(async (): Promise<boolean> => {
    if (!configured) return false

    const container = document.getElementById(RECAPTCHA_CONTAINER_ID)
    if (!container) return false

    if (recaptchaRef.current) return true

    try {
      const { RecaptchaVerifier } = await import('firebase/auth')
      const auth = getFirebaseAuth()

      container.innerHTML = ''

      const verifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
        size: 'normal',
        callback: () => setRecaptchaReady(true),
        'expired-callback': () => {
          setRecaptchaReady(false)
          setError('Security check expired. Complete reCAPTCHA again.')
        },
      })

      await verifier.render()
      recaptchaRef.current = verifier
      setRecaptchaReady(true)
      return true
    } catch (err) {
      console.error('[Firebase RecaptchaVerifier]', err)
      setError(firebaseErrorMessage(err))
      return false
    }
  }, [configured])

  const sendOtp = useCallback(
    async (phoneE164: string): Promise<string | null> => {
      if (!configured) {
        setError('Phone verification is not configured.')
        return null
      }

      const e164 = phoneE164.trim().startsWith('+') ? phoneE164.trim() : normalizePhoneE164(phoneE164)
      if (!e164 || !/^\+\d{8,15}$/.test(e164)) {
        setError('Enter a valid mobile number for the selected country.')
        return null
      }

      setSending(true)
      setError(null)
      setIdToken(null)
      setVerifiedPhone(null)

      try {
        if (!recaptchaRef.current) {
          const ok = await initRecaptcha()
          if (!ok || !recaptchaRef.current) {
            setError((prev) => prev ?? 'Security verification is not ready. Refresh and try again.')
            return null
          }
        }

        const { signInWithPhoneNumber } = await import('firebase/auth')
        const auth = getFirebaseAuth()
        const confirmation = await signInWithPhoneNumber(auth, e164, recaptchaRef.current)
        confirmationRef.current = confirmation
        return e164
      } catch (err: unknown) {
        console.error('[Firebase signInWithPhoneNumber]', err)
        setError(firebaseErrorMessage(err))
        clearRecaptcha()
        return null
      } finally {
        setSending(false)
      }
    },
    [configured, initRecaptcha, clearRecaptcha],
  )

  const verifyOtp = useCallback(async (codeRaw: string): Promise<boolean> => {
    const code = codeRaw.replace(/\D/g, '').trim()
    if (code.length < 6) {
      setError('Enter the 6-digit code from your SMS.')
      return false
    }

    const confirmation = confirmationRef.current
    if (!confirmation) {
      setError('Request a new code first.')
      return false
    }

    setVerifying(true)
    setError(null)

    try {
      const { signOut } = await import('firebase/auth')
      const auth = getFirebaseAuth()
      const credential = await confirmation.confirm(code)
      const token = await credential.user.getIdToken()
      const phone = credential.user.phoneNumber

      setIdToken(token)
      setVerifiedPhone(phone)

      await signOut(auth)
      confirmationRef.current = null

      return true
    } catch {
      setError('That code is incorrect or expired. Check your SMS and try again.')
      return false
    } finally {
      setVerifying(false)
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setIdToken(null)
    setVerifiedPhone(null)
    confirmationRef.current = null
    clearRecaptcha()
  }, [clearRecaptcha])

  return {
    configured,
    recaptchaContainerId: RECAPTCHA_CONTAINER_ID,
    initRecaptcha,
    recaptchaReady,
    sendOtp,
    verifyOtp,
    sending,
    verifying,
    error,
    idToken,
    verifiedPhone,
    reset,
    clearError: () => setError(null),
  }
}
