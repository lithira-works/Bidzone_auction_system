'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ShieldCheck, Zap, CreditCard, Landmark, Wallet as WalletIcon,
  Bitcoin, CheckCircle2, AlertCircle, RefreshCw, X, Receipt, Sparkles,
  History, TrendingUp, TrendingDown, Lock,
} from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { BcCoin } from '@/components/ui/BcCoin'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/apiClient'

/* ── types (mirror API serializers) ── */
type CoinPackage = {
  id: string
  name: string
  bcAmount: number
  bonusBc: number
  totalBc: number
  priceUSD: number
  badge: string
  tier: 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
}

type CoinSettings = {
  customEnabled: boolean
  customMinBc: number
  customMaxBc: number
  usdPerBc: number
  dailyPurchaseCapBc: number
  maxWalletBc: number
}

type Gateway = {
  id: string
  name: string
  provider: 'card' | 'paypal' | 'bank_transfer' | 'mobile_wallet' | 'crypto'
  feePercent: number
}

type CoinTx = {
  id: string
  type: string
  bcAmount: number
  balanceAfter: number
  priceUSD: number | null
  reference: string
  packageName: string
  gatewayName: string
  auctionTitle: string
  status: string
  note: string
  createdAt: string
}

const fmtBc = (n: number) => n.toLocaleString('en-US')
const fmtUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

function gatewayIcon(provider: Gateway['provider']) {
  switch (provider) {
    case 'card': return <CreditCard size={17} />
    case 'paypal': return <WalletIcon size={17} />
    case 'bank_transfer': return <Landmark size={17} />
    case 'mobile_wallet': return <WalletIcon size={17} />
    case 'crypto': return <Bitcoin size={17} />
  }
}

function txMeta(tx: CoinTx): { label: string; positive: boolean } {
  switch (tx.type) {
    case 'purchase':     return { label: tx.packageName || 'BC Purchase', positive: true }
    case 'bid_hold':     return { label: `Bid hold — ${tx.auctionTitle}`, positive: false }
    case 'bid_release':  return { label: `Escrow released — ${tx.auctionTitle}`, positive: true }
    case 'spend':        return { label: `Won auction — ${tx.auctionTitle}`, positive: false }
    case 'refund':       return { label: 'Refund', positive: true }
    case 'admin_credit': return { label: 'Admin credit', positive: true }
    case 'admin_debit':  return { label: 'Admin adjustment', positive: false }
    default:             return { label: tx.type, positive: tx.bcAmount >= 0 }
  }
}

