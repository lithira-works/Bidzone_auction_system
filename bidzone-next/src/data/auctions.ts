export type ModerationStatus = 'pending' | 'approved' | 'rejected'
export type ListingSource = 'admin' | 'seller'

export type AuctionItem = {
  id: string
  title: string
  image: string
  images?: string[]
  category: string
  currentBid: number
  buyNow?: number
  reservePrice?: number
  bids: number
  timeLeft: string
  urgent?: boolean
  featured?: boolean
  sellerName?: string
  listingDescription?: string
  condition?: string
  auctionEndsAt?: string
  auctionCreatedAt?: string
  moderationStatus?: ModerationStatus
  listingSource?: ListingSource
}

export type CategoryInfo = {
  slug: string
  name: string
  count: number
  icon: 'laptop' | 'shirt' | 'gem' | 'palette' | 'home' | 'trophy' | 'sparkles' | 'car'
}

export const categories: CategoryInfo[] = [
  { slug: 'electronics', name: 'Electronics', count: 234, icon: 'laptop' },
  { slug: 'fashion', name: 'Fashion', count: 189, icon: 'shirt' },
  { slug: 'collectibles', name: 'Collectibles', count: 156, icon: 'gem' },
  { slug: 'art', name: 'Art', count: 98, icon: 'palette' },
  { slug: 'home', name: 'Home & Garden', count: 312, icon: 'home' },
  { slug: 'sports', name: 'Sports', count: 145, icon: 'trophy' },
  { slug: 'jewelry', name: 'Jewelry', count: 87, icon: 'sparkles' },
  { slug: 'vehicles', name: 'Vehicles', count: 42, icon: 'car' },
]

/** Map display category name to slug for seller forms */
export function categoryNameToSlug(name: string): string {
  const found = categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
  return found?.slug ?? name.toLowerCase().replace(/\s+/g, '-')
}
