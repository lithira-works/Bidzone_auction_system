'use client'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useI18n } from './I18nContext'

type HelpContextValue = {
  openHelp: () => void
}

const HelpContext = createContext<HelpContextValue | null>(null)

export function HelpProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  const openHelp = useCallback(() => setOpen(true), [])
  const closeHelp = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ openHelp }), [openHelp])

  return (
    <HelpContext.Provider value={value}>
      {children}
      {open && (
        <div className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
          <button type="button" className="help-modal__backdrop" aria-label={t('help.close')} onClick={closeHelp} />
          <div className="help-modal__card">
            <h2 id="help-modal-title" className="help-modal__title">
              {t('help.title')}
            </h2>
            <p className="help-modal__body">{t('help.body')}</p>
            <button type="button" className="help-modal__btn" onClick={closeHelp}>
              {t('help.close')}
            </button>
          </div>
        </div>
      )}
    </HelpContext.Provider>
  )
}

export function useHelp() {
  const ctx = useContext(HelpContext)
  if (!ctx) throw new Error('useHelp must be used within HelpProvider')
  return ctx
}