export function CoinStorePage() {
  const { updateUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [packages, setPackages] = useState<CoinPackage[]>([])
  const [settings, setSettings] = useState<CoinSettings | null>(null)
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [balance, setBalance] = useState(0)

  /* selection state */
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage | null>(null)
  const [customBc, setCustomBc] = useState('')
  const [customActive, setCustomActive] = useState(false)
  const [gatewayId, setGatewayId] = useState('')

  /* checkout state */
  const [confirming, setConfirming] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<CoinTx | null>(null)

  /* history */
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [transactions, setTransactions] = useState<CoinTx[]>([])

  const loadStore = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await api.get<{
        packages: CoinPackage[]
        settings: CoinSettings | null
        gateways: Gateway[]
        balance: number
      }>('/coins/store')
      setPackages(data.packages)
      setSettings(data.settings)
      setGateways(data.gateways)
      setBalance(data.balance)
      if (data.gateways.length && !gatewayId) setGatewayId(data.gateways[0].id)
    } catch {
      setLoadError('Could not load the coin store. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [gatewayId])

  useEffect(() => { void loadStore() }, [loadStore])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const data = await api.get<{ transactions: CoinTx[]; balance: number }>('/coins/transactions')
      setTransactions(data.transactions)
      setBalance(data.balance)
    } catch { /* non-critical */ }
    finally { setHistoryLoading(false) }
  }, [])

  useEffect(() => { if (showHistory) void loadHistory() }, [showHistory, loadHistory])

  /* ── derived checkout summary ── */
  const customAmount = Math.floor(Number(customBc) || 0)

  const customValid = settings
    ? customAmount >= settings.customMinBc && customAmount <= settings.customMaxBc
    : false

  const order = useMemo(() => {
    if (selectedPkg) {
      return { bc: selectedPkg.totalBc, price: selectedPkg.priceUSD, label: selectedPkg.name }
    }
    if (customActive && customValid && settings) {
      return {
        bc: customAmount,
        price: Math.round(customAmount * settings.usdPerBc * 100) / 100,
        label: 'Custom Amount',
      }
    }
    return null
  }, [selectedPkg, customActive, customValid, customAmount, settings])

  const selectedGateway = gateways.find(g => g.id === gatewayId) ?? null
  const gatewayFee = order && selectedGateway
    ? Math.round(order.price * (selectedGateway.feePercent / 100) * 100) / 100
    : 0
  const orderTotal = order ? Math.round((order.price + gatewayFee) * 100) / 100 : 0

  function pickPackage(pkg: CoinPackage) {
    setSelectedPkg(pkg)
    setCustomActive(false)
    setPurchaseError(null)
  }

  function activateCustom() {
    setSelectedPkg(null)
    setCustomActive(true)
    setPurchaseError(null)
  }

  async function confirmPurchase() {
    if (!order || !selectedGateway) return
    setPurchasing(true)
    setPurchaseError(null)
    try {
      const payload = selectedPkg
        ? { packageId: selectedPkg.id, gatewayId: selectedGateway.id }
        : { customBc: customAmount, gatewayId: selectedGateway.id }
      const res = await api.post<{ transaction: CoinTx; balance: number; charged: number }>(
        '/coins/purchase',
        payload,
      )
      setBalance(res.balance)
      updateUser({ bcBalance: res.balance })
      setReceipt(res.transaction)
      setConfirming(false)
      setSelectedPkg(null)
      setCustomBc('')
      setCustomActive(false)
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <div className="coins">
      <SiteHeader />

      <main className="coins__main">
        {/* ── Hero / wallet strip ── */}
        <section className="coins__hero">
          <div className="coins__hero-left">
            <Link href="/home" className="coins__back">
              <ArrowLeft size={15} /> Marketplace
            </Link>
            <h1 className="coins__title">
              <Sparkles size={22} className="coins__title-spark" />
              BidZone Coin Store
            </h1>
            <p className="coins__subtitle">
              BidZone Currency (BC) powers every bid. Top up your wallet securely and start winning auctions.
            </p>
          </div>

          <div className="coins__wallet-card">
            <div className="coins__wallet-coin"><BcCoin size={44} /></div>
            <div className="coins__wallet-info">
              <span className="coins__wallet-label">Your Balance</span>
              <span className="coins__wallet-value">{fmtBc(balance)} <em>BC</em></span>
            </div>
            <button type="button" className="coins__wallet-history" onClick={() => setShowHistory(true)}>
              <History size={14} /> History
            </button>
          </div>
        </section>

        {loadError && (
          <div className="coins__error" role="alert">
            <AlertCircle size={16} /> {loadError}
            <button type="button" onClick={() => void loadStore()}><RefreshCw size={13} /> Retry</button>
          </div>
        )}

        {/* ── Packages grid ── */}
        <section className="coins__section">
          <h2 className="coins__section-title">Choose a Package</h2>
          {loading ? (
            <div className="coins__grid">
              {Array.from({ length: 6 }, (_, i) => <div key={i} className="coins__pkg coins__pkg--skeleton" />)}
            </div>
          ) : (
            <div className="coins__grid">
              {packages.map(pkg => (
                <button
                  key={pkg.id}
                  type="button"
                  className={`coins__pkg coins__pkg--${pkg.tier}${selectedPkg?.id === pkg.id ? ' coins__pkg--selected' : ''}`}
                  onClick={() => pickPackage(pkg)}
                >
                  {pkg.badge && <span className="coins__pkg-badge">{pkg.badge}</span>}
                  <div className="coins__pkg-coin"><BcCoin size={52} /></div>
                  <span className="coins__pkg-name">{pkg.name}</span>
                  <span className="coins__pkg-amount">{fmtBc(pkg.bcAmount)} BC</span>
                  {pkg.bonusBc > 0 && (
                    <span className="coins__pkg-bonus">
                      <Zap size={12} /> +{fmtBc(pkg.bonusBc)} bonus
                    </span>
                  )}
                  <span className="coins__pkg-price">{fmtUsd(pkg.priceUSD)}</span>
                  {selectedPkg?.id === pkg.id && (
                    <span className="coins__pkg-check"><CheckCircle2 size={18} /></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Custom amount ── */}
        {settings?.customEnabled && (
          <section className="coins__section">
            <h2 className="coins__section-title">Or Enter a Custom Amount</h2>
            <div className={`coins__custom${customActive ? ' coins__custom--active' : ''}`}>
              <div className="coins__custom-coin"><BcCoin size={38} /></div>
              <div className="coins__custom-input-wrap">
                <input
                  type="number"
                  className="coins__custom-input"
                  placeholder={`${fmtBc(settings.customMinBc)} – ${fmtBc(settings.customMaxBc)}`}
                  min={settings.customMinBc}
                  max={settings.customMaxBc}
                  value={customBc}
                  onFocus={activateCustom}
                  onChange={e => { setCustomBc(e.target.value); activateCustom() }}
                />
                <span className="coins__custom-suffix">BC</span>
              </div>
              <div className="coins__custom-meta">
                {customActive && customBc && !customValid ? (
                  <span className="coins__custom-err">
                    <AlertCircle size={13} />
                    {customAmount < settings.customMinBc
                      ? `Minimum ${fmtBc(settings.customMinBc)} BC`
                      : `Maximum ${fmtBc(settings.customMaxBc)} BC`}
                  </span>
                ) : (
                  <span className="coins__custom-rate">
                    Rate: {fmtUsd(settings.usdPerBc)} / BC
                    {customActive && customValid && (
                      <strong> · {fmtUsd(Math.round(customAmount * settings.usdPerBc * 100) / 100)}</strong>
                    )}
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Payment method ── */}
        <section className="coins__section">
          <h2 className="coins__section-title">Payment Method</h2>
          <div className="coins__gateways">
            {gateways.map(g => (
              <button
                key={g.id}
                type="button"
                className={`coins__gateway${gatewayId === g.id ? ' coins__gateway--selected' : ''}`}
                onClick={() => setGatewayId(g.id)}
              >
                <span className="coins__gateway-icon">{gatewayIcon(g.provider)}</span>
                <span className="coins__gateway-name">{g.name}</span>
                <span className="coins__gateway-fee">
                  {g.feePercent > 0 ? `${g.feePercent}% fee` : 'No fee'}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Order summary + buy ── */}
        <section className="coins__checkout">
          <div className="coins__summary">
            <h3><Receipt size={16} /> Order Summary</h3>
            {order ? (
              <>
                <div className="coins__summary-row">
                  <span>{order.label}</span>
                  <strong>{fmtBc(order.bc)} BC</strong>
                </div>
                <div className="coins__summary-row">
                  <span>Price</span>
                  <strong>{fmtUsd(order.price)}</strong>
                </div>
                {gatewayFee > 0 && (
                  <div className="coins__summary-row coins__summary-row--fee">
                    <span>{selectedGateway?.name} fee ({selectedGateway?.feePercent}%)</span>
                    <strong>{fmtUsd(gatewayFee)}</strong>
                  </div>
                )}
                <div className="coins__summary-row coins__summary-row--total">
                  <span>Total</span>
                  <strong>{fmtUsd(orderTotal)}</strong>
                </div>
              </>
            ) : (
              <p className="coins__summary-empty">Select a package or enter a custom amount to continue.</p>
            )}
          </div>

          <button
            type="button"
            className="coins__buy-btn"
            disabled={!order || !selectedGateway}
            onClick={() => { setPurchaseError(null); setConfirming(true) }}
          >
            <Lock size={15} /> Buy {order ? `${fmtBc(order.bc)} BC` : 'Coins'}
          </button>

          <p className="coins__secure-note">
            <ShieldCheck size={13} /> Payments are processed securely. BC is credited instantly and never expires.
          </p>
        </section>
      </main>

      {/* ── Confirm modal ── */}
      {confirming && order && selectedGateway && (
        <div className="coins__modal-backdrop" onClick={e => { if (e.target === e.currentTarget && !purchasing) setConfirming(false) }}>
          <div className="coins__modal" role="dialog" aria-modal="true" aria-label="Confirm purchase">
            <div className="coins__modal-head">
              <h2>Confirm Purchase</h2>
              <button type="button" className="coins__modal-close" disabled={purchasing} onClick={() => setConfirming(false)}>
                <X size={17} />
              </button>
            </div>
            <div className="coins__modal-coin"><BcCoin size={64} /></div>
            <p className="coins__modal-amount">{fmtBc(order.bc)} BC</p>
            <p className="coins__modal-desc">{order.label} via {selectedGateway.name}</p>
            <div className="coins__modal-summary">
              <div><span>Price</span><strong>{fmtUsd(order.price)}</strong></div>
              {gatewayFee > 0 && <div><span>Fee</span><strong>{fmtUsd(gatewayFee)}</strong></div>}
              <div className="coins__modal-total"><span>Total charge</span><strong>{fmtUsd(orderTotal)}</strong></div>
            </div>
            {purchaseError && (
              <p className="coins__modal-error"><AlertCircle size={14} /> {purchaseError}</p>
            )}
            <div className="coins__modal-actions">
              <button type="button" className="coins__modal-cancel" disabled={purchasing} onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button type="button" className="coins__modal-confirm" disabled={purchasing} onClick={() => void confirmPurchase()}>
                {purchasing
                  ? <><RefreshCw size={14} className="coins__spin" /> Processing…</>
                  : <><Lock size={14} /> Pay {fmtUsd(orderTotal)}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt modal ── */}
      {receipt && (
        <div className="coins__modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setReceipt(null) }}>
          <div className="coins__modal coins__modal--receipt" role="dialog" aria-modal="true">
            <div className="coins__receipt-check"><CheckCircle2 size={44} /></div>
            <h2 className="coins__receipt-title">Purchase Complete!</h2>
            <p className="coins__receipt-amount">+{fmtBc(receipt.bcAmount)} BC</p>
            <div className="coins__modal-summary">
              <div><span>Package</span><strong>{receipt.packageName}</strong></div>
              <div><span>Paid</span><strong>{receipt.priceUSD != null ? fmtUsd(receipt.priceUSD) : '—'}</strong></div>
              <div><span>Method</span><strong>{receipt.gatewayName}</strong></div>
              <div><span>Reference</span><strong className="coins__receipt-ref">{receipt.reference}</strong></div>
              <div className="coins__modal-total"><span>New balance</span><strong>{fmtBc(receipt.balanceAfter)} BC</strong></div>
            </div>
            <div className="coins__modal-actions">
              <button type="button" className="coins__modal-confirm" onClick={() => setReceipt(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── History drawer ── */}
      {showHistory && (
        <div className="coins__modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowHistory(false) }}>
          <div className="coins__modal coins__modal--history" role="dialog" aria-modal="true" aria-label="Transaction history">
            <div className="coins__modal-head">
              <h2><History size={17} /> Wallet History</h2>
              <button type="button" className="coins__modal-close" onClick={() => setShowHistory(false)}>
                <X size={17} />
              </button>
            </div>
            {historyLoading ? (
              <div className="coins__history-empty"><RefreshCw size={22} className="coins__spin" /></div>
            ) : transactions.length === 0 ? (
              <div className="coins__history-empty">
                <Receipt size={30} strokeWidth={1.25} />
                <p>No transactions yet.</p>
              </div>
            ) : (
              <ul className="coins__history-list">
                {transactions.map(tx => {
                  const meta = txMeta(tx)
                  return (
                    <li key={tx.id} className="coins__history-item">
                      <span className={`coins__history-icon${meta.positive ? ' coins__history-icon--in' : ' coins__history-icon--out'}`}>
                        {meta.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      </span>
                      <div className="coins__history-info">
                        <span className="coins__history-label">{meta.label}</span>
                        <span className="coins__history-date">
                          {new Date(tx.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          {tx.reference && ` · ${tx.reference}`}
                        </span>
                      </div>
                      <div className="coins__history-amounts">
                        <strong className={meta.positive ? 'coins__history-in' : 'coins__history-out'}>
                          {tx.bcAmount > 0 ? '+' : ''}{fmtBc(tx.bcAmount)} BC
                        </strong>
                        <span className="coins__history-bal">bal {fmtBc(tx.balanceAfter)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  )
}
