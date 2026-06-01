'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, CheckCircle2, Gavel, HelpCircle, IdCard, Lock, Mail, MapPin, Phone, Shield, User,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useHelp } from '@/context/HelpContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { DEMO_OTP_CODE, type UserProfile } from '@/types/userProfile'

type Step = 'account' | 'phone' | 'otp' | 'nic' | 'aml' | 'done'

type Props =
  | { mode: 'new' }
  | { mode: 'upgrade'; bidder: UserProfile }

export function SellerKycWizard(props: Props) {
  const { registerNewVerifiedSeller, upgradeCurrentUserToSeller } = useAuth()
  const { t } = useI18n()
  const { openHelp } = useHelp()
  const router = useRouter()

  const initialStep: Step = props.mode === 'new' ? 'account' : 'phone'

  const [step, setStep] = useState<Step>(initialStep)

  const [fullName, setFullName] = useState(props.mode === 'upgrade' ? props.bidder.fullName : '')
  const [email, setEmail] = useState(props.mode === 'upgrade' ? props.bidder.email : '')
  const [password, setPassword] = useState('')
  const [address, setAddress] = useState(props.mode === 'upgrade' ? props.bidder.address : '')
  const [city, setCity] = useState(props.mode === 'upgrade' ? props.bidder.city : '')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [nicDataUrl, setNicDataUrl] = useState<string | null>(null)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [regError, setRegError] = useState<string | null>(null)
  const [amlRunning, setAmlRunning] = useState(false)

  function onAccountNext(e: React.FormEvent) {
    e.preventDefault()
    setRegError(null)
    setStep('phone')
  }

  function onPhoneNext(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) return
    setOtpError(null)
    setStep('otp')
  }

  function onOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (otp.trim() !== DEMO_OTP_CODE) {
      setOtpError(t('onboard.otpWrong'))
      return
    }
    setOtpError(null)
    setStep('nic')
  }

  function onNicNext(e: React.FormEvent) {
    e.preventDefault()
    if (!nicDataUrl || amlRunning) return
    setAmlRunning(true)
    setStep('aml')
    window.setTimeout(() => {
      if (props.mode === 'new') {
        const r = registerNewVerifiedSeller({
          fullName, email, password, address, city, phone, nicImageDataUrl: nicDataUrl,
        })
        if (r === 'email_taken') {
          setRegError(t('onboard.errEmailTaken'))
          setAmlRunning(false)
          setStep('account')
          return
        }
      } else {
        upgradeCurrentUserToSeller({ phone, nicImageDataUrl: nicDataUrl })
      }
      setStep('done')
    }, 2400)
  }

  function onNicFileChange(f: FileList | null) {
    const file = f?.[0]
    if (!file || !file.type.startsWith('image/')) {
      setNicDataUrl(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setNicDataUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const title =
    step === 'done'
      ? t('onboard.sellerDoneTitle')
      : props.mode === 'upgrade'
        ? t('onboard.sellerUpgradeTitle')
        : t('onboard.sellerTitle')

  const sub =
    step === 'done'
      ? t('onboard.sellerDoneSub')
      : props.mode === 'upgrade'
        ? t('onboard.sellerUpgradeSub')
        : t('onboard.sellerSub')

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
              <h1 className="login-page__title">{title}</h1>
              <p className="login-page__tagline">{sub}</p>
            </div>
          </div>
        </div>
        <div className="login-page__body">
          {step !== 'done' && step !== 'aml' && (
            <ol className="kyc-steps" aria-label={t('onboard.stepsLabel')}>
              {(props.mode === 'new' ? ['account', 'phone', 'otp', 'nic'] : ['phone', 'otp', 'nic']).map((s, i) => {
                const order = ['account', 'phone', 'otp', 'nic', 'aml', 'done']
                const active = order.indexOf(step) >= order.indexOf(s)
                return (
                  <li key={s} className={active ? 'kyc-steps__dot kyc-steps__dot--on' : 'kyc-steps__dot'}>
                    {i + 1}
                  </li>
                )
              })}
            </ol>
          )}

          {step === 'account' && props.mode === 'new' && (
            <form className="login-page__form" onSubmit={onAccountNext}>
              {regError && (
                <p role="alert" style={{ color: 'var(--bz-err)', fontSize: '0.875rem', margin: 0 }}>
                  {regError}
                </p>
              )}
              <label className="login-page__field">
                <span className="login-page__label">{t('login.name')}</span>
                <div className="login-page__input-wrap">
                  <User className="login-page__input-icon" size={18} aria-hidden />
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
                </div>
              </label>
              <label className="login-page__field">
                <span className="login-page__label">{t('login.email')}</span>
                <div className="login-page__input-wrap">
                  <Mail className="login-page__input-icon" size={18} aria-hidden />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
              </label>
              <label className="login-page__field">
                <span className="login-page__label">{t('login.password')}</span>
                <div className="login-page__input-wrap">
                  <Lock className="login-page__input-icon" size={18} aria-hidden />
                  <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                </div>
              </label>
              <label className="login-page__field">
                <span className="login-page__label">{t('onboard.address')}</span>
                <div className="login-page__input-wrap">
                  <MapPin className="login-page__input-icon" size={18} aria-hidden />
                  <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
                </div>
              </label>
              <label className="login-page__field">
                <span className="login-page__label">{t('onboard.city')}</span>
                <div className="login-page__input-wrap">
                  <MapPin className="login-page__input-icon" size={18} aria-hidden />
                  <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </label>
              <button type="submit" className="login-page__submit">
                {t('onboard.next')}
                <ArrowRight size={18} style={{ marginLeft: 6 }} aria-hidden />
              </button>
            </form>
          )}

          {step === 'phone' && (
            <form className="login-page__form" onSubmit={onPhoneNext}>
              <p className="kyc-hint">{t('onboard.phoneHint')}</p>
              <label className="login-page__field">
                <span className="login-page__label">{t('onboard.phone')}</span>
                <div className="login-page__input-wrap">
                  <Phone className="login-page__input-icon" size={18} aria-hidden />
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder={t('onboard.phonePh')} />
                </div>
              </label>
              <button type="submit" className="login-page__submit">{t('onboard.sendOtp')}</button>
            </form>
          )}

          {step === 'otp' && (
            <form className="login-page__form" onSubmit={onOtpSubmit}>
              <p className="kyc-hint">{t('onboard.otpHint', { code: DEMO_OTP_CODE })}</p>
              <label className="login-page__field">
                <span className="login-page__label">{t('onboard.otpLabel')}</span>
                <div className="login-page__input-wrap">
                  <Shield className="login-page__input-icon" size={18} aria-hidden />
                  <input type="text" inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
                </div>
              </label>
              {otpError && (
                <p role="alert" style={{ color: 'var(--bz-err)', fontSize: '0.875rem', margin: 0 }}>{otpError}</p>
              )}
              <button type="submit" className="login-page__submit">{t('onboard.verifyOtp')}</button>
            </form>
          )}

          {step === 'nic' && (
            <form className="login-page__form" onSubmit={onNicNext}>
              <p className="kyc-hint">{t('onboard.nicHint')}</p>
              <label className="login-page__field">
                <span className="login-page__label">{t('onboard.nicLabel')}</span>
                <div className="login-page__input-wrap" style={{ alignItems: 'center', minHeight: 48, padding: '0.5rem 0.75rem' }}>
                  <IdCard className="login-page__input-icon" size={18} aria-hidden />
                  <input type="file" accept="image/*" required onChange={(e) => onNicFileChange(e.target.files)} />
                </div>
              </label>
              {nicDataUrl && (
                <div className="kyc-nic-preview">
                  <img src={nicDataUrl} alt="" />
                </div>
              )}
              <button type="submit" className="login-page__submit" disabled={!nicDataUrl}>{t('onboard.submitKyc')}</button>
            </form>
          )}

          {step === 'aml' && (
            <div className="kyc-aml" role="status">
              <Shield size={40} className="kyc-aml__icon" aria-hidden />
              <p>{t('onboard.amlWait')}</p>
            </div>
          )}

          {step === 'done' && (
            <div className="kyc-done">
              <CheckCircle2 size={48} className="kyc-done__icon" aria-hidden />
              <p>{t('onboard.sellerSuccess')}</p>
              <button type="button" className="login-page__submit" onClick={() => router.replace('/dashboard')}>
                {t('onboard.goDashboard')}
              </button>
            </div>
          )}

          {step !== 'done' && step !== 'aml' && (
            <p className="onboard-back">
              {props.mode === 'new' ? (
                <Link href="/onboarding">{t('onboard.backRoles')}</Link>
              ) : (
                <Link href="/home">{t('onboard.backHome')}</Link>
              )}
            </p>
          )}
        </div>
      </div>
      <style>{`
        .kyc-steps { display:flex;gap:.5rem;list-style:none;padding:0 0 1rem;margin:0;justify-content:center;border-bottom:1px solid var(--bz-card-border);margin-bottom:1.25rem; }
        .kyc-steps__dot { width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:.75rem;font-weight:700;background:var(--bz-card-border);color:var(--bz-text-muted); }
        .kyc-steps__dot--on { background:var(--bz-gold);color:var(--bz-bid-btn-text); }
        .kyc-hint { font-size:.875rem;color:var(--bz-text-body);margin:0 0 .75rem;line-height:1.45; }
        .kyc-nic-preview { margin:.5rem 0;border-radius:8px;overflow:hidden;border:1px solid var(--bz-card-border);max-height:160px; }
        .kyc-nic-preview img { width:100%;height:auto;display:block;object-fit:cover; }
        .kyc-aml { text-align:center;padding:2rem 1rem; }
        .kyc-aml__icon { color:var(--bz-ai-glow);margin-bottom:.75rem; }
        .kyc-done { text-align:center;padding:1rem 0 .5rem; }
        .kyc-done__icon { color:var(--bz-success);margin-bottom:.75rem; }
        .onboard-back { margin:1rem 0 0;text-align:center;font-size:.9rem; }
        .onboard-back a { color:var(--bz-gold);font-weight:600; }
      `}</style>
    </div>
  )
}
