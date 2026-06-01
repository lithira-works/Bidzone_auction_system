'use client'
import { type FormEvent, useEffect, useRef, useState } from 'react'
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
import { ProfileMenu } from '@/components/ui/ProfileMenu'

const NAV_SLUGS = [
  { key: 'nav.allAuctions', slug: null as string | null },
  { key: 'nav.electronics', slug: 'electronics' },
  { key: 'nav.fashion', slug: 'fashion' },
  { key: 'nav.collectibles', slug: 'collectibles' },
  { key: 'nav.art', slug: 'art' },
  { key: 'nav.moreCategories', slug: 'more' },
] as const

/* ── Avatar helpers ── */
const AVATAR_GRADIENTS = [
  ['#d97706', '#f59e0b'],
  ['#7c3aed', '#a78bfa'],
  ['#0891b2', '#22d3ee'],
  ['#059669', '#34d399'],
  ['#be185d', '#f472b6'],
  ['#b45309', '#d97706'],
] as const

function avatarGradient(name: string) {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length
  const [from, to] = AVATAR_GRADIENTS[idx]
  return `linear-gradient(135deg, ${from}, ${to})`
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || 'BZ'
}

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

  const [draft, setDraft]   = useState('')
  const [sheet, setSheet]   = useState<'none' | 'notifications' | 'wishlist' | 'cart'>('none')
  const [profileOpen, setProfileOpen] = useState(false)

  const profileWrapRef = useRef<HTMLDivElement>(null)

  /* Close profile menu on outside click or Escape */
  useEffect(() => {
    if (!profileOpen) return
    function onMouse(e: MouseEvent) {
      if (profileWrapRef.current && !profileWrapRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileOpen(false)
    }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [profileOpen])

  useEffect(() => {
    if (isHome) setDraft(searchParams.get('q') ?? '')
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

  /* Avatar details */
  const avatarGrad = user ? avatarGradient(user.fullName) : ''
  const avatarInit = user ? initials(user.fullName) : ''

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

            {/* Notifications */}
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

            {/* Wishlist */}
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

            {/* Cart */}
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

            {/* ── Profile avatar / Sign-in ── */}
            {isAuthenticated && user ? (
              <div className="sh-profile-wrap" ref={profileWrapRef}>
                <button
                  type="button"
                  className="sh-avatar-btn"
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                  aria-label="Open profile menu"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="sh-avatar-img"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="sh-avatar" style={{ background: avatarGrad }}>
                      {avatarInit}
                    </div>
                  )}
                </button>
                {profileOpen && <ProfileMenu onClose={() => setProfileOpen(false)} />}
              </div>
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
      <WishlistPanel     open={sheet === 'wishlist'}      onClose={() => setSheet('none')} />
      <CartPanel         open={sheet === 'cart'}          onClose={() => setSheet('none')} />
    </>
  )
}
