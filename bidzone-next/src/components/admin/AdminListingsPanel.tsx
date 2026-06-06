'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  Gavel,
  Plus,
  Search,
  Trash2,
  XCircle,
  Star,
  Pause,
} from 'lucide-react'
import { api } from '@/lib/apiClient'
import { categories } from '@/data/auctions'
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '@/lib/auctionTime'
import { filesToListingImages } from '@/lib/listingImages'
import { ListingPhotoUpload } from '@/components/listings/ListingPhotoUpload'
import type { AdminAuctionRow } from '@/types/admin'

type Props = {
  onError: (msg: string) => void
  actionId: string | null
  setActionId: (id: string | null) => void
}

type ListingForm = {
  title: string
  imageUrl: string
  category: string
  currentBid: string
  buyNow: string
  description: string
  condition: string
  auctionEndsAt: string
  featured: boolean
}

const EMPTY: ListingForm = {
  title: '',
  imageUrl: '',
  category: categories[0]?.name ?? 'Electronics',
  currentBid: '',
  buyNow: '',
  description: '',
  condition: 'New',
  auctionEndsAt: toDatetimeLocalValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  featured: false,
}

function StatusBadge({ status }: { status?: string }) {
  const cls =
    status === 'approved'
      ? 'adm-badge adm-badge--ok'
      : status === 'pending'
        ? 'adm-badge adm-badge--warn'
        : status === 'rejected'
          ? 'adm-badge adm-badge--err'
          : 'adm-badge adm-badge--muted'
  return <span className={cls}>{status ?? 'unknown'}</span>
}

