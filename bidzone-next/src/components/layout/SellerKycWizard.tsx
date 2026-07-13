'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff,
  Gavel, HelpCircle, IdCard, Lock, Mail, MapPin, Phone,
  Shield, ShieldCheck, Star, User, Briefcase, Clock, AlertCircle,
  Camera, X, Sun, CreditCard,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useHelp } from '@/context/HelpContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { DEMO_OTP_CODE, type UserProfile } from '@/types/userProfile'
import { api } from '@/lib/apiClient'

type Step = 'account' | 'business' | 'phone' | 'otp' | 'nic' | 'aml' | 'done'

type Props =
  | { mode: 'new' }
  | { mode: 'upgrade'; bidder: UserProfile }

type StepDef = { id: Step; label: string }

const NEW_STEPS: StepDef[]     = [
  { id: 'account',  label: 'Account'  },
  { id: 'business', label: 'Business' },
  { id: 'phone',    label: 'Phone'    },
  { id: 'otp',      label: 'Verify'  },
  { id: 'nic',      label: 'Identity' },
]
const UPGRADE_STEPS: StepDef[] = [
  { id: 'business', label: 'Business' },
  { id: 'phone',    label: 'Phone'    },
  { id: 'otp',      label: 'Verify'  },
  { id: 'nic',      label: 'Identity' },
]
const STEP_ORDER: Step[] = ['account', 'business', 'phone', 'otp', 'nic', 'aml', 'done']

const HERO_TL = [
  { id: 'account'  as Step, label: 'Account details',    sub: 'Name, email & password'          },
  { id: 'business' as Step, label: 'Business profile',   sub: 'Business name & description'     },
  { id: 'phone'    as Step, label: 'Phone verification', sub: 'SMS one-time code'                },
  { id: 'otp'      as Step, label: 'Code confirmation',  sub: 'Enter the code from your phone'   },
  { id: 'nic'      as Step, label: 'Identity documents', sub: 'ID front & back + selfie photo'  },
]

/* ── KYC document slots ── */
type DocSlot = 'front' | 'back' | 'selfie'
const MAX_DOC_BYTES = 6 * 1024 * 1024 /* keep in sync with the server cap */

const BUSINESS_TYPES = [
  { value: 'individual',          label: 'Individual / Sole trader' },
  { value: 'registered_business', label: 'Registered Business'     },
  { value: 'cooperative',         label: 'Cooperative / Partnership'},
]

