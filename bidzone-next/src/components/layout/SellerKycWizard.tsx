'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff,
  Gavel, HelpCircle, IdCard, Lock, Mail, MapPin, Phone,
  Shield, ShieldCheck, Star, User,
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

type StepDef = { id: Step; label: string }

const NEW_STEPS: StepDef[]     = [
  { id: 'account', label: 'Account' },
  { id: 'phone',   label: 'Phone'   },
  { id: 'otp',     label: 'Verify'  },
  { id: 'nic',     label: 'Identity'},
]
const UPGRADE_STEPS: StepDef[] = [
  { id: 'phone',   label: 'Phone'   },
  { id: 'otp',     label: 'Verify'  },
  { id: 'nic',     label: 'Identity'},
]
const STEP_ORDER: Step[] = ['account', 'phone', 'otp', 'nic', 'aml', 'done']

const HERO_TL = [
  { id: 'account' as Step, label: 'Account details',   sub: 'Name, email & password'        },
  { id: 'phone'   as Step, label: 'Phone verification', sub: 'SMS one-time code'              },
  { id: 'otp'     as Step, label: 'Code confirmation',  sub: 'Enter the code from your phone' },
  { id: 'nic'     as Step, label: 'Identity document',  sub: 'Upload NIC or passport scan'   },
]

