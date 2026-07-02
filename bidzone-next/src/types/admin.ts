export type AdminTab = 'overview' | 'users' | 'kyc' | 'auctions' | 'admins' | 'banners' | 'coins'

export type AdminStats = {
  totalUsers: number
  bidders: number
  sellers: number
  admins: number
  pendingKyc: number
  rejectedKyc: number
  pendingListings: number
  totalAuctions: number
  activeAuctions: number
  totalBids: number
  bidsToday: number
  newUsersWeek: number
}

export type AdminUserRow = {
  id: string
  role: string
  fullName: string
  email: string
  phone: string
  phoneVerified: boolean
  kycStatus: string
  listingAllowed: boolean
  fraudCheckPassed: boolean
  city: string
  isSuperAdmin?: boolean
  delegatedAdmin?: boolean
  adminType?: 'super' | 'delegated' | null
  createdAt: string
  updatedAt: string
  businessName?: string
  businessType?: string
  businessDescription?: string
  kycSubmittedAt?: string | null
  kycNotes?: string
}

export type AdminAuctionRow = {
  id: string
  title: string
  image: string
  category: string
  currentBid: number
  bids: number
  sellerId?: string
  sellerName?: string
  featured: boolean
  urgent: boolean
  listingSource?: string
  moderationStatus?: 'pending' | 'approved' | 'rejected'
  auctionEndsAt?: string
  auctionCreatedAt?: string
}

export type AdminBannerRow = {
  id: string
  title: string
  subtitle: string
  imageUrl: string
  linkUrl: string
  placement: 'left_primary' | 'left_secondary' | 'right_primary' | 'right_secondary'
  status: 'draft' | 'active' | 'paused'
  displayStatus: 'draft' | 'paused' | 'scheduled' | 'live' | 'expired'
  startsAt: string
  endsAt: string
  priority: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type BannerFormState = {
  title: string
  subtitle: string
  imageUrl: string
  linkUrl: string
  placement: AdminBannerRow['placement']
  status: AdminBannerRow['status']
  startsAt: string
  endsAt: string
  priority: number
}

export type PublicBanner = {
  id: string
  title: string
  subtitle: string
  imageUrl: string
  linkUrl?: string
  placement: AdminBannerRow['placement']
  startsAt: string
  endsAt: string
  priority: number
}

export type AdminStatsResponse = {
  stats: AdminStats
  recentUsers: Pick<AdminUserRow, 'id' | 'fullName' | 'email' | 'role' | 'kycStatus' | 'createdAt'>[]
  recentAuctions: Pick<AdminAuctionRow, 'id' | 'title' | 'currentBid' | 'bids' | 'sellerName' | 'featured' | 'auctionCreatedAt'>[]
}
