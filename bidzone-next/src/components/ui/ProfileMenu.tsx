'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, HelpCircle, LogOut, PlusCircle,
  ShieldCheck, Store, User, BarChart3, Settings,
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

  const grad  = avatarGradient(user.fullName)
  const init  = initials(user.fullName)
  const isSeller = user.role === 'seller'

  function handleSignOut() {
    onClose()
    logout()
    router.push('/')
  }

  function handleHelp() {
    onClose()
    openHelp()
  }

  return (
    <div className="pm" role="menu" aria-label="Profile menu">

      {/* ── User card ── */}
      <div className="pm__card">
        <div className="pm__avatar" style={{ background: user.avatarUrl ? 'transparent' : grad }}>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="pm__avatar-img"
              referrerPolicy="no-referrer"
            />
          ) : init}
        </div>
        <div className="pm__info">
          <span className="pm__name">{user.fullName}</span>
          <span className="pm__email">{user.email}</span>
          <span className={`pm__role${isSeller ? ' pm__role--seller' : ''}`}>
            {isSeller ? (
              <><ShieldCheck size={10} strokeWidth={2.5} /> Verified Seller</>
            ) : (
              'Bidder'
            )}
          </span>
        </div>
      </div>

      {/* ── Menu items ── */}
      <div className="pm__body">

        {/* Account */}
        <button type="button" className="pm__item" role="menuitem" onClick={onClose}>
          <User size={15} className="pm__item-icon" />
          My Account
        </button>

        {/* Role-specific items */}
        {canAccessSellerTools ? (
          <>
            <Link href="/dashboard" className="pm__item" role="menuitem" onClick={onClose}>
              <LayoutDashboard size={15} className="pm__item-icon" />
              Seller Dashboard
            </Link>
            <Link href="/seller/new" className="pm__item" role="menuitem" onClick={onClose}>
              <PlusCircle size={15} className="pm__item-icon" />
              Create Listing
            </Link>
            <Link href="/home" className="pm__item" role="menuitem" onClick={onClose}>
              <BarChart3 size={15} className="pm__item-icon" />
              My Auctions
            </Link>
          </>
        ) : (
          <>
            <Link href="/home" className="pm__item" role="menuitem" onClick={onClose}>
              <BarChart3 size={15} className="pm__item-icon" />
              My Bids
            </Link>
            <Link href="/onboarding/seller-upgrade" className="pm__item" role="menuitem" onClick={onClose}>
              <Store size={15} className="pm__item-icon" />
              <span>
                Become a Seller
                <span className="pm__item-badge">Upgrade</span>
              </span>
            </Link>
          </>
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

        <button
          type="button"
          className="pm__item pm__item--danger"
          role="menuitem"
          onClick={handleSignOut}
        >
          <LogOut size={15} className="pm__item-icon" />
          Sign Out
        </button>

      </div>
    </div>
  )
}
