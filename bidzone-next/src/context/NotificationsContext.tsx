'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, getToken } from '@/lib/apiClient'

export type NotificationKind =
  | 'outbid'
  | 'bid_placed'
  | 'won'
  | 'payment'
  | 'lot_broadcast'
  | 'seller_approved'
  | 'seller_rejected'
  | 'listing_approved'
  | 'listing_rejected'
  | 'account_banned'
  | 'account_suspended'
  | 'account_reinstated'
  | 'seller_role_removed'
  | 'bidding_blocked'
  | 'bidding_restored'
  | 'admin_warning'
  | 'listing_removed'

export type NotificationItem = {
  id: string
  kind: NotificationKind
  read: boolean
  createdAt: number
  meta: {
    itemKey?: string
    bidAmount?: number
    rawItem?: string
    paymentTotal?: number
    message?: string
    adminNote?: string
    listingTitle?: string
  }
}

type NotificationsContextValue = {
  items: NotificationItem[]
  unreadCount: number
  clearAll: () => void
  markRead: (id: string) => void
  addBidPlaced: (amount: number, itemTitle: string) => void
  addLotBroadcast: (itemTitle: string, amount: number) => void
  addPaymentSuccess: (totalUsd: number) => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    api
      .get<{ notifications: NotificationItem[] }>('/notifications')
      .then(({ notifications }) => setItems(notifications))
      .catch(() => {/* silent */})
  }, [])

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items])

  const clearAll = useCallback(() => {
    setItems([])
    api.delete('/notifications').catch(() => {/* silent */})
  }, [])

  const markRead = useCallback((id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    api.patch(`/notifications/${id}`, { read: true }).catch(() => {/* silent */})
  }, [])

  const pushNotification = useCallback(
    (kind: NotificationKind, meta: NotificationItem['meta']): NotificationItem => {
      const optimistic: NotificationItem = {
        id: `opt-${crypto.randomUUID()}`,
        kind,
        read: false,
        createdAt: Date.now(),
        meta,
      }
      setItems((prev) => [optimistic, ...prev])

      api
        .post<{ notification: NotificationItem }>('/notifications', { kind, meta })
        .then(({ notification }) => {
          setItems((prev) =>
            prev.map((n) => (n.id === optimistic.id ? notification : n)),
          )
        })
        .catch(() => {/* keep optimistic */})

      return optimistic
    },
    [],
  )

  const addBidPlaced = useCallback(
    (amount: number, itemTitle: string) => {
      pushNotification('bid_placed', { bidAmount: amount, rawItem: itemTitle })
    },
    [pushNotification],
  )

  const addLotBroadcast = useCallback(
    (itemTitle: string, amount: number) => {
      pushNotification('lot_broadcast', { rawItem: itemTitle, bidAmount: amount })
    },
    [pushNotification],
  )

  const addPaymentSuccess = useCallback(
    (totalUsd: number) => {
      pushNotification('payment', { paymentTotal: totalUsd })
    },
    [pushNotification],
  )

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      clearAll,
      markRead,
      addBidPlaced,
      addLotBroadcast,
      addPaymentSuccess,
    }),
    [items, unreadCount, clearAll, markRead, addBidPlaced, addLotBroadcast, addPaymentSuccess],
  )

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
