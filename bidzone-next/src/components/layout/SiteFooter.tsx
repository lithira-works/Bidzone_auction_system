'use client'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { categories } from '@/data/auctions'

export function SiteFooter() {
  const { t } = useI18n()
  const { canAccessSellerTools, user } = useAuth()
  const sellHref =
    canAccessSellerTools ? '/seller/new' : user?.role === 'bidder' ? '/onboarding/seller-upgrade' : '/onboarding/seller'

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
      <p className="site-footer__copy">{t('footer.copy')}</p>
    </footer>
  )
}
