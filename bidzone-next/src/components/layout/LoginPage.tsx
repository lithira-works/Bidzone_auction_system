'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Gavel, Lock, Mail, HelpCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useHelp } from '@/context/HelpContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const { login } = useAuth()
  const { t } = useI18n()
  const { openHelp } = useHelp()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthError(null)
    const r = login(email, password)
    if (r === 'invalid') {
      setAuthError(t('login.errInvalid'))
      return
    }
    router.replace('/home')
  }

  return (
    <div className="login-page">
      <div className="login-page__top-tools">
        <LanguageSwitcher />
      </div>
      <button type="button" className="login-page__help" aria-label={t('common.help')} onClick={openHelp}>
        <HelpCircle size={22} />
      </button>

      <div className="login-page__card">
        <div className="login-page__header">
          <div className="login-page__brand-row">
            <Gavel className="login-page__gavel" size={40} strokeWidth={1.75} aria-hidden />
            <div>
              <h1 className="login-page__title">BidZone</h1>
              <p className="login-page__tagline">{t('login.tagline')}</p>
            </div>
          </div>
        </div>

        <div className="login-page__body">
          <p className="login-page__signup-prompt">
            {t('login.newHere')}{' '}
            <Link href="/onboarding" className="login-page__signup-link">
              {t('login.startOnboarding')}
            </Link>
          </p>

          <form className="login-page__form" onSubmit={handleSubmit}>
            <label className="login-page__field">
              <span className="login-page__label">{t('login.email')}</span>
              <div className="login-page__input-wrap">
                <Mail className="login-page__input-icon" size={18} aria-hidden />
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
            <label className="login-page__field">
              <span className="login-page__label">{t('login.password')}</span>
              <div className="login-page__input-wrap">
                <Lock className="login-page__input-icon" size={18} aria-hidden />
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
                  className="login-page__eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('login.hidePw') : t('login.showPw')}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <div className="login-page__row">
              <label className="login-page__remember">
                <input type="checkbox" name="remember" />
                {t('login.remember')}
              </label>
              <a href="#forgot" className="login-page__forgot">
                {t('login.forgot')}
              </a>
            </div>

            {authError && (
              <p role="alert" className="login-page__auth-error">
                {authError}
              </p>
            )}

            <button type="submit" className="login-page__submit">
              {t('login.signIn')}
            </button>
          </form>

          <div className="login-page__divider">
            <span>{t('login.orSocial')}</span>
          </div>

          <div className="login-page__social">
            <button type="button" className="login-page__social-btn">
              <GoogleIcon />
              {t('login.google')}
            </button>
            <button type="button" className="login-page__social-btn">
              <FacebookIcon />
              {t('login.facebook')}
            </button>
          </div>
        </div>
      </div>

      <section className="login-page__stats" aria-label={t('login.statsHead')}>
        <h2 className="login-page__stats-headline">{t('login.statsHead')}</h2>
        <div className="login-page__stats-grid">
          <div>
            <p className="login-page__stat-value">50K+</p>
            <p className="login-page__stat-label">{t('login.statUsers')}</p>
          </div>
          <div>
            <p className="login-page__stat-value">100K+</p>
            <p className="login-page__stat-label">{t('login.statSold')}</p>
          </div>
          <div>
            <p className="login-page__stat-value">$50M+</p>
            <p className="login-page__stat-label">{t('login.statSales')}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
