/** Passed from review → payment via React Router location state. */
export type CheckoutDraftState = {
  subtotal: number
  shipping: number
  discount: number
  total: number
  /** Cart line ids included in this checkout (buy-now only). */
  payableIds: string[]
}

export function draftStateValid(d: unknown): d is CheckoutDraftState {
  if (!d || typeof d !== 'object') return false
  const x = d as CheckoutDraftState
  return (
    typeof x.subtotal === 'number' &&
    typeof x.shipping === 'number' &&
    typeof x.discount === 'number' &&
    typeof x.total === 'number' &&
    Array.isArray(x.payableIds) &&
    x.payableIds.every((id) => typeof id === 'string')
  )
}
