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
import { LOCALE_LABELS, STRINGS, type Locale } from '@/i18n/strings'

const STORAGE_KEY = 'bidzone-locale'

type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  localeLabels: typeof LOCALE_LABELS
}

const I18nContext = createContext<I18nContextValue | null>(null)

function readStoredLocale(): Locale {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'si' || v === 'ta' || v === 'en') return v
  } catch {
    /* ignore */
  }
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    setLocaleState(readStoredLocale())
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const map: Record<Locale, string> = { en: 'en', si: 'si', ta: 'ta' }
    document.documentElement.lang = map[locale] ?? 'en'
  }, [locale])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let s = STRINGS[locale][key] ?? STRINGS.en[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          const token = `{${k}}`
          s = s.split(token).join(String(v))
        }
      }
      return s
    },
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t, localeLabels: LOCALE_LABELS }),
    [locale, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
