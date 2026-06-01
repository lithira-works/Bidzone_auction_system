'use client'
import { type FormEvent, useEffect, useState } from 'react'
import { Bell, Heart, Search, ShoppingCart, User, Gavel } from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useWishlist } from '@/context/WishlistContext'
import { useNotifications } from '@/context/NotificationsContext'
import { useCart } from '@/context/CartContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { NotificationsPanel } from '@/components/panels/NotificationsPanel'
import { WishlistPanel } from '@/components/panels/WishlistPanel'
import { CartPanel } from '@/components/panels/CartPanel'

const NAV_SLUGS = [
  { key: 'nav.allAuctions', slug: null as string | null },
  { key: 'nav.electronics', slug: 'electronics' },
  { key: 'nav.fashion', slug: 'fashion' },
  { key: 'nav.collectibles', slug: 'collectibles' },
  { key: 'nav.art', slug: 'art' },
  { key: 'nav.moreCategories', slug: 'more' },
] as const

export function SiteHeader() {
  const { isAuthenticated, canAccessSellerTools, user, logout } = useAuth()
  const { t } = useI18n()
  const { count: wishlistCount } = useWishlist()
  const { unreadCount } = useNotifications()
  const { count: cartCount } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isHome = pathname === '/home'

  const [draft, setDraft] = useState('')
  const [sheet, setSheet] = useState<'none' | 'notifications' | 'wishlist' | 'cart'>('none')

  useEffect(() => {
    if (isHome) {
      setDraft(searchParams.get('q') ?? '')
    }
  }, [isHome, searchParams])

  function applySearch(e?: FormEvent) {
    e?.preventDefault()
    if (!isHome) {
      const n = new URLSearchParams()
      if (draft.trim()) n.set('q', draft.trim())
      router.push(`/home?${n.toString()}`)
      return
    }
    const next = new URLSearchParams(searchParams.toString())
    if (draft.trim()) next.set('q', draft.trim())
    else next.delete('q')
    const qs = next.toString()
    router.push(qs ? `/home?${qs}` : '/home')
  }

  const activeSlug = searchParams.get('category')

  function navHref(slug: string | null) {
    if (slug === 'more') return '/home#categories'
    if (!isHome) {
      const n = new URLSearchParams()
      if (slug) n.set('category', slug)
      return n.toString() ? `/home?${n}` : '/home'
    }
    const p = new URLSearchParams(searchParams.toString())
    if (slug) p.set('category', slug)
    else p.delete('category')
    const qs = p.toString()
    return qs ? `/home?${qs}` : '/home'
  }

  function isNavActive(slug: string | null) {
    if (slug === 'more') return false
    if (slug === null) return !activeSlug
    return activeSlug === slug
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__top">
          <Link href="/home" className="site-header__brand">
            <Gavel className="site-header__logo-icon" size={28} aria-hidden />
            <span>BidZone</span>
          </Link>

          <form className="site-header__search-form" onSubmit={applySearch} role="search">
            <label className="site-header__search">
              <Search size={18} className="site-header__search-icon" aria-hidden />
              <input
                type="search"
                name="q"
                placeholder={t('search.placeholder')}
                autoComplete="off"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
            <button type="submit" className="site-header__search-submit">
              {t('search.submit')}
            </button>
          </form>

          <div className="site-header__actions">
            <LanguageSwitcher />
            {canAccessSellerTools && (
              <Link href="/dashboard" className="site-header__dashboard">
                {t('header.dashboard')}
              </Link>
            )}
            {isAuthenticated && user?.role === 'bidder' && (
              <Link href="/onboarding/seller-upgrade" className="site-header__dashboard">
                {t('header.becomeSeller')}
              </Link>
            )}
            <button
              type="button"
              className="site-header__icon-btn"
              aria-label={t('header.notifications')}
              aria-expanded={sheet === 'notifications'}
              onClick={() => setSheet((s) => (s === 'notifications' ? 'none' : 'notifications'))}
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="site-header__badge site-header__badge--red">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className="site-header__icon-btn"
              aria-label={t('header.wishlist')}
              aria-expanded={sheet === 'wishlist'}
              onClick={() => setSheet((s) => (s === 'wishlist' ? 'none' : 'wishlist'))}
            >
              <Heart size={22} />
              {wishlistCount > 0 && (
                <span className="site-header__badge site-header__badge--red">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className="site-header__icon-btn"
              aria-label={t('header.cart')}
              aria-expanded={sheet === 'cart'}
              onClick={() => setSheet((s) => (s === 'cart' ? 'none' : 'cart'))}
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="site-header__badge site-header__badge--blue">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
            {isAuthenticated ? (
              <button
                type="button"
                className="site-header__signin"
                onClick={() => {
                  logout()
                  router.push('/')
                }}
              >
                <User size={18} aria-hidden />
                {t('header.signOut')}
              </button>
            ) : (
              <Link href="/" className="site-header__signin">
                <User size={18} aria-hidden />
                {t('header.signIn')}
              </Link>
            )}
          </div>
        </div>
        <nav className="site-header__nav" aria-label="Categories">
          {NAV_SLUGS.map((l) => (
            <Link
              key={l.key}
              href={navHref(l.slug)}
              className={
                isNavActive(l.slug)
                  ? 'site-header__nav-link site-header__nav-link--active'
                  : 'site-header__nav-link'
              }
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
      </header>
      <NotificationsPanel open={sheet === 'notifications'} onClose={() => setSheet('none')} />
      <WishlistPanel open={sheet === 'wishlist'} onClose={() => setSheet('none')} />
      <CartPanel open={sheet === 'cart'} onClose={() => setSheet('none')} />
    </>
  )
}
