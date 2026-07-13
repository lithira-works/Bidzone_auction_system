/**
 * Central account-standing gate. Every entry point that authenticates a user
 * (login, Google sign-in, session refresh) or performs a buyer action
 * (bidding, coin purchases) must call this before proceeding.
 */
import { UserModel, type IUser } from '@/models/User'

export type AccountRestriction =
  | { code: 'account_banned'; reason: string }
  | { code: 'account_suspended'; reason: string; suspendedUntil: string }

const DEFAULT_BAN_REASON = 'Your account has been banned for violating BidZone policies.'
const DEFAULT_SUSPEND_REASON = 'Your account is temporarily suspended.'

/**
 * Evaluates a user's moderation status. If a suspension has already expired,
 * the account is auto-reinstated (both in the DB and on the in-memory doc)
 * so callers immediately see the restored, active state.
 * Returns a restriction descriptor when the account is currently locked out,
 * or null when the account is in good standing.
 */
export async function checkAccountRestriction(user: IUser): Promise<AccountRestriction | null> {
  if (user.accountStatus === 'banned') {
    return { code: 'account_banned', reason: user.statusReason || DEFAULT_BAN_REASON }
  }

  if (user.accountStatus === 'suspended') {
    if (user.suspendedUntil && user.suspendedUntil.getTime() > Date.now()) {
      return {
        code: 'account_suspended',
        reason: user.statusReason || DEFAULT_SUSPEND_REASON,
        suspendedUntil: user.suspendedUntil.toISOString(),
      }
    }

    /* Suspension window has elapsed — auto-reinstate transparently */
    await UserModel.findByIdAndUpdate(user._id, {
      $set: { accountStatus: 'active', suspendedUntil: null, statusReason: '' },
    })
    user.accountStatus = 'active'
    user.suspendedUntil = null
    user.statusReason = ''
  }

  return null
}

/** Buyer-privilege check (bidding, coin purchases) — bans/suspensions imply this too. */
export async function checkBuyerAllowed(user: IUser): Promise<AccountRestriction | { code: 'bidding_blocked'; reason: string } | null> {
  const restriction = await checkAccountRestriction(user)
  if (restriction) return restriction
  if (user.biddingBlocked) {
    return {
      code: 'bidding_blocked',
      reason: 'Your buyer privileges (bidding & coin purchases) have been restricted by an administrator.',
    }
  }
  return null
}
