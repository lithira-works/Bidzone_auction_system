'use client'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, Lock, ShieldCheck } from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { useCart } from '@/context/CartContext'
import { useListings } from '@/context/ListingsContext'
import { useI18n } from '@/context/I18nContext'
import { useNotifications } from '@/context/NotificationsContext'
import { useSavedCards } from '@/context/SavedCardsContext'
import type { AuctionItem } from '@/data/auctions'
import { draftStateValid, type CheckoutDraftState } from '@/types/checkoutDraft'
import { detectCardBrand, expiryNotPast, formatCardGroups, luhnValid, normalizeExpiry } from '@/lib/cardBrand'

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

function cvvLengthForBrand(brand: string): number {
  return brand === 'American Express' ? 4 : 3
}

function sortIds(ids: string[]) { return [...ids].sort().join('\u0000') }

function verifyDraft(draft: CheckoutDraftState, payable: AuctionItem[]): boolean {
  if (sortIds(draft.payableIds) !== sortIds(payable.map((p) => p.id))) return false
  const sub = payable.reduce((s, i) => s + (i.buyNow as number), 0)
  if (Math.abs(sub - draft.subtotal) > 0.02) return false
  if (draft.discount < -0.01 || draft.shipping < -0.01) return false
  if (draft.discount > draft.subtotal + 0.02) return false
  const expected = draft.subtotal - draft.discount + draft.shipping
  if (Math.abs(expected - draft.total) > 0.02) return false
  return true
}

type PayOption = 'paypal' | 'card' | 'gpay'

