'use client'
import Link from 'next/link'
import { ArrowRight, Gavel, HelpCircle, ShieldCheck, ShoppingBag, Star, Store } from 'lucide-react'
import { useI18n } from '@/context/I18nContext'
import { useHelp } from '@/context/HelpContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

const STATS = [
  { value: '50K+', label: 'Active bidders' },
  { value: '100K+', label: 'Items sold' },
  { value: '$50M+', label: 'Total sales' },
]

const BIDDER_FEATURES = [
  'Browse thousands of live auctions',
  'Real-time competitive bidding',
  'AI-powered bid coaching & win probability',
  'Buyer protection on every purchase',
]

const SELLER_FEATURES = [
  'List unlimited items with no upfront fees',
  'Real-time auction management dashboard',
  'Automated KYC & AML identity verification',
  'Reach 50,000+ verified global buyers',
]

export function OnboardingRolePage() {
  const { t } = useI18n()
  const { openHelp } = useHelp()

  return (
    <div className="ob-role">
      {/* ════════════════════════════════
          LEFT — Hero panel
          ════════════════════════════════ */}
      <div className="ob-role__hero" aria-hidden="true">
        <div className="ob-role__orb ob-role__orb--1" />
        <div className="ob-role__orb ob-role__orb--2" />
        <div className="ob-role__orb ob-role__orb--3" />

        <div className="ob-role__hero-inner">
          {/* Brand */}
          <div className="ob-role__brand">
            <div className="ob-role__brand-icon">
              <Gavel size={21} strokeWidth={2.2} />
            </div>
            <span className="ob-role__brand-name">BidZone</span>
          </div>

          {/* Step badge */}
          <div className="ob-role__step-pill">
            <Star size={10} strokeWidth={2.5} />
            Step 1 of 2 — Account type
          </div>

          {/* Headline */}
          <h1 className="ob-role__headline">
            Join the<br />
            <span className="ob-role__headline-accent">Premier</span>{' '}
            Auction<br />
            Platform.
          </h1>

          <p className="ob-role__hero-sub">
            Real-time auctions on exclusive items. Verified sellers,
            secure payments, and AI-powered bid coaching.
          </p>

          {/* Stats */}
          <div className="ob-role__stats">
            {STATS.map((s) => (
              <div key={s.label}>
                <span className="ob-role__stat-val">{s.value}</span>
                <span className="ob-role__stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Trust row */}
          <div className="ob-role__trust">
            <ShieldCheck size={12} strokeWidth={2.5} />
            <span>SSL Secured</span>
            <span className="ob-role__trust-sep" aria-hidden />
            <span>Verified Sellers</span>
            <span className="ob-role__trust-sep" aria-hidden />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          RIGHT — Choice panel
          ════════════════════════════════ */}
      <div className="ob-role__panel">
        <div className="ob-role__panel-inner">
          {/* Toolbar */}
          <div className="ob-role__toolbar">
            <LanguageSwitcher />
            <button
              type="button"
              className="ob-role__help-btn"
              aria-label={t('common.help')}
              onClick={openHelp}
            >
              <HelpCircle size={17} />
            </button>
          </div>

          {/* Mobile-only brand */}
          <div className="ob-role__mobile-brand" aria-hidden="true">
            <div className="ob-role__brand-icon">
              <Gavel size={19} strokeWidth={2.2} />
            </div>
            <span className="ob-role__brand-name">BidZone</span>
          </div>

          <h2 className="ob-role__panel-heading">Create your account</h2>
          <p className="ob-role__panel-sub">
            How do you want to participate in BidZone?
          </p>

          {/* ── Cards ── */}
          <div className="ob-role__cards">

            {/* Bidder card */}
            <Link href="/onboarding/bidder" className="ob-role__card ob-role__card--bidder">
              <div className="ob-role__card-head">
                <div className="ob-role__card-icon ob-role__card-icon--bidder">
                  <ShoppingBag size={22} strokeWidth={1.75} />
                </div>
                <span className="ob-role__card-badge ob-role__card-badge--popular">
                  <Star size={9} strokeWidth={2.5} />
                  Most popular
                </span>
              </div>

              <div>
                <h3 className="ob-role__card-title">Register as a Bidder</h3>
                <p className="ob-role__card-desc">
                  Shop thousands of live auctions with full buyer protection on every purchase.
                </p>
              </div>

              <ul className="ob-role__features" aria-label="Bidder features">
                {BIDDER_FEATURES.map((f) => (
                  <li key={f} className="ob-role__feature">
                    <span className="ob-role__feature-check ob-role__feature-check--bidder" aria-hidden>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="ob-role__card-footer">
                <span className="ob-role__cta-label">Get started for free</span>
                <span className="ob-role__cta-arrow" aria-hidden>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </span>
              </div>
            </Link>

            {/* Seller card */}
            <Link href="/onboarding/seller" className="ob-role__card ob-role__card--seller">
              <div className="ob-role__card-head">
                <div className="ob-role__card-icon ob-role__card-icon--seller">
                  <Store size={22} strokeWidth={1.75} />
                </div>
                <span className="ob-role__card-badge ob-role__card-badge--kyc">
                  <ShieldCheck size={9} strokeWidth={2.5} />
                  KYC verified
                </span>
              </div>

              <div>
                <h3 className="ob-role__card-title">Register as a Seller</h3>
                <p className="ob-role__card-desc">
                  List items, run live auctions, and reach verified buyers worldwide.
                </p>
              </div>

              <ul className="ob-role__features" aria-label="Seller features">
                {SELLER_FEATURES.map((f) => (
                  <li key={f} className="ob-role__feature">
                    <span className="ob-role__feature-check ob-role__feature-check--seller" aria-hidden>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="ob-role__card-footer">
                <span className="ob-role__cta-label">Start selling today</span>
                <span className="ob-role__cta-arrow" aria-hidden>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </span>
              </div>
            </Link>

          </div>

          {/* Sign-in link */}
          <div className="ob-role__footer">
            <p className="ob-role__footer-text">
              Already have an account?{' '}
              <Link href="/" className="ob-role__footer-link">
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
