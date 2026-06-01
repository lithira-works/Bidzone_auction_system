'use client'
import Link from 'next/link'
import { Gavel } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { categories } from '@/data/auctions'

export function SiteFooter() {
  const { t } = useI18n()
  const { canAccessSellerTools, user } = useAuth()
  const sellHref =
    canAccessSellerTools ? '/seller/new' : user?.role === 'bidder' ? '/onboarding/seller-upgrade' : '/register'

  return (
    <footer className="site-footer">
      <div className="site-footer__jump-targets" aria-hidden="true">
        <span id="how" />
        <span id="buyer" />
        <span id="help" />
        <span id="terms" />
        <span id="privacy" />
        <span id="cookies" />
      </div>

      {/* Brand + social */}
      <div className="site-footer__brand">
        <div>
          <Link href="/home" className="site-footer__brand-logo">
            <Gavel size={22} className="site-footer__brand-logo-icon" aria-hidden />
            BidZone
          </Link>
          <p className="site-footer__brand-tagline">
            The premium auction platform where every bid tells a story.
          </p>
          <div className="site-footer__social">
            <a href="#" className="site-footer__social-btn" aria-label="Twitter/X">X</a>
            <a href="#" className="site-footer__social-btn" aria-label="Instagram">IG</a>
            <a href="#" className="site-footer__social-btn" aria-label="LinkedIn">in</a>
          </div>
        </div>
      </div>

      {/* Links grid */}
      <div className="site-footer__inner">
        <div className="site-footer__col">
          <h3 className="site-footer__heading">{t('footer.about')}</h3>
          <p className="site-footer__text">{t('footer.aboutText')}</p>
        </div>
        <div className="site-footer__col">
          <h3 className="site-footer__heading">{t('footer.quickLinks')}</h3>
          <ul className="site-footer__list">
            <li><a href="#how">{t('footer.howToBid')}</a></li>
            <li><Link href={sellHref}>{t('footer.sell')}</Link></li>
            <li><a href="#buyer">{t('footer.buyer')}</a></li>
            <li><a href="#help">{t('footer.help')}</a></li>
          </ul>
        </div>
        <div className="site-footer__col">
          <h3 className="site-footer__heading">{t('footer.categories')}</h3>
          <ul className="site-footer__list">
            {categories.slice(0, 4).map((c) => (
              <li key={c.slug}>
                <Link href={`/home?category=${c.slug}`}>{t(`cat.${c.slug}` as 'cat.electronics')}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="site-footer__col">
          <h3 className="site-footer__heading">{t('footer.legal')}</h3>
          <ul className="site-footer__list">
            <li><a href="#terms">{t('footer.terms')}</a></li>
            <li><a href="#privacy">{t('footer.privacy')}</a></li>
            <li><a href="#cookies">{t('footer.cookies')}</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="site-footer__bottom">
        <p className="site-footer__copy">{t('footer.copy')}</p>
        <ul className="site-footer__bottom-links">
          <li><a href="#privacy">{t('footer.privacy')}</a></li>
          <li><a href="#terms">{t('footer.terms')}</a></li>
          <li><a href="#cookies">{t('footer.cookies')}</a></li>
        </ul>
      </div>
    </footer>
  )
}
