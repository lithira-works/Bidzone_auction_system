'use client'
import { type DragEvent, type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { DollarSign, Calendar, Upload, HelpCircle } from 'lucide-react'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useListings } from '@/context/ListingsContext'
import { useI18n } from '@/context/I18nContext'
import { useHelp } from '@/context/HelpContext'
import { categories, type AuctionItem } from '@/data/auctions'
import {
  displayAuctionEndLocal,
  formatTimeLeftCompact,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '@/lib/auctionTime'

const MAX_BYTES = 10 * 1024 * 1024
const MAX_IMAGES = 8

const CONDITIONS = [
  { value: 'New', key: 'cond.new' as const },
  { value: 'Excellent', key: 'cond.excellent' as const },
  { value: 'Very Good', key: 'cond.veryGood' as const },
  { value: 'Good', key: 'cond.good' as const },
]

function defaultEndDate(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('read'))
    r.readAsDataURL(file)
  })
}

function MoneyField({
  id, label, required, value, onChange, placeholderKey, t,
}: {
  id: string; label: string; required?: boolean; value: string
  onChange: (v: string) => void; placeholderKey: string; t: (k: string) => string
}) {
  return (
    <label className="seller-new__money" htmlFor={id}>
      <span className="seller-new__label">
        {label}
        {required && <abbr title="required"> *</abbr>}
      </span>
      <div className="seller-new__money-wrap">
        <span className="seller-new__dollar" aria-hidden>$</span>
        <input id={id} type="number" min={0} step={1} value={value} onChange={(e) => onChange(e.target.value)} placeholder={t(placeholderKey)} required={required} />
      </div>
    </label>
  )
}

