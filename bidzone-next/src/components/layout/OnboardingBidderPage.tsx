'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Eye, EyeOff, Gavel, HelpCircle,
  Lock, Mail, MapPin, ShieldCheck, ShoppingBag, Star, User,
  Zap, Package, TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useHelp } from '@/context/HelpContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

const HERO_FEATURES = [
  { icon: ShoppingBag, text: 'Browse 100K+ live auctions daily' },
  { icon: Zap,         text: 'AI-powered bid coaching & win probability' },
  { icon: ShieldCheck, text: 'Buyer protection on every purchase' },
  { icon: TrendingUp,  text: 'Real-time price tracking & notifications' },
]

const STATS = [
  { value: '50K+', label: 'Active bidders' },
  { value: '100K+', label: 'Items sold' },
  { value: '$50M+', label: 'Total sales' },
]

export function OnboardingBidderPage() {
  const { isAuthenticated, registerBidder } = useAuth()
  const { t } = useI18n()
  const { openHelp } = useHelp()
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [address, setAddress]   = useState('')
  const [city, setCity]         = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAuthenticated) router.replace('/home')
    else nameRef.current?.focus()
  }, [isAuthenticated, router])

  if (isAuthenticated) return null

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const r = await registerBidder({ fullName, email, password, address, city })
      if (r === 'email_taken') {
        setError(t('onboard.errEmailTaken'))
        return
      }
      router.replace('/home')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ob-role">

      {/* ════════════════════════════════
          LEFT HERO — Bidder benefits
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

          {/* Pill */}
          <div className="ob-role__step-pill">
            <Star size={10} strokeWidth={2.5} />
            Bidder Registration
          </div>

          <h1 className="ob-role__headline">
            Start Bidding<br />
            in{' '}
            <span className="ob-role__headline-accent">Minutes.</span>
          </h1>

          <p className="ob-role__hero-sub">
            Quick sign-up, no credit card required. Access thousands
            of exclusive live auctions instantly.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.25rem' }}>
            {HERO_FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)',
                  display: 'grid', placeItems: 'center', color: 'var(--bz-gold)',
                }}>
                  <Icon size={16} strokeWidth={1.75} />
                </div>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.45 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="ob-role__stats">
            {STATS.map((s) => (
              <div key={s.label}>
                <span className="ob-role__stat-val">{s.value}</span>
                <span className="ob-role__stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Trust */}
          <div className="ob-role__trust">
            <ShieldCheck size={12} strokeWidth={2.5} />
            <span>SSL Secured</span>
            <span className="ob-role__trust-sep" aria-hidden />
            <span>No credit card needed</span>
            <span className="ob-role__trust-sep" aria-hidden />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          RIGHT — Registration form
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

          {/* Mobile brand */}
          <div className="ob-role__mobile-brand" aria-hidden="true">
            <div className="ob-role__brand-icon">
              <Gavel size={19} strokeWidth={2.2} />
            </div>
            <span className="ob-role__brand-name">BidZone</span>
          </div>

          {/* Headings */}
          <h2 className="ob-role__panel-heading">Create your account</h2>
          <p className="ob-role__panel-sub">
            Start bidding in minutes — free forever.
          </p>

          {/* Form */}
          <form className="ob-form" onSubmit={onSubmit} noValidate>

            {/* Full name */}
            <label className="ob-field">
              <span className="ob-label">{t('login.name')}</span>
              <div className="ob-input-wrap">
                <span className="ob-input-icon"><User size={17} /></span>
                <input
                  ref={nameRef}
                  className="ob-input"
                  type="text"
                  required
                  placeholder={t('login.namePh')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            </label>

            {/* Email */}
            <label className="ob-field">
              <span className="ob-label">{t('login.email')}</span>
              <div className="ob-input-wrap">
                <span className="ob-input-icon"><Mail size={17} /></span>
                <input
                  className="ob-input"
                  type="email"
                  required
                  placeholder={t('login.emailPh')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </label>

            {/* Password */}
            <label className="ob-field">
              <span className="ob-label">{t('login.password')}</span>
              <div className="ob-input-wrap">
                <span className="ob-input-icon"><Lock size={17} /></span>
                <input
                  className="ob-input ob-input--pad-right"
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder={t('login.passwordPh')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="ob-eye"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? t('login.hidePw') : t('login.showPw')}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {/* Address */}
            <label className="ob-field">
              <span className="ob-label">{t('onboard.address')}</span>
              <div className="ob-input-wrap">
                <span className="ob-input-icon"><MapPin size={17} /></span>
                <input
                  className="ob-input"
                  type="text"
                  required
                  placeholder={t('onboard.addressPh')}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                  disabled={loading}
                />
              </div>
            </label>

            {/* City */}
            <label className="ob-field">
              <span className="ob-label">{t('onboard.city')}</span>
              <div className="ob-input-wrap">
                <span className="ob-input-icon"><Package size={17} /></span>
                <input
                  className="ob-input"
                  type="text"
                  required
                  placeholder={t('onboard.cityPh')}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                  disabled={loading}
                />
              </div>
            </label>

            {/* Error */}
            {error && (
              <p role="alert" className="ob-alert">
                <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </p>
            )}

            {/* Submit */}
            <button type="submit" className="ob-btn" disabled={loading}>
              {loading ? (
                <>
                  <span style={{
                    width: 18, height: 18, border: '2px solid rgba(3,7,18,0.3)',
                    borderTopColor: '#030712', borderRadius: '50%',
                    animation: 'ob-spin 0.7s linear infinite', flexShrink: 0,
                  }} />
                  Creating account…
                </>
              ) : (
                <>
                  {t('onboard.bidderSubmit')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          {/* Footer links */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link href="/onboarding" className="ob-back">
              <ArrowLeft size={15} />
              {t('onboard.backRoles')}
            </Link>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--bz-text-muted)' }}>
              Have an account?{' '}
              <Link href="/" style={{ color: 'var(--bz-gold)', fontWeight: 700, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
