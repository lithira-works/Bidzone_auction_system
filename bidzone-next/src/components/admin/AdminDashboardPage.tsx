'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Gavel,
  Search,
  LogOut,
  Home,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TrendingUp,
  Activity,
  UserPlus,
  AlertTriangle,
  Lock,
  Crown,
  Megaphone,
  X,
  Eye,
  EyeOff,
  Coins,
  ShieldAlert,
  ShieldOff,
  Clock,
  ShoppingCart,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/apiClient'
import { AdminAdminsPanel } from '@/components/admin/AdminAdminsPanel'
import { AdminBannersPanel } from '@/components/admin/AdminBannersPanel'
import { AdminListingsPanel } from '@/components/admin/AdminListingsPanel'
import { AdminCoinsPanel } from '@/components/admin/AdminCoinsPanel'
import { AdminKycPanel } from '@/components/admin/AdminKycPanel'
import { AdminUserModerationModal } from '@/components/admin/AdminUserModerationModal'
import type { AdminStatsResponse, AdminTab, AdminUserRow } from '@/types/admin'

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function KycBadge({ status }: { status: string }) {
  const cls =
    status === 'verified'
      ? 'adm-badge adm-badge--ok'
      : status === 'pending'
        ? 'adm-badge adm-badge--warn'
        : status === 'rejected'
          ? 'adm-badge adm-badge--err'
          : 'adm-badge adm-badge--muted'
  return <span className={cls}>{status.replace('_', ' ')}</span>
}

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === 'admin'
      ? 'adm-badge adm-badge--admin'
      : role === 'seller'
        ? 'adm-badge adm-badge--seller'
        : 'adm-badge adm-badge--muted'
  return <span className={cls}>{role}</span>
}

function AccountStatusBadge({ user }: { user: AdminUserRow }) {
  const status = user.accountStatus ?? 'active'
  if (status === 'banned') {
    return <span className="adm__status-pill adm__status-pill--banned"><ShieldOff size={11} /> Banned</span>
  }
  if (status === 'suspended') {
    return <span className="adm__status-pill adm__status-pill--suspended"><Clock size={11} /> Suspended</span>
  }
  if (user.biddingBlocked) {
    return <span className="adm__status-pill adm__status-pill--blocked"><ShoppingCart size={11} /> Bidding blocked</span>
  }
  return <span className="adm__status-pill adm__status-pill--active">Active</span>
}

const NAV: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'kyc', label: 'Seller Verification', icon: ShieldCheck },
  { id: 'auctions', label: 'Listings', icon: Gavel },
  { id: 'coins', label: 'Coin Store', icon: Coins },
  { id: 'banners', label: 'Promotions', icon: Megaphone },
  { id: 'admins', label: 'Administrators', icon: Crown },
]

