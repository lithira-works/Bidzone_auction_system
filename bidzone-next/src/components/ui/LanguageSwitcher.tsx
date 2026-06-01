'use client'
import { useI18n } from '@/context/I18nContext'
import type { Locale } from '@/i18n/strings'

const LOCALES: Locale[] = ['en', 'si', 'ta']

export function LanguageSwitcher() {
  const { locale, setLocale, t, localeLabels } = useI18n()

  return (
    <div className="lang-switch" role="group" aria-label={t('lang.label')}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          className={l === locale ? 'lang-switch__btn lang-switch__btn--active' : 'lang-switch__btn'}
          onClick={() => setLocale(l)}
          aria-pressed={l === locale}
        >
          {localeLabels[l]}
        </button>
      ))}
    </div>
  )
}
