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

export type SavedCardMask = {
  id: string
  brand: string
  last4: string
  expLabel: string
  addedAt: number
}

const STORAGE_KEY = 'bidzone-saved-cards-masks'

function load(): SavedCardMask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (x) =>
        x &&
        typeof (x as SavedCardMask).id === 'string' &&
        typeof (x as SavedCardMask).last4 === 'string',
    ) as SavedCardMask[]
  } catch {
    return []
  }
}

function save(list: SavedCardMask[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

type Value = {
  cards: SavedCardMask[]
  addCardMask: (c: Omit<SavedCardMask, 'id' | 'addedAt'>) => void
  removeCard: (id: string) => void
}

const Ctx = createContext<Value | null>(null)

export function SavedCardsProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<SavedCardMask[]>([])

  useEffect(() => {
    setCards(load())
  }, [])

  const addCardMask = useCallback((c: Omit<SavedCardMask, 'id' | 'addedAt'>) => {
    setCards((prev) => {
      const next: SavedCardMask[] = [
        {
          id: `card-${crypto.randomUUID()}`,
          ...c,
          addedAt: Date.now(),
        },
        ...prev.filter((x) => x.last4 !== c.last4 || x.expLabel !== c.expLabel),
      ].slice(0, 5)
      save(next)
      return next
    })
  }, [])

  const removeCard = useCallback((id: string) => {
    setCards((prev) => {
      const next = prev.filter((x) => x.id !== id)
      save(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ cards, addCardMask, removeCard }),
    [cards, addCardMask, removeCard],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSavedCards() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSavedCards must be used within SavedCardsProvider')
  return ctx
}