export function AdminDashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statsData, setStatsData] = useState<AdminStatsResponse | null>(null)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [userQuery, setUserQuery] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [moderatingUser, setModeratingUser] = useState<AdminUserRow | null>(null)

  /* Create Seller modal state */
  const [showCreateSeller, setShowCreateSeller] = useState(false)
  const [createSellerForm, setCreateSellerForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    businessName: '',
    businessType: '' as '' | 'individual' | 'registered_business' | 'cooperative',
    businessDescription: '',
    preApproved: true,
  })
  const [createSellerSaving, setCreateSellerSaving] = useState(false)
  const [createSellerError, setCreateSellerError] = useState<string | null>(null)
  const [createSellerSuccess, setCreateSellerSuccess] = useState<string | null>(null)
  const [showCreatePw, setShowCreatePw] = useState(false)

  const loadStats = useCallback(async () => {
    const data = await api.get<AdminStatsResponse>('/admin/stats')
    setStatsData(data)
  }, [])

  const loadUsers = useCallback(async (params?: { kycStatus?: string; q?: string }) => {
    const qs = new URLSearchParams()
    if (params?.kycStatus) qs.set('kycStatus', params.kycStatus)
    if (params?.q) qs.set('q', params.q)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    const data = await api.get<{ users: AdminUserRow[] }>(`/admin/users${suffix}`)
    setUsers(data.users)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await loadStats()
      if (tab === 'users') await loadUsers({ q: userQuery || undefined })
    } catch {
      setError('Failed to load admin data. Check your connection and permissions.')
    } finally {
      setLoading(false)
    }
  }, [tab, userQuery, loadStats, loadUsers])

  useEffect(() => {
    void refresh()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  async function patchUser(id: string, body: Record<string, unknown>) {
    setActionId(id)
    try {
      await api.patch(`/admin/users/${id}`, body)
      await refresh()
    } catch {
      setError('Action failed. Please try again.')
    } finally {
      setActionId(null)
    }
  }

  function handleSignOut() {
    logout()
    router.push('/')
  }

  async function handleCreateSeller(e: React.FormEvent) {
    e.preventDefault()
    setCreateSellerError(null)
    if (!createSellerForm.fullName.trim() || !createSellerForm.email.trim() || !createSellerForm.password) {
      setCreateSellerError('Full name, email and password are required.')
      return
    }
    setCreateSellerSaving(true)
    try {
      const created = await api.post<{ user: AdminUserRow }>('/admin/users', createSellerForm)
      setCreateSellerSuccess(`Seller account created for ${created.user.fullName} (${created.user.email}).`)
      setCreateSellerForm({
        fullName: '', email: '', password: '', phone: '', city: '',
        businessName: '', businessType: '', businessDescription: '', preApproved: true,
      })
      await refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setCreateSellerError(msg === 'email_taken' ? 'That email address is already registered.' : 'Failed to create account. Please try again.')
    } finally {
      setCreateSellerSaving(false)
    }
  }

  function openCreateSeller() {
    setCreateSellerError(null)
    setCreateSellerSuccess(null)
    setShowCreateSeller(true)
  }

  const pendingCount = statsData?.stats.pendingKyc ?? 0
  const pendingListingsCount = statsData?.stats.pendingListings ?? 0

  return (
    <div className="adm">
      <aside className="adm__sidebar">
        <div className="adm__brand">
          <div className="adm__brand-mark">BZ</div>
          <div>
            <span className="adm__brand-name">BidZone</span>
            <span className="adm__brand-sub">Admin Console</span>
          </div>
        </div>

        <nav className="adm__nav" aria-label="Admin navigation">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`adm__nav-item${tab === id ? ' adm__nav-item--active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
              {id === 'kyc' && pendingCount > 0 && (
                <span className="adm__nav-badge">{pendingCount}</span>
              )}
              {id === 'auctions' && pendingListingsCount > 0 && (
                <span className="adm__nav-badge">{pendingListingsCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="adm__sidebar-foot">
          <div className="adm__admin-card">
            <div className="adm__admin-avatar">
              {(user?.fullName ?? 'A').slice(0, 2).toUpperCase()}
            </div>
            <div className="adm__admin-meta">
              <span className="adm__admin-name">{user?.fullName}</span>
              <span className="adm__admin-email">{user?.email}</span>
            </div>
          </div>
          <Link href="/home" className="adm__foot-link">
            <Home size={16} /> Marketplace
          </Link>
          <button type="button" className="adm__foot-link adm__foot-link--danger" onClick={handleSignOut}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="adm__main">
        <header className="adm__topbar">
          <div>
            <h1 className="adm__title">{NAV.find((n) => n.id === tab)?.label}</h1>
            <p className="adm__subtitle">Platform management &amp; moderation</p>
          </div>
          <button type="button" className="adm__refresh" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'adm__spin' : ''} />
            Refresh
          </button>
        </header>

        {error && (
          <div className="adm__alert" role="alert">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {loading && !statsData ? (
          <div className="adm__loading">
            <div className="adm__loading-ring" aria-hidden />
            <p>Loading admin data…</p>
          </div>
        ) : (
          <>
            {tab === 'overview' && statsData && (
              <div className="adm__panel">
                <div className="adm__kpi-grid">
                  <div className="adm__kpi adm__kpi--gold">
                    <Users size={22} />
                    <div>
                      <span className="adm__kpi-val">{statsData.stats.totalUsers}</span>
                      <span className="adm__kpi-lbl">Total users</span>
                    </div>
                    <span className="adm__kpi-delta">
                      <UserPlus size={14} /> +{statsData.stats.newUsersWeek} this week
                    </span>
                  </div>
                  <div className="adm__kpi">
                    <ShieldCheck size={22} />
                    <div>
                      <span className="adm__kpi-val">{statsData.stats.pendingKyc}</span>
                      <span className="adm__kpi-lbl">Pending sellers</span>
                    </div>
                  </div>
                  <div className="adm__kpi">
                    <Gavel size={22} />
                    <div>
                      <span className="adm__kpi-val">{statsData.stats.activeAuctions}</span>
                      <span className="adm__kpi-lbl">Active auctions</span>
                    </div>
                  </div>
                  <div className="adm__kpi">
                    <Activity size={22} />
                    <div>
                      <span className="adm__kpi-val">{statsData.stats.bidsToday}</span>
                      <span className="adm__kpi-lbl">Bids today</span>
                    </div>
                  </div>
                </div>

                <div className="adm__split">
                  <section className="adm__card">
                    <div className="adm__card-head">
                      <h2><TrendingUp size={18} /> Platform snapshot</h2>
                    </div>
                    <ul className="adm__stat-list">
                      <li><span>Bidders</span><strong>{statsData.stats.bidders}</strong></li>
                      <li><span>Sellers</span><strong>{statsData.stats.sellers}</strong></li>
                      <li><span>Administrators</span><strong>{statsData.stats.admins}</strong></li>
                      <li><span>Total listings</span><strong>{statsData.stats.totalAuctions}</strong></li>
                      <li><span>Total bids</span><strong>{statsData.stats.totalBids}</strong></li>
                      <li><span>Rejected verifications</span><strong>{statsData.stats.rejectedKyc}</strong></li>
                    </ul>
                  </section>

                  <section className="adm__card">
                    <div className="adm__card-head">
                      <h2><Lock size={18} /> Security model</h2>
                    </div>
                    <ul className="adm__security-list">
                      <li>Admin access is controlled by the <code>ADMIN_EMAILS</code> environment allowlist — never hardcoded in source.</li>
                      <li>Every admin API validates JWT, database role, and allowlist (defense in depth).</li>
                      <li>Main admins (<code>ADMIN_EMAILS</code>) cannot be demoted; delegated admins can be managed in Administrators.</li>
                      <li>Users cannot self-promote to admin or self-verify KYC privileges.</li>
                      <li>Admin accounts cannot be modified from this panel.</li>
                    </ul>
                  </section>
                </div>

                <div className="adm__split">
                  <section className="adm__card">
                    <div className="adm__card-head">
                      <h2>Recent sign-ups</h2>
                    </div>
                    <div className="adm__table-wrap">
                      <table className="adm__table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Verification</th>
                            <th>Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statsData.recentUsers.map((u) => (
                            <tr key={u.id}>
                              <td>
                                <span className="adm__cell-main">{u.fullName}</span>
                                <span className="adm__cell-sub">{u.email}</span>
                              </td>
                              <td><RoleBadge role={u.role} /></td>
                              <td><KycBadge status={u.kycStatus} /></td>
                              <td>{formatDate(u.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="adm__card">
                    <div className="adm__card-head">
                      <h2>Recent listings</h2>
                    </div>
                    <div className="adm__table-wrap">
                      <table className="adm__table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Bid</th>
                            <th>Seller</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statsData.recentAuctions.map((a) => (
                            <tr key={a.id}>
                              <td>
                                <span className="adm__cell-main">{a.title}</span>
                                {a.featured && <span className="adm__featured-tag">Featured</span>}
                              </td>
                              <td>{formatMoney(a.currentBid)}</td>
                              <td>{a.sellerName ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {tab === 'users' && (
              <div className="adm__panel">
                <div className="adm__toolbar">
                  <div className="adm__search">
                    <Search size={16} />
                    <input
                      type="search"
                      placeholder="Search by name or email…"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void loadUsers({ q: userQuery || undefined })}
                    />
                  </div>
                  <button type="button" className="adm__btn adm__btn--ghost" onClick={() => void loadUsers({ q: userQuery || undefined })}>
                    Search
                  </button>
                  <button type="button" className="adm__btn adm__btn--primary" onClick={openCreateSeller}>
                    <UserPlus size={15} /> Create Seller
                  </button>
                </div>
                <div className="adm__card adm__card--flush">
                  <div className="adm__table-wrap">
                    <table className="adm__table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Verification</th>
                          <th>Status</th>
                          <th>Joined</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <span className="adm__cell-main">{u.fullName}</span>
                              <span className="adm__cell-sub">{u.email}</span>
                            </td>
                            <td><RoleBadge role={u.role} /></td>
                            <td><KycBadge status={u.kycStatus} /></td>
                            <td><AccountStatusBadge user={u} /></td>
                            <td>{formatDate(u.createdAt)}</td>
                            <td>
                              {u.role !== 'admin' && (
                                <div className="adm__row-actions">
                                  {u.kycStatus === 'pending' && (
                                    <>
                                      <button
                                        type="button"
                                        className="adm__icon-btn adm__icon-btn--ok"
                                        title="Approve seller"
                                        disabled={actionId === u.id}
                                        onClick={() => void patchUser(u.id, { kycStatus: 'verified' })}
                                      >
                                        <CheckCircle2 size={16} />
                                      </button>
                                      <button
                                        type="button"
                                        className="adm__icon-btn adm__icon-btn--err"
                                        title="Reject seller"
                                        disabled={actionId === u.id}
                                        onClick={() => void patchUser(u.id, { kycStatus: 'rejected' })}
                                      >
                                        <XCircle size={16} />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    className="adm__icon-btn"
                                    title="Manage user (ban / suspend / warn / roles)"
                                    onClick={() => setModeratingUser(u)}
                                  >
                                    <ShieldAlert size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === 'kyc' && (
              <AdminKycPanel onError={setError} onDecided={() => void loadStats()} />
            )}

            {tab === 'auctions' && (
              <AdminListingsPanel
                onError={setError}
                actionId={actionId}
                setActionId={setActionId}
              />
            )}

            {tab === 'admins' && (
              <AdminAdminsPanel
                onError={setError}
                actionId={actionId}
                setActionId={setActionId}
              />
            )}

            {tab === 'banners' && (
              <AdminBannersPanel
                onError={setError}
                actionId={actionId}
                setActionId={setActionId}
              />
            )}

            {tab === 'coins' && <AdminCoinsPanel onError={setError} />}
          </>
        )}
      </div>

      {/* ── Create Seller Modal ── */}
      {showCreateSeller && (
        <div className="adm__modal-overlay" role="dialog" aria-modal="true" aria-labelledby="create-seller-title">
          <div className="adm__modal">
            <div className="adm__modal-head">
              <h2 id="create-seller-title"><UserPlus size={18} /> Create Seller Account</h2>
              <button type="button" className="adm__modal-close" aria-label="Close" onClick={() => setShowCreateSeller(false)}>
                <X size={18} />
              </button>
            </div>

            {createSellerSuccess ? (
              <div className="adm__modal-body">
                <div className="adm__modal-success">
                  <CheckCircle2 size={40} />
                  <p>{createSellerSuccess}</p>
                  <button type="button" className="adm__btn adm__btn--primary" onClick={() => setShowCreateSeller(false)}>
                    Done
                  </button>
                  <button
                    type="button"
                    className="adm__btn adm__btn--ghost"
                    onClick={() => { setCreateSellerSuccess(null) }}
                  >
                    Create Another
                  </button>
                </div>
              </div>
            ) : (
              <form className="adm__modal-body" onSubmit={handleCreateSeller}>
                {createSellerError && (
                  <div className="adm__alert" role="alert">
                    <AlertTriangle size={16} /> {createSellerError}
                  </div>
                )}

                <p className="adm__modal-hint">
                  Create a seller account directly. If <strong>Pre-approved</strong> is on, the account is immediately verified and can list items without going through KYC review.
                </p>

                <div className="adm__form-section-label">Account Details</div>
                <div className="adm__form-row">
                  <div className="adm__form-group">
                    <label className="adm__form-label">Full Name <span className="adm__req">*</span></label>
                    <input
                      type="text"
                      className="adm__form-input"
                      placeholder="e.g. Jane Smith"
                      value={createSellerForm.fullName}
                      onChange={e => setCreateSellerForm(p => ({ ...p, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="adm__form-group">
                    <label className="adm__form-label">Email Address <span className="adm__req">*</span></label>
                    <input
                      type="email"
                      className="adm__form-input"
                      placeholder="seller@example.com"
                      value={createSellerForm.email}
                      onChange={e => setCreateSellerForm(p => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="adm__form-group">
                  <label className="adm__form-label">Password <span className="adm__req">*</span></label>
                  <div className="adm__form-pw-wrap">
                    <input
                      type={showCreatePw ? 'text' : 'password'}
                      className="adm__form-input"
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      value={createSellerForm.password}
                      onChange={e => setCreateSellerForm(p => ({ ...p, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className="adm__form-pw-toggle"
                      aria-label={showCreatePw ? 'Hide password' : 'Show password'}
                      onClick={() => setShowCreatePw(v => !v)}
                    >
                      {showCreatePw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="adm__form-row">
                  <div className="adm__form-group">
                    <label className="adm__form-label">Phone</label>
                    <input
                      type="tel"
                      className="adm__form-input"
                      placeholder="+1 555 000 0000"
                      value={createSellerForm.phone}
                      onChange={e => setCreateSellerForm(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <div className="adm__form-group">
                    <label className="adm__form-label">City</label>
                    <input
                      type="text"
                      className="adm__form-input"
                      placeholder="City"
                      value={createSellerForm.city}
                      onChange={e => setCreateSellerForm(p => ({ ...p, city: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="adm__form-section-label" style={{ marginTop: '1rem' }}>Business Profile</div>
                <div className="adm__form-row">
                  <div className="adm__form-group">
                    <label className="adm__form-label">Business Name</label>
                    <input
                      type="text"
                      className="adm__form-input"
                      placeholder="Trading name"
                      value={createSellerForm.businessName}
                      onChange={e => setCreateSellerForm(p => ({ ...p, businessName: e.target.value }))}
                    />
                  </div>
                  <div className="adm__form-group">
                    <label className="adm__form-label">Business Type</label>
                    <select
                      className="adm__form-select"
                      value={createSellerForm.businessType}
                      onChange={e => setCreateSellerForm(p => ({ ...p, businessType: e.target.value as typeof createSellerForm.businessType }))}
                    >
                      <option value="">Select type…</option>
                      <option value="individual">Individual / Sole Trader</option>
                      <option value="registered_business">Registered Business</option>
                      <option value="cooperative">Cooperative / Partnership</option>
                    </select>
                  </div>
                </div>

                <div className="adm__form-group">
                  <label className="adm__form-label">Business Description</label>
                  <textarea
                    className="adm__form-textarea"
                    rows={2}
                    placeholder="Brief description of products or expertise…"
                    value={createSellerForm.businessDescription}
                    onChange={e => setCreateSellerForm(p => ({ ...p, businessDescription: e.target.value }))}
                  />
                </div>

                <div className="adm__form-toggle-row">
                  <label className="adm__form-toggle-label" htmlFor="pre-approved-toggle">
                    <div>
                      <span>Pre-approve account</span>
                      <span className="adm__form-toggle-sub">Account is immediately verified — seller can list items right away. Turn off to require standard KYC review.</span>
                    </div>
                  </label>
                  <div
                    id="pre-approved-toggle"
                    role="checkbox"
                    aria-checked={createSellerForm.preApproved}
                    tabIndex={0}
                    className={`adm__toggle${createSellerForm.preApproved ? ' adm__toggle--on' : ''}`}
                    onClick={() => setCreateSellerForm(p => ({ ...p, preApproved: !p.preApproved }))}
                    onKeyDown={e => e.key === ' ' && setCreateSellerForm(p => ({ ...p, preApproved: !p.preApproved }))}
                  >
                    <div className="adm__toggle-thumb" />
                  </div>
                </div>

                <div className="adm__modal-foot">
                  <button type="button" className="adm__btn adm__btn--ghost" onClick={() => setShowCreateSeller(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="adm__btn adm__btn--primary" disabled={createSellerSaving}>
                    {createSellerSaving
                      ? <><RefreshCw size={14} className="adm__spin" /> Creating…</>
                      : <><UserPlus size={14} /> Create Seller</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {moderatingUser && (
        <AdminUserModerationModal
          user={moderatingUser}
          onClose={() => setModeratingUser(null)}
          onDone={() => {
            void loadUsers({ q: userQuery || undefined })
            void loadStats()
          }}
        />
      )}
    </div>
  )
}