export function AdminListingsPanel({ onError, actionId, setActionId }: Props) {
  const [listings, setListings] = useState<AdminAuctionRow[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<ListingForm>(EMPTY)
  const [photos, setPhotos] = useState<File[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (filter !== 'all') qs.set('moderationStatus', filter)
      if (query.trim()) qs.set('q', query.trim())
      const suffix = qs.toString() ? `?${qs.toString()}` : ''
      const data = await api.get<{ auctions: AdminAuctionRow[] }>(`/admin/auctions${suffix}`)
      setListings(data.auctions)
    } catch {
      onError('Failed to load marketplace listings.')
    } finally {
      setLoading(false)
    }
  }, [filter, query, onError])

  useEffect(() => {
    void load()
  }, [load])

  async function moderate(id: string, moderationStatus: 'approved' | 'rejected') {
    setActionId(id)
    try {
      await api.patch(`/admin/auctions/${id}`, { moderationStatus })
      await load()
    } catch {
      onError('Could not update listing status.')
    } finally {
      setActionId(null)
    }
  }

  async function toggleFeatured(row: AdminAuctionRow) {
    setActionId(row.id)
    try {
      await api.patch(`/admin/auctions/${row.id}`, { featured: !row.featured })
      await load()
    } catch {
      onError('Could not update listing.')
    } finally {
      setActionId(null)
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this listing permanently?')) return
    setActionId(id)
    try {
      await api.delete(`/admin/auctions/${id}`)
      await load()
    } catch {
      onError('Could not delete listing.')
    } finally {
      setActionId(null)
    }
  }

  async function createListing() {
    const start = Number(form.currentBid)
    if (!form.title.trim() || !Number.isFinite(start) || start <= 0) {
      onError('Title and starting bid are required.')
      return
    }

    const urlFallback = form.imageUrl.trim() ? [form.imageUrl.trim()] : []
    let imageResult
    try {
      imageResult = await filesToListingImages(photos, { existingUrls: urlFallback })
    } catch {
      onError('Could not read one of the selected photos.')
      return
    }

    if ('error' in imageResult) {
      onError(
        imageResult.error === 'too_large'
          ? 'Each photo must be 10MB or smaller.'
          : 'Add at least one photo from your device or paste an image URL.',
      )
      return
    }

    setActionId('create')
    try {
      const buyNow = form.buyNow.trim() === '' ? undefined : Number(form.buyNow)
      await api.post('/admin/auctions', {
        title: form.title.trim(),
        image: imageResult.image,
        images: imageResult.images,
        category: form.category,
        currentBid: start,
        buyNow: Number.isFinite(buyNow!) && buyNow! > start ? buyNow : undefined,
        listingDescription: form.description.trim() || undefined,
        condition: form.condition,
        auctionEndsAt: fromDatetimeLocalValue(form.auctionEndsAt),
        featured: form.featured,
        sellerName: 'BidZone Official',
      })
      setShowCreate(false)
      setPhotos([])
      setForm({ ...EMPTY, auctionEndsAt: toDatetimeLocalValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) })
      setFilter('approved')
      await load()
    } catch {
      onError('Could not create listing.')
    } finally {
      setActionId(null)
    }
  }

  const pendingCount = listings.filter((l) => l.moderationStatus === 'pending').length

  if (loading && listings.length === 0) {
    return (
      <div className="adm__loading">
        <div className="adm__loading-ring" aria-hidden />
        <p>Loading listings…</p>
      </div>
    )
  }

  return (
    <div className="adm__panel">
      <div className="adm__toolbar">
        <p className="adm__hint adm__hint--inline">
          Seller listings start as <strong>pending</strong> until you approve them. Admin-created
          listings go live immediately.
        </p>
        <button type="button" className="adm__btn adm__btn--gold" onClick={() => { setShowCreate((v) => !v); if (showCreate) setPhotos([]) }}>
          <Plus size={16} /> Add listing
        </button>
      </div>

      <div className="adm__filter-tabs">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`adm__filter-tab${filter === f ? ' adm__filter-tab--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'pending' ? `Pending${pendingCount ? ` (${pendingCount})` : ''}` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="adm__toolbar">
        <div className="adm__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search listings…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void load()}
          />
        </div>
        <button type="button" className="adm__btn adm__btn--ghost" onClick={() => void load()}>
          Search
        </button>
      </div>

      {showCreate && (
        <section className="adm__card">
          <div className="adm__card-head">
            <h2>
              <Gavel size={18} /> Add marketplace listing (live immediately)
            </h2>
          </div>
          <div className="adm__form-grid">
            <label className="adm__field adm__field--full">
              <span>Title</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="adm__field adm__field--full">
              <span>Photos</span>
              <ListingPhotoUpload
                photos={photos}
                onPhotosChange={setPhotos}
                uploadPrompt="Click to upload or drag and drop"
                uploadHint="PNG, JPG, or WEBP up to 10MB (max 8 photos)"
                fileTooLargeMessage="Each image must be 10MB or smaller."
                tooManyImagesMessage="You can upload up to 8 images."
              />
            </label>
            <label className="adm__field adm__field--full">
              <span>Or paste image URL (optional)</span>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://…"
              />
            </label>
            <label className="adm__field">
              <span>Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="adm__field">
              <span>Condition</span>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                {['New', 'Excellent', 'Very Good', 'Good'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="adm__field">
              <span>Starting bid ($)</span>
              <input type="number" min={1} value={form.currentBid} onChange={(e) => setForm({ ...form, currentBid: e.target.value })} />
            </label>
            <label className="adm__field">
              <span>Buy now ($, optional)</span>
              <input type="number" min={0} value={form.buyNow} onChange={(e) => setForm({ ...form, buyNow: e.target.value })} />
            </label>
            <label className="adm__field adm__field--full">
              <span>Description</span>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label className="adm__field">
              <span>Auction ends</span>
              <input
                type="datetime-local"
                value={form.auctionEndsAt}
                onChange={(e) => setForm({ ...form, auctionEndsAt: e.target.value })}
              />
            </label>
            <label className="adm__field adm__field--check">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              <span>Featured on homepage</span>
            </label>
          </div>
          <div className="adm__form-actions">
            <button type="button" className="adm__btn adm__btn--ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button type="button" className="adm__btn adm__btn--gold" disabled={actionId === 'create'} onClick={() => void createListing()}>
              Publish to marketplace
            </button>
          </div>
        </section>
      )}

      <section className="adm__card adm__card--flush">
        <div className="adm__table-wrap">
          <table className="adm__table">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Seller</th>
                <th>Bid</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="adm__empty-cell">
                    No listings in this view.
                  </td>
                </tr>
              ) : (
                listings.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="adm__listing-cell">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={row.image} alt="" className="adm__listing-thumb" />
                        <div>
                          <span className="adm__cell-main">{row.title}</span>
                          <span className="adm__cell-sub">{row.category}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="adm__cell-main">{row.sellerName ?? '—'}</span>
                      <span className="adm__cell-sub">{row.listingSource ?? 'seller'}</span>
                    </td>
                    <td>${row.currentBid.toLocaleString()}</td>
                    <td>
                      <StatusBadge status={row.moderationStatus} />
                      {row.featured && <span className="adm__featured-tag">Featured</span>}
                    </td>
                    <td>
                      <div className="adm__row-actions">
                        {row.moderationStatus === 'pending' && (
                          <>
                            <button
                              type="button"
                              className="adm__icon-btn adm__icon-btn--ok"
                              title="Approve for marketplace"
                              disabled={actionId === row.id}
                              onClick={() => void moderate(row.id, 'approved')}
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              type="button"
                              className="adm__icon-btn adm__icon-btn--err"
                              title="Reject"
                              disabled={actionId === row.id}
                              onClick={() => void moderate(row.id, 'rejected')}
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {row.moderationStatus === 'approved' && (
                          <button
                            type="button"
                            className="adm__icon-btn"
                            title={row.featured ? 'Unfeature' : 'Feature'}
                            disabled={actionId === row.id}
                            onClick={() => void toggleFeatured(row)}
                          >
                            <Star size={16} fill={row.featured ? 'currentColor' : 'none'} />
                          </button>
                        )}
                        {row.moderationStatus === 'rejected' && (
                          <button
                            type="button"
                            className="adm__icon-btn"
                            title="Re-approve"
                            disabled={actionId === row.id}
                            onClick={() => void moderate(row.id, 'approved')}
                          >
                            <Pause size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="adm__icon-btn adm__icon-btn--err"
                          title="Delete"
                          disabled={actionId === row.id}
                          onClick={() => void remove(row.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
