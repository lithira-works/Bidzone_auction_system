export type AuctionItem = {
  id: string
  title: string
  image: string
  category: string
  currentBid: number
  buyNow?: number
  reservePrice?: number
  bids: number
  timeLeft: string
  urgent?: boolean
  featured?: boolean
  /** Set when a seller creates a listing */
  sellerName?: string
  listingDescription?: string
  condition?: string
  /** Exact auction end instant (ISO 8601), set by seller at listing time — Phase 2 */
  auctionEndsAt?: string
  /** When the listing row was created (ISO 8601) — demo "database" log */
  auctionCreatedAt?: string
}

export const featuredAuctions: AuctionItem[] = [
  {
    id: '1',
    title: 'Vintage Rolex Submariner Watch',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&h=450&fit=crop',
    category: 'Jewelry',
    currentBid: 12500,
    buyNow: 18000,
    bids: 23,
    timeLeft: '1h 59m',
    urgent: true,
    featured: true,
  },
  {
    id: '2',
    title: 'MacBook Pro 16" M3 Max',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=450&fit=crop',
    category: 'Electronics',
    currentBid: 2800,
    buyNow: 3500,
    bids: 18,
    timeLeft: '4h 59m',
    featured: true,
  },
  {
    id: '3',
    title: 'Original Banksy Print - Girl with Balloon',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=450&fit=crop',
    category: 'Art',
    currentBid: 8900,
    bids: 31,
    timeLeft: '7h 59m',
    featured: true,
  },
]

export const allAuctions: AuctionItem[] = [
  ...featuredAuctions,
  {
    id: '4',
    title: 'Nike Air Jordan 1 Retro High OG',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=450&fit=crop',
    category: 'Fashion',
    currentBid: 450,
    buyNow: 650,
    bids: 12,
    timeLeft: '11h 59m',
    featured: false,
  },
  {
    id: '5',
    title: 'Herman Miller Aeron Chair',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=450&fit=crop',
    category: 'Home & Garden',
    currentBid: 620,
    buyNow: 850,
    bids: 7,
    timeLeft: '14h 59m',
    featured: false,
  },
  {
    id: '6',
    title: 'Signed Michael Jordan Basketball',
    image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600&h=450&fit=crop',
    category: 'Collectibles',
    currentBid: 1850,
    bids: 21,
    timeLeft: '19h 59m',
    featured: false,
  },
  {
    id: '7',
    title: 'Gibson Les Paul Standard 1959 Reissue',
    image: 'https://images.unsplash.com/photo-1564186763535-e36a60e12d20?w=600&h=450&fit=crop',
    category: 'Electronics',
    currentBid: 4200,
    bids: 9,
    timeLeft: '23h 59m',
    featured: false,
  },
  {
    id: '8',
    title: 'Diamond Tennis Bracelet 18K',
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&h=450&fit=crop',
    category: 'Jewelry',
    currentBid: 3200,
    buyNow: 4500,
    bids: 15,
    timeLeft: '2d 3h',
    featured: true,
  },
]

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
