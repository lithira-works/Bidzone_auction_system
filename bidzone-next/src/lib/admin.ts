/**
 * Server-side admin authorization.
 * Super admins come from ADMIN_EMAILS env; delegated admins are promoted in the admin console.
 */
import type { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import { getAdminEmails } from '@/lib/env'
import { UserModel, type IUser } from '@/models/User'

/** Comma-separated super-admin allowlist from environment. */
export function getAdminAllowlist(): Set<string> {
  return new Set(
    getAdminEmails()
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isAdminEmail(email: string): boolean {
  return getAdminAllowlist().has(email.toLowerCase().trim())
}

/** Main / super admins — protected from demotion via admin console. */
export function isProtectedAdmin(user: Pick<IUser, 'email' | 'isSuperAdmin'>): boolean {
  return user.isSuperAdmin || isAdminEmail(user.email)
}

function fallbackRoleForUser(user: IUser): 'bidder' | 'seller' {
  return user.listingAllowed && user.phoneVerified && user.kycStatus === 'verified'
    ? 'seller'
    : 'bidder'
}

/** Sync super-admin flag from env; preserve delegated admins. */
export async function syncAdminRole(user: IUser): Promise<IUser> {
  const envAdmin = isAdminEmail(user.email)
  let changed = false

  if (envAdmin) {
    if (user.role !== 'admin' || !user.isSuperAdmin) {
      user.role = 'admin'
      user.isSuperAdmin = true
      user.delegatedAdmin = false
      changed = true
    }
  } else if (user.isSuperAdmin) {
    user.isSuperAdmin = false
    if (!user.delegatedAdmin) {
      user.role = fallbackRoleForUser(user)
    }
    changed = true
  }

  if (changed) await user.save()
  return user
}

export function isActiveAdmin(user: Pick<IUser, 'role' | 'isSuperAdmin' | 'delegatedAdmin' | 'email'>): boolean {
  return (
    user.role === 'admin' &&
    (user.isSuperAdmin || user.delegatedAdmin || isAdminEmail(user.email))
  )
}

export type AdminContext = {
  userId: string
  email: string
  role: 'admin'
  isSuperAdmin: boolean
}

/**
 * Validates JWT + live DB admin role (super or delegated).
 */
export async function requireAdmin(req: NextRequest): Promise<AdminContext | null> {
  const claims = requireAuth(req)
  if (!claims) return null

  await connectToDatabase()

  const user = await UserModel.findById(claims.userId).select('email role isSuperAdmin delegatedAdmin')
  if (!user || !isActiveAdmin(user)) return null

  return {
    userId: user._id.toString(),
    email: user.email,
    role: 'admin',
    isSuperAdmin: user.isSuperAdmin || isAdminEmail(user.email),
  }
}

export function toAdminUserSummary(user: IUser) {
  return {
    id: user._id.toString(),
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    kycStatus: user.kycStatus,
    listingAllowed: user.listingAllowed,
    fraudCheckPassed: user.fraudCheckPassed,
    city: user.city,
    isSuperAdmin: user.isSuperAdmin || isAdminEmail(user.email),
    delegatedAdmin: user.delegatedAdmin,
    adminType:
      user.isSuperAdmin || isAdminEmail(user.email)
        ? ('super' as const)
        : user.delegatedAdmin
          ? ('delegated' as const)
          : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    businessName: user.businessName ?? '',
    businessType: user.businessType ?? '',
    businessDescription: user.businessDescription ?? '',
    kycSubmittedAt: user.kycSubmittedAt ? user.kycSubmittedAt.toISOString() : null,
    kycNotes: user.kycNotes ?? '',
    accountStatus: user.accountStatus ?? 'active',
    suspendedUntil: user.suspendedUntil ? user.suspendedUntil.toISOString() : null,
    statusReason: user.statusReason ?? '',
    statusUpdatedAt: user.statusUpdatedAt ? user.statusUpdatedAt.toISOString() : null,
    statusUpdatedBy: user.statusUpdatedBy ?? '',
    biddingBlocked: user.biddingBlocked ?? false,
  }
}

export async function demoteAdminUser(user: IUser): Promise<IUser> {
  user.role = fallbackRoleForUser(user)
  user.delegatedAdmin = false
  user.isSuperAdmin = false
  await user.save()
  return user
}

export async function promoteToDelegatedAdmin(user: IUser): Promise<IUser> {
  user.role = 'admin'
  user.delegatedAdmin = true
  await user.save()
  return user
}
