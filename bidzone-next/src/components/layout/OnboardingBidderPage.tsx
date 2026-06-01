'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Gavel, HelpCircle, Lock, Mail, MapPin, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useHelp } from '@/context/HelpContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export function OnboardingBidderPage() {
  const { isAuthenticated, registerBidder } = useAuth()
  const { t } = useI18n()
  const { openHelp } = useHelp()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) router.replace('/home')
  }, [isAuthenticated, router])

  if (isAuthenticated) return null

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const r = registerBidder({ fullName, email, password, address, city })
    if (r === 'email_taken') {
      setError(t('onboard.errEmailTaken'))
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

      <div className="login-page__card" style={{ maxWidth: 440 }}>
        <div className="login-page__header">
          <div className="login-page__brand-row">
            <Gavel className="login-page__gavel" size={40} strokeWidth={1.75} aria-hidden />
            <div>
              <h1 className="login-page__title">{t('onboard.bidderTitle')}</h1>
              <p className="login-page__tagline">{t('onboard.bidderSub')}</p>
            </div>
          </div>
        </div>
        <div className="login-page__body">
          <form className="login-page__form" onSubmit={onSubmit}>
            <label className="login-page__field">
              <span className="login-page__label">{t('login.name')}</span>
              <div className="login-page__input-wrap">
                <User className="login-page__input-icon" size={18} aria-hidden />
                <input type="text" required placeholder={t('login.namePh')} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
              </div>
            </label>
            <label className="login-page__field">
              <span className="login-page__label">{t('login.email')}</span>
              <div className="login-page__input-wrap">
                <Mail className="login-page__input-icon" size={18} aria-hidden />
                <input type="email" required placeholder={t('login.emailPh')} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </label>
            <label className="login-page__field">
              <span className="login-page__label">{t('login.password')}</span>
              <div className="login-page__input-wrap">
                <Lock className="login-page__input-icon" size={18} aria-hidden />
                <input type="password" required minLength={6} placeholder={t('login.passwordPh')} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
            </label>
            <label className="login-page__field">
              <span className="login-page__label">{t('onboard.address')}</span>
              <div className="login-page__input-wrap">
                <MapPin className="login-page__input-icon" size={18} aria-hidden />
                <input type="text" required placeholder={t('onboard.addressPh')} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
              </div>
            </label>
            <label className="login-page__field">
              <span className="login-page__label">{t('onboard.city')}</span>
              <div className="login-page__input-wrap">
                <MapPin className="login-page__input-icon" size={18} aria-hidden />
                <input type="text" required placeholder={t('onboard.cityPh')} value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
              </div>
            </label>
            {error && (
              <p role="alert" style={{ color: 'var(--bz-err)', fontSize: '0.875rem', margin: 0 }}>{error}</p>
            )}
            <button type="submit" className="login-page__submit">{t('onboard.bidderSubmit')}</button>
          </form>
          <p className="onboard-back">
            <Link href="/onboarding">{t('onboard.backRoles')}</Link>
          </p>
        </div>
      </div>
      <style>{`
        .onboard-back { margin:1rem 0 0;text-align:center;font-size:.9rem; }
        .onboard-back a { color:var(--bz-gold);font-weight:600; }
      `}</style>
    </div>
  )
}
