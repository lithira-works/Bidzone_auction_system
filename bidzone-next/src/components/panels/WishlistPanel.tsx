'use client'
import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Heart, X } from 'lucide-react'
import type { AuctionItem } from '@/data/auctions'
import { useI18n } from '@/context/I18nContext'
import { useListings } from '@/context/ListingsContext'
import { useWishlist } from '@/context/WishlistContext'
import { useHelp } from '@/context/HelpContext'

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

type Props = { open: boolean; onClose: () => void }

export function WishlistPanel({ open, onClose }: Props) {
  const { t } = useI18n()
  const { openHelp } = useHelp()
  const { mergedCatalog } = useListings()
  const { ids, remove } = useWishlist()

  const items = useMemo(() => {
    const map = new Map(mergedCatalog.map((a) => [a.id, a]))
    return ids.map((id) => map.get(id)).filter((x): x is AuctionItem => x != null)
  }, [ids, mergedCatalog])

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
    <div className="wish-panel" role="dialog" aria-modal="true" aria-labelledby="wish-panel-title">
      <button type="button" className="wish-panel__backdrop" aria-label={t('notif.close')} onClick={onClose} />
      <div className="wish-panel__sheet">
        <header className="wish-panel__header">
          <Heart size={22} className="wish-panel__header-icon" aria-hidden fill="currentColor" />
          <h2 id="wish-panel-title" className="wish-panel__title">{t('wishlist.panelTitle')}</h2>
          <button type="button" className="wish-panel__close" onClick={onClose} aria-label={t('notif.close')}>
            <X size={22} />
          </button>
        </header>
        <div className="wish-panel__body">
          {items.length === 0 ? (
            <div className="wish-panel__empty">
              <Heart size={72} strokeWidth={1} className="wish-panel__empty-icon" aria-hidden />
              <p className="wish-panel__empty-title">{t('wishlist.emptyTitle')}</p>
              <p className="wish-panel__empty-sub">{t('wishlist.emptySub')}</p>
            </div>
          ) : (
            <ul className="wish-panel__list">
              {items.map((item) => (
                <li key={item.id} className="wish-panel__item">
                  <Link href={`/listing/${item.id}`} className="wish-panel__thumb-link" onClick={onClose}>
                    <img src={item.image} alt="" className="wish-panel__thumb" />
                  </Link>
                  <div className="wish-panel__info">
                    <Link href={`/listing/${item.id}`} className="wish-panel__title-link" onClick={onClose}>
                      {item.title}
                    </Link>
                    <p className="wish-panel__bid">
                      {t('card.currentBid')} <strong>{formatMoney(item.currentBid)}</strong>
                    </p>
                  </div>
                  <button type="button" className="wish-panel__remove" aria-label={t('wishlist.remove')} onClick={() => remove(item.id)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" className="wish-panel__help" aria-label={t('common.help')} onClick={openHelp}>?</button>
      </div>
    </div>
  )
}