export function SellerKycWizard(props: Props) {
  const { registerNewVerifiedSeller, upgradeCurrentUserToSeller } = useAuth()
  const { t } = useI18n()
  const { openHelp } = useHelp()
  const router = useRouter()

  const initialStep: Step = props.mode === 'new' ? 'account' : 'phone'
  const [step, setStep] = useState<Step>(initialStep)

  const [fullName, setFullName] = useState(props.mode === 'upgrade' ? props.bidder.fullName : '')
  const [email,    setEmail]    = useState(props.mode === 'upgrade' ? props.bidder.email    : '')
  const [password, setPassword] = useState('')
  const [address,  setAddress]  = useState(props.mode === 'upgrade' ? props.bidder.address  : '')
  const [city,     setCity]     = useState(props.mode === 'upgrade' ? props.bidder.city     : '')
  const [phone,    setPhone]    = useState('')
  const [otp,      setOtp]      = useState('')
  const [nicDataUrl, setNicDataUrl] = useState<string | null>(null)
  const [showPw,   setShowPw]   = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [regError, setRegError] = useState<string | null>(null)
  const [amlRunning, setAmlRunning] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  const steps    = props.mode === 'new' ? NEW_STEPS : UPGRADE_STEPS
  const curIdx   = STEP_ORDER.indexOf(step)

  function stepStatus(s: StepDef): 'done' | 'active' | 'pending' {
    const si = STEP_ORDER.indexOf(s.id)
    if (curIdx > si) return 'done'
    if (curIdx === si) return 'active'
    return 'pending'
  }

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
    window.setTimeout(async () => {
      if (props.mode === 'new') {
        const r = await registerNewVerifiedSeller({
          fullName, email, password, address, city, phone, nicImageDataUrl: nicDataUrl,
        })
        if (r === 'email_taken') {
          setRegError(t('onboard.errEmailTaken'))
          setAmlRunning(false)
          setStep('account')
          return
        }
      } else {
        await upgradeCurrentUserToSeller({ phone, nicImageDataUrl: nicDataUrl })
      }
      setStep('done')
    }, 2600)
  }

  function onNicFileChange(files: FileList | null) {
    const file = files?.[0]
    if (!file || !file.type.startsWith('image/')) { setNicDataUrl(null); return }
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === 'string') setNicDataUrl(reader.result) }
    reader.readAsDataURL(file)
  }

  /* ── Hero timeline status ── */
  function tlStatus(id: Step): 'done' | 'active' | 'pending' {
    const si = STEP_ORDER.indexOf(id)
    if (curIdx > si) return 'done'
    if (curIdx === si) return 'active'
    return 'pending'
  }

  const heroTitle =
    step === 'done'
      ? 'You\'re Verified!'
      : props.mode === 'upgrade'
        ? 'Become a Seller'
        : 'Seller Sign-up'

  return (
    <div className="ob-role">

      {/* ════════════════════════════════
          LEFT HERO — Seller timeline
          ════════════════════════════════ */}
      <div className="ob-role__hero" aria-hidden="true">
        <div className="ob-role__orb ob-role__orb--1" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)' }} />
        <div className="ob-role__orb ob-role__orb--2" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)' }} />
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
          <div className="ob-role__step-pill" style={{ background: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.3)', color: '#a78bfa' }}>
            <Star size={10} strokeWidth={2.5} />
            Seller Verification
          </div>

          <h1 className="ob-role__headline">
            {heroTitle.split(' ').slice(0, 2).join(' ')}<br />
            <span style={{
              background: 'linear-gradient(120deg,#a78bfa 0%,#8b5cf6 50%,#c4b5fd 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {heroTitle.split(' ').slice(2).join(' ') || 'Verified Seller'}
            </span>
          </h1>

          <p className="ob-role__hero-sub">
            {step === 'done'
              ? 'Your seller account is active. List items and start earning on BidZone.'
              : 'Complete 4 quick steps to unlock listing access and reach 50,000+ buyers.'}
          </p>

          {/* Verification timeline */}
          {step !== 'done' && (
            <div className="ob-seller-tl" style={{ marginBottom: '2rem' }}>
              {HERO_TL.map((item) => {
                const s = tlStatus(item.id)
                return (
                  <div key={item.id} className="ob-tl-item">
                    <div className="ob-tl-left">
                      <div className={`ob-tl-dot ob-tl-dot--${s}`}>
                        {s === 'done' ? <Check size={13} /> : HERO_TL.findIndex(h => h.id === item.id) + 1}
                      </div>
                      <div className={`ob-tl-line ob-tl-line--${s === 'done' ? 'done' : ''}`} />
                    </div>
                    <div className="ob-tl-content">
                      <p className={`ob-tl-title ob-tl-title--${s}`}>{item.label}</p>
                      <p className={`ob-tl-sub ob-tl-sub--${s === 'active' ? 'active' : ''}`}>{item.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Done perks */}
          {step === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {['Listing access is now active', 'Auctions go live immediately', 'Manage everything from dashboard'].map((perk) => (
                <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'grid', placeItems: 'center', color: '#10b981', flexShrink: 0 }}>
                    <Check size={13} />
                  </div>
                  <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)' }}>{perk}</span>
                </div>
              ))}
            </div>
          )}

          {/* Trust row */}
          <div className="ob-role__trust">
            <ShieldCheck size={12} strokeWidth={2.5} />
            <span>AML Screened</span>
            <span className="ob-role__trust-sep" aria-hidden />
            <span>KYC Verified</span>
            <span className="ob-role__trust-sep" aria-hidden />
            <span>Data Encrypted</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          RIGHT — Wizard steps
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

          {/* Step indicator */}
          {step !== 'done' && step !== 'aml' && (
            <nav className="ob-wiz-steps" aria-label={t('onboard.stepsLabel')}>
              {steps.map((s, i) => {
                const st = stepStatus(s)
                return (
                  <div key={s.id} className={`ob-wstep ob-wstep--${st}`}>
                    <div className="ob-wstep-top">
                      <div className="ob-wstep-circle">
                        {st === 'done' ? <Check size={13} /> : i + 1}
                      </div>
                      <div className="ob-wstep-line" />
                    </div>
                    <span className="ob-wstep-label">{s.label}</span>
                  </div>
                )
              })}
            </nav>
          )}

          {/* ── STEP: Account ── */}
          {step === 'account' && props.mode === 'new' && (
            <>
              <h2 className="ob-role__panel-heading">Account details</h2>
              <p className="ob-role__panel-sub">Create your seller login credentials.</p>

              <form className="ob-form" onSubmit={onAccountNext} noValidate>
                {regError && (
                  <p role="alert" className="ob-alert">
                    <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    {regError}
                  </p>
                )}

                <label className="ob-field">
                  <span className="ob-label">{t('login.name')}</span>
                  <div className="ob-input-wrap">
                    <span className="ob-input-icon"><User size={17} /></span>
                    <input className="ob-input" type="text" required autoFocus
                      placeholder="Your full name"
                      value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
                  </div>
                </label>

                <label className="ob-field">
                  <span className="ob-label">{t('login.email')}</span>
                  <div className="ob-input-wrap">
                    <span className="ob-input-icon"><Mail size={17} /></span>
                    <input className="ob-input" type="email" required
                      placeholder="your@email.com"
                      value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  </div>
                </label>

                <label className="ob-field">
                  <span className="ob-label">{t('login.password')}</span>
                  <div className="ob-input-wrap">
                    <span className="ob-input-icon"><Lock size={17} /></span>
                    <input
                      className="ob-input ob-input--pad-right"
                      type={showPw ? 'text' : 'password'}
                      required minLength={6}
                      placeholder="Min. 6 characters"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button type="button" className="ob-eye" onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? t('login.hidePw') : t('login.showPw')}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <label className="ob-field">
                  <span className="ob-label">{t('onboard.address')}</span>
                  <div className="ob-input-wrap">
                    <span className="ob-input-icon"><MapPin size={17} /></span>
                    <input className="ob-input" type="text" required
                      placeholder="Number, street, unit"
                      value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
                  </div>
                </label>

                <label className="ob-field">
                  <span className="ob-label">{t('onboard.city')}</span>
                  <div className="ob-input-wrap">
                    <span className="ob-input-icon"><MapPin size={17} /></span>
                    <input className="ob-input" type="text" required
                      placeholder="Your city"
                      value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
                  </div>
                </label>

                <button type="submit" className="ob-btn">
                  {t('onboard.next')} <ArrowRight size={18} />
                </button>
              </form>
            </>
          )}

          {/* ── STEP: Phone ── */}
          {step === 'phone' && (
            <>
              <h2 className="ob-role__panel-heading">Phone verification</h2>
              <p className="ob-role__panel-sub">We&apos;ll send a one-time code to confirm your number.</p>

              <form className="ob-form" onSubmit={onPhoneNext} noValidate>
                <div className="ob-hint">
                  <Shield size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  {t('onboard.phoneHint')}
                </div>

                <label className="ob-field">
                  <span className="ob-label">{t('onboard.phone')}</span>
                  <div className="ob-input-wrap">
                    <span className="ob-input-icon"><Phone size={17} /></span>
                    <input
                      className="ob-input"
                      type="tel" required autoFocus
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      placeholder={t('onboard.phonePh')}
                    />
                  </div>
                </label>

                <button type="submit" className="ob-btn">
                  <Phone size={17} />
                  {t('onboard.sendOtp')}
                </button>
              </form>
            </>
          )}

          {/* ── STEP: OTP ── */}
          {step === 'otp' && (
            <>
              <h2 className="ob-role__panel-heading">Enter your code</h2>
              <p className="ob-role__panel-sub">Check your phone for the 6-digit verification code.</p>

              <form className="ob-form" onSubmit={onOtpSubmit} noValidate>
                <div className="ob-hint">
                  <strong>Demo:</strong> enter <strong>{DEMO_OTP_CODE}</strong> to continue.
                </div>

                <label className="ob-field">
                  <span className="ob-label" style={{ textAlign: 'center' }}>{t('onboard.otpLabel')}</span>
                  <input
                    className="ob-input--otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    autoFocus
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="——————"
                  />
                </label>

                {otpError && (
                  <p role="alert" className="ob-alert">
                    <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    {otpError}
                  </p>
                )}

                <button type="submit" className="ob-btn">
                  <ShieldCheck size={17} />
                  {t('onboard.verifyOtp')}
                </button>
              </form>
            </>
          )}

          {/* ── STEP: NIC Upload ── */}
          {step === 'nic' && (
            <>
              <h2 className="ob-role__panel-heading">Identity document</h2>
              <p className="ob-role__panel-sub">Upload a clear photo of your NIC or passport.</p>

              <form className="ob-form" onSubmit={onNicNext} noValidate>
                <div className="ob-hint">
                  <IdCard size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  {t('onboard.nicHint')}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => onNicFileChange(e.target.files)}
                />

                {/* Upload zone */}
                <button
                  type="button"
                  className={`ob-upload-zone${nicDataUrl ? ' ob-upload-zone--uploaded' : ''}`}
                  onClick={() => fileRef.current?.click()}
                  aria-label="Upload identity document"
                >
                  <div className="ob-upload-icon-wrap">
                    {nicDataUrl ? <CheckCircle2 size={24} /> : <IdCard size={24} />}
                  </div>
                  <p className="ob-upload-title">
                    {nicDataUrl ? 'Document uploaded' : 'Tap to upload your NIC'}
                  </p>
                  <p className="ob-upload-sub">
                    {nicDataUrl ? 'Tap to change the file' : 'PNG, JPG or JPEG — max 10 MB'}
                  </p>
                  {nicDataUrl && (
                    <div className="ob-nic-preview">
                      <img src={nicDataUrl} alt="NIC preview" />
                    </div>
                  )}
                </button>

                <button type="submit" className="ob-btn" disabled={!nicDataUrl}>
                  <Shield size={17} />
                  {t('onboard.submitKyc')}
                </button>
              </form>
            </>
          )}

          {/* ── AML Screening ── */}
          {step === 'aml' && (
            <div className="ob-aml" role="status" aria-live="polite">
              <div className="ob-aml-ring">
                <div className="ob-aml-icon"><Shield size={24} /></div>
              </div>

              <div>
                <p className="ob-aml-title">Screening in progress</p>
                <p className="ob-aml-sub">{t('onboard.amlWait')}</p>
              </div>

              <div className="ob-aml-checks">
                {[
                  'eKYC identity verification',
                  'AML watchlist screening',
                  'Fraud pattern analysis',
                ].map((check) => (
                  <div key={check} className="ob-aml-row">
                    <span className="ob-aml-pulse" />
                    {check}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <div className="ob-done">
              <div className="ob-done-ring">
                <CheckCircle2 size={40} />
              </div>

              <div>
                <h2 className="ob-done-title">{t('onboard.sellerDoneTitle')}</h2>
                <p className="ob-done-sub">{t('onboard.sellerSuccess')}</p>
              </div>

              <div className="ob-done-perks">
                {[
                  'Listing access enabled',
                  'Identity verified & secured',
                  'Dashboard ready to use',
                ].map((p) => (
                  <div key={p} className="ob-done-perk">
                    <div className="ob-done-check"><Check size={11} /></div>
                    {p}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="ob-btn"
                style={{ width: '100%' }}
                onClick={() => router.replace('/dashboard')}
              >
                {t('onboard.goDashboard')}
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Footer nav */}
          {step !== 'done' && step !== 'aml' && (
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              {props.mode === 'new' ? (
                <Link href="/onboarding" className="ob-back">
                  <ArrowLeft size={15} />
                  Back to role choice
                </Link>
              ) : (
                <Link href="/home" className="ob-back">
                  <ArrowLeft size={15} />
                  Back to auctions
                </Link>
              )}
              <span style={{ fontSize: '0.8rem', color: 'var(--bz-text-dim)' }}>
                Step {steps.findIndex(s => s.id === step) + 1} of {steps.length}
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
