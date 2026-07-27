'use client'
import { useEffect } from 'react'
import {
  Bell, Gavel, TrendingUp, X, Award, CreditCard,
  ShieldOff, Clock, UserMinus, ShoppingCart, MessageSquareWarning,
  CheckCircle2, XCircle,
} from 'lucide-react'
import { useI18n } from '@/context/I18nContext'
import { useHelp } from '@/context/HelpContext'
import { useNotifications, type NotificationItem } from '@/context/NotificationsContext'

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function formatWhen(ms: number, locale: string) {
  return new Date(ms).toLocaleString(locale === 'si' ? 'si-LK' : locale === 'ta' ? 'ta-LK' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

const MODERATION_TITLES: Partial<Record<NotificationItem['kind'], string>> = {
  seller_approved: 'Seller Application Approved',
  seller_rejected: 'Seller Application Rejected',
  listing_approved: 'Listing Approved',
  listing_rejected: 'Listing Rejected',
  listing_removed: 'Listing Removed',
  account_banned: 'Account Banned',
  account_suspended: 'Account Suspended',
  account_reinstated: 'Account Reinstated',
  seller_role_removed: 'Seller Role Removed',
  bidding_blocked: 'Bidding Restricted',
  bidding_restored: 'Bidding Restored',
  admin_warning: 'Warning from Admin',
}

function titleFor(n: NotificationItem, t: (k: string, v?: Record<string, string | number>) => string) {
  if (n.kind === 'outbid') return t('notif.outbidTitle')
  if (n.kind === 'bid_placed') return t('notif.bidTitle')
  if (n.kind === 'lot_broadcast') return t('notif.broadcastTitle')
  if (n.kind === 'payment') return t('notif.paymentTitle')
  if (n.kind === 'won') return t('notif.wonTitle')
  return MODERATION_TITLES[n.kind] ?? 'Notification'
}

function bodyFor(n: NotificationItem, t: (k: string, v?: Record<string, string | number>) => string) {
  if (n.kind === 'outbid' && n.meta.itemKey) return t('notif.outbidBody', { item: t(n.meta.itemKey) })
  if (n.kind === 'bid_placed' && n.meta.bidAmount != null) {
    if (n.meta.rawItem) return t('notif.bidBodyItem', { amount: formatMoney(n.meta.bidAmount), item: n.meta.rawItem })
    return t('notif.bidBody', { amount: formatMoney(n.meta.bidAmount) })
  }
  if (n.kind === 'lot_broadcast' && n.meta.rawItem != null && n.meta.bidAmount != null) {
    return t('notif.broadcastBody', { item: n.meta.rawItem, amount: formatMoney(n.meta.bidAmount) })
  }
  if (n.kind === 'won' && n.meta.itemKey) return t('notif.wonBody', { item: t(n.meta.itemKey) })
  if (n.kind === 'payment' && n.meta.paymentTotal != null) {
    return t('notif.paymentBody', { amount: formatMoney(n.meta.paymentTotal) })
  }
  return n.meta.message ?? n.meta.adminNote ?? ''
}

type Props = { open: boolean; onClose: () => void }

export function NotificationsPanel({ open, onClose }: Props) {
  const { t, locale } = useI18n()
  const { openHelp } = useHelp()
  const { items, unreadCount, clearAll, markRead } = useNotifications()

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
    <div className="notif-panel" role="dialog" aria-modal="true" aria-labelledby="notif-panel-title">
      <button type="button" className="notif-panel__backdrop" aria-label={t('notif.close')} onClick={onClose} />
      <div className="notif-panel__sheet">
        <header className="notif-panel__header">
          <div className="notif-panel__header-icon-wrap" aria-hidden>
            <Bell size={18} />
          </div>
          <h2 id="notif-panel-title" className="notif-panel__title">
            {t('notif.panelTitle')}
            {unreadCount > 0 && (
              <span className="notif-panel__title-badge" aria-label={t('notif.unreadCount', { n: unreadCount })}>
                {unreadCount}
              </span>
            )}
          </h2>
          <button type="button" className="notif-panel__close" onClick={onClose} aria-label={t('notif.close')}>
            <X size={18} />
          </button>
        </header>
        <div className="notif-panel__toolbar">
          {items.length > 0 ? (
            <button type="button" className="notif-panel__clear" onClick={clearAll}>
              {t('notif.clearAll')}
            </button>
          ) : (
            <span className="notif-panel__toolbar-muted">{t('notif.none')}</span>
          )}
        </div>
        <ul className="notif-panel__list">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={n.read ? 'notif-panel__row' : 'notif-panel__row notif-panel__row--unread'}
                onClick={() => markRead(n.id)}
              >
                <span className={`notif-panel__icon notif-panel__icon--${n.kind}`} aria-hidden>
                  {n.kind === 'outbid' && <TrendingUp size={22} strokeWidth={2.25} />}
                  {n.kind === 'bid_placed' && <Gavel size={22} strokeWidth={2.25} />}
                  {n.kind === 'lot_broadcast' && <Gavel size={22} strokeWidth={2.25} />}
                  {n.kind === 'won' && <Award size={22} strokeWidth={2.25} />}
                  {n.kind === 'payment' && <CreditCard size={22} strokeWidth={2.25} />}
                  {(n.kind === 'seller_approved' || n.kind === 'listing_approved' || n.kind === 'account_reinstated' || n.kind === 'bidding_restored') && <CheckCircle2 size={22} strokeWidth={2.25} />}
                  {(n.kind === 'seller_rejected' || n.kind === 'listing_rejected' || n.kind === 'listing_removed') && <XCircle size={22} strokeWidth={2.25} />}
                  {n.kind === 'account_banned' && <ShieldOff size={22} strokeWidth={2.25} />}
                  {n.kind === 'account_suspended' && <Clock size={22} strokeWidth={2.25} />}
                  {n.kind === 'seller_role_removed' && <UserMinus size={22} strokeWidth={2.25} />}
                  {n.kind === 'bidding_blocked' && <ShoppingCart size={22} strokeWidth={2.25} />}
                  {n.kind === 'admin_warning' && <MessageSquareWarning size={22} strokeWidth={2.25} />}
                </span>
                <span className="notif-panel__text">
                  <span className="notif-panel__item-title">{titleFor(n, t)}</span>
                  <span className="notif-panel__desc">{bodyFor(n, t)}</span>
                  <span className="notif-panel__time">{formatWhen(n.createdAt, locale)}</span>
                </span>
                {!n.read && <span className="notif-panel__dot" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="notif-panel__help" aria-label={t('common.help')} onClick={openHelp}>
          ?
        </button>
      </div>
    </div>
  )
}
