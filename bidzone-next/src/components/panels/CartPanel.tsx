'use client'
import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, X } from 'lucide-react'
import type { AuctionItem } from '@/data/auctions'
import { useI18n } from '@/context/I18nContext'
import { useListings } from '@/context/ListingsContext'
import { useCart } from '@/context/CartContext'
import { useHelp } from '@/context/HelpContext'

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

type Props = { open: boolean; onClose: () => void }

export function CartPanel({ open, onClose }: Props) {
  const { t } = useI18n()
  const router = useRouter()
  const { mergedCatalog } = useListings()
  const { ids, remove, clear } = useCart()
  const { openHelp } = useHelp()

  const rows = useMemo(() => {
    const map = new Map(mergedCatalog.map((a) => [a.id, a]))
    return ids
      .map((id) => {
        const item = map.get(id)
        if (!item) return null
        const price = item.buyNow ?? item.currentBid
        return { item, price, hasBuyNow: item.buyNow != null }
      })
      .filter((x): x is { item: AuctionItem; price: number; hasBuyNow: boolean } => x != null)
  }, [ids, mergedCatalog])

  const subtotal = useMemo(() => rows.reduce((s, r) => s + r.price, 0), [rows])
  const hasPayable = useMemo(() => rows.some((r) => r.hasBuyNow), [rows])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-panel-title">
      <button type="button" className="cart-panel__backdrop" aria-label={t('notif.close')} onClick={onClose} />
      <div className="cart-panel__sheet">
        <header className="cart-panel__header">
          <ShoppingCart size={22} className="cart-panel__header-icon" aria-hidden />
          <h2 id="cart-panel-title" className="cart-panel__title">{t('cart.panelTitle')}</h2>
          <button type="button" className="cart-panel__close" onClick={onClose} aria-label={t('notif.close')}>
            <X size={22} />
          </button>
        </header>
        <div className="cart-panel__body">
          {rows.length === 0 ? (
            <div className="cart-panel__empty">
              <ShoppingCart size={72} strokeWidth={1} className="cart-panel__empty-icon" aria-hidden />
              <p className="cart-panel__empty-title">{t('cart.emptyTitle')}</p>
              <p className="cart-panel__empty-sub">{t('cart.emptySub')}</p>
            </div>
          ) : (
            <>
              <ul className="cart-panel__list">
                {rows.map(({ item, price, hasBuyNow }) => (
                  <li key={item.id} className="cart-panel__item">
                    <Link href={`/listing/${item.id}`} className="cart-panel__thumb-link" onClick={onClose}>
                      <img src={item.image} alt="" className="cart-panel__thumb" />
                    </Link>
                    <div className="cart-panel__info">
                      <Link href={`/listing/${item.id}`} className="cart-panel__title-link" onClick={onClose}>
                        {item.title}
                      </Link>
                      <p className="cart-panel__price-line">
                        {hasBuyNow ? (
                          <>{t('product.buyNowPrice')} <strong>{formatMoney(price)}</strong></>
                        ) : (
                          <span className="cart-panel__warn">{t('cart.noBuyNow')}</span>
                        )}
                      </p>
                    </div>
                    <button type="button" className="cart-panel__remove" aria-label={t('cart.remove')} onClick={() => remove(item.id)}>×</button>
                  </li>
                ))}
              </ul>
              <div className="cart-panel__footer">
                <div className="cart-panel__subtotal">
                  <span>{t('cart.subtotal')}</span>
                  <strong>{formatMoney(subtotal)}</strong>
                </div>
                <div className="cart-panel__actions">
                  <button type="button" className="cart-panel__linkish" onClick={clear}>{t('cart.clear')}</button>
                  <button
                    type="button"
                    className="cart-panel__checkout"
                    disabled={!hasPayable}
                    onClick={() => {
                      if (!hasPayable) return
                      onClose()
                      router.push('/checkout')
                    }}
                  >
                    {t('cart.checkout')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <button type="button" className="cart-panel__help" onClick={openHelp} aria-label={t('common.help')}>?</button>
      </div>
    </div>
  )
}
