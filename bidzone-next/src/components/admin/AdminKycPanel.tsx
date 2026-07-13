'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  IdCard,
  Camera,
  X,
  ZoomIn,
  Clock,
  RefreshCw,
  UserCheck,
  Briefcase,
  MapPin,
  Phone,
  CalendarDays,
  FileCheck2,
} from 'lucide-react'
import { api } from '@/lib/apiClient'
import type { AdminKycRow } from '@/types/admin'

type Props = {
  onError: (msg: string | null) => void
  /** Called after an approve/reject so the parent can refresh nav badges */
  onDecided?: () => void
}

type StatusFilter = 'pending' | 'verified' | 'rejected'

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'pending', label: 'Pending Review' },
  { id: 'verified', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function docTypeLabel(t: string) {
  return t === 'driving_license' ? 'Driving License' : 'National ID (NIC)'
}

export function AdminKycPanel({ onError, onDecided }: Props) {
  const [filter, setFilter] = useState<StatusFilter>('pending')
  const [rows, setRows] = useState<AdminKycRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null)

  const load = useCallback(async (status: StatusFilter) => {
    setLoading(true)
    try {
      const data = await api.get<{ applications: AdminKycRow[] }>(`/admin/kyc?status=${status}`)
      setRows(data.applications)
      onError(null)
    } catch {
      onError('Failed to load verification queue. Check your connection and permissions.')
    } finally {
      setLoading(false)
    }
  }, [onError])

  useEffect(() => {
    void load(filter)
  }, [filter, load])

  /* Close lightbox on Escape */
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightbox(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  async function decide(id: string, decision: 'verified' | 'rejected') {
    const note = (notes[id] ?? '').trim()
    if (decision === 'rejected' && !note) {
      onError('Please add a rejection reason — the applicant will see it.')
      return
    }
    setActionId(id)
    try {
      await api.patch(`/admin/users/${id}`, { kycStatus: decision, kycNotes: note })
      await load(filter)
      onDecided?.()
    } catch {
      onError('Action failed. Please try again.')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="adm__panel">
      <p className="adm__hint">
        Identity verification queue. Compare the submitted ID document (front &amp; back) with the selfie,
        confirm the name matches the account, then approve to grant the seller role or reject with a reason.
        Only verified applicants can list items.
      </p>

      {/* Status filter tabs */}
      <div className="adm__kycv-filters" role="tablist" aria-label="Verification status filter">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`adm__kycv-filter${filter === f.id ? ' adm__kycv-filter--active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {filter === f.id && rows.length > 0 && <span className="adm__kycv-filter-count">{rows.length}</span>}
          </button>
        ))}
        <button
          type="button"
          className="adm__kycv-reload"
          onClick={() => void load(filter)}
          disabled={loading}
          aria-label="Reload queue"
        >
          <RefreshCw size={14} className={loading ? 'adm__spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="adm__loading">
          <div className="adm__loading-ring" aria-hidden />
          <p>Loading verification queue…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="adm__card adm__card--flush">
          <div className="adm__empty">
            <ShieldCheck size={40} strokeWidth={1.25} />
            <p>
              {filter === 'pending'
                ? 'No applications awaiting verification'
                : filter === 'verified'
                  ? 'No approved applications with documents yet'
                  : 'No rejected applications'}
            </p>
          </div>
        </div>
      ) : (
        <div className="adm__kycv-list">
          {rows.map((u) => (
            <article key={u.id} className="adm__kycv-card">
              {/* ── Applicant header ── */}
              <div className="adm__kycv-head">
                <div className="adm__kyc-avatar">{(u.fullName || 'U').slice(0, 2).toUpperCase()}</div>
                <div className="adm__kycv-id">
                  <h3>{u.fullName}</h3>
                  <p>{u.email}</p>
                  <div className="adm__kycv-meta">
                    <span><Phone size={12} /> {u.phone || '—'}</span>
                    <span><MapPin size={12} /> {u.city || '—'}</span>
                    <span><CalendarDays size={12} /> Member since {formatDate(u.memberSince).split(',')[0]}</span>
                  </div>
                </div>
                <div className="adm__kycv-badges">
                  <span className="adm__kycv-doctype">
                    <IdCard size={13} /> {docTypeLabel(u.docType)}
                  </span>
                  {u.kycSubmittedAt && (
                    <span className="adm__kycv-submitted">
                      <Clock size={12} /> Applied {formatDate(u.kycSubmittedAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Identity documents ── */}
              <div className="adm__kycv-docs">
                {([
                  { src: u.docFront, label: `${docTypeLabel(u.docType)} — Front`, icon: <IdCard size={14} /> },
                  { src: u.docBack, label: `${docTypeLabel(u.docType)} — Back`, icon: <IdCard size={14} /> },
                  { src: u.selfie, label: 'Selfie', icon: <Camera size={14} /> },
                ]).map((doc) => (
                  <figure key={doc.label} className="adm__kycv-doc">
                    <button
                      type="button"
                      className="adm__kycv-doc-btn"
                      onClick={() => setLightbox({ src: doc.src, label: `${u.fullName} — ${doc.label}` })}
                      aria-label={`Enlarge ${doc.label}`}
                    >
                      {doc.src ? (
                        <img src={doc.src} alt={doc.label} loading="lazy" />
                      ) : (
                        <span className="adm__kycv-doc-missing">Not provided</span>
                      )}
                      <span className="adm__kycv-doc-zoom"><ZoomIn size={14} /></span>
                    </button>
                    <figcaption>{doc.icon} {doc.label}</figcaption>
                  </figure>
                ))}
              </div>

              {/* ── Business profile ── */}
              {(u.businessName || u.businessDescription) && (
                <div className="adm__kycv-biz">
                  <span className="adm__kycv-biz-label"><Briefcase size={13} /> Business Profile</span>
                  <p className="adm__kycv-biz-name">
                    {u.businessName}
                    {u.businessType && (
                      <span className="adm__kycv-biz-type">
                        {u.businessType === 'individual' ? 'Individual' :
                         u.businessType === 'registered_business' ? 'Registered Business' : 'Cooperative'}
                      </span>
                    )}
                  </p>
                  {u.businessDescription && <p className="adm__kycv-biz-desc">{u.businessDescription}</p>}
                </div>
              )}

              {/* ── Review checklist reminder ── */}
              {filter === 'pending' && (
                <ul className="adm__kycv-checklist">
                  <li><FileCheck2 size={13} /> Document is valid, unexpired and fully readable</li>
                  <li><UserCheck size={13} /> Name on the document matches “{u.fullName}”</li>
                  <li><Camera size={13} /> Selfie clearly matches the photo on the ID</li>
                </ul>
              )}

              {/* ── Decision record (approved / rejected views) ── */}
              {filter !== 'pending' && u.reviewedAt && (
                <div className={`adm__kycv-decision adm__kycv-decision--${u.kycStatus === 'verified' ? 'ok' : 'err'}`}>
                  {u.kycStatus === 'verified' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <span>
                    {u.kycStatus === 'verified' ? 'Approved' : 'Rejected'} by <strong>{u.reviewedBy || 'admin'}</strong> on {formatDate(u.reviewedAt)}
                    {u.kycNotes && <> — “{u.kycNotes}”</>}
                  </span>
                </div>
              )}

              {/* ── Note + actions (pending only) ── */}
              {filter === 'pending' && (
                <>
                  <div className="adm__kyc-note-wrap">
                    <label className="adm__kyc-note-label" htmlFor={`kycv-note-${u.id}`}>
                      Admin note <span style={{ color: 'var(--bz-text-muted)', fontWeight: 400 }}>(required for rejection, optional for approval)</span>
                    </label>
                    <textarea
                      id={`kycv-note-${u.id}`}
                      className="adm__kyc-note-input"
                      rows={2}
                      placeholder="e.g. “ID photo is blurry — please re-upload the front side in better light.”"
                      value={notes[u.id] ?? ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [u.id]: e.target.value }))}
                    />
                  </div>

                  <div className="adm__kyc-actions">
                    <button
                      type="button"
                      className="adm__btn adm__btn--ok"
                      disabled={actionId === u.id}
                      onClick={() => void decide(u.id, 'verified')}
                    >
                      <CheckCircle2 size={16} /> Approve &amp; Grant Seller Role
                    </button>
                    <button
                      type="button"
                      className="adm__btn adm__btn--err"
                      disabled={actionId === u.id}
                      onClick={() => void decide(u.id, 'rejected')}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}

      {/* ── Document lightbox ── */}
      {lightbox && (
        <div className="adm__kycv-lightbox" role="dialog" aria-modal="true" aria-label={lightbox.label} onClick={() => setLightbox(null)}>
          <button type="button" className="adm__kycv-lightbox-close" aria-label="Close" onClick={() => setLightbox(null)}>
            <X size={20} />
          </button>
          <img src={lightbox.src} alt={lightbox.label} onClick={(e) => e.stopPropagation()} />
          <p className="adm__kycv-lightbox-caption">{lightbox.label}</p>
        </div>
      )}
    </div>
  )
}
