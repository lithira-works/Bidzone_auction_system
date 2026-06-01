/** Demo-only: passwords stored in localStorage; use a real backend for production. */

export type UserRole = 'bidder' | 'seller'

export type KycStatus = 'not_required' | 'pending' | 'verified' | 'rejected'

export type UserProfile = {
  id: string
  role: UserRole
  fullName: string
  email: string
  /** Demo storage only — never ship plaintext passwords to production */
  password: string
  address: string
  city: string
  phone: string
  phoneVerified: boolean
  nicImageDataUrl: string | null
  kycStatus: KycStatus
  listingAllowed: boolean
  fraudCheckPassed: boolean
  createdAt: string
}

export const DEMO_OTP_CODE = '123456'

export function createBidderProfile(input: {
  fullName: string
  email: string
  password: string
  address: string
  city: string
}): UserProfile {
  return {
    id: `u-${crypto.randomUUID()}`,
    role: 'bidder',
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    address: input.address.trim(),
    city: input.city.trim(),
    phone: '',
    phoneVerified: false,
    nicImageDataUrl: null,
    kycStatus: 'not_required',
    listingAllowed: false,
    fraudCheckPassed: false,
    createdAt: new Date().toISOString(),
  }
}

export function createSellerProfileAfterKyc(input: {
  fullName: string
  email: string
  password: string
  address: string
  city: string
  phone: string
  nicImageDataUrl: string | null
}): UserProfile {
  return {
    id: `u-${crypto.randomUUID()}`,
    role: 'seller',
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    address: input.address.trim(),
    city: input.city.trim(),
    phone: input.phone.trim(),
    phoneVerified: true,
    nicImageDataUrl: input.nicImageDataUrl,
    kycStatus: 'verified',
    listingAllowed: true,
    fraudCheckPassed: true,
    createdAt: new Date().toISOString(),
  }
}

export function upgradeBidderToVerifiedSeller(
  user: UserProfile,
  input: { phone: string; nicImageDataUrl: string | null },
): UserProfile {
  return {
    ...user,
    role: 'seller',
    phone: input.phone.trim(),
    phoneVerified: true,
    nicImageDataUrl: input.nicImageDataUrl,
    kycStatus: 'verified',
    listingAllowed: true,
    fraudCheckPassed: true,
  }
}
