'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUp, Shield } from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { useCart } from '@/context/CartContext'
import { useListings } from '@/context/ListingsContext'
import { useI18n } from '@/context/I18nContext'
import { useHelp } from '@/context/HelpContext'
import type { CheckoutDraftState } from '@/types/checkoutDraft'
import type { AuctionItem } from '@/data/auctions'

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

const FLAT_SHIPPING = 12

function estDeliveryRange(locale: string) {
  const start = new Date(); start.setDate(start.getDate() + 5)
  const end = new Date(); end.setDate(end.getDate() + 9)
  const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const loc = locale === 'si' ? 'si-LK' : locale === 'ta' ? 'ta-LK' : 'en-US'
  return `${start.toLocaleDateString(loc, opt)} – ${end.toLocaleDateString(loc, opt)}`
}

function sellerLabel(item: AuctionItem): string {
  return item.sellerName?.trim() || 'BidZone'
}

export function CheckoutReviewPage() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const { openHelp } = useHelp()
  const { ids } = useCart()
  const { mergedCatalog } = useListings()

  const rows = useMemo(() => {
    const map = new Map(mergedCatalog.map((a) => [a.id, a]))
    return ids.map((id) => map.get(id)).filter((x): x is AuctionItem => x != null)
  }, [ids, mergedCatalog])

  const payable = useMemo(() => rows.filter((item) => item.buyNow != null), [rows])
  const skipped = rows.length - payable.length
  const itemSubtotal = useMemo(() => payable.reduce((s, item) => s + (item.buyNow as number), 0), [payable])

  const sellerGroups = useMemo(() => {
    const m = new Map<string, AuctionItem[]>()
    for (const p of payable) {
      const k = sellerLabel(p)
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(p)
    }
    return [...m.entries()]
  }, [payable])

  const [couponInput, setCouponInput] = useState('')
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [freeShip, setFreeShip] = useState(false)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const discountAmount = useMemo(() => {
    if (!appliedCode) return 0
    const c = appliedCode.toUpperCase()
    if (c === 'SAVE10') return Math.round(itemSubtotal * 0.1 * 100) / 100
    if (c === 'WELCOME5') return Math.min(5, itemSubtotal)
    return 0
  }, [appliedCode, itemSubtotal])

  const shippingCost = freeShip ? 0 : FLAT_SHIPPING
  const orderTotal = Math.max(0, itemSubtotal - discountAmount) + shippingCost

  useEffect(() => {
    if (rows.length === 0) router.replace('/home')
  }, [rows.length, router])

  function tryApplyCoupon() {
    const raw = couponInput.trim().toUpperCase()
    if (!raw) return
    if (raw === 'SAVE10' || raw === 'WELCOME5') {
      setAppliedCode(raw); setFreeShip(false)
    } else if (raw === 'FREESHIP') {
      setFreeShip(true); setAppliedCode('FREESHIP')
    }
  }

  function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }

  function confirmAndPay() {
    const draft: CheckoutDraftState = {
      subtotal: itemSubtotal, shipping: shippingCost,
      discount: discountAmount, total: orderTotal,
      payableIds: payable.map((p) => p.id),
    }
    localStorage.setItem('bz_checkout_draft', JSON.stringify(draft))
    router.push('/checkout/payment')
  }

  if (rows.length === 0) return null

  if (payable.length === 0) {
    return (
      <div className="checkout-review">
        <SiteHeader />
        <div className="checkout-review__wrap">
          <p className="checkout-review__warn">{t('pay.noPayable')}</p>
          <Link href="/home" className="checkout-review__back">
            <ArrowLeft size={18} aria-hidden />
            {t('product.back')}
          </Link>
        </div>
        <SiteFooter />
      </div>
    )
  }

  const couponActive = appliedCode === 'SAVE10' || appliedCode === 'WELCOME5' || appliedCode === 'FREESHIP'

  return (
    <div className="checkout-review">
      <SiteHeader />
      <div className="checkout-review__wrap">
        <Link href="/home" className="checkout-review__back">
          <ArrowLeft size={18} aria-hidden />
          {t('review.backShopping')}
        </Link>

        <div className="checkout-review__grid">
          <div className="checkout-review__main">
            <h1 className="checkout-review__title">{t('review.title')}</h1>

            {sellerGroups.map(([seller, items]) => (
              <section key={seller} className="checkout-review__seller-block">
                <div className="checkout-review__seller-row">
                  <span className="checkout-review__avatar" aria-hidden>{seller.slice(0, 1).toUpperCase()}</span>
                  <div>
                    <p className="checkout-review__seller-name">{seller}</p>
                    <button type="button" className="checkout-review__linkish">{t('review.addNote')}</button>
                    <span className="checkout-review__feedback">{t('review.positiveFeedback')}</span>
                  </div>
                </div>

                {items.map((item) => (
                  <div key={item.id} className="checkout-review__product">
                    <img src={item.image} alt="" className="checkout-review__product-img" />
                    <div className="checkout-review__product-body">
                      <span className="checkout-review__sold-pill">{t('review.soldBadge', { n: Math.max(item.bids, 1) })}</span>
                      <h2 className="checkout-review__product-title">{item.title}</h2>
                      <div className="checkout-review__price-row">
                        <strong className="checkout-review__price-now">{formatMoney(item.buyNow as number)}</strong>
                        {item.currentBid != null && item.currentBid !== item.buyNow && (
                          <span className="checkout-review__price-was">{formatMoney(item.currentBid)}</span>
                        )}
                      </div>
                      <label className="checkout-review__qty">
                        <span>{t('review.quantity')}</span>
                        <select defaultValue={1} disabled aria-disabled="true"><option value={1}>1</option></select>
                      </label>
                      <p className="checkout-review__returns">{t('review.returns')}</p>
                      <label className="checkout-review__note-field">
                        <span className="checkout-review__visually-hidden">{t('review.noteForSeller')}</span>
                        <textarea
                          rows={2}
                          maxLength={500}
                          placeholder={t('review.notePlaceholder')}
                          value={notes[item.id] ?? ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        />
                      </label>
                    </div>
                  </div>
                ))}

                <div className="checkout-review__delivery">
                  <h3 className="checkout-review__delivery-title">{t('review.delivery')}</h3>
                  <p className="checkout-review__delivery-est">{t('review.estDelivery')}: {estDeliveryRange(locale)}</p>
                  <p className="checkout-review__delivery-method">{t('review.shippingMethod')}</p>
                  <p className="checkout-review__delivery-fee">{freeShip ? t('review.shippingFree') : formatMoney(FLAT_SHIPPING)}</p>
                </div>
              </section>
            ))}

            {skipped > 0 && <p className="checkout-review__skip">{t('pay.skippedItems', { n: skipped })}</p>}
            <hr className="checkout-review__rule" />

            <section className="checkout-review__coupon">
              <h2 className="checkout-review__coupon-title">{t('review.giftCoupons')}</h2>
              <p className="checkout-review__coupon-hint">{t('review.couponHint')}</p>
              <div className="checkout-review__coupon-row">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder={t('review.couponPh')}
                  className="checkout-review__coupon-input"
                />
                <button type="button" className="checkout-review__coupon-apply" disabled={!couponInput.trim()} onClick={tryApplyCoupon}>
                  {t('review.apply')}
                </button>
              </div>
              {couponActive && (
                <p className="checkout-review__coupon-applied">
                  {appliedCode === 'FREESHIP' ? t('review.couponFreeship') : t('review.couponApplied', { code: appliedCode ?? '' })}
                </p>
              )}
            </section>
          </div>

          <aside className="checkout-review__aside" aria-labelledby="review-summary-title">
            <div className="checkout-review__summary-card">
              <h2 id="review-summary-title" className="checkout-review__summary-title">{t('review.orderSummary')}</h2>
              <div className="checkout-review__summary-rows">
                <div className="checkout-review__summary-row">
                  <span>{t('review.lineItems', { n: payable.length })}</span>
                  <span>{formatMoney(itemSubtotal)}</span>
                </div>
                <div className="checkout-review__summary-row">
                  <span>{t('review.lineShipping')}</span>
                  <span>{freeShip ? t('review.shippingFree') : formatMoney(FLAT_SHIPPING)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="checkout-review__summary-row checkout-review__summary-row--discount">
                    <span>{t('review.lineDiscount')}</span>
                    <span>−{formatMoney(discountAmount)}</span>
                  </div>
                )}
              </div>
              <div className="checkout-review__summary-total">
                <span>{t('review.orderTotal')}</span>
                <strong>{formatMoney(orderTotal)}</strong>
              </div>
              <button type="button" className="checkout-review__confirm" onClick={confirmAndPay}>
                {t('review.confirmPay')}
              </button>
              <p className="checkout-review__confirm-hint">{t('review.confirmHint')}</p>
              <p className="checkout-review__guarantee">
                <Shield size={18} aria-hidden />
                {t('review.guarantee')}
              </p>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />

      <div className="checkout-review__fabs">
        <button type="button" className="checkout-review__fab" onClick={scrollTop} aria-label={t('review.scrollTop')}>
          <ArrowUp size={20} />
        </button>
        <button type="button" className="checkout-review__fab" onClick={openHelp} aria-label={t('common.help')}>?</button>
      </div>
    </div>
  )
}