export function CheckoutPaymentPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { ids, remove } = useCart()
  const { mergedCatalog } = useListings()
  const { addPaymentSuccess } = useNotifications()
  const { cards, addCardMask, removeCard } = useSavedCards()

  const [draft, setDraft] = useState<CheckoutDraftState | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('bz_checkout_draft')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (draftStateValid(parsed)) setDraft(parsed)
      } catch { /* invalid */ }
    }
  }, [])

  const rows = useMemo(() => {
    const map = new Map(mergedCatalog.map((a) => [a.id, a]))
    return ids.map((id) => map.get(id)).filter((x): x is AuctionItem => x != null)
  }, [ids, mergedCatalog])

  const payable = useMemo(() => rows.filter((item) => item.buyNow != null), [rows])
  const skipped = rows.length - payable.length
  const draftOk = draft && verifyDraft(draft, payable)

  const [payOption, setPayOption] = useState<PayOption>('card')
  const [method, setMethod] = useState<'new' | string>('new')
  const [nameOnCard, setNameOnCard] = useState('')
  const [cardDigits, setCardDigits] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [zip, setZip] = useState('')
  const [saveCard, setSaveCard] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const selectedSaved = method !== 'new' ? cards.find((c) => c.id === method) : undefined
  const displayBrand = useMemo(() => detectCardBrand(cardDigits.replace(/\D/g, '')), [cardDigits])
  const cvvMax = selectedSaved ? cvvLengthForBrand(selectedSaved.brand) : cvvLengthForBrand(displayBrand)
  const totalToCharge = draft?.total ?? 0

  useEffect(() => {
    if (rows.length === 0) router.replace('/home')
  }, [rows.length, router])

  useEffect(() => {
    if (payable.length > 0 && draft && !draftOk) router.replace('/checkout')
  }, [payable.length, draft, draftOk, router])

  if (rows.length === 0) return null

  if (payable.length === 0) {
    return (
      <div className="checkout">
        <SiteHeader />
        <div className="checkout__wrap">
          <p className="checkout__banner checkout__banner--warn">{t('pay.noPayable')}</p>
          <Link href="/home" className="checkout__back">
            <ArrowLeft size={18} aria-hidden />
            {t('product.back')}
          </Link>
        </div>
        <SiteFooter />
      </div>
    )
  }

  if (!draft) return null

  function validate(): boolean {
    setError(null)
    if (payOption !== 'card') { setError(t('pay.useCardDemo')); return false }
    if (selectedSaved) {
      if (cvv.replace(/\D/g, '').length !== cvvMax) { setError(t('pay.errCvv')); return false }
      return true
    }
    const pan = cardDigits.replace(/\D/g, '')
    if (nameOnCard.trim().length < 2) { setError(t('pay.errName')); return false }
    if (!luhnValid(pan)) { setError(t('pay.errPan')); return false }
    const exp = normalizeExpiry(expiry)
    if (!exp || !expiryNotPast(exp.month, exp.year)) { setError(t('pay.errExp')); return false }
    if (cvv.replace(/\D/g, '').length !== cvvMax) { setError(t('pay.errCvv')); return false }
    return true
  }

  async function handlePay(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setProcessing(true)
    await new Promise((r) => window.setTimeout(r, 1400))
    setProcessing(false)

    if (method === 'new' && saveCard) {
      const pan = cardDigits.replace(/\D/g, '')
      const last4 = pan.slice(-4)
      const exp = normalizeExpiry(expiry)
      const expLabel = exp ? `${String(exp.month).padStart(2, '0')}/${String(exp.year).slice(-2)}` : ''
      addCardMask({ brand: displayBrand, last4, expLabel })
    }

    payable.forEach((item) => remove(item.id))
    localStorage.removeItem('bz_checkout_draft')
    addPaymentSuccess(totalToCharge)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="checkout">
        <SiteHeader />
        <div className="checkout__wrap checkout__wrap--narrow">
          <div className="checkout__success">
            <ShieldCheck size={48} className="checkout__success-icon" aria-hidden />
            <h1 className="checkout__success-title">{t('pay.successTitle')}</h1>
            <p className="checkout__success-sub">{t('pay.successSub', { amount: formatMoney(totalToCharge) })}</p>
            <button type="button" className="checkout__primary" onClick={() => router.push('/home')}>
              {t('pay.continue')}
            </button>
          </div>
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="checkout">
      <SiteHeader />
      <div className="checkout__wrap">
        <Link href="/checkout" className="checkout__back">
          <ArrowLeft size={18} aria-hidden />
          {t('pay.backReview')}
        </Link>

        <div className="checkout__paypal-banner" role="note">{t('pay.paypalBanner')}</div>
        <h1 className="checkout__title">{t('pay.secureTitle')}</h1>
        <p className="checkout__demo">{t('pay.demoNotice')}</p>

        <div className="checkout__grid checkout__grid--payment">
          <div className="checkout__main-col">
            <section className="checkout__ship" aria-labelledby="ship-to-title">
              <h2 id="ship-to-title" className="checkout__section-title">{t('pay.shipTo')}</h2>
              <div className="checkout__ship-body">
                <p className="checkout__ship-lines">{t('pay.mockAddress')}</p>
                <button type="button" className="checkout__change-link">{t('pay.changeAddr')}</button>
              </div>
            </section>

            <section className="checkout__pay-with" aria-labelledby="pay-with-title">
              <h2 id="pay-with-title" className="checkout__section-title">{t('pay.payWith')}</h2>
              <div className="checkout__pay-options">
                <label className="checkout__pay-opt">
                  <input type="radio" name="pay-opt" checked={payOption === 'paypal'} onChange={() => setPayOption('paypal')} />
                  <span>{t('pay.optPaypal')}</span>
                </label>
                <label className="checkout__pay-opt">
                  <input type="radio" name="pay-opt" checked={payOption === 'card'} onChange={() => setPayOption('card')} />
                  <span>{t('pay.optCard')}</span>
                </label>
                <label className="checkout__pay-opt">
                  <input type="radio" name="pay-opt" checked={payOption === 'gpay'} onChange={() => setPayOption('gpay')} />
                  <span>{t('pay.optGpay')}</span>
                </label>
              </div>
            </section>

            {payOption === 'card' ? (
              <section className="checkout__payment" aria-labelledby="checkout-pay-title">
                <h2 id="checkout-pay-title" className="checkout__section-title">
                  <CreditCard size={22} aria-hidden />
                  {t('pay.cardTitle')}
                </h2>
                <form className="checkout__form" onSubmit={handlePay}>
                  {cards.length > 0 && (
                    <fieldset className="checkout__fieldset">
                      <legend className="checkout__legend">{t('pay.savedCards')}</legend>
                      <div className="checkout__saved-list">
                        <label className="checkout__radio">
                          <input type="radio" name="pay-method" checked={method === 'new'} onChange={() => setMethod('new')} />
                          <span>{t('pay.newCard')}</span>
                        </label>
                        {cards.map((c) => (
                          <label key={c.id} className="checkout__radio checkout__radio--card">
                            <input type="radio" name="pay-method" checked={method === c.id} onChange={() => setMethod(c.id)} />
                            <span>
                              <strong>{c.brand}</strong> ·••• {c.last4}{' '}
                              <span className="checkout__exp">{c.expLabel}</span>
                            </span>
                            <button
                              type="button"
                              className="checkout__remove-saved"
                              onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); removeCard(c.id); if (method === c.id) setMethod('new') }}
                            >
                              {t('pay.removeSaved')}
                            </button>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {method === 'new' ? (
                    <>
                      <label className="checkout__field">
                        <span>{t('pay.nameOnCard')}</span>
                        <input autoComplete="cc-name" value={nameOnCard} onChange={(e) => setNameOnCard(e.target.value)} placeholder={t('pay.namePh')} />
                      </label>
                      <label className="checkout__field checkout__field--pan">
                        <span>{t('pay.cardNumber')}</span>
                        <input
                          inputMode="numeric"
                          autoComplete="cc-number"
                          value={formatCardGroups(cardDigits)}
                          onChange={(e) => setCardDigits(e.target.value.replace(/\D/g, '').slice(0, 19))}
                          placeholder={t('pay.cardPh')}
                        />
                        <span className="checkout__brand-pill">{displayBrand}</span>
                      </label>
                      <div className="checkout__row2">
                        <label className="checkout__field">
                          <span>{t('pay.expiry')}</span>
                          <input
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            value={expiry}
                            onChange={(e) => {
                              const d = e.target.value.replace(/\D/g, '').slice(0, 4)
                              const a = d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d
                              setExpiry(a)
                            }}
                            placeholder={t('pay.expiryPh')}
                          />
                        </label>
                        <label className="checkout__field">
                          <span>{t('pay.cvv')}</span>
                          <input
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            maxLength={cvvMax}
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, cvvMax))}
                            placeholder={t('pay.cvvPh')}
                          />
                        </label>
                      </div>
                      <label className="checkout__field">
                        <span>{t('pay.zip')}</span>
                        <input autoComplete="postal-code" value={zip} onChange={(e) => setZip(e.target.value)} placeholder={t('pay.zipPh')} />
                      </label>
                      <label className="checkout__check">
                        <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} />
                        {t('pay.saveCard')}
                      </label>
                    </>
                  ) : (
                    <label className="checkout__field">
                      <span>{t('pay.cvv')}</span>
                      <input
                        inputMode="numeric"
                        maxLength={cvvMax}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, cvvMax))}
                        placeholder={t('pay.cvvPh')}
                      />
                    </label>
                  )}

                  {error && <p className="checkout__error">{error}</p>}
                  <button type="submit" className="checkout__pay" disabled={processing}>
                    <Lock size={18} aria-hidden />
                    {processing ? t('pay.processing') : t('pay.submit', { amount: formatMoney(totalToCharge) })}
                  </button>
                </form>
              </section>
            ) : (
              <p className="checkout__alt-pay-hint">{t('pay.useCardDemo')}</p>
            )}
          </div>

          <aside className="checkout__summary checkout__summary--sticky" aria-labelledby="checkout-summary-title">
            <h2 id="checkout-summary-title" className="checkout__section-title">{t('review.orderSummary')}</h2>
            <ul className="checkout__lines">
              {payable.map((item) => (
                <li key={item.id} className="checkout__line">
                  <img src={item.image} alt="" className="checkout__thumb" />
                  <div className="checkout__line-text">
                    <span className="checkout__line-title">{item.title}</span>
                    <span className="checkout__line-price">{formatMoney(item.buyNow as number)}</span>
                  </div>
                </li>
              ))}
            </ul>
            {skipped > 0 && <p className="checkout__skip-note">{t('pay.skippedItems', { n: skipped })}</p>}
            <div className="checkout__summary-breakdown">
              <div className="checkout__summary-line">
                <span>{t('review.lineItems', { n: payable.length })}</span>
                <span>{formatMoney(draft.subtotal)}</span>
              </div>
              {draft.discount > 0 && (
                <div className="checkout__summary-line checkout__summary-line--discount">
                  <span>{t('review.lineDiscount')}</span>
                  <span>−{formatMoney(draft.discount)}</span>
                </div>
              )}
              <div className="checkout__summary-line">
                <span>{t('review.lineShipping')}</span>
                <span>{draft.shipping <= 0.01 ? t('review.shippingFree') : formatMoney(draft.shipping)}</span>
              </div>
            </div>
            <div className="checkout__total-row">
              <span>{t('review.orderTotal')}</span>
              <strong>{formatMoney(draft.total)}</strong>
            </div>
            <p className="checkout__summary-guarantee">
              <ShieldCheck size={16} aria-hidden />
              {t('review.guarantee')}
            </p>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
