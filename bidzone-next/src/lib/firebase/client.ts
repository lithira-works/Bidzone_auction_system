'use client'

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { firebasePublicConfig, isFirebaseConfigured } from '@/lib/firebase/config'

export { isFirebaseConfigured }

let app: FirebaseApp | undefined
let auth: Auth | undefined

/** Lazily initialize Firebase Auth (client-only). */
export function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth is only available in the browser')
  }
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* variables to .env.local')
  }
  if (!app) {
    app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebasePublicConfig)
  }
  if (!auth) {
    auth = getAuth(app)
  }
  return auth
}
