'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  HelpCircle,
  Gavel,
  ShieldCheck,
  LogIn,
  Users,
  TrendingUp,
  Package,
  ShieldOff,
  Clock,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useHelp } from '@/context/HelpContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

const GoogleSignInButton = dynamic(
  () => import('@/components/auth/GoogleSignInButton').then((m) => m.GoogleSignInButton),
  {
    ssr: false,
    loading: () => (
      <div className="lp__g-btn lp__g-btn--skeleton" aria-busy="true">
        <span className="lp__g-btn__icon-slot" />
        <span className="lp__g-btn__label">Continue with Google</span>
      </div>
    ),
  },
)

const STATS = [
  { icon: Users, value: '50K+', labelKey: 'login.statUsers' as const },
  { icon: Package, value: '100K+', labelKey: 'login.statSold' as const },
  { icon: TrendingUp, value: '$50M+', labelKey: 'login.statSales' as const },
]

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const { login, lockInfo: authLockInfo } = useAuth()
  const { t } = useI18n()
  const { openHelp } = useHelp()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthError(null)
    const r = await login(email, password)
    if (r === 'invalid') {
      setAuthError(t('login.errInvalid'))
      return
    }
    if (r === 'locked') {
      return /* lockInfo banner below renders the reason */
    }
    router.replace('/home')
  }

  return (
    <div className="lp">
      {/* Ambient decorative orbs */}
      <div className="lp__orb lp__orb--1" aria-hidden />
      <div className="lp__orb lp__orb--2" aria-hidden />
      <div className="lp__orb lp__orb--3" aria-hidden />

      {/* Fixed toolbar */}
      <div className="lp__toolbar">
        <LanguageSwitcher />
        <button
          type="button"
          className="lp__toolbar-help"
          aria-label={t('common.help')}
          onClick={openHelp}
        >
          <HelpCircle size={17} />
        </button>
      </div>

      <main className="lp__main">
        {/* ── LEFT HERO PANEL (desktop only) ── */}
        <div className="lp__hero">
          <div className="lp__hero-inner">
            <div className="lp__hero-badge">
              <Gavel size={13} strokeWidth={2} aria-hidden />
              Premium Auction Platform
            </div>

            <h1 className="lp__hero-headline">
              Bid Smarter.<br />
              Win <span className="lp__hero-accent">More.</span>
            </h1>

            <p className="lp__hero-copy">
              Real-time auctions on thousands of exclusive items. Verified sellers, 
              trusted payments, AI-powered bid coaching.
            </p>

            <div className="lp__hero-stats">
              {STATS.map(({ icon: Icon, value, labelKey }) => (
                <div key={labelKey} className="lp__hero-stat">
                  <Icon size={18} className="lp__hero-stat-icon" aria-hidden />
                  <span className="lp__hero-stat-val">{value}</span>
                  <span className="lp__hero-stat-lbl">{t(labelKey)}</span>
                </div>
              ))}
            </div>

            <div className="lp__hero-trust">
              <ShieldCheck size={14} aria-hidden />
              <span>Verified sellers · Secure payments · Live support</span>
            </div>
          </div>

          {/* Decorative gavel watermark */}
          <div className="lp__hero-watermark" aria-hidden>
            <Gavel size={280} strokeWidth={0.4} />
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div className="lp__panel">
          <div className="lp__card">
            {/* Mobile-only brand mark */}
            <div className="lp__card-brand">
              <Gavel size={28} className="lp__card-gavel" strokeWidth={1.75} aria-hidden />
              <span className="lp__card-name">BidZone</span>
            </div>

            <h2 className="lp__card-title">Welcome back</h2>
            <p className="lp__card-sub">
              New to BidZone?{' '}
              <Link href="/register" className="lp__card-link">
                Create a free account
              </Link>
            </p>

            {authLockInfo && (
              <div className={`lp__lock-banner lp__lock-banner--${authLockInfo.code === 'account_banned' ? 'banned' : 'suspended'}`} role="alert">
                <span className="lp__lock-icon" aria-hidden>
                  {authLockInfo.code === 'account_banned' ? <ShieldOff size={18} /> : <Clock size={18} />}
                </span>
                <div>
                  <p className="lp__lock-title">
                    {authLockInfo.code === 'account_banned' ? 'Account Banned' : 'Account Temporarily Suspended'}
                  </p>
                  <p className="lp__lock-reason">{authLockInfo.reason}</p>
                  {authLockInfo.suspendedUntil && (
                    <p className="lp__lock-until">
                      Access restored: {new Date(authLockInfo.suspendedUntil).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Google – primary action */}
            <div className="lp__google-section">
              <GoogleSignInButton />
            </div>

            <div className="lp__divider">
              <span>{t('login.orSocial')}</span>
            </div>

            <form className="lp__form" onSubmit={handleSubmit} noValidate>
              <label className="lp__field">
                <span className="lp__field-label">{t('login.email')}</span>
                <div className="lp__input-wrap">
                  <Mail size={16} className="lp__input-icon" aria-hidden />
                  <input
                    type="email"
                    required
                    placeholder={t('login.emailPh')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="lp__field">
                <span className="lp__field-label">{t('login.password')}</span>
                <div className="lp__input-wrap">
                  <Lock size={16} className="lp__input-icon" aria-hidden />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={t('login.passwordPh')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lp__eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('login.hidePw') : t('login.showPw')}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <div className="lp__form-row">
                <label className="lp__remember">
                  <input type="checkbox" name="remember" />
                  {t('login.remember')}
                </label>
                <a href="#forgot" className="lp__forgot">
                  {t('login.forgot')}
                </a>
              </div>

              {authError && (
                <p role="alert" className="lp__error">
                  {authError}
                </p>
              )}

              <button type="submit" className="lp__submit">
                <LogIn size={18} aria-hidden />
                {t('login.signIn')}
              </button>
            </form>

            <p className="lp__terms">
              By signing in you agree to our{' '}
              <a href="#terms" className="lp__terms-link">Terms of Service</a>
              {' '}and{' '}
              <a href="#privacy" className="lp__terms-link">Privacy Policy</a>.
            </p>
          </div>

          {/* Mobile-only stats below card */}
          <div className="lp__mobile-stats" aria-label={t('login.statsHead')}>
            {STATS.map(({ value, labelKey }) => (
              <div key={labelKey} className="lp__mobile-stat">
                <span className="lp__mobile-stat-val">{value}</span>
                <span className="lp__mobile-stat-lbl">{t(labelKey)}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
