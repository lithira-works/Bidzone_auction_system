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
  addUser,
  clearLegacyAuthFlag,
  findUserByEmail,
  findUserById,
  getSessionUserId,
  hasLegacyAuthOnly,
  setSessionUserId,
  updateUser,
} from '@/lib/userRegistry'
import {
  createBidderProfile,
  createSellerProfileAfterKyc,
  upgradeBidderToVerifiedSeller,
  type UserProfile,
} from '@/types/userProfile'

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
  canAccessSellerTools: boolean
  login: (email: string, password: string) => 'ok' | 'invalid'
  logout: () => void
  registerBidder: (input: BidderRegisterInput) => 'ok' | 'email_taken'
  registerNewVerifiedSeller: (input: SellerRegisterInput) => 'ok' | 'email_taken'
  upgradeCurrentUserToSeller: (input: {
    phone: string
    nicImageDataUrl: string | null
  }) => 'ok' | 'not_bidder'
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSessionUser(): UserProfile | null {
  const id = getSessionUserId()
  if (!id) return null
  const u = findUserById(id)
  if (!u) {
    setSessionUserId(null)
    return null
  }
  return u
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)

  const refreshUser = useCallback(() => {
    setUser(readSessionUser())
  }, [])

  useEffect(() => {
    if (hasLegacyAuthOnly() && !getSessionUserId()) {
      clearLegacyAuthFlag()
    }
    refreshUser()
  }, [refreshUser])

  const login = useCallback((email: string, password: string) => {
    const found = findUserByEmail(email)
    if (!found || found.password !== password) return 'invalid'
    setSessionUserId(found.id)
    setUser(found)
    clearLegacyAuthFlag()
    return 'ok'
  }, [])

  const logout = useCallback(() => {
    setSessionUserId(null)
    clearLegacyAuthFlag()
    setUser(null)
  }, [])

  const registerBidder = useCallback((input: BidderRegisterInput) => {
    const profile = createBidderProfile(input)
    const r = addUser(profile)
    if (r === 'email_taken') return 'email_taken'
    setSessionUserId(profile.id)
    setUser(profile)
    clearLegacyAuthFlag()
    return 'ok'
  }, [])

  const registerNewVerifiedSeller = useCallback((input: SellerRegisterInput) => {
    const profile = createSellerProfileAfterKyc(input)
    const r = addUser(profile)
    if (r === 'email_taken') return 'email_taken'
    setSessionUserId(profile.id)
    setUser(profile)
    clearLegacyAuthFlag()
    return 'ok'
  }, [])

  const upgradeCurrentUserToSeller = useCallback(
    (input: { phone: string; nicImageDataUrl: string | null }) => {
      const id = getSessionUserId()
      if (!id) return 'not_bidder'
      const current = findUserById(id)
      if (!current || current.role !== 'bidder') return 'not_bidder'
      const next = upgradeBidderToVerifiedSeller(current, input)
      updateUser(next)
      setUser(next)
      return 'ok'
    },
    [],
  )

  const isAuthenticated = user !== null
  const canAccessSellerTools =
    user?.role === 'seller' && user.listingAllowed === true && user.phoneVerified === true

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      canAccessSellerTools,
      login,
      logout,
      registerBidder,
      registerNewVerifiedSeller,
      upgradeCurrentUserToSeller,
    }),
    [
      user,
      isAuthenticated,
      canAccessSellerTools,
      login,
      logout,
      registerBidder,
      registerNewVerifiedSeller,
      upgradeCurrentUserToSeller,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