export function SellerKycWizard(props: Props) {
  const { registerNewVerifiedSeller } = useAuth()
  const { t } = useI18n()
  const { openHelp } = useHelp()
  const router = useRouter()

  const initialStep: Step = props.mode === 'new' ? 'account' : 'business'
  const [step, setStep] = useState<Step>(initialStep)

  /* Account fields */
  const [fullName, setFullName] = useState(props.mode === 'upgrade' ? props.bidder.fullName : '')
  const [email,    setEmail]    = useState(props.mode === 'upgrade' ? props.bidder.email    : '')
  const [password, setPassword] = useState('')
  const [address,  setAddress]  = useState(props.mode === 'upgrade' ? (props.bidder.address ?? '') : '')
  const [city,     setCity]     = useState(props.mode === 'upgrade' ? (props.bidder.city ?? '')    : '')

  /* Business fields */
  const [businessName,        setBusinessName]        = useState(props.mode === 'upgrade' ? (props.bidder.businessName ?? '') : '')
  const [businessType,        setBusinessType]        = useState<string>(props.mode === 'upgrade' ? (props.bidder.businessType ?? 'individual') : 'individual')
  const [businessDescription, setBusinessDescription] = useState(props.mode === 'upgrade' ? (props.bidder.businessDescription ?? '') : '')

  /* Phone / OTP */
  const [phone,      setPhone]      = useState('')
  const [otp,        setOtp]        = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [otpError,   setOtpError]   = useState<string | null>(null)
  const [regError,   setRegError]   = useState<string | null>(null)
  const [amlRunning, setAmlRunning] = useState(false)

  /* KYC identity documents */
  const [docType,  setDocType]  = useState<'nic' | 'driving_license'>('nic')
  const [docFront, setDocFront] = useState<string | null>(null)
  const [docBack,  setDocBack]  = useState<string | null>(null)
  const [selfie,   setSelfie]   = useState<string | null>(null)
  const [docError, setDocError] = useState<string | null>(null)

  const frontRef  = useRef<HTMLInputElement>(null)
  const backRef   = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  const steps  = props.mode === 'new' ? NEW_STEPS : UPGRADE_STEPS
  const curIdx = STEP_ORDER.indexOf(step)

  function stepStatus(s: StepDef): 'done' | 'active' | 'pending' {
    const si = STEP_ORDER.indexOf(s.id)
    if (curIdx > si) return 'done'
    if (curIdx === si) return 'active'
    return 'pending'
  }

  function onAccountNext(e: React.FormEvent) {
    e.preventDefault()
    setRegError(null)
    setStep('business')
  }

  function onBusinessNext(e: React.FormEvent) {
    e.preventDefault()
    if (!businessName.trim()) return
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

  const allDocsUploaded = Boolean(docFront && docBack && selfie)

  function onNicNext(e: React.FormEvent) {
    e.preventDefault()
    if (!allDocsUploaded || amlRunning) return
    setDocError(null)
    setAmlRunning(true)
    setStep('aml')
    window.setTimeout(async () => {
      const applyPayload = {
        phone,
        businessName: businessName.trim(),
        businessType,
        businessDescription: businessDescription.trim(),
        docType,
        docFront,
        docBack,
        selfie,
      }
      try {
        if (props.mode === 'new') {
          const r = await registerNewVerifiedSeller({
            fullName, email, password, address, city, phone, nicImageDataUrl: docFront,
          })
          if (r === 'email_taken') {
            setRegError(t('onboard.errEmailTaken'))
            setAmlRunning(false)
            setStep('account')
            return
          }
        }
        await api.post('/seller/apply', applyPayload)
        setStep('done')
      } catch (err) {
        setDocError(err instanceof Error ? err.message : 'Failed to submit application. Please try again.')
        setAmlRunning(false)
        setStep('nic')
      }
    }, 2600)
  }

  /** Downscale to ≤1600px JPEG so payloads stay small (well under server & DB caps) */
  function compressImage(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const maxDim = 1600
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(dataUrl); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.86))
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    })
  }

  function onDocFileChange(slot: DocSlot, files: FileList | null) {
    setDocError(null)
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setDocError('Only image files (JPG, PNG, WEBP) are accepted.')
      return
    }
    if (file.size > MAX_DOC_BYTES) {
      setDocError('Each image must be under 6 MB. Please compress and retry.')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return
      const compressed = await compressImage(reader.result)
      if (slot === 'front')  setDocFront(compressed)
      if (slot === 'back')   setDocBack(compressed)
      if (slot === 'selfie') setSelfie(compressed)
    }
    reader.readAsDataURL(file)
  }

  function clearDoc(slot: DocSlot) {
    if (slot === 'front')  { setDocFront(null);  if (frontRef.current)  frontRef.current.value = '' }
    if (slot === 'back')   { setDocBack(null);   if (backRef.current)   backRef.current.value = '' }
    if (slot === 'selfie') { setSelfie(null);    if (selfieRef.current) selfieRef.current.value = '' }
  }

  function tlStatus(id: Step): 'done' | 'active' | 'pending' {
    const si = STEP_ORDER.indexOf(id)
    if (curIdx > si) return 'done'
    if (curIdx === si) return 'active'
    return 'pending'
  }

  const heroTl = props.mode === 'new' ? HERO_TL : HERO_TL.slice(1)

  const heroTitle =
    step === 'done'
      ? 'Application Submitted!'
      : props.mode === 'upgrade'
        ? 'Become a Seller'
        : 'Seller Sign-up'

  return (
    <div className="ob-role">

      {/* ════════════════════════════ LEFT HERO ════════════════════════════ */}
      <div className="ob-role__hero" aria-hidden="true">
        <div className="ob-role__orb ob-role__orb--1" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)' }} />
        <div className="ob-role__orb ob-role__orb--2" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)' }} />
        <div className="ob-role__orb ob-role__orb--3" />

        <div className="ob-role__hero-inner">
          <div className="ob-role__brand">
            <div className="ob-role__brand-icon">
              <Gavel size={21} strokeWidth={2.2} />
            </div>
            <span className="ob-role__brand-name">BidZone</span>
          </div>

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
              {heroTitle.split(' ').slice(2).join(' ') || 'Pending Review'}
            </span>
          </h1>

          <p className="ob-role__hero-sub">
            {step === 'done'
              ? 'Your application is under admin review. You\'ll be notified once approved.'
              : 'Complete the steps to unlock listing access and reach 50,000+ buyers.'}
          </p>

          {/* Verification timeline */}
          {step !== 'done' && (
            <div className="ob-seller-tl" style={{ marginBottom: '2rem' }}>
              {heroTl.map((item) => {
                const s = tlStatus(item.id)
                return (
                  <div key={item.id} className="ob-tl-item">
                    <div className="ob-tl-left">
                      <div className={`ob-tl-dot ob-tl-dot--${s}`}>
                        {s === 'done' ? <Check size={13} /> : heroTl.findIndex(h => h.id === item.id) + 1}
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

          {/* Done perks — now showing pending state */}
          {step === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {[
                'Application submitted successfully',
                'Admin review typically takes 24–48 hours',
                'You\'ll receive a notification when approved',
              ].map((perk) => (
                <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'grid', placeItems: 'center', color: '#a78bfa', flexShrink: 0 }}>
                    <Clock size={13} />
                  </div>
                  <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)' }}>{perk}</span>
                </div>
              ))}
            </div>
          )}

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

      {/* ════════════════════════════ RIGHT — Wizard ════════════════════════════ */}
      <div className="ob-role__panel">
        <div className="ob-role__panel-inner">

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

          <div className="ob-role__mobile-brand" aria-hidden="true">
            <div className="ob-role__brand-icon">
              <Gavel size={19} strokeWidth={2.2} />
            </div>
            <span className="ob-role__brand-name">BidZone</span>
          </div>

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

          {/* ── STEP: Business Profile ── */}
          {step === 'business' && (
            <>
              <h2 className="ob-role__panel-heading">Business profile</h2>
              <p className="ob-role__panel-sub">Tell buyers about your business to build trust.</p>

              <form className="ob-form" onSubmit={onBusinessNext} noValidate>
                <div className="ob-hint">
                  <Briefcase size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  This information will be reviewed by our admin team during verification.
                </div>

                <label className="ob-field">
                  <span className="ob-label">Business / Display name <span style={{ color: 'var(--bz-err)' }}>*</span></span>
                  <div className="ob-input-wrap">
                    <span className="ob-input-icon"><Briefcase size={17} /></span>
                    <input className="ob-input" type="text" required autoFocus
                      placeholder="Your shop or business name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)} />
                  </div>
                </label>

                <label className="ob-field">
                  <span className="ob-label">Business type</span>
                  <div className="ob-input-wrap">
                    <span className="ob-input-icon"><Briefcase size={17} /></span>
                    <select
                      className="ob-input"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt.value} value={bt.value}>{bt.label}</option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="ob-field">
                  <span className="ob-label">Short description <span style={{ color: 'var(--bz-text-muted)', fontWeight: 400 }}>(optional)</span></span>
                  <div className="ob-input-wrap">
                    <textarea
                      className="ob-input ob-textarea"
                      placeholder="What will you be selling? A brief description helps admin approve faster."
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      maxLength={300}
                      rows={3}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--bz-text-muted)', textAlign: 'right', display: 'block', marginTop: '0.25rem' }}>
                    {businessDescription.length}/300
                  </span>
                </label>

                <button type="submit" className="ob-btn" disabled={!businessName.trim()}>
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

          {/* ── STEP: Identity Documents (ID front + back + selfie) ── */}
          {step === 'nic' && (
            <>
              <h2 className="ob-role__panel-heading">Identity verification</h2>
              <p className="ob-role__panel-sub">
                Upload both sides of your ID and a selfie. An admin reviews these before your seller account is activated.
              </p>

              <form className="ob-form" onSubmit={onNicNext} noValidate>
                {docError && (
                  <p role="alert" className="ob-alert">
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    {docError}
                  </p>
                )}

                {/* Document type selector */}
                <div className="kyc-doctype" role="radiogroup" aria-label="Identity document type">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={docType === 'nic'}
                    className={`kyc-doctype__opt${docType === 'nic' ? ' kyc-doctype__opt--active' : ''}`}
                    onClick={() => setDocType('nic')}
                  >
                    <IdCard size={18} />
                    <span>
                      <strong>National ID (NIC)</strong>
                      <small>Government-issued identity card</small>
                    </span>
                    {docType === 'nic' && <Check size={15} className="kyc-doctype__check" />}
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={docType === 'driving_license'}
                    className={`kyc-doctype__opt${docType === 'driving_license' ? ' kyc-doctype__opt--active' : ''}`}
                    onClick={() => setDocType('driving_license')}
                  >
                    <CreditCard size={18} />
                    <span>
                      <strong>Driving License</strong>
                      <small>Valid, unexpired license</small>
                    </span>
                    {docType === 'driving_license' && <Check size={15} className="kyc-doctype__check" />}
                  </button>
                </div>

                {/* Hidden file inputs */}
                <input ref={frontRef}  type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => onDocFileChange('front',  e.target.files)} />
                <input ref={backRef}   type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => onDocFileChange('back',   e.target.files)} />
                <input ref={selfieRef} type="file" accept="image/jpeg,image/png,image/webp" hidden capture="user" onChange={(e) => onDocFileChange('selfie', e.target.files)} />

                {/* Upload slots */}
                <div className="kyc-docs">
                  {([
                    { slot: 'front' as DocSlot, ref: frontRef, value: docFront, icon: <IdCard size={20} />, title: `${docType === 'nic' ? 'NIC' : 'License'} — Front side`, sub: 'All corners visible, no glare' },
                    { slot: 'back' as DocSlot, ref: backRef, value: docBack, icon: <IdCard size={20} />, title: `${docType === 'nic' ? 'NIC' : 'License'} — Back side`, sub: 'Text readable, in focus' },
                    { slot: 'selfie' as DocSlot, ref: selfieRef, value: selfie, icon: <Camera size={20} />, title: 'Selfie photo', sub: 'Good lighting, face clearly visible' },
                  ]).map(({ slot, ref, value, icon, title, sub }) => (
                    <div key={slot} className={`kyc-doc${value ? ' kyc-doc--done' : ''}`}>
                      {value ? (
                        <div className="kyc-doc__preview-wrap">
                          <img src={value} alt={title} className="kyc-doc__preview" />
                          <button
                            type="button"
                            className="kyc-doc__remove"
                            aria-label={`Remove ${title}`}
                            onClick={() => clearDoc(slot)}
                          >
                            <X size={13} />
                          </button>
                          <span className="kyc-doc__done-tag"><CheckCircle2 size={12} /> Uploaded</span>
                        </div>
                      ) : (
                        <button type="button" className="kyc-doc__drop" onClick={() => ref.current?.click()}>
                          <span className="kyc-doc__drop-icon">{icon}</span>
                        </button>
                      )}
                      <div className="kyc-doc__meta">
                        <p className="kyc-doc__title">{title}</p>
                        <p className="kyc-doc__sub">{sub}</p>
                        <button type="button" className="kyc-doc__action" onClick={() => ref.current?.click()}>
                          {value ? 'Replace photo' : 'Upload photo'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selfie lighting guidance */}
                <div className="kyc-guide">
                  <Sun size={14} />
                  <span>
                    <strong>Selfie tips:</strong> face a window or light source, remove hats and sunglasses,
                    and make sure your whole face is inside the frame. Blurry or dark photos will be rejected.
                  </span>
                </div>

                <div className="kyc-progress" aria-hidden="true">
                  <div className="kyc-progress__bar" style={{ width: `${([docFront, docBack, selfie].filter(Boolean).length / 3) * 100}%` }} />
                  <span className="kyc-progress__label">{[docFront, docBack, selfie].filter(Boolean).length} of 3 documents ready</span>
                </div>

                <button type="submit" className="ob-btn" disabled={!allDocsUploaded}>
                  <Shield size={17} />
                  Submit for verification
                </button>

                <p className="kyc-privacy">
                  <Lock size={12} />
                  Your documents are encrypted, visible only to the BidZone verification team, and never shared.
                </p>
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
                <p className="ob-aml-title">Submitting your application</p>
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

          {/* ── Done — Application Submitted (Pending Review) ── */}
          {step === 'done' && (
            <div className="ob-done">
              <div className="ob-done-ring" style={{ background: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                <Clock size={40} />
              </div>

              <div>
                <h2 className="ob-done-title">Application Submitted!</h2>
                <p className="ob-done-sub">
                  Your seller application is under review. Our admin team will verify your details and notify you within 24–48 hours.
                </p>
              </div>

              <div className="ob-done-perks">
                {[
                  'Application sent for admin review',
                  'NIC & business info verified securely',
                  'Notification sent on decision',
                ].map((p) => (
                  <div key={p} className="ob-done-perk" style={{ borderColor: 'rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.06)' }}>
                    <div className="ob-done-check" style={{ background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                      <AlertCircle size={11} />
                    </div>
                    {p}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="ob-btn"
                style={{ width: '100%' }}
                onClick={() => router.replace('/home')}
              >
                Back to Marketplace
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
