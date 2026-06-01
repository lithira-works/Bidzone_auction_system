/**
 * Server-side helper — converts a MongoDB IUser document into the
 * UserProfile shape that the client expects.
 */
import type { IUser } from '@/models/User'
import type { UserProfile } from '@/types/userProfile'

export function toUserProfile(user: IUser): UserProfile {
  return {
    id: (user._id as import('mongoose').Types.ObjectId).toString(),
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    password: '',
    address: user.address,
    city: user.city,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    nicImageDataUrl: null,
    kycStatus: user.kycStatus,
    listingAllowed: user.listingAllowed,
    fraudCheckPassed: user.fraudCheckPassed,
    createdAt: user.createdAt.toISOString(),
    avatarUrl: user.avatarUrl ?? null,
  }
}
