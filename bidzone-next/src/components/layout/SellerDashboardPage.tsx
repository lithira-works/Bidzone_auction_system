'use client'
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, TrendingUp, User, Home, LogOut,
  Plus, CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw,
  DollarSign, Gavel, Users, BarChart3, Search, Eye,
  ChevronRight, Store, ShieldCheck, Menu, X,
  ArrowUpRight, Pencil, Save, Ban,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useListings } from '@/context/ListingsContext'
import { useI18n } from '@/context/I18nContext'
import { api } from '@/lib/apiClient'
import type { AuctionItem } from '@/data/auctions'
import { displayAuctionEndLocal } from '@/lib/auctionTime'

/* ── helpers ── */
const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const fmtNum = (n: number) => n.toLocaleString('en-US')

function initials(name: string) {
  const p = name.trim().split(/\s+/)
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function isEndingToday(iso: string) {
  const e = new Date(iso), t = new Date()
  return e > new Date() &&
    e.getFullYear() === t.getFullYear() && e.getMonth() === t.getMonth() && e.getDate() === t.getDate()
}

/* ── types ── */
type SellerTab = 'overview' | 'listings' | 'analytics' | 'profile'
type ModerationFilter = 'all' | 'approved' | 'pending' | 'rejected'

type SellerStats = {
  totalListings: number
  approvedListings: number
  pendingListings: number
  rejectedListings: number
  activeListings: number
  endingSoon: number
  totalRevenue: number
  totalBidsReceived: number
  uniqueBidders: number
}

/* ── sub-components ── */
function StatusBadge({ status }: { status?: string }) {
  if (status === 'approved') return (
    <span className="sdash__badge sdash__badge--ok">
      <CheckCircle2 size={12} /> Approved
    </span>
  )
  if (status === 'rejected') return (
    <span className="sdash__badge sdash__badge--err">
      <XCircle size={12} /> Rejected
    </span>
  )
  return (
    <span className="sdash__badge sdash__badge--warn">
      <Clock size={12} /> Pending
    </span>
  )
}

function KpiSkeleton() {
  return (
    <div className="sdash__kpi sdash__kpi--skeleton">
      <div className="sdash__skel sdash__skel--icon" />
      <div style={{ flex: 1 }}>
        <div className="sdash__skel sdash__skel--label" />
        <div className="sdash__skel sdash__skel--value" />
      </div>
    </div>
  )
}

function RevenueChart({ values }: { values: number[] }) {
  const W = 600, H = 180, pL = 48, pR = 16, pT = 12, pB = 28
  const iw = W - pL - pR, ih = H - pT - pB
  const max = Math.max(...values, 1000) * 1.05
  const pts = values.map((v, i) => ({
    x: pL + (values.length === 1 ? iw / 2 : (i / (values.length - 1)) * iw),
    y: pT + ih - (v / max) * ih,
  }))
  const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L ${(pL + iw).toFixed(1)} ${(pT + ih).toFixed(1)} L ${pL.toFixed(1)} ${(pT + ih).toFixed(1)} Z`
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => max * t)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return (
    <svg className="sdash__chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="sdash-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4912d" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#d4912d" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((v, i) => {
        const y = pT + ih - (v / max) * ih
        return (
          <g key={i}>
            <line x1={pL} x2={pL + iw} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={4} y={y + 4} fontSize="10" fill="rgba(255,255,255,0.35)">{Math.round(v).toLocaleString()}</text>
          </g>
        )
      })}
      <path d={area} fill="url(#sdash-grad)" />
      <path d={line} fill="none" stroke="#d4912d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#d4912d" stroke="#0f172a" strokeWidth="2" />
      ))}
      {days.map((d, i) => (
        <text key={d} x={pL + (i / 6) * iw} y={H - 6} fontSize="10" textAnchor="middle" fill="rgba(255,255,255,0.35)">{d}</text>
      ))}
    </svg>
  )
}

function DonutChart({ segs }: { segs: { pct: number; color: string; label: string }[] }) {
  let acc = 0
  const parts = segs.filter(s => s.pct > 0).map(s => { const start = acc; acc += s.pct; return { ...s, start } })
  const grad = parts.map(p => {
    const a = (p.start / 100) * 360, b = ((p.start + p.pct) / 100) * 360
    return `${p.color} ${a}deg ${b}deg`
  }).join(', ')
  return (
    <div className="sdash__donut-wrap">
      <div className="sdash__donut" style={{ background: `conic-gradient(${grad || '#2a3549 0deg 360deg'})` }} />
      <ul className="sdash__donut-legend">
        {parts.map(p => (
          <li key={p.label}>
            <span className="sdash__dot" style={{ background: p.color }} />
            <span>{p.label}</span>
            <strong>{p.pct}%</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export function SellerDashboardPage() {
  const { user, logout, updateUser } = useAuth()
  const { userListings } = useListings()
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tab, setTab] = useState<SellerTab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [listingFilter, setListingFilter] = useState<ModerationFilter>('all')
  const [listingSearch, setListingSearch] = useState('')
  const [showNewBanner, setShowNewBanner] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  /* profile edit state */
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    businessName: '',
    businessType: '' as '' | 'individual' | 'registered_business' | 'cooperative',
    businessDescription: '',
    phone: '',
    city: '',
    address: '',
  })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState(false)

  /* auth-derived flags */
  const isApproved  = !!(user?.listingAllowed && user?.kycStatus === 'verified')
  const isPending   = user?.kycStatus === 'pending'
  const isRejected  = user?.kycStatus === 'rejected'
  const bizName     = user?.businessName || user?.fullName || 'Seller'
  const kycNotes    = user?.kycNotes ?? ''

  /* load stats */
  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const data = await api.get<SellerStats>('/seller/stats')
      setStats(data)
    } catch { /* non-critical */ }
    finally { setStatsLoading(false) }
  }, [])

  useEffect(() => { void loadStats() }, [loadStats])

  useEffect(() => {
    if (searchParams.get('listing') === 'pending') {
      setShowNewBanner(true)
      router.replace('/dashboard', { scroll: false })
    }
  }, [searchParams, router])

  /* close mobile sidebar on outside click */
  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false)
      }
    }
    if (sidebarOpen) document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [sidebarOpen])

  /* derived listing data */
  const approvedListings = useMemo(
    () => userListings.filter(x => x.moderationStatus === 'approved'),
    [userListings],
  )

  const filteredListings = useMemo(() => {
    let list = listingFilter === 'all' ? userListings : userListings.filter(x => x.moderationStatus === listingFilter)
    if (listingSearch.trim()) {
      const q = listingSearch.toLowerCase()
      list = list.filter(x => x.title.toLowerCase().includes(q) || x.category.toLowerCase().includes(q))
    }
    return list
  }, [userListings, listingFilter, listingSearch])

  /* KPIs */
  const kpiRevenue      = stats?.totalRevenue      ?? approvedListings.reduce((s, x) => s + x.currentBid, 0)
  const kpiActive       = stats?.activeListings     ?? approvedListings.length
  const kpiBids         = stats?.totalBidsReceived  ?? userListings.reduce((s, x) => s + x.bids, 0)
  const kpiUnique       = stats?.uniqueBidders      ?? 0
  const pendingCount    = stats?.pendingListings     ?? userListings.filter(x => x.moderationStatus === 'pending').length

  const endingToday = useMemo(
    () => approvedListings.filter(x => x.auctionEndsAt ? isEndingToday(x.auctionEndsAt) : /^\d+h\b/.test(x.timeLeft)).length,
    [approvedListings],
  )

  const revSeries = useMemo(() => {
    if (kpiRevenue === 0) return [820, 1350, 1090, 1780, 2100, 1640, 2900]
    const base = kpiRevenue / 7
    return Array.from({ length: 7 }, (_, d) => Math.round(base * (d + 1) * (0.8 + d * 0.06) * 0.42 + 500))
  }, [kpiRevenue])

  const donutSegs = useMemo(() => {
    let e = 0, f = 0, c = 0, o = 0
    approvedListings.forEach(i => {
      const cat = i.category.toLowerCase()
      if (cat.includes('electron') || cat.includes('computer') || cat.includes('laptop')) e++
      else if (cat.includes('fashion') || cat.includes('jewelry') || cat.includes('watch')) f++
      else if (cat.includes('collect') || cat.includes('sport') || cat.includes('art')) c++
      else o++
    })
    const tot = e + f + c + o
    if (tot === 0) return [
      { pct: 45, color: '#3b82f6', label: 'Electronics' },
      { pct: 25, color: '#8b5cf6', label: 'Fashion' },
      { pct: 20, color: '#10b981', label: 'Collectibles' },
      { pct: 10, color: '#f97316', label: 'Other' },
    ]
    const p = (n: number) => Math.round((n / tot) * 100)
    const segs = [
      { pct: p(e), color: '#3b82f6', label: 'Electronics' },
      { pct: p(f), color: '#8b5cf6', label: 'Fashion' },
      { pct: p(c), color: '#10b981', label: 'Collectibles' },
      { pct: p(o), color: '#f97316', label: 'Other' },
    ]
    const diff = 100 - segs.reduce((s, x) => s + x.pct, 0)
    if (diff !== 0) segs[segs.length - 1].pct += diff
    return segs
  }, [approvedListings])

  function handleSignOut() {
    logout()
    router.push('/')
  }

  function startEdit() {
    setEditForm({
      businessName: user?.businessName ?? '',
      businessType: (user?.businessType ?? '') as typeof editForm.businessType,
      businessDescription: user?.businessDescription ?? '',
      phone: user?.phone ?? '',
      city: user?.city ?? '',
      address: user?.address ?? '',
    })
    setEditError(null)
    setEditSuccess(false)
    setEditMode(true)
  }

  function cancelEdit() {
    setEditMode(false)
    setEditError(null)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm.businessName.trim()) {
      setEditError('Business name is required.')
      return
    }
    setEditSaving(true)
    setEditError(null)
    try {
      const { user: updated } = await api.patch<{ user: import('@/types/userProfile').UserProfile }>('/auth/me', {
        businessName: editForm.businessName.trim(),
        businessType: editForm.businessType,
        businessDescription: editForm.businessDescription.trim(),
        phone: editForm.phone.trim(),
        city: editForm.city.trim(),
        address: editForm.address.trim(),
      })
      updateUser(updated)
      setEditMode(false)
      setEditSuccess(true)
      setTimeout(() => setEditSuccess(false), 3500)
    } catch {
      setEditError('Failed to save changes. Please try again.')
    } finally {
      setEditSaving(false)
    }
  }

  /* ── nav config ── */
  const NAV = [
    { id: 'overview'  as SellerTab, label: 'Overview',    icon: LayoutDashboard },
    { id: 'listings'  as SellerTab, label: 'My Listings', icon: Package, badge: pendingCount },
    { id: 'analytics' as SellerTab, label: 'Analytics',   icon: TrendingUp },
    { id: 'profile'   as SellerTab, label: 'Profile',     icon: User },
  ]

  function navTo(t: SellerTab) { setTab(t); setSidebarOpen(false) }

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className="sdash">

      {/* Mobile overlay */}
      {sidebarOpen && <div className="sdash__overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`sdash__sidebar${sidebarOpen ? ' sdash__sidebar--open' : ''}`} ref={sidebarRef}>
        {/* Brand */}
        <div className="sdash__brand">
          <div className="sdash__brand-mark">BZ</div>
          <div className="sdash__brand-text">
            <span className="sdash__brand-name">BidZone</span>
            <span className="sdash__brand-sub">Seller Console</span>
          </div>
        </div>

        {/* Seller card */}
        <div className="sdash__seller-card">
          <div className="sdash__seller-avatar">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={user.fullName} referrerPolicy="no-referrer" />
              : initials(user?.fullName ?? 'S')}
          </div>
          <div className="sdash__seller-info">
            <span className="sdash__seller-name">{bizName}</span>
            <span className={`sdash__seller-status${isApproved ? ' sdash__seller-status--ok' : isPending ? ' sdash__seller-status--warn' : ' sdash__seller-status--err'}`}>
              {isApproved
                ? <><CheckCircle2 size={10} /> Active Seller</>
                : isPending
                  ? <><Clock size={10} /> Under Review</>
                  : <><AlertCircle size={10} /> Action Required</>}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sdash__nav" aria-label="Seller navigation">
          {NAV.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              className={`sdash__nav-item${tab === id ? ' sdash__nav-item--active' : ''}`}
              onClick={() => navTo(id)}
            >
              <Icon size={17} />
              <span>{label}</span>
              {!!badge && badge > 0 && (
                <span className="sdash__nav-badge">{badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="sdash__sidebar-foot">
          {isApproved && (
            <Link href="/seller/new" className="sdash__create-btn" onClick={() => setSidebarOpen(false)}>
              <Plus size={15} /> New Listing
            </Link>
          )}
          <Link href="/home" className="sdash__foot-link">
            <Home size={14} /> Marketplace
          </Link>
          <button type="button" className="sdash__foot-link sdash__foot-link--danger" onClick={handleSignOut}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="sdash__main">

        {/* Top bar */}
        <header className="sdash__topbar">
          <button
            type="button"
            className="sdash__hamburger"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen(v => !v)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="sdash__topbar-title">
            <h1>{NAV.find(n => n.id === tab)?.label}</h1>
            <p>
              {tab === 'overview' && 'Your seller performance at a glance'}
              {tab === 'listings' && 'Manage and track your auction listings'}
              {tab === 'analytics' && 'Revenue trends and bidder insights'}
              {tab === 'profile'  && 'Your business profile and account settings'}
            </p>
          </div>

          <div className="sdash__topbar-actions">
            <button
              type="button"
              className="sdash__refresh-btn"
              title="Refresh data"
              disabled={statsLoading}
              onClick={() => void loadStats()}
            >
              <RefreshCw size={15} className={statsLoading ? 'sdash__spin' : ''} />
            </button>
            {isApproved && (
              <Link href="/seller/new" className="sdash__topbar-cta">
                <Plus size={16} /> New Listing
              </Link>
            )}
          </div>
        </header>

        <div className="sdash__body">

          {/* ── application status banners ── */}
          {isPending && (
            <div className="sdash__alert sdash__alert--warn" role="status">
              <Clock size={18} />
              <div>
                <strong>Application Under Review</strong>
                <p>Our admin team is verifying your details. You&apos;ll be notified within 24–48 hours.</p>
              </div>
              <Link href="/onboarding/seller-upgrade" className="sdash__alert-link">View Status <ChevronRight size={14} /></Link>
            </div>
          )}

          {isRejected && (
            <div className="sdash__alert sdash__alert--err" role="alert">
              <AlertCircle size={18} />
              <div>
                <strong>Application Not Approved</strong>
                <p>{kycNotes ? `Admin note: "${kycNotes}"` : 'Your application was not approved. Please reapply with updated information.'}</p>
              </div>
              <Link href="/onboarding/seller-upgrade" className="sdash__alert-link sdash__alert-link--err">Reapply <ChevronRight size={14} /></Link>
            </div>
          )}

          {showNewBanner && isApproved && (
            <div className="sdash__alert sdash__alert--info" role="status">
              <CheckCircle2 size={18} />
              <div>
                <strong>Listing submitted for review</strong>
                <p>Your listing is pending admin approval and will appear on the marketplace once approved.</p>
              </div>
              <button type="button" className="sdash__alert-close" onClick={() => setShowNewBanner(false)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* ══════════════ OVERVIEW TAB ══════════════ */}
          {tab === 'overview' && (
            <>
              {/* KPI row */}
              <div className="sdash__kpi-grid">
                {statsLoading ? (
                  Array.from({ length: 4 }, (_, i) => <KpiSkeleton key={i} />)
                ) : (
                  <>
                    <article className="sdash__kpi sdash__kpi--gold">
                      <div className="sdash__kpi-icon-wrap">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p className="sdash__kpi-label">Total Revenue</p>
                        <p className="sdash__kpi-value">{fmt(kpiRevenue)}</p>
                        <p className="sdash__kpi-foot sdash__kpi-foot--up">
                          <TrendingUp size={12} /> From approved listings
                        </p>
                      </div>
                    </article>

                    <article className="sdash__kpi sdash__kpi--blue">
                      <div className="sdash__kpi-icon-wrap">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="sdash__kpi-label">Active Listings</p>
                        <p className="sdash__kpi-value">{kpiActive}</p>
                        <p className="sdash__kpi-foot">{endingToday} ending today</p>
                      </div>
                    </article>

                    <article className="sdash__kpi sdash__kpi--purple">
                      <div className="sdash__kpi-icon-wrap">
                        <Gavel size={20} />
                      </div>
                      <div>
                        <p className="sdash__kpi-label">Total Bids</p>
                        <p className="sdash__kpi-value">{fmtNum(kpiBids)}</p>
                        <p className="sdash__kpi-foot">Across all listings</p>
                      </div>
                    </article>

                    <article className="sdash__kpi sdash__kpi--green">
                      <div className="sdash__kpi-icon-wrap">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="sdash__kpi-label">Unique Bidders</p>
                        <p className="sdash__kpi-value">{fmtNum(kpiUnique)}</p>
                        <p className="sdash__kpi-foot sdash__kpi-foot--up">
                          <TrendingUp size={12} /> Buyer reach
                        </p>
                      </div>
                    </article>
                  </>
                )}
              </div>

              {/* Listing status chips */}
              {stats && (
                <div className="sdash__status-chips">
                  <button type="button" className="sdash__chip sdash__chip--ok" onClick={() => { setTab('listings'); setListingFilter('approved') }}>
                    <CheckCircle2 size={13} /> {stats.approvedListings} Approved
                  </button>
                  <button type="button" className="sdash__chip sdash__chip--warn" onClick={() => { setTab('listings'); setListingFilter('pending') }}>
                    <Clock size={13} /> {stats.pendingListings} Pending
                  </button>
                  <button type="button" className="sdash__chip sdash__chip--err" onClick={() => { setTab('listings'); setListingFilter('rejected') }}>
                    <XCircle size={13} /> {stats.rejectedListings} Rejected
                  </button>
                  <div className="sdash__chip sdash__chip--muted">
                    <Package size={13} /> {stats.totalListings} Total
                  </div>
                </div>
              )}

              {/* Charts */}
              {isApproved && (
                <div className="sdash__charts">
                  <section className="sdash__chart-card sdash__chart-card--wide">
                    <div className="sdash__card-head">
                      <h2>Revenue Trend <span>(7 days)</span></h2>
                      <span className="sdash__card-badge sdash__card-badge--gold">{fmt(kpiRevenue)} total</span>
                    </div>
                    <RevenueChart values={revSeries} />
                  </section>
                  <section className="sdash__chart-card">
                    <div className="sdash__card-head">
                      <h2>By Category</h2>
                    </div>
                    <DonutChart segs={donutSegs} />
                  </section>
                </div>
              )}

              {/* Recent listings preview */}
              <section className="sdash__card">
                <div className="sdash__card-head">
                  <h2>Recent Listings</h2>
                  <button type="button" className="sdash__card-link" onClick={() => setTab('listings')}>
                    View all <ArrowUpRight size={14} />
                  </button>
                </div>

                {!isApproved ? (
                  <div className="sdash__locked">
                    <div className="sdash__locked-icon"><ShieldCheck size={32} /></div>
                    <h3>Listing Access Locked</h3>
                    <p>
                      {isPending
                        ? 'Your application is under review. Once approved you can create listings.'
                        : isRejected
                          ? 'Application was not approved. Please reapply.'
                          : 'Apply to become a seller to start creating listings.'}
                    </p>
                    <Link href="/onboarding/seller-upgrade" className="sdash__locked-btn">
                      <Store size={14} />
                      {isPending ? 'Check Status' : isRejected ? 'Reapply' : 'Apply Now'}
                    </Link>
                  </div>
                ) : userListings.length === 0 ? (
                  <div className="sdash__empty">
                    <Package size={36} strokeWidth={1.25} />
                    <p>No listings yet. Create your first auction!</p>
                    <Link href="/seller/new" className="sdash__locked-btn">
                      <Plus size={14} /> Create Listing
                    </Link>
                  </div>
                ) : (
                  <div className="sdash__table-wrap">
                    <table className="sdash__table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Status</th>
                          <th>Current Bid</th>
                          <th>Bids</th>
                          <th>Ends</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {userListings.slice(0, 5).map(item => (
                          <tr key={item.id}>
                            <td>
                              <span className="sdash__cell-main">{item.title}</span>
                              <span className="sdash__cell-sub">{item.category}</span>
                            </td>
                            <td><StatusBadge status={item.moderationStatus} /></td>
                            <td className="sdash__bid-cell">{fmt(item.currentBid)}</td>
                            <td>{item.bids}</td>
                            <td className="sdash__cell-sub">{item.auctionEndsAt ? displayAuctionEndLocal(item.auctionEndsAt) : item.timeLeft}</td>
                            <td>
                              <Link href={`/seller/edit/${item.id}`} className="sdash__row-action">Edit</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* ══════════════ LISTINGS TAB ══════════════ */}
          {tab === 'listings' && (
            <section className="sdash__card">
              <div className="sdash__card-head">
                <h2>All Listings</h2>
                {isApproved && (
                  <Link href="/seller/new" className="sdash__topbar-cta">
                    <Plus size={15} /> New Listing
                  </Link>
                )}
              </div>

              {/* Filter tabs */}
              <div className="sdash__filter-tabs">
                {(['all', 'approved', 'pending', 'rejected'] as ModerationFilter[]).map(f => {
                  const cnt = f === 'all' ? userListings.length : userListings.filter(x => x.moderationStatus === f).length
                  return (
                    <button
                      key={f}
                      type="button"
                      className={`sdash__filter-tab${listingFilter === f ? ' sdash__filter-tab--active' : ''}`}
                      onClick={() => setListingFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      {cnt > 0 && <span className="sdash__filter-cnt">{cnt}</span>}
                    </button>
                  )
                })}
              </div>

              {/* Search */}
              <div className="sdash__search-wrap">
                <Search size={15} className="sdash__search-icon" />
                <input
                  type="search"
                  className="sdash__search"
                  placeholder="Search by title or category…"
                  value={listingSearch}
                  onChange={e => setListingSearch(e.target.value)}
                />
              </div>

              {!isApproved ? (
                <div className="sdash__locked">
                  <div className="sdash__locked-icon"><ShieldCheck size={32} /></div>
                  <h3>Listing Access Locked</h3>
                  <p>
                    {isPending
                      ? 'Awaiting admin approval. Check back soon.'
                      : isRejected
                        ? 'Application rejected. Reapply to unlock listing access.'
                        : 'Submit a seller application to create listings.'}
                  </p>
                  <Link href="/onboarding/seller-upgrade" className="sdash__locked-btn">
                    <Store size={14} />
                    {isPending ? 'View Application' : isRejected ? 'Reapply' : 'Apply to Sell'}
                  </Link>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="sdash__empty">
                  <Package size={36} strokeWidth={1.25} />
                  <p>{listingSearch ? 'No listings match your search.' : 'No listings in this category.'}</p>
                </div>
              ) : (
                <div className="sdash__table-wrap">
                  <table className="sdash__table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Status</th>
                        <th>Current Bid</th>
                        <th>Bids</th>
                        <th>Ends</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredListings.map(item => (
                        <tr key={item.id}>
                          <td>
                            <span className="sdash__cell-main">{item.title}</span>
                            <span className="sdash__cell-sub">{item.category}</span>
                          </td>
                          <td><StatusBadge status={item.moderationStatus} /></td>
                          <td className="sdash__bid-cell">{fmt(item.currentBid)}</td>
                          <td>{item.bids}</td>
                          <td className="sdash__cell-sub">
                            {item.auctionEndsAt ? displayAuctionEndLocal(item.auctionEndsAt) : item.timeLeft}
                          </td>
                          <td>
                            <div className="sdash__row-actions">
                              <Link href={`/listing/${item.id}`} className="sdash__row-action sdash__row-action--view" title="View listing">
                                <Eye size={14} />
                              </Link>
                              <Link href={`/seller/edit/${item.id}`} className="sdash__row-action" title="Edit listing">
                                Edit
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ══════════════ ANALYTICS TAB ══════════════ */}
          {tab === 'analytics' && (
            <>
              <div className="sdash__kpi-grid">
                {statsLoading ? Array.from({ length: 4 }, (_, i) => <KpiSkeleton key={i} />) : (
                  <>
                    <article className="sdash__kpi sdash__kpi--gold">
                      <div className="sdash__kpi-icon-wrap"><DollarSign size={20} /></div>
                      <div>
                        <p className="sdash__kpi-label">Total Revenue</p>
                        <p className="sdash__kpi-value">{fmt(kpiRevenue)}</p>
                      </div>
                    </article>
                    <article className="sdash__kpi sdash__kpi--blue">
                      <div className="sdash__kpi-icon-wrap"><Gavel size={20} /></div>
                      <div>
                        <p className="sdash__kpi-label">Total Bids</p>
                        <p className="sdash__kpi-value">{fmtNum(kpiBids)}</p>
                      </div>
                    </article>
                    <article className="sdash__kpi sdash__kpi--purple">
                      <div className="sdash__kpi-icon-wrap"><Users size={20} /></div>
                      <div>
                        <p className="sdash__kpi-label">Unique Bidders</p>
                        <p className="sdash__kpi-value">{fmtNum(kpiUnique)}</p>
                      </div>
                    </article>
                    <article className="sdash__kpi sdash__kpi--green">
                      <div className="sdash__kpi-icon-wrap"><BarChart3 size={20} /></div>
                      <div>
                        <p className="sdash__kpi-label">Ending Soon</p>
                        <p className="sdash__kpi-value">{stats?.endingSoon ?? 0}</p>
                        <p className="sdash__kpi-foot">Within 24 hours</p>
                      </div>
                    </article>
                  </>
                )}
              </div>

              <section className="sdash__card">
                <div className="sdash__card-head">
                  <h2>Revenue Trend <span>(7 days)</span></h2>
                </div>
                <RevenueChart values={revSeries} />
              </section>

              <div className="sdash__charts">
                <section className="sdash__chart-card">
                  <div className="sdash__card-head"><h2>Category Breakdown</h2></div>
                  <DonutChart segs={donutSegs} />
                </section>
                <section className="sdash__chart-card">
                  <div className="sdash__card-head"><h2>Listing Health</h2></div>
                  <div className="sdash__health-list">
                    {[
                      { label: 'Approved & Live', val: stats?.approvedListings ?? 0, color: '#10b981' },
                      { label: 'Pending Review',   val: stats?.pendingListings  ?? 0, color: '#f59e0b' },
                      { label: 'Rejected',          val: stats?.rejectedListings ?? 0, color: '#ef4444' },
                      { label: 'Ending Soon',       val: stats?.endingSoon       ?? 0, color: '#8b5cf6' },
                    ].map(row => (
                      <div key={row.label} className="sdash__health-row">
                        <span className="sdash__health-dot" style={{ background: row.color }} />
                        <span className="sdash__health-label">{row.label}</span>
                        <strong className="sdash__health-val">{row.val}</strong>
                        <div
                          className="sdash__health-bar-bg"
                          role="progressbar"
                          aria-valuenow={row.val}
                          aria-valuemax={Math.max(stats?.totalListings ?? 1, 1)}
                        >
                          <div
                            className="sdash__health-bar-fill"
                            style={{
                              width: `${Math.min(100, (row.val / Math.max(stats?.totalListings ?? 1, 1)) * 100)}%`,
                              background: row.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* ══════════════ PROFILE TAB ══════════════ */}
          {tab === 'profile' && (
            <div className="sdash__profile-grid">
              {/* Identity card */}
              <section className="sdash__card">
                <div className="sdash__card-head">
                  <h2>Business Profile</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className={`sdash__kyc-chip${isApproved ? ' sdash__kyc-chip--ok' : isPending ? ' sdash__kyc-chip--warn' : ' sdash__kyc-chip--err'}`}>
                      {isApproved ? <><CheckCircle2 size={12} /> Verified</> : isPending ? <><Clock size={12} /> Pending</> : <><AlertCircle size={12} /> Rejected</>}
                    </span>
                    {!editMode && (
                      <button type="button" className="sdash__edit-btn" onClick={startEdit}>
                        <Pencil size={13} /> Edit
                      </button>
                    )}
                  </div>
                </div>

                {editSuccess && (
                  <div className="sdash__alert sdash__alert--info" style={{ marginBottom: '1rem' }}>
                    <CheckCircle2 size={16} />
                    <div><strong>Profile updated successfully</strong></div>
                  </div>
                )}

                <div className="sdash__profile-hero">
                  <div className="sdash__profile-avatar">
                    {user?.avatarUrl
                      ? <img src={user.avatarUrl} alt={user?.fullName} referrerPolicy="no-referrer" />
                      : initials(user?.fullName ?? 'S')}
                  </div>
                  <div>
                    <h3 className="sdash__profile-name">{user?.fullName}</h3>
                    <p className="sdash__profile-email">{user?.email}</p>
                  </div>
                </div>

                {/* VIEW mode */}
                {!editMode && (
                  <div className="sdash__profile-fields">
                    {[
                      { label: 'Business Name', val: user?.businessName || '—' },
                      {
                        label: 'Business Type',
                        val: user?.businessType === 'individual' ? 'Individual / Sole Trader'
                          : user?.businessType === 'registered_business' ? 'Registered Business'
                            : user?.businessType === 'cooperative' ? 'Cooperative / Partnership'
                              : '—',
                      },
                      { label: 'Description', val: user?.businessDescription || '—' },
                      { label: 'Phone', val: user?.phone || '—' },
                      { label: 'City', val: user?.city || '—' },
                      { label: 'Address', val: user?.address || '—' },
                    ].map(f => (
                      <div key={f.label} className="sdash__profile-field">
                        <span className="sdash__profile-field-label">{f.label}</span>
                        <span className="sdash__profile-field-val">{f.val}</span>
                      </div>
                    ))}
                    {user?.kycSubmittedAt && (
                      <div className="sdash__profile-field">
                        <span className="sdash__profile-field-label">Applied On</span>
                        <span className="sdash__profile-field-val">
                          {new Date(user.kycSubmittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {user?.kycNotes && (
                      <div className="sdash__profile-field sdash__profile-field--note">
                        <span className="sdash__profile-field-label">Admin Note</span>
                        <span className="sdash__profile-field-val">{user.kycNotes}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* EDIT mode */}
                {editMode && (
                  <form className="sdash__edit-form" onSubmit={saveEdit}>
                    {editError && (
                      <div className="sdash__alert sdash__alert--err" style={{ marginBottom: '1rem' }}>
                        <AlertCircle size={16} />
                        <div><strong>{editError}</strong></div>
                      </div>
                    )}

                    <div className="sdash__field-group">
                      <label className="sdash__field-label">Business Name <span className="sdash__field-req">*</span></label>
                      <input
                        type="text"
                        className="sdash__field-input"
                        placeholder="Your business or trading name"
                        value={editForm.businessName}
                        onChange={e => setEditForm(p => ({ ...p, businessName: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="sdash__field-group">
                      <label className="sdash__field-label">Business Type</label>
                      <select
                        className="sdash__field-select"
                        value={editForm.businessType}
                        onChange={e => setEditForm(p => ({ ...p, businessType: e.target.value as typeof editForm.businessType }))}
                      >
                        <option value="">Select type…</option>
                        <option value="individual">Individual / Sole Trader</option>
                        <option value="registered_business">Registered Business</option>
                        <option value="cooperative">Cooperative / Partnership</option>
                      </select>
                    </div>

                    <div className="sdash__field-group">
                      <label className="sdash__field-label">Business Description</label>
                      <textarea
                        className="sdash__field-textarea"
                        rows={3}
                        placeholder="Briefly describe what you sell or your expertise…"
                        value={editForm.businessDescription}
                        onChange={e => setEditForm(p => ({ ...p, businessDescription: e.target.value }))}
                      />
                    </div>

                    <div className="sdash__field-row">
                      <div className="sdash__field-group">
                        <label className="sdash__field-label">Phone</label>
                        <input
                          type="tel"
                          className="sdash__field-input"
                          placeholder="+1 555 000 0000"
                          value={editForm.phone}
                          onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                        />
                      </div>
                      <div className="sdash__field-group">
                        <label className="sdash__field-label">City</label>
                        <input
                          type="text"
                          className="sdash__field-input"
                          placeholder="City"
                          value={editForm.city}
                          onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="sdash__field-group">
                      <label className="sdash__field-label">Address</label>
                      <input
                        type="text"
                        className="sdash__field-input"
                        placeholder="Street address"
                        value={editForm.address}
                        onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                      />
                    </div>

                    <div className="sdash__edit-actions">
                      <button type="submit" className="sdash__save-btn" disabled={editSaving}>
                        {editSaving
                          ? <><RefreshCw size={14} className="sdash__spin" /> Saving…</>
                          : <><Save size={14} /> Save Changes</>}
                      </button>
                      <button type="button" className="sdash__cancel-btn" onClick={cancelEdit} disabled={editSaving}>
                        <Ban size={14} /> Cancel
                      </button>
                    </div>
                  </form>
                )}

                {(isPending || isRejected) && !editMode && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <Link href="/onboarding/seller-upgrade" className="sdash__locked-btn" style={{ display: 'inline-flex' }}>
                      {isRejected ? <><AlertCircle size={14} /> Reapply Now</> : <><Clock size={14} /> Check Status</>}
                    </Link>
                  </div>
                )}
              </section>

              {/* Account stats */}
              <section className="sdash__card">
                <div className="sdash__card-head"><h2>Account Summary</h2></div>
                <div className="sdash__account-stats">
                  {[
                    { label: 'Member Since', val: user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—' },
                    { label: 'Total Listings', val: fmtNum(stats?.totalListings ?? userListings.length) },
                    { label: 'Active Auctions', val: fmtNum(kpiActive) },
                    { label: 'Total Revenue', val: fmt(kpiRevenue) },
                    { label: 'Bids Received', val: fmtNum(kpiBids) },
                    { label: 'Unique Bidders', val: fmtNum(kpiUnique) },
                  ].map(r => (
                    <div key={r.label} className="sdash__account-stat">
                      <span className="sdash__profile-field-label">{r.label}</span>
                      <strong className="sdash__account-stat-val">{r.val}</strong>
                    </div>
                  ))}
                </div>

                <div className="sdash__profile-actions">
                  <Link href="/home" className="sdash__profile-action-btn">
                    <Home size={14} /> Browse Marketplace
                  </Link>
                  <button type="button" className="sdash__profile-action-btn sdash__profile-action-btn--danger" onClick={handleSignOut}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </section>
            </div>
          )}

        </div>{/* /sdash__body */}
      </div>{/* /sdash__main */}
    </div>
  )
}
