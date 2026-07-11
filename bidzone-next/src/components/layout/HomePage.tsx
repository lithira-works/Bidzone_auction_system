'use client'
import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { HelpCircle, TrendingUp, Clock, SearchX, Star, ArrowRight } from 'lucide-react'
import {
  Desktop,
  TShirt,
  Diamond,
  PaintBrush,
  House,
  Barbell,
  Crown,
  Car,
} from '@phosphor-icons/react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { HomeAdRail, type BannerSlotData } from '@/components/ui/HomeAdRail'
import { HomeServiceAndGuide } from '@/components/ui/HomeServiceAndGuide'
import { AuctionCard } from '@/components/ui/AuctionCard'
import { categories, type AuctionItem } from '@/data/auctions'
import { useListings } from '@/context/ListingsContext'
import { useI18n } from '@/context/I18nContext'
import { useHelp } from '@/context/HelpContext'
import { categorySlugMatchesItem, queryMatchesItem } from '@/lib/auctionFilters'
import { secondsUntil } from '@/lib/auctionTime'
import type { PublicBanner } from '@/types/admin'

const iconMap = {
  laptop: Desktop,
  shirt: TShirt,
  gem: Diamond,
  palette: PaintBrush,
  home: House,
  trophy: Barbell,
  sparkles: Crown,
  car: Car,
} as const

type SortKey = 'ending' | 'bid-high' | 'bid-low' | 'bids'

function sortList(list: AuctionItem[], sort: SortKey) {
  const copy = [...list]
  if (sort === 'bid-high') copy.sort((a, b) => b.currentBid - a.currentBid)
  else if (sort === 'bid-low') copy.sort((a, b) => a.currentBid - b.currentBid)
  else if (sort === 'bids') copy.sort((a, b) => b.bids - a.bids)
  else {
    const rank = (t: AuctionItem) => {
      if (t.auctionEndsAt) {
        const sec = secondsUntil(t.auctionEndsAt)
        return sec > 0 ? sec : Number.MAX_SAFE_INTEGER
      }
      if (t.urgent) return 0
      const m = t.timeLeft.match(/(\d+)h/)
      return m ? Number(m[1]) * 3600 : Number.MAX_SAFE_INTEGER - 1
    }
    copy.sort((a, b) => rank(a) - rank(b))
  }
  return copy
}

