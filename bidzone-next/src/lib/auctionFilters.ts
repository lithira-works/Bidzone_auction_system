import type { AuctionItem, CategoryInfo } from '../data/auctions'

export function categorySlugMatchesItem(item: AuctionItem, slug: string | null, defs: CategoryInfo[]) {
  if (!slug) return true
  const c = defs.find((x) => x.slug === slug)
  if (!c) return true
  return item.category === c.name
}

export function queryMatchesItem(item: AuctionItem, q: string) {
  const t = q.trim().toLowerCase()
  if (!t) return true
  const desc = item.listingDescription?.toLowerCase() ?? ''
  return (
    item.title.toLowerCase().includes(t) ||
    item.category.toLowerCase().includes(t) ||
    desc.includes(t)
  )
}
