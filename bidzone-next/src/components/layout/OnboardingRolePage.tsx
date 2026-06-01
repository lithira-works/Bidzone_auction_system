'use client'
import Link from 'next/link'
import { Gavel, HelpCircle, ShoppingBag, Store } from 'lucide-react'
import { useI18n } from '@/context/I18nContext'
import { useHelp } from '@/context/HelpContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export function OnboardingRolePage() {
  const { t } = useI18n()
  const { openHelp } = useHelp()

  return (
    <div className="login-page">
      <div className="login-page__top-tools">
        <LanguageSwitcher />
      </div>
      <button type="button" className="login-page__help" aria-label={t('common.help')} onClick={openHelp}>
        <HelpCircle size={22} />
      </button>

      <div className="login-page__card" style={{ maxWidth: 480 }}>
        <div className="login-page__header">
          <div className="login-page__brand-row">
            <Gavel className="login-page__gavel" size={40} strokeWidth={1.75} aria-hidden />
            <div>
              <h1 className="login-page__title">{t('onboard.roleTitle')}</h1>
              <p className="login-page__tagline">{t('onboard.roleSub')}</p>
            </div>
          </div>
        </div>
        <div className="login-page__body" style={{ paddingBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <Link href="/onboarding/bidder" className="onboard-choice">
              <ShoppingBag size={22} aria-hidden />
              <span>
                <strong>{t('onboard.bidderCardTitle')}</strong>
                <small>{t('onboard.bidderCardSub')}</small>
              </span>
            </Link>
            <Link href="/onboarding/seller" className="onboard-choice">
              <Store size={22} aria-hidden />
              <span>
                <strong>{t('onboard.sellerCardTitle')}</strong>
                <small>{t('onboard.sellerCardSub')}</small>
              </span>
            </Link>
          </div>
          <p className="onboard-foot">
            <Link href="/">{t('onboard.haveAccount')}</Link>
          </p>
        </div>
      </div>
      <style>{`
        .onboard-choice {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding: 1rem 1.1rem;
          border-radius: 12px;
          border: 2px solid var(--bz-card-border);
          text-decoration: none;
          color: var(--bz-text);
          transition: border-color 0.15s, background 0.15s;
        }
        .onboard-choice:hover {
          border-color: var(--bz-gold);
          background: color-mix(in srgb, var(--bz-gold) 10%, var(--bz-card-bg));
        }
        .onboard-choice span {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          text-align: left;
        }
        .onboard-choice small {
          font-size: 0.85rem;
          color: var(--bz-text-muted);
          font-weight: 400;
        }
        .onboard-foot {
          margin: 1.25rem 0 0;
          text-align: center;
          font-size: 0.9rem;
        }
        .onboard-foot a {
          color: var(--bz-gold);
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
