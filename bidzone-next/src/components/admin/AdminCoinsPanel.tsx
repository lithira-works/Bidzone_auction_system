'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Coins, Plus, Trash2, Pencil, Save, X, RefreshCw, Settings2,
  CreditCard, DollarSign, TrendingUp, ShoppingCart, CheckCircle2,
} from 'lucide-react'
import { api } from '@/lib/apiClient'
import { BcCoin } from '@/components/ui/BcCoin'

type Props = {
  onError: (msg: string) => void
}

/* ── API row types ── */
type PkgRow = {
  id: string
  name: string
  bcAmount: number
  bonusBc: number
  totalBc: number
  priceUSD: number
  badge: string
  tier: string
  active: boolean
  sortOrder: number
}

type SettingsRow = {
  customEnabled: boolean
  customMinBc: number
  customMaxBc: number
  usdPerBc: number
  dailyPurchaseCapBc: number
  maxWalletBc: number
  updatedBy: string
  updatedAt: string | null
}

type GatewayRow = {
  id: string
  name: string
  provider: string
  feePercent: number
  enabled: boolean
  sortOrder: number
}

type TxRow = {
  id: string
  bcAmount: number
  priceUSD: number | null
  reference: string
  packageName: string
  gatewayName: string
  createdAt: string
}

type CoinAdminData = {
  packages: PkgRow[]
  settings: SettingsRow | null
  gateways: GatewayRow[]
  recentTransactions: TxRow[]
  stats: { totalRevenueUSD: number; totalBcSold: number; purchases: number }
}

type PkgForm = {
  name: string
  bcAmount: string
  bonusBc: string
  priceUSD: string
  badge: string
  tier: string
  sortOrder: string
}

