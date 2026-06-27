'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearLegacyAuthFlag,
  getSessionUserId,
  hasLegacyAuthOnly,
  setSessionUserId,
} from '@/lib/userRegistry'
import { parseGoogleIdToken } from '@/lib/googleAuth'
import { api, setToken, clearToken, getToken } from '@/lib/apiClient'
import type { UserProfile } from '@/types/userProfile'

export type BidderRegisterInput = {
  fullName: string
  email: string
  password: string
  address: string
  city: string
}

export type SellerRegisterInput = {
  fullName: string
  email: string
  password: string
  address: string
  city: string
  phone: string
  nicImageDataUrl: string | null
}

type AuthContextValue = {
  user: UserProfile | null
  isAuthenticated: boolean
  isAdmin: boolean
  canAccessSellerTools: boolean
  login: (email: string, password: string) => Promise<'ok' | 'invalid'>
  loginWithGoogle: (idTokenCredential: string) => Promise<'ok' | 'invalid' | 'database_unavailable'>
  loginWithGoogleProfile: (profile: {
    email: string
    name?: string
    picture?: string
  }) => Promise<'ok' | 'invalid' | 'database_unavailable'>
  logout: () => void
  registerBidder: (input: BidderRegisterInput) => Promise<'ok' | 'email_taken'>
  registerNewVerifiedSeller: (input: SellerRegisterInput) => Promise<'ok' | 'email_taken'>
  upgradeCurrentUserToSeller: (input: {
    phone: string
    nicImageDataUrl: string | null
  }) => Promise<'ok' | 'not_bidder'>
  /** Merge a partial profile update into the cached user (call after PATCH /auth/me) */
  updateUser: (patch: Partial<UserProfile>) => void
}

type AuthResponse = { token: string; user: UserProfile }

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (hasLegacyAuthOnly() && !getSessionUserId()) {
      clearLegacyAuthFlag()
      return
    }
    const token = getToken()
    if (!token) return

    api
      .get<{ user: UserProfile; token?: string }>('/auth/me')
      .then(({ user: u, token: refreshed }) => {
        if (refreshed) setToken(refreshed)
        setUser(u)
        setSessionUserId(u.id)
      })
      .catch(() => {
        clearToken()
        setSessionUserId(null)
        clearLegacyAuthFlag()
      })
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<'ok' | 'invalid'> => {
    try {
      const { token, user: u } = await api.post<AuthResponse>('/auth/login', { email, password })
      setToken(token)
      setSessionUserId(u.id)
      setUser(u)
      clearLegacyAuthFlag()
      return 'ok'
    } catch {
      return 'invalid'
    }
  }, [])

  const loginWithGoogleProfile = useCallback(
    async (profile: {
      email: string
      name?: string
      picture?: string
    }): Promise<'ok' | 'invalid' | 'database_unavailable'> => {
      try {
        const { token, user: u } = await api.post<AuthResponse>('/auth/google', {
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        })
        setToken(token)
        setSessionUserId(u.id)
        setUser(u)
        clearLegacyAuthFlag()
        return 'ok'
      } catch (err) {
        if (err instanceof Error && err.message === 'database_unavailable') {
          return 'database_unavailable'
        }
        return 'invalid'
      }
    },
    [],
  )

  const loginWithGoogle = useCallback(async (idTokenCredential: string): Promise<'ok' | 'invalid' | 'database_unavailable'> => {
    const payload = parseGoogleIdToken(idTokenCredential)
    if (!payload?.email) return 'invalid'
    return loginWithGoogleProfile({
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    })
  }, [loginWithGoogleProfile])

  const logout = useCallback(() => {
    clearToken()
    setSessionUserId(null)
    clearLegacyAuthFlag()
    setUser(null)
  }, [])

  const registerBidder = useCallback(
    async (input: BidderRegisterInput): Promise<'ok' | 'email_taken'> => {
      try {
        const { token, user: u } = await api.post<AuthResponse>('/auth/register', {
          type: 'bidder',
          ...input,
        })
        setToken(token)
        setSessionUserId(u.id)
        setUser(u)
        clearLegacyAuthFlag()
        return 'ok'
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : ''
        return msg === 'email_taken' ? 'email_taken' : 'email_taken'
      }
    },
    [],
  )

  const registerNewVerifiedSeller = useCallback(
    async (input: SellerRegisterInput): Promise<'ok' | 'email_taken'> => {
      try {
        const { token, user: u } = await api.post<AuthResponse>('/auth/register', {
          type: 'seller',
          fullName: input.fullName,
          email: input.email,
          password: input.password,
          address: input.address,
          city: input.city,
          phone: input.phone,
        })
        setToken(token)
        setSessionUserId(u.id)
        setUser(u)
        clearLegacyAuthFlag()
        return 'ok'
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : ''
        return msg === 'email_taken' ? 'email_taken' : 'email_taken'
      }
    },
    [],
  )

  const upgradeCurrentUserToSeller = useCallback(
    async (input: {
      phone: string
      nicImageDataUrl: string | null
    }): Promise<'ok' | 'not_bidder'> => {
      if (!user || user.role !== 'bidder') return 'not_bidder'
      try {
        const { user: u } = await api.patch<{ user: UserProfile }>('/auth/me', {
          role: 'seller',
          phone: input.phone,
        })
        setUser(u)
        return 'ok'
      } catch {
        return 'not_bidder'
      }
    },
    [user],
  )

  const updateUser = useCallback((patch: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...patch } : prev)
  }, [])

  const isAuthenticated = user !== null
  const isAdmin = user?.role === 'admin'
  const canAccessSellerTools =
    user?.role === 'seller' && user.listingAllowed === true && user.phoneVerified === true

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isAdmin,
      canAccessSellerTools,
      login,
      loginWithGoogle,
      loginWithGoogleProfile,
      logout,
      registerBidder,
      registerNewVerifiedSeller,
      upgradeCurrentUserToSeller,
      updateUser,
    }),
    [
      user,
      isAuthenticated,
      isAdmin,
      canAccessSellerTools,
      login,
      loginWithGoogle,
      loginWithGoogleProfile,
      logout,
      registerBidder,
      registerNewVerifiedSeller,
      upgradeCurrentUserToSeller,
      updateUser,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
