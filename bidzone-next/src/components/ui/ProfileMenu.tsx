'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, HelpCircle, LogOut, PlusCircle,
  ShieldCheck, Store, User, BarChart3, Settings,
  Shield, Clock, AlertCircle, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useHelp } from '@/context/HelpContext'

type Props = { onClose: () => void }

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

export function ProfileMenu({ onClose }: Props) {
  const { user, logout, canAccessSellerTools } = useAuth()
  const { openHelp } = useHelp()
  const router = useRouter()

  if (!user) return null

  /* Single source of truth for role — never trust two separate variables */
  const role = user.role
  const isAdmin          = role === 'admin'
  const isSeller         = role === 'seller'
  const isVerifiedSeller = isSeller && canAccessSellerTools
  const isPendingSeller  = isSeller && user.kycStatus === 'pending'
  const isRejectedSeller = isSeller && user.kycStatus === 'rejected'

  const grad = avatarGradient(user.fullName)
  const init = initials(user.fullName)

  function handleSignOut() {
    onClose()
    logout()
    router.push('/')
  }

  function handleHelp() {
    onClose()
    openHelp()
  }

  /* Role badge appearance */
  const roleCls = [
    'pm__role',
    isAdmin          ? 'pm__role--admin'    : '',
    isVerifiedSeller ? 'pm__role--seller'   : '',
    isPendingSeller  ? 'pm__role--pending'  : '',
    isRejectedSeller ? 'pm__role--rejected' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="pm" role="menu" aria-label="Profile menu">

      {/* ── User card ── */}
      <div className="pm__card">
        <div className="pm__avatar" style={{ background: user.avatarUrl ? 'transparent' : grad }}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="pm__avatar-img" referrerPolicy="no-referrer" />
          ) : init}
        </div>
        <div className="pm__info">
          <span className="pm__name">{user.fullName}</span>
          <span className="pm__email">{user.email}</span>
          <span className={roleCls}>
            {isAdmin ? (
              <><Shield size={10} strokeWidth={2.5} /> Administrator</>
            ) : isVerifiedSeller ? (
              <><ShieldCheck size={10} strokeWidth={2.5} /> Verified Seller</>
            ) : isPendingSeller ? (
              <><ShieldCheck size={10} strokeWidth={2.5} /> Seller · Pending</>
            ) : isRejectedSeller ? (
              <><ShieldCheck size={10} strokeWidth={2.5} /> Seller · Rejected</>
            ) : (
              'Bidder'
            )}
          </span>
        </div>
      </div>

      {/* ── Prominent action panel (non-admins only) ── */}
      {!isAdmin && (
        <div className="pm__action-panel">
          {/* Bidder → Become a Seller CTA */}
          {!isSeller && (
            <Link href="/onboarding/seller-upgrade" className="pm__action-cta pm__action-cta--gold" onClick={onClose}>
              <div className="pm__action-cta-icon"><Store size={18} /></div>
              <div className="pm__action-cta-text">
                <span>Become a Seller</span>
                <small>List items &amp; reach 50k+ buyers</small>
              </div>
              <ChevronRight size={16} className="pm__action-cta-arrow" />
            </Link>
          )}

          {/* Verified seller → Dashboard + Create Listing */}
          {isVerifiedSeller && (
            <div className="pm__action-seller-grid">
              <Link href="/dashboard" className="pm__action-cta pm__action-cta--dash" onClick={onClose}>
                <LayoutDashboard size={17} />
                <span>Dashboard</span>
              </Link>
              <Link href="/seller/new" className="pm__action-cta pm__action-cta--new" onClick={onClose}>
                <PlusCircle size={17} />
                <span>New Listing</span>
              </Link>
            </div>
          )}

          {/* Pending seller */}
          {isPendingSeller && (
            <Link href="/dashboard" className="pm__action-cta pm__action-cta--pending" onClick={onClose}>
              <div className="pm__action-cta-icon"><Clock size={18} /></div>
              <div className="pm__action-cta-text">
                <span>Application Under Review</span>
                <small>Tap to view your seller dashboard</small>
              </div>
              <ChevronRight size={16} className="pm__action-cta-arrow" />
            </Link>
          )}

          {/* Rejected seller */}
          {isRejectedSeller && (
            <Link href="/onboarding/seller-upgrade" className="pm__action-cta pm__action-cta--rejected" onClick={onClose}>
              <div className="pm__action-cta-icon"><AlertCircle size={18} /></div>
              <div className="pm__action-cta-text">
                <span>Application Not Approved</span>
                <small>Tap to reapply as a seller</small>
              </div>
              <ChevronRight size={16} className="pm__action-cta-arrow" />
            </Link>
          )}
        </div>
      )}

      {/* ── Menu body ── */}
      <div className="pm__body">

        <button type="button" className="pm__item" role="menuitem" onClick={onClose}>
          <User size={15} className="pm__item-icon" />
          My Account
        </button>

        {/* Admin-only: Admin Console link */}
        {isAdmin && (
          <Link href="/admin" className="pm__item pm__item--admin" role="menuitem" onClick={onClose}>
            <Shield size={15} className="pm__item-icon" />
            Admin Console
          </Link>
        )}

        {/* Seller nav items (secondary, below the action panel) */}
        {isVerifiedSeller && (
          <>
            <Link href="/home" className="pm__item" role="menuitem" onClick={onClose}>
              <BarChart3 size={15} className="pm__item-icon" />
              My Auctions
            </Link>
          </>
        )}

        {(isPendingSeller || isRejectedSeller) && (
          <Link href="/home" className="pm__item" role="menuitem" onClick={onClose}>
            <BarChart3 size={15} className="pm__item-icon" />
            My Bids
          </Link>
        )}

        {!isSeller && !isAdmin && (
          <Link href="/home" className="pm__item" role="menuitem" onClick={onClose}>
            <BarChart3 size={15} className="pm__item-icon" />
            My Bids
          </Link>
        )}

        <div className="pm__sep" />

        <button type="button" className="pm__item" role="menuitem" onClick={onClose}>
          <Settings size={15} className="pm__item-icon" />
          Settings
        </button>

        <button type="button" className="pm__item" role="menuitem" onClick={handleHelp}>
          <HelpCircle size={15} className="pm__item-icon" />
          Help &amp; Support
        </button>

        <div className="pm__sep" />

        <button type="button" className="pm__item pm__item--danger" role="menuitem" onClick={handleSignOut}>
          <LogOut size={15} className="pm__item-icon" />
          Sign Out
        </button>

      </div>
    </div>
  )
}