export function SellerNewListingPage() {
  const { t } = useI18n()
  const { openHelp } = useHelp()
  const params = useParams<{ id?: string }>()
  const editId = params?.id
  const { userListings, addListing, updateListing } = useListings()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const isEdit = Boolean(editId)
  const editItem = editId ? userListings.find((x) => x.id === editId) : undefined

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [condition, setCondition] = useState('New')
  const [starting, setStarting] = useState('')
  const [reserve, setReserve] = useState('')
  const [buyNow, setBuyNow] = useState('')
  const [auctionEndLocal, setAuctionEndLocal] = useState(() => toDatetimeLocalValue(defaultEndDate()))
  const [photos, setPhotos] = useState<File[]>([])
  const [seller, setSeller] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!editId) return
    const item = userListings.find((x) => x.id === editId)
    if (!item) return
    setTitle(item.title)
    setDescription(item.listingDescription ?? '')
    const cat = categories.find((c) => c.name === item.category)
    setCategorySlug(cat?.slug ?? '')
    setCondition(item.condition ?? 'New')
    setStarting(String(item.currentBid))
    setReserve(item.reservePrice != null ? String(item.reservePrice) : '')
    setBuyNow(item.buyNow != null ? String(item.buyNow) : '')
    if (item.auctionEndsAt) setAuctionEndLocal(toDatetimeLocalValue(new Date(item.auctionEndsAt)))
    else setAuctionEndLocal(toDatetimeLocalValue(defaultEndDate()))
    setSeller(item.sellerName ?? '')
    setPhotos([])
    setExistingImageUrl(item.image)
  }, [editId, userListings])

  const previewUrls = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos])

  useEffect(() => {
    return () => { previewUrls.forEach((u) => URL.revokeObjectURL(u)) }
  }, [previewUrls])

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list).filter((f) => f.type.startsWith('image/'))
    setPhotos((prev) => {
      const next = [...prev]
      for (const f of arr) {
        if (f.size > MAX_BYTES) { window.alert(t('seller.fileTooLarge')); continue }
        if (next.length >= MAX_IMAGES) { window.alert(t('seller.tooManyImages')); break }
        next.push(f)
      }
      return next
    })
  }, [t])

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const startNum = Number(starting)
    if (!title.trim() || !categorySlug || !Number.isFinite(startNum) || startNum <= 0 || !seller.trim()) return
    const cat = categories.find((c) => c.slug === categorySlug)
    if (!cat) return
    const endsIso = fromDatetimeLocalValue(auctionEndLocal)
    if (new Date(endsIso).getTime() <= Date.now()) { window.alert(t('seller.errEndPast')); return }

    const resNum = reserve.trim() === '' ? NaN : Number(reserve)
    const buyNum = buyNow.trim() === '' ? NaN : Number(buyNow)
    const listingId = isEdit && editId ? editId : `u-${crypto.randomUUID()}`
    const seed = encodeURIComponent(title.trim().slice(0, 40) || listingId)
    const createdAt = isEdit && editItem?.auctionCreatedAt ? editItem.auctionCreatedAt : new Date().toISOString()

    let image = existingImageUrl ?? `https://picsum.photos/seed/${seed}/600/450`
    if (photos[0]) {
      try {
        const dataUrl = await readFileAsDataUrl(photos[0])
        if (dataUrl.length > 2_400_000) { window.alert(t('seller.fileTooLarge')); return }
        image = dataUrl
      } catch { /* keep fallback */ }
    }

    const item: AuctionItem = {
      id: listingId,
      title: title.trim(),
      image,
      category: cat.name,
      currentBid: startNum,
      reservePrice: Number.isFinite(resNum) && resNum > 0 ? resNum : undefined,
      buyNow: Number.isFinite(buyNum) && buyNum > startNum ? buyNum : undefined,
      bids: isEdit && editItem ? editItem.bids : 0,
      timeLeft: formatTimeLeftCompact(endsIso),
      featured: isEdit && editItem ? editItem.featured : false,
      sellerName: seller.trim(),
      listingDescription: description.trim() || undefined,
      condition,
      auctionEndsAt: endsIso,
      auctionCreatedAt: createdAt,
    }

    if (isEdit) updateListing(item)
    else addListing(item)
    router.push(`/listing/${listingId}`)
  }

  useEffect(() => {
    if (editId && !editItem && userListings.length > 0) router.replace('/dashboard')
  }, [editId, editItem, userListings.length, router])

  if (editId && !editItem) return null

  return (
    <div className="seller-new">
      <header className="seller-new__toolbar">
        <Link href="/dashboard" className="seller-new__toolbar-back">{t('seller.backDashboard')}</Link>
        <div className="seller-new__toolbar-right"><LanguageSwitcher /></div>
      </header>

      <main className="seller-new__main">
        <h1 className="seller-new__page-title">
          {isEdit ? t('seller.editPageTitle') : t('seller.createPageTitle')}
        </h1>

        <form className="seller-new__form" onSubmit={handleSubmit}>
          <div className="seller-new__block">
            <label className="seller-new__field seller-new__field--full">
              <span className="seller-new__label">{t('seller.fieldTitle')} <abbr title="required">*</abbr></span>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </label>
          </div>
          <hr className="seller-new__rule" />
          <div className="seller-new__block">
            <label className="seller-new__field seller-new__field--full">
              <span className="seller-new__label">{t('seller.itemDescriptionTitle')}</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} maxLength={4000} placeholder={t('seller.describePlaceholder')} className="seller-new__textarea" />
            </label>
          </div>
          <hr className="seller-new__rule" />
          <div className="seller-new__row2">
            <label className="seller-new__field">
              <span className="seller-new__label">{t('seller.fieldCategory')} <abbr title="required">*</abbr></span>
              <select required value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}>
                <option value="">{t('seller.categorySelect')}</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{t(`cat.${c.slug}` as 'cat.electronics')}</option>
                ))}
              </select>
            </label>
            <label className="seller-new__field">
              <span className="seller-new__label">{t('seller.fieldCondition')} <abbr title="required">*</abbr></span>
              <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{t(c.key)}</option>)}
              </select>
            </label>
          </div>
          <hr className="seller-new__rule" />
          <div className="seller-new__block">
            <h2 className="seller-new__section-title seller-new__section-title--pricing">
              <DollarSign size={20} strokeWidth={2.25} aria-hidden />
              {t('seller.sectionPricing')}
            </h2>
            <div className="seller-new__row3">
              <MoneyField id="starting" label={t('seller.startingBidLabel')} required value={starting} onChange={setStarting} placeholderKey="seller.phStarting" t={t} />
              <MoneyField id="reserve" label={t('seller.reserveLabel')} value={reserve} onChange={setReserve} placeholderKey="seller.phOptional" t={t} />
              <MoneyField id="buynow" label={t('seller.buyNowShortLabel')} value={buyNow} onChange={setBuyNow} placeholderKey="seller.phOptional" t={t} />
            </div>
          </div>
          <hr className="seller-new__rule" />
          <div className="seller-new__block">
            <h2 className="seller-new__section-title seller-new__section-title--duration">
              <Calendar size={20} strokeWidth={2} aria-hidden />
              {t('seller.sectionAuctionEnd')}
            </h2>
            <label className="seller-new__field seller-new__field--full">
              <span className="seller-new__label">{t('seller.auctionEndLabel')} <abbr title="required">*</abbr></span>
              <input
                type="datetime-local"
                required
                className="seller-new__input-datetime"
                value={auctionEndLocal}
                min={toDatetimeLocalValue(new Date())}
                onChange={(e) => setAuctionEndLocal(e.target.value)}
              />
              <span className="seller-new__hint">{t('seller.auctionEndHint')}</span>
              <span className="seller-new__hint seller-new__hint--muted">
                {t('seller.auctionEndPreview', { time: displayAuctionEndLocal(fromDatetimeLocalValue(auctionEndLocal)) })}
              </span>
            </label>
          </div>
          <hr className="seller-new__rule" />
          <div className="seller-new__block">
            <h2 className="seller-new__section-title seller-new__section-title--photos">
              <Upload size={20} strokeWidth={2} aria-hidden />
              {t('seller.sectionPhotos')}
            </h2>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              className="seller-new__file-input"
              onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = '' }}
            />
            <button
              type="button"
              className={dragOver ? 'seller-new__dropzone seller-new__dropzone--active' : 'seller-new__dropzone'}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={40} strokeWidth={1.25} className="seller-new__drop-icon" aria-hidden />
              <span className="seller-new__drop-title">{t('seller.uploadPrompt')}</span>
              <span className="seller-new__drop-sub">{t('seller.uploadHint')}</span>
              {photos.length > 0 && <span className="seller-new__drop-count">{photos.length} / {MAX_IMAGES}</span>}
            </button>
            {(previewUrls.length > 0 || (existingImageUrl && photos.length === 0)) && (
              <div className="seller-new__previews">
                {existingImageUrl && photos.length === 0 && <img src={existingImageUrl} alt="" className="seller-new__thumb" />}
                {previewUrls.map((src) => <img key={src} src={src} alt="" className="seller-new__thumb" />)}
              </div>
            )}
          </div>
          <hr className="seller-new__rule" />
          <div className="seller-new__block">
            <label className="seller-new__field seller-new__field--full">
              <span className="seller-new__label">{t('seller.fieldSeller')} <abbr title="required">*</abbr></span>
              <input required value={seller} onChange={(e) => setSeller(e.target.value)} maxLength={80} />
            </label>
          </div>
          <div className="seller-new__actions">
            <Link href="/dashboard" className="seller-new__cancel">{t('seller.cancel')}</Link>
            <button type="submit" className="seller-new__submit">
              {isEdit ? t('seller.saveListing') : t('seller.publish')}
            </button>
          </div>
        </form>
      </main>

      <SiteFooter />

      <button type="button" className="seller-new__help" aria-label={t('common.help')} onClick={openHelp}>
        <HelpCircle size={22} />
      </button>
    </div>
  )
}
