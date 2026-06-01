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

export type NotificationKind = 'outbid' | 'bid_placed' | 'won' | 'payment' | 'lot_broadcast'

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
  }
}

const STORAGE_KEY = 'bidzone-notifications'

function loadNotifications(): NotificationItem[] | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return undefined
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return undefined
    return parsed.filter((x) => x && typeof (x as NotificationItem).id === 'string') as NotificationItem[]
  } catch {
    return undefined
  }
}

function saveNotifications(items: NotificationItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function seedNotifications(): NotificationItem[] {
  const now = Date.now()
  return [
    {
      id: 'seed-outbid',
      kind: 'outbid',
      read: false,
      createdAt: now - 15 * 60 * 1000,
      meta: { itemKey: 'notif.demoItemRolex' },
    },
    {
      id: 'seed-bid',
      kind: 'bid_placed',
      read: false,
      createdAt: now - 30 * 60 * 1000,
      meta: { bidAmount: 2800 },
    },
    {
      id: 'seed-won',
      kind: 'won',
      read: true,
      createdAt: now - 120 * 60 * 1000,
      meta: { itemKey: 'notif.demoItemSunglasses' },
    },
  ]
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
    const loaded = loadNotifications()
    if (loaded !== undefined) {
      setItems(loaded)
    } else {
      const seed = seedNotifications()
      saveNotifications(seed)
      setItems(seed)
    }
  }, [])

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items])

  const clearAll = useCallback(() => {
    setItems([])
    saveNotifications([])
  }, [])

  const markRead = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      saveNotifications(next)
      return next
    })
  }, [])

  const addBidPlaced = useCallback((amount: number, itemTitle: string) => {
    setItems((prev) => {
      const n: NotificationItem = {
        id: `push-${crypto.randomUUID()}`,
        kind: 'bid_placed',
        read: false,
        createdAt: Date.now(),
        meta: { bidAmount: amount, rawItem: itemTitle },
      }
      const next = [n, ...prev]
      saveNotifications(next)
      return next
    })
  }, [])

  const addLotBroadcast = useCallback((itemTitle: string, amount: number) => {
    setItems((prev) => {
      const n: NotificationItem = {
        id: `bc-${crypto.randomUUID()}`,
        kind: 'lot_broadcast',
        read: false,
        createdAt: Date.now(),
        meta: { rawItem: itemTitle, bidAmount: amount },
      }
      const next = [n, ...prev]
      saveNotifications(next)
      return next
    })
  }, [])

  const addPaymentSuccess = useCallback((totalUsd: number) => {
    setItems((prev) => {
      const n: NotificationItem = {
        id: `pay-${crypto.randomUUID()}`,
        kind: 'payment',
        read: false,
        createdAt: Date.now(),
        meta: { paymentTotal: totalUsd },
      }
      const next = [n, ...prev]
      saveNotifications(next)
      return next
    })
  }, [])

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
