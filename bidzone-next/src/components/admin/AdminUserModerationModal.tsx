'use client'

import { useState } from 'react'
import {
  X,
  ShieldOff,
  ShieldAlert,
  ShieldCheck,
  Clock,
  MessageSquareWarning,
  UserMinus,
  Ban,
  RotateCcw,
  Gavel,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/apiClient'
import type { AdminUserRow } from '@/types/admin'

type Props = {
  user: AdminUserRow
  onClose: () => void
  onDone: () => void
}

type ActionPanel = 'suspend' | 'ban' | 'warn' | null

const SUSPEND_DURATIONS = [
  { label: '1 hour', hours: 1 },
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
  { label: '30 days', hours: 720 },
]

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function AdminUserModerationModal({ user, onClose, onDone }: Props) {
  const [panel, setPanel] = useState<ActionPanel>(null)
  const [reason, setReason] = useState('')
  const [warnMessage, setWarnMessage] = useState('')
  const [durationHours, setDurationHours] = useState(24)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const status = user.accountStatus ?? 'active'
  const isSeller = user.role === 'seller'

  async function patch(body: Record<string, unknown>, successMsg: string) {
    setBusy(true)
    setError(null)
    try {
      await api.patch(`/admin/users/${user.id}`, body)
      setSuccess(successMsg)
      setPanel(null)
      setReason('')
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleBan() {
    if (!reason.trim()) { setError('Please provide a reason for the ban.'); return }
    await patch({ accountStatus: 'banned', statusReason: reason.trim() }, 'User has been banned.')
  }

  async function handleSuspend() {
    if (!reason.trim()) { setError('Please provide a reason for the suspension.'); return }
    const until = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
    await patch(
      { accountStatus: 'suspended', suspendedUntil: until, statusReason: reason.trim() },
      `User suspended until ${formatDate(until)}.`,
    )
  }

  async function handleReinstate() {
    await patch({ accountStatus: 'active' }, 'User has been reinstated.')
  }

  async function handleRemoveSellerRole() {
    if (!confirm(`Remove seller privileges from ${user.fullName}? They will keep their buyer account.`)) return
    await patch({ role: 'bidder' }, 'Seller role removed.')
  }

  async function handleToggleBidding() {
    const next = !user.biddingBlocked
    if (next && !confirm(`Block ${user.fullName} from bidding and purchasing BC?`)) return
    await patch({ biddingBlocked: next }, next ? 'Buyer privileges restricted.' : 'Buyer privileges restored.')
  }

  async function handleWarn() {
    if (!warnMessage.trim()) { setError('Please write a warning message.'); return }
    setBusy(true)
    setError(null)
    try {
      await api.post(`/admin/users/${user.id}/warn`, { message: warnMessage.trim() })
      setSuccess('Warning sent to the user\u2019s notifications.')
      setPanel(null)
      setWarnMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send warning.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="adm__modal-overlay" role="dialog" aria-modal="true" aria-labelledby="moderate-user-title">
      <div className="adm__modal adm__modal--moderate">
        <div className="adm__modal-head">
          <h2 id="moderate-user-title"><ShieldAlert size={18} /> Manage User</h2>
          <button type="button" className="adm__modal-close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="adm__modal-body">
          {/* Identity */}
          <div className="adm__mod-identity">
            <div className="adm__kyc-avatar">{(user.fullName || 'U').slice(0, 2).toUpperCase()}</div>
            <div>
              <p className="adm__mod-name">{user.fullName}</p>
              <p className="adm__mod-email">{user.email}</p>
            </div>
          </div>

          {error && (
            <div className="adm__alert" role="alert">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="adm__mod-success">
              <ShieldCheck size={15} /> {success}
            </div>
          )}

          {/* Current status */}
          <div className={`adm__mod-status adm__mod-status--${status}`}>
            {status === 'banned' && <ShieldOff size={16} />}
            {status === 'suspended' && <Clock size={16} />}
            {status === 'active' && <ShieldCheck size={16} />}
            <div>
              <p className="adm__mod-status-label">
                {status === 'banned' ? 'Banned' : status === 'suspended' ? 'Suspended' : 'Active'}
              </p>
              {status !== 'active' && user.statusReason && <p className="adm__mod-status-reason">{user.statusReason}</p>}
              {status === 'suspended' && user.suspendedUntil && (
                <p className="adm__mod-status-until">Until {formatDate(user.suspendedUntil)}</p>
              )}
            </div>
          </div>

          {user.biddingBlocked && (
            <div className="adm__mod-status adm__mod-status--blocked">
              <ShoppingCart size={16} />
              <p className="adm__mod-status-label">Buyer privileges restricted</p>
            </div>
          )}

          {/* Quick actions */}
          <div className="adm__mod-actions-grid">
            {status === 'active' ? (
              <>
                <button type="button" className="adm__mod-action-btn adm__mod-action-btn--warn" disabled={busy} onClick={() => { setPanel('suspend'); setError(null) }}>
                  <Clock size={15} /> Suspend
                </button>
                <button type="button" className="adm__mod-action-btn adm__mod-action-btn--danger" disabled={busy} onClick={() => { setPanel('ban'); setError(null) }}>
                  <Ban size={15} /> Ban
                </button>
              </>
            ) : (
              <button type="button" className="adm__mod-action-btn adm__mod-action-btn--ok" disabled={busy} onClick={() => void handleReinstate()}>
                <RotateCcw size={15} /> Reinstate account
              </button>
            )}

            <button type="button" className="adm__mod-action-btn" disabled={busy} onClick={() => { setPanel('warn'); setError(null) }}>
              <MessageSquareWarning size={15} /> Send warning
            </button>

            <button
              type="button"
              className={`adm__mod-action-btn${user.biddingBlocked ? ' adm__mod-action-btn--ok' : ''}`}
              disabled={busy}
              onClick={() => void handleToggleBidding()}
            >
              <Gavel size={15} /> {user.biddingBlocked ? 'Restore bidding' : 'Block bidding'}
            </button>

            {isSeller && (
              <button type="button" className="adm__mod-action-btn adm__mod-action-btn--danger" disabled={busy} onClick={() => void handleRemoveSellerRole()}>
                <UserMinus size={15} /> Remove seller role
              </button>
            )}
          </div>

          {/* Suspend panel */}
          {panel === 'suspend' && (
            <div className="adm__mod-panel">
              <label className="adm__mod-panel-label">Duration</label>
              <div className="adm__mod-duration-row">
                {SUSPEND_DURATIONS.map((d) => (
                  <button
                    key={d.hours}
                    type="button"
                    className={`adm__mod-duration-chip${durationHours === d.hours ? ' adm__mod-duration-chip--active' : ''}`}
                    onClick={() => setDurationHours(d.hours)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <label className="adm__mod-panel-label" htmlFor="mod-suspend-reason">Reason (shown to the user)</label>
              <textarea
                id="mod-suspend-reason"
                className="adm__kyc-note-input"
                rows={2}
                placeholder="e.g. Multiple policy violations reported by other bidders."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="adm__mod-panel-actions">
                <button type="button" className="adm__btn adm__btn--ghost" onClick={() => setPanel(null)}>Cancel</button>
                <button type="button" className="adm__btn adm__btn--err" disabled={busy} onClick={() => void handleSuspend()}>
                  <Clock size={15} /> Apply suspension
                </button>
              </div>
            </div>
          )}

          {/* Ban panel */}
          {panel === 'ban' && (
            <div className="adm__mod-panel">
              <label className="adm__mod-panel-label" htmlFor="mod-ban-reason">Reason (shown to the user)</label>
              <textarea
                id="mod-ban-reason"
                className="adm__kyc-note-input"
                rows={2}
                placeholder="e.g. Confirmed fraudulent payment activity."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="adm__mod-panel-actions">
                <button type="button" className="adm__btn adm__btn--ghost" onClick={() => setPanel(null)}>Cancel</button>
                <button type="button" className="adm__btn adm__btn--err" disabled={busy} onClick={() => void handleBan()}>
                  <Ban size={15} /> Ban permanently
                </button>
              </div>
            </div>
          )}

          {/* Warn panel */}
          {panel === 'warn' && (
            <div className="adm__mod-panel">
              <label className="adm__mod-panel-label" htmlFor="mod-warn-msg">Warning message</label>
              <textarea
                id="mod-warn-msg"
                className="adm__kyc-note-input"
                rows={3}
                maxLength={500}
                placeholder="This is sent as a one-time notification — it does not change the account status."
                value={warnMessage}
                onChange={(e) => setWarnMessage(e.target.value)}
              />
              <div className="adm__mod-panel-actions">
                <button type="button" className="adm__btn adm__btn--ghost" onClick={() => setPanel(null)}>Cancel</button>
                <button type="button" className="adm__btn adm__btn--primary" disabled={busy} onClick={() => void handleWarn()}>
                  <MessageSquareWarning size={15} /> Send warning
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