const EMPTY_PKG: PkgForm = { name: '', bcAmount: '', bonusBc: '0', priceUSD: '', badge: '', tier: 'starter', sortOrder: '99' }
const TIERS = ['starter', 'bronze', 'silver', 'gold', 'platinum', 'diamond']
const PROVIDERS = [
  { value: 'card', label: 'Card' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_wallet', label: 'Mobile Wallet' },
  { value: 'crypto', label: 'Crypto' },
]

const fmtBc = (n: number) => n.toLocaleString('en-US')
const fmtUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export function AdminCoinsPanel({ onError }: Props) {
  const [data, setData] = useState<CoinAdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  /* package form */
  const [showPkgForm, setShowPkgForm] = useState(false)
  const [editPkgId, setEditPkgId] = useState<string | null>(null)
  const [pkgForm, setPkgForm] = useState<PkgForm>(EMPTY_PKG)
  const [pkgSaving, setPkgSaving] = useState(false)

  /* settings form */
  const [settingsForm, setSettingsForm] = useState({
    customEnabled: true,
    customMinBc: '100',
    customMaxBc: '50000',
    usdPerBc: '0.01',
    dailyPurchaseCapBc: '100000',
    maxWalletBc: '1000000',
  })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  /* gateway form */
  const [showGwForm, setShowGwForm] = useState(false)
  const [gwForm, setGwForm] = useState({ name: '', provider: 'card', feePercent: '0' })
  const [gwSaving, setGwSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<CoinAdminData>('/admin/coins')
      setData(res)
      if (res.settings) {
        setSettingsForm({
          customEnabled: res.settings.customEnabled,
          customMinBc: String(res.settings.customMinBc),
          customMaxBc: String(res.settings.customMaxBc),
          usdPerBc: String(res.settings.usdPerBc),
          dailyPurchaseCapBc: String(res.settings.dailyPurchaseCapBc),
          maxWalletBc: String(res.settings.maxWalletBc),
        })
      }
    } catch {
      onError('Failed to load coin store data.')
    } finally {
      setLoading(false)
    }
  }, [onError])

  useEffect(() => { void load() }, [load])

  /* ── Package handlers ── */
  function openCreatePkg() {
    setEditPkgId(null)
    setPkgForm(EMPTY_PKG)
    setShowPkgForm(true)
  }

  function openEditPkg(p: PkgRow) {
    setEditPkgId(p.id)
    setPkgForm({
      name: p.name,
      bcAmount: String(p.bcAmount),
      bonusBc: String(p.bonusBc),
      priceUSD: String(p.priceUSD),
      badge: p.badge,
      tier: p.tier,
      sortOrder: String(p.sortOrder),
    })
    setShowPkgForm(true)
  }

  async function savePkg() {
    const payload = {
      name: pkgForm.name,
      bcAmount: Number(pkgForm.bcAmount),
      bonusBc: Number(pkgForm.bonusBc) || 0,
      priceUSD: Number(pkgForm.priceUSD),
      badge: pkgForm.badge,
      tier: pkgForm.tier,
      sortOrder: Number(pkgForm.sortOrder) || 99,
    }
    if (!payload.name.trim() || !payload.bcAmount || !payload.priceUSD) {
      onError('Package name, BC amount and price are required.')
      return
    }
    setPkgSaving(true)
    try {
      if (editPkgId) {
        await api.patch(`/admin/coins/packages/${editPkgId}`, payload)
      } else {
        await api.post('/admin/coins', payload)
      }
      setShowPkgForm(false)
      await load()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save package.')
    } finally {
      setPkgSaving(false)
    }
  }

  async function togglePkgActive(p: PkgRow) {
    setBusyId(p.id)
    try {
      await api.patch(`/admin/coins/packages/${p.id}`, { active: !p.active })
      await load()
    } catch {
      onError('Failed to update package.')
    } finally {
      setBusyId(null)
    }
  }

  async function deletePkg(p: PkgRow) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    setBusyId(p.id)
    try {
      await api.delete(`/admin/coins/packages/${p.id}`)
      await load()
    } catch {
      onError('Failed to delete package.')
    } finally {
      setBusyId(null)
    }
  }

  /* ── Settings handler ── */
  async function saveSettings() {
    setSettingsSaving(true)
    setSettingsSaved(false)
    try {
      await api.patch('/admin/coins', {
        customEnabled: settingsForm.customEnabled,
        customMinBc: Number(settingsForm.customMinBc),
        customMaxBc: Number(settingsForm.customMaxBc),
        usdPerBc: Number(settingsForm.usdPerBc),
        dailyPurchaseCapBc: Number(settingsForm.dailyPurchaseCapBc),
        maxWalletBc: Number(settingsForm.maxWalletBc),
      })
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2500)
      await load()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save settings.')
    } finally {
      setSettingsSaving(false)
    }
  }

  /* ── Gateway handlers ── */
  async function saveGateway() {
    if (!gwForm.name.trim()) { onError('Gateway name is required.'); return }
    setGwSaving(true)
    try {
      await api.post('/admin/coins/gateways', {
        name: gwForm.name,
        provider: gwForm.provider,
        feePercent: Number(gwForm.feePercent) || 0,
      })
      setShowGwForm(false)
      setGwForm({ name: '', provider: 'card', feePercent: '0' })
      await load()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to add gateway.')
    } finally {
      setGwSaving(false)
    }
  }

  async function toggleGateway(g: GatewayRow) {
    setBusyId(g.id)
    try {
      await api.patch(`/admin/coins/gateways/${g.id}`, { enabled: !g.enabled })
      await load()
    } catch {
      onError('Failed to update gateway.')
    } finally {
      setBusyId(null)
    }
  }

  async function deleteGateway(g: GatewayRow) {
    if (!window.confirm(`Remove "${g.name}" payment option?`)) return
    setBusyId(g.id)
    try {
      await api.delete(`/admin/coins/gateways/${g.id}`)
      await load()
    } catch {
      onError('Failed to remove gateway.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading && !data) {
    return (
      <div className="adm__coins-loading">
        <RefreshCw size={22} className="adm__spin" />
      </div>
    )
  }

  return (
    <div className="adm__coins">

      {/* ── Revenue stats ── */}
      <div className="adm__coins-stats">
        <article className="adm__coins-stat">
          <div className="adm__coins-stat-icon adm__coins-stat-icon--gold"><DollarSign size={18} /></div>
          <div>
            <p className="adm__coins-stat-label">Coin Revenue</p>
            <p className="adm__coins-stat-value">{fmtUsd(data?.stats.totalRevenueUSD ?? 0)}</p>
          </div>
        </article>
        <article className="adm__coins-stat">
          <div className="adm__coins-stat-icon adm__coins-stat-icon--blue"><Coins size={18} /></div>
          <div>
            <p className="adm__coins-stat-label">BC Sold</p>
            <p className="adm__coins-stat-value">{fmtBc(data?.stats.totalBcSold ?? 0)}</p>
          </div>
        </article>
        <article className="adm__coins-stat">
          <div className="adm__coins-stat-icon adm__coins-stat-icon--green"><ShoppingCart size={18} /></div>
          <div>
            <p className="adm__coins-stat-label">Purchases</p>
            <p className="adm__coins-stat-value">{fmtBc(data?.stats.purchases ?? 0)}</p>
          </div>
        </article>
      </div>

      {/* ── Packages ── */}
      <section className="adm__card">
        <div className="adm__card-head">
          <h2><Coins size={16} /> Coin Packages</h2>
          <button type="button" className="adm__btn adm__btn--gold" onClick={openCreatePkg}>
            <Plus size={14} /> New Package
          </button>
        </div>

        {showPkgForm && (
          <div className="adm__coins-form">
            <div className="adm__coins-form-head">
              <h3>{editPkgId ? 'Edit Package' : 'Create Package'}</h3>
              <button type="button" className="adm__coins-form-close" onClick={() => setShowPkgForm(false)}><X size={15} /></button>
            </div>
            <div className="adm__coins-form-grid">
              <label>
                Name *
                <input type="text" value={pkgForm.name} maxLength={60}
                  onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))} placeholder="Gold Pack" />
              </label>
              <label>
                BC Amount *
                <input type="number" min={1} value={pkgForm.bcAmount}
                  onChange={e => setPkgForm(f => ({ ...f, bcAmount: e.target.value }))} placeholder="6500" />
              </label>
              <label>
                Bonus BC
                <input type="number" min={0} value={pkgForm.bonusBc}
                  onChange={e => setPkgForm(f => ({ ...f, bonusBc: e.target.value }))} placeholder="750" />
              </label>
              <label>
                Price USD *
                <input type="number" min={0.01} step={0.01} value={pkgForm.priceUSD}
                  onChange={e => setPkgForm(f => ({ ...f, priceUSD: e.target.value }))} placeholder="49.99" />
              </label>
              <label>
                Badge
                <input type="text" value={pkgForm.badge} maxLength={30}
                  onChange={e => setPkgForm(f => ({ ...f, badge: e.target.value }))} placeholder="Best Value" />
              </label>
              <label>
                Tier
                <select value={pkgForm.tier} onChange={e => setPkgForm(f => ({ ...f, tier: e.target.value }))}>
                  {TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </label>
              <label>
                Sort Order
                <input type="number" value={pkgForm.sortOrder}
                  onChange={e => setPkgForm(f => ({ ...f, sortOrder: e.target.value }))} />
              </label>
            </div>
            <div className="adm__coins-form-actions">
              <button type="button" className="adm__btn adm__btn--ghost" onClick={() => setShowPkgForm(false)}>Cancel</button>
              <button type="button" className="adm__btn adm__btn--gold" disabled={pkgSaving} onClick={() => void savePkg()}>
                {pkgSaving ? <RefreshCw size={13} className="adm__spin" /> : <Save size={13} />}
                {editPkgId ? 'Save Changes' : 'Create Package'}
              </button>
            </div>
          </div>
        )}

        <div className="adm__coins-pkg-list">
          {(data?.packages ?? []).map(p => (
            <div key={p.id} className={`adm__coins-pkg${!p.active ? ' adm__coins-pkg--off' : ''}`}>
              <div className="adm__coins-pkg-coin"><BcCoin size={30} /></div>
              <div className="adm__coins-pkg-main">
                <span className="adm__coins-pkg-name">
                  {p.name}
                  {p.badge && <em className="adm__coins-pkg-badge">{p.badge}</em>}
                  {!p.active && <em className="adm__coins-pkg-inactive">Inactive</em>}
                </span>
                <span className="adm__coins-pkg-sub">
                  {fmtBc(p.bcAmount)} BC{p.bonusBc > 0 && ` + ${fmtBc(p.bonusBc)} bonus`} · {fmtUsd(p.priceUSD)} · tier: {p.tier} · order: {p.sortOrder}
                </span>
              </div>
              <div className="adm__coins-pkg-actions">
                <button type="button" className="adm__btn adm__btn--sm adm__btn--ghost" disabled={busyId === p.id}
                  onClick={() => void togglePkgActive(p)}>
                  {p.active ? 'Disable' : 'Enable'}
                </button>
                <button type="button" className="adm__btn adm__btn--sm adm__btn--ghost" onClick={() => openEditPkg(p)}>
                  <Pencil size={12} />
                </button>
                <button type="button" className="adm__btn adm__btn--sm adm__btn--err" disabled={busyId === p.id}
                  onClick={() => void deletePkg(p)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Custom amount + caps settings ── */}
      <section className="adm__card">
        <div className="adm__card-head">
          <h2><Settings2 size={16} /> Custom Amount &amp; Purchase Caps</h2>
          {settingsSaved && <span className="adm-badge adm-badge--ok"><CheckCircle2 size={11} /> Saved</span>}
        </div>

        <div className="adm__coins-form-grid">
          <label className="adm__coins-toggle-label">
            <span>Custom amounts enabled</span>
            <button
              type="button"
              className={`adm__toggle${settingsForm.customEnabled ? ' adm__toggle--on' : ''}`}
              onClick={() => setSettingsForm(f => ({ ...f, customEnabled: !f.customEnabled }))}
              aria-pressed={settingsForm.customEnabled}
            >
              <span className="adm__toggle-thumb" />
            </button>
          </label>
          <label>
            Min custom BC
            <input type="number" min={1} value={settingsForm.customMinBc}
              onChange={e => setSettingsForm(f => ({ ...f, customMinBc: e.target.value }))} />
          </label>
          <label>
            Max custom BC
            <input type="number" min={1} value={settingsForm.customMaxBc}
              onChange={e => setSettingsForm(f => ({ ...f, customMaxBc: e.target.value }))} />
          </label>
          <label>
            USD per 1 BC
            <input type="number" min={0.0001} step={0.001} value={settingsForm.usdPerBc}
              onChange={e => setSettingsForm(f => ({ ...f, usdPerBc: e.target.value }))} />
          </label>
          <label>
            Daily purchase cap BC (0 = unlimited)
            <input type="number" min={0} value={settingsForm.dailyPurchaseCapBc}
              onChange={e => setSettingsForm(f => ({ ...f, dailyPurchaseCapBc: e.target.value }))} />
          </label>
          <label>
            Max wallet BC (0 = unlimited)
            <input type="number" min={0} value={settingsForm.maxWalletBc}
              onChange={e => setSettingsForm(f => ({ ...f, maxWalletBc: e.target.value }))} />
          </label>
        </div>

        <div className="adm__coins-form-actions">
          <button type="button" className="adm__btn adm__btn--gold" disabled={settingsSaving} onClick={() => void saveSettings()}>
            {settingsSaving ? <RefreshCw size={13} className="adm__spin" /> : <Save size={13} />}
            Save Settings
          </button>
        </div>
      </section>

      {/* ── Payment gateways ── */}
      <section className="adm__card">
        <div className="adm__card-head">
          <h2><CreditCard size={16} /> Payment Gateways</h2>
          <button type="button" className="adm__btn adm__btn--gold" onClick={() => setShowGwForm(v => !v)}>
            <Plus size={14} /> Add Gateway
          </button>
        </div>

        {showGwForm && (
          <div className="adm__coins-form">
            <div className="adm__coins-form-grid">
              <label>
                Name *
                <input type="text" value={gwForm.name} maxLength={60}
                  onChange={e => setGwForm(f => ({ ...f, name: e.target.value }))} placeholder="Credit / Debit Card" />
              </label>
              <label>
                Provider
                <select value={gwForm.provider} onChange={e => setGwForm(f => ({ ...f, provider: e.target.value }))}>
                  {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
              <label>
                Fee %
                <input type="number" min={0} max={30} step={0.1} value={gwForm.feePercent}
                  onChange={e => setGwForm(f => ({ ...f, feePercent: e.target.value }))} />
              </label>
            </div>
            <div className="adm__coins-form-actions">
              <button type="button" className="adm__btn adm__btn--ghost" onClick={() => setShowGwForm(false)}>Cancel</button>
              <button type="button" className="adm__btn adm__btn--gold" disabled={gwSaving} onClick={() => void saveGateway()}>
                {gwSaving ? <RefreshCw size={13} className="adm__spin" /> : <Save size={13} />} Add
              </button>
            </div>
          </div>
        )}

        <div className="adm__coins-pkg-list">
          {(data?.gateways ?? []).map(g => (
            <div key={g.id} className={`adm__coins-pkg${!g.enabled ? ' adm__coins-pkg--off' : ''}`}>
              <div className="adm__coins-pkg-coin adm__coins-gw-icon"><CreditCard size={18} /></div>
              <div className="adm__coins-pkg-main">
                <span className="adm__coins-pkg-name">
                  {g.name}
                  {!g.enabled && <em className="adm__coins-pkg-inactive">Disabled</em>}
                </span>
                <span className="adm__coins-pkg-sub">
                  {g.provider.replace('_', ' ')} · fee {g.feePercent}%
                </span>
              </div>
              <div className="adm__coins-pkg-actions">
                <button type="button" className="adm__btn adm__btn--sm adm__btn--ghost" disabled={busyId === g.id}
                  onClick={() => void toggleGateway(g)}>
                  {g.enabled ? 'Disable' : 'Enable'}
                </button>
                <button type="button" className="adm__btn adm__btn--sm adm__btn--err" disabled={busyId === g.id}
                  onClick={() => void deleteGateway(g)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recent purchases ── */}
      <section className="adm__card">
        <div className="adm__card-head">
          <h2><TrendingUp size={16} /> Recent Coin Purchases</h2>
          <button type="button" className="adm__btn adm__btn--sm adm__btn--ghost" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={12} className={loading ? 'adm__spin' : ''} />
          </button>
        </div>
        {(data?.recentTransactions ?? []).length === 0 ? (
          <p className="adm__coins-empty">No purchases yet.</p>
        ) : (
          <div className="adm__table-wrap">
            <table className="adm__table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Package</th>
                  <th>BC</th>
                  <th>Paid</th>
                  <th>Gateway</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentTransactions ?? []).map(tx => (
                  <tr key={tx.id}>
                    <td className="adm__coins-ref">{tx.reference}</td>
                    <td>{tx.packageName}</td>
                    <td>{fmtBc(tx.bcAmount)}</td>
                    <td>{tx.priceUSD != null ? fmtUsd(tx.priceUSD) : '—'}</td>
                    <td>{tx.gatewayName}</td>
                    <td>{new Date(tx.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
