'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { HelpCircle, Laptop, Shirt, Gem, Palette, Home, Trophy, Sparkles, Car, TrendingUp } from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { HomeAdRail } from '@/components/ui/HomeAdRail'
import { HomeServiceAndGuide } from '@/components/ui/HomeServiceAndGuide'
import { AuctionCard } from '@/components/ui/AuctionCard'
import { featuredAuctions, categories, type AuctionItem } from '@/data/auctions'
import { useListings } from '@/context/ListingsContext'
import { useI18n } from '@/context/I18nContext'
import { useHelp } from '@/context/HelpContext'
import { categorySlugMatchesItem, queryMatchesItem } from '@/lib/auctionFilters'

const iconMap = {
  laptop: Laptop, shirt: Shirt, gem: Gem, palette: Palette,
  home: Home, trophy: Trophy, sparkles: Sparkles, car: Car,
} as const

type SortKey = 'ending' | 'bid-high' | 'bid-low' | 'bids'

function sortList(list: AuctionItem[], sort: SortKey) {
  const copy = [...list]
  if (sort === 'bid-high') copy.sort((a, b) => b.currentBid - a.currentBid)
  else if (sort === 'bid-low') copy.sort((a, b) => a.currentBid - b.currentBid)
  else if (sort === 'bids') copy.sort((a, b) => b.bids - a.bids)
  else {
    const rank = (t: AuctionItem) => {
      if (t.urgent) return 0
      const m = t.timeLeft.match(/(\d+)h/)
      return m ? Number(m[1]) : 99
    }
    copy.sort((a, b) => rank(a) - rank(b))
  }
  return copy
}

export function HomePage() {
  const [sort, setSort] = useState<SortKey>('ending')
  const searchParams = useSearchParams()
  const router = useRouter()
  const { mergedCatalog } = useListings()
  const { t } = useI18n()
  const { openHelp } = useHelp()

  const q = searchParams.get('q') ?? ''
  const categorySlug = searchParams.get('category')

  const filtered = useMemo(
    () => mergedCatalog.filter((item) => queryMatchesItem(item, q) && categorySlugMatchesItem(item, categorySlug, categories)),
    [mergedCatalog, q, categorySlug],
  )

  const sorted = useMemo(() => sortList(filtered, sort), [filtered, sort])

  const featuredFiltered = useMemo(() => {
    const ids = new Set(featuredAuctions.map((x) => x.id))
    return mergedCatalog.filter(
      (item) => ids.has(item.id) && queryMatchesItem(item, q) && categorySlugMatchesItem(item, categorySlug, categories),
    )
  }, [mergedCatalog, q, categorySlug])

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

  return (
    <div className="home-page">
      <button type="button" className="home-page__help" aria-label={t('common.help')} onClick={openHelp}>
        <HelpCircle size={22} />
      </button>

      <SiteHeader />

      <div className="home-page__body-grid">
        <aside className="home-page__rail home-page__rail--left">
          <HomeAdRail side="left" />
        </aside>

        <div className="home-page__center">
          <section className="home-page__hero">
            <h2 className="home-page__hero-title">{t('hero.title')}</h2>
            <p className="home-page__hero-sub">{t('hero.sub')}</p>
            <button type="button" className="home-page__hero-cta">{t('hero.cta')}</button>
          </section>

          <main className="home-page__main">
            {hasFilters && (
              <div className="home-page__filters-bar">
                <p className="home-page__filters-summary">
                  {q.trim() && <span>&ldquo;{q}&rdquo;</span>}
                  {categorySlug && categoryDisplay && (
                    <span>{q.trim() ? ' · ' : ''}{categoryDisplay}</span>
                  )}
                </p>
                <button type="button" className="home-page__clear-filters" onClick={clearFilters}>
                  {t('home.clearFilters')}
                </button>
              </div>
            )}

            <section className="home-page__section">
              <h2 className="home-page__section-title">
                <span className="home-page__star" aria-hidden>★</span>{' '}
                {t('home.featured')}
              </h2>
              {featuredFiltered.length === 0 ? (
                <p className="home-page__empty">{t('home.noResults')}</p>
              ) : (
                <div className="home-page__grid home-page__grid--featured">
                  {featuredFiltered.map((item) => <AuctionCard key={item.id} item={item} />)}
                </div>
              )}
            </section>

            <section className="home-page__section" id="categories">
              <h2 className="home-page__section-title home-page__section-title--plain">{t('home.browseCategory')}</h2>
              <div className="home-page__categories">
                {categories.map((c) => {
                  const Icon = iconMap[c.icon]
                  const next = new URLSearchParams(searchParams.toString())
                  next.set('category', c.slug)
                  const href = `/home?${next.toString()}`
                  return (
                    <Link key={c.slug} href={href} className="home-page__category-card">
                      <Icon size={28} strokeWidth={1.5} className="home-page__category-icon" aria-hidden />
                      <span className="home-page__category-name">{t(`cat.${c.slug}` as 'cat.electronics')}</span>
                      <span className="home-page__category-count">{t('category.items', { count: c.count })}</span>
                    </Link>
                  )
                })}
              </div>
            </section>

            <section className="home-page__section" id="all">
              <div className="home-page__section-head">
                <h2 className="home-page__section-title home-page__section-title--plain home-page__section-title--inline">
                  <TrendingUp size={26} className="home-page__trend-icon" aria-hidden />
                  {t('home.allAuctions', { count: sorted.length })}
                </h2>
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
                <p className="home-page__empty">{t('home.noResults')}</p>
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
          <HomeAdRail side="right" />
        </aside>
      </div>

      <SiteFooter />
    </div>
  )
}