/** Compact number formatting for hero stats: 12K, 4.2M… */
function compact(n: number) {
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export function HomePage() {
  const [sort, setSort] = useState<SortKey>('ending')
  const [banners, setBanners] = useState<PublicBanner[]>([])
  const searchParams = useSearchParams()
  const router = useRouter()
  const { mergedCatalog } = useListings()
  const { t } = useI18n()
  const { openHelp } = useHelp()

  useEffect(() => {
    fetch('/api/banners')
      .then((r) => (r.ok ? r.json() : { banners: [] }))
      .then((data: { banners: PublicBanner[] }) => setBanners(data.banners ?? []))
      .catch(() => setBanners([]))
  }, [])

  const bannerSlots = useMemo(() => {
    const map: Partial<Record<PublicBanner['placement'], BannerSlotData>> = {}
    for (const b of banners) {
      if (!map[b.placement]) {
        map[b.placement] = {
          imageUrl: b.imageUrl,
          href: b.linkUrl,
          title: b.title,
          subtitle: b.subtitle,
        }
      }
    }
    return map
  }, [banners])

  const q = searchParams.get('q') ?? ''
  const categorySlug = searchParams.get('category')

  const filtered = useMemo(
    () => mergedCatalog.filter((item) => queryMatchesItem(item, q) && categorySlugMatchesItem(item, categorySlug, categories)),
    [mergedCatalog, q, categorySlug],
  )

  const sorted = useMemo(() => sortList(filtered, sort), [filtered, sort])

  const featuredFiltered = useMemo(
    () =>
      mergedCatalog.filter(
        (item) =>
          item.featured &&
          queryMatchesItem(item, q) &&
          categorySlugMatchesItem(item, categorySlug, categories),
      ),
    [mergedCatalog, q, categorySlug],
  )

  /* ── Ending soon: live auctions closing first ── */
  const endingSoon = useMemo(() => {
    return mergedCatalog
      .filter((item) => item.auctionEndsAt && secondsUntil(item.auctionEndsAt) > 0)
      .sort((a, b) => secondsUntil(a.auctionEndsAt!) - secondsUntil(b.auctionEndsAt!))
      .slice(0, 8)
  }, [mergedCatalog])

  /* ── Live hero stats derived from the real catalog ── */
  const heroStats = useMemo(() => {
    const liveCount = mergedCatalog.filter(
      (item) => !item.auctionEndsAt || secondsUntil(item.auctionEndsAt) > 0,
    ).length
    const totalValue = mergedCatalog.reduce((sum, item) => sum + (item.currentBid || 0), 0)
    const totalBids = mergedCatalog.reduce((sum, item) => sum + (item.bids || 0), 0)
    return { liveCount, totalValue, totalBids }
  }, [mergedCatalog])

  const hasFilters = Boolean(q.trim() || categorySlug)

  const categoryDisplay = useMemo(() => {
    if (!categorySlug) return null
    const key = `cat.${categorySlug}`
    const s = t(key)
    return s === key ? categorySlug : s
  }, [categorySlug, t])

  function clearFilters() {
    router.push('/home')
  }

  function scrollToAll() {
    document.getElementById('all')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="home-page">
      <button type="button" className="home-page__help" aria-label={t('common.help')} onClick={openHelp}>
        <HelpCircle size={22} />
      </button>

      <SiteHeader />

      <div className="home-page__body-grid">
        <aside className="home-page__rail home-page__rail--left">
          <HomeAdRail
            side="left"
            primary={bannerSlots.left_primary}
            secondary={bannerSlots.left_secondary}
          />
        </aside>

        <div className="home-page__center">
          <section className="home-page__hero">
            <div className="home-page__hero-eyebrow">
              <span className="home-page__hero-eyebrow-dot" aria-hidden />
              Live Auctions Now
            </div>
            <h2 className="home-page__hero-title">
              Bid Smart,{' '}
              <span className="home-page__hero-title-gold">Win Big</span>
            </h2>
            <p className="home-page__hero-sub">{t('hero.sub')}</p>
            <div className="home-page__hero-actions">
              <button type="button" className="home-page__hero-cta" onClick={scrollToAll}>
                {t('hero.cta')}
                <ArrowRight size={16} aria-hidden />
              </button>
              <Link href="/home#categories" className="home-page__hero-cta-ghost">
                Browse categories
              </Link>
            </div>
            <div className="home-page__hero-stats">
              <div className="home-page__hero-stat">
                <div className="home-page__hero-stat-value">{compact(heroStats.liveCount)}</div>
                <div className="home-page__hero-stat-label">Live Auctions</div>
              </div>
              <span className="home-page__hero-stat-sep" aria-hidden />
              <div className="home-page__hero-stat">
                <div className="home-page__hero-stat-value">${compact(heroStats.totalValue)}</div>
                <div className="home-page__hero-stat-label">Total Value Bid</div>
              </div>
              <span className="home-page__hero-stat-sep" aria-hidden />
              <div className="home-page__hero-stat">
                <div className="home-page__hero-stat-value">{compact(heroStats.totalBids)}</div>
                <div className="home-page__hero-stat-label">Bids Placed</div>
              </div>
            </div>
          </section>

          <main className="home-page__main">
            {hasFilters && (
              <div className="home-page__filters-bar">
                <p className="home-page__filters-summary">
                  {q.trim() && <span>&ldquo;{q}&rdquo;</span>}
                  {categorySlug && categoryDisplay && (
                    <span>{q.trim() ? ' · ' : ''}{categoryDisplay}</span>
                  )}
                  <span className="home-page__filters-count">{sorted.length} result{sorted.length === 1 ? '' : 's'}</span>
                </p>
                <button type="button" className="home-page__clear-filters" onClick={clearFilters}>
                  {t('home.clearFilters')}
                </button>
              </div>
            )}

            {/* ── Ending soon (hidden while filtering) ── */}
            {!hasFilters && endingSoon.length > 0 && (
              <section className="home-page__section">
                <div className="home-page__sec-head">
                  <div>
                    <p className="home-page__sec-eyebrow home-page__sec-eyebrow--red">
                      <Clock size={12} aria-hidden /> Closing soon
                    </p>
                    <h2 className="home-page__sec-title">Ending Soon</h2>
                  </div>
                  <button type="button" className="home-page__sec-link" onClick={scrollToAll}>
                    View all <ArrowRight size={14} aria-hidden />
                  </button>
                </div>
                <div className="home-page__ending-row" role="list">
                  {endingSoon.map((item) => (
                    <div key={item.id} className="home-page__ending-cell" role="listitem">
                      <AuctionCard item={item} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="home-page__section">
              <div className="home-page__sec-head">
                <div>
                  <p className="home-page__sec-eyebrow">
                    <Star size={12} aria-hidden /> Hand-picked
                  </p>
                  <h2 className="home-page__sec-title">{t('home.featured')}</h2>
                </div>
                <span className="home-page__sec-count">{featuredFiltered.length}</span>
              </div>
              {featuredFiltered.length === 0 ? (
                <div className="home-page__empty-state">
                  <SearchX size={30} aria-hidden />
                  <p>{t('home.noResults')}</p>
                  {hasFilters && (
                    <button type="button" className="home-page__empty-btn" onClick={clearFilters}>
                      {t('home.clearFilters')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="home-page__grid home-page__grid--featured">
                  {featuredFiltered.map((item) => <AuctionCard key={item.id} item={item} />)}
                </div>
              )}
            </section>

            <section className="home-page__section" id="categories">
              <div className="home-page__sec-head">
                <div>
                  <p className="home-page__sec-eyebrow">
                    <TrendingUp size={12} aria-hidden /> Explore
                  </p>
                  <h2 className="home-page__sec-title">{t('home.browseCategory')}</h2>
                </div>
              </div>
              <div className="home-page__cat-marquee" aria-label={t('home.browseCategory')}>
                <div className="home-page__cat-track" aria-hidden="false">
                  {[...categories, ...categories].map((c, idx) => {
                    const Icon = iconMap[c.icon]
                    const next = new URLSearchParams(searchParams.toString())
                    next.set('category', c.slug)
                    const href = `/home?${next.toString()}`
                    return (
                      <Link
                        key={`${c.slug}-${idx}`}
                        href={href}
                        className="home-page__category-card"
                        tabIndex={idx >= categories.length ? -1 : 0}
                        aria-hidden={idx >= categories.length}
                      >
                        <div className="home-page__category-icon">
                          <Icon size={26} weight="duotone" aria-hidden />
                        </div>
                        <span className="home-page__category-name">{t(`cat.${c.slug}` as 'cat.electronics')}</span>
                        <span className="home-page__category-count">{t('category.items', { count: c.count })}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </section>

            <section className="home-page__section" id="all">
              <div className="home-page__sec-head">
                <div>
                  <p className="home-page__sec-eyebrow">
                    <TrendingUp size={12} aria-hidden /> Marketplace
                  </p>
                  <h2 className="home-page__sec-title">
                    {t('home.allAuctions', { count: sorted.length })}
                  </h2>
                </div>
                <label className="home-page__sort">
                  <span>{t('home.sortBy')}</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                    <option value="ending">{t('home.sort.ending')}</option>
                    <option value="bid-high">{t('home.sort.bidHigh')}</option>
                    <option value="bid-low">{t('home.sort.bidLow')}</option>
                    <option value="bids">{t('home.sort.bids')}</option>
                  </select>
                </label>
              </div>
              {sorted.length === 0 ? (
                <div className="home-page__empty-state">
                  <SearchX size={30} aria-hidden />
                  <p>{t('home.noResults')}</p>
                  {hasFilters && (
                    <button type="button" className="home-page__empty-btn" onClick={clearFilters}>
                      {t('home.clearFilters')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="home-page__grid">
                  {sorted.map((item) => <AuctionCard key={item.id} item={item} />)}
                </div>
              )}
            </section>

            <HomeServiceAndGuide />
          </main>
        </div>

        <aside className="home-page__rail home-page__rail--right">
          <HomeAdRail
            side="right"
            primary={bannerSlots.right_primary}
            secondary={bannerSlots.right_secondary}
          />
        </aside>
      </div>

      <SiteFooter />
    </div>
  )
}
