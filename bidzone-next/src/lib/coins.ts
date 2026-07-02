/**
 * Server-side BidZone Currency (BC) helpers.
 * Seeds default packages/gateways/settings and serializes documents for the client.
 */
import {
  CoinPackageModel,
  CoinSettingsModel,
  PaymentGatewayModel,
  type ICoinPackage,
  type ICoinSettings,
  type IPaymentGateway,
  type ICoinTransaction,
} from '@/models/Coin'

/* ── Default seed data (created once, then fully admin-managed) ── */

const DEFAULT_PACKAGES = [
  { name: 'Starter Pack',  bcAmount: 500,    bonusBc: 0,     priceUSD: 4.99,   badge: '',           tier: 'starter'  as const, sortOrder: 1 },
  { name: 'Bronze Pack',   bcAmount: 1200,   bonusBc: 60,    priceUSD: 9.99,   badge: '',           tier: 'bronze'   as const, sortOrder: 2 },
  { name: 'Silver Pack',   bcAmount: 3000,   bonusBc: 250,   priceUSD: 24.99,  badge: 'Popular',    tier: 'silver'   as const, sortOrder: 3 },
  { name: 'Gold Pack',     bcAmount: 6500,   bonusBc: 750,   priceUSD: 49.99,  badge: 'Best Value', tier: 'gold'     as const, sortOrder: 4 },
  { name: 'Platinum Pack', bcAmount: 14000,  bonusBc: 2000,  priceUSD: 99.99,  badge: '',           tier: 'platinum' as const, sortOrder: 5 },
  { name: 'Diamond Pack',  bcAmount: 30000,  bonusBc: 6000,  priceUSD: 199.99, badge: 'Whale',      tier: 'diamond'  as const, sortOrder: 6 },
]

const DEFAULT_GATEWAYS = [
  { name: 'Credit / Debit Card', provider: 'card'          as const, feePercent: 2.9, sortOrder: 1 },
  { name: 'PayPal',              provider: 'paypal'        as const, feePercent: 3.5, sortOrder: 2 },
  { name: 'Bank Transfer',       provider: 'bank_transfer' as const, feePercent: 0,   sortOrder: 3 },
]

/** Idempotent seed — only inserts when collections are empty. */
export async function ensureCoinDefaults(): Promise<void> {
  const [pkgCount, gwCount, settings] = await Promise.all([
    CoinPackageModel.estimatedDocumentCount(),
    PaymentGatewayModel.estimatedDocumentCount(),
    CoinSettingsModel.findOne({ key: 'global' }),
  ])

  const ops: Promise<unknown>[] = []
  if (pkgCount === 0) ops.push(CoinPackageModel.insertMany(DEFAULT_PACKAGES))
  if (gwCount === 0) ops.push(PaymentGatewayModel.insertMany(DEFAULT_GATEWAYS))
  if (!settings) ops.push(CoinSettingsModel.create({ key: 'global' }))
  if (ops.length) await Promise.all(ops)
}

/* ── Serializers ── */

export function toCoinPackage(p: ICoinPackage) {
  return {
    id: p._id.toString(),
    name: p.name,
    bcAmount: p.bcAmount,
    bonusBc: p.bonusBc,
    totalBc: p.bcAmount + p.bonusBc,
    priceUSD: p.priceUSD,
    badge: p.badge,
    tier: p.tier,
    active: p.active,
    sortOrder: p.sortOrder,
  }
}

export function toCoinSettings(s: ICoinSettings) {
  return {
    customEnabled: s.customEnabled,
    customMinBc: s.customMinBc,
    customMaxBc: s.customMaxBc,
    usdPerBc: s.usdPerBc,
    dailyPurchaseCapBc: s.dailyPurchaseCapBc,
    maxWalletBc: s.maxWalletBc,
    updatedBy: s.updatedBy,
    updatedAt: s.updatedAt?.toISOString() ?? null,
  }
}

export function toPaymentGateway(g: IPaymentGateway) {
  return {
    id: g._id.toString(),
    name: g.name,
    provider: g.provider,
    feePercent: g.feePercent,
    enabled: g.enabled,
    sortOrder: g.sortOrder,
  }
}

export function toCoinTransaction(t: ICoinTransaction) {
  return {
    id: t._id.toString(),
    type: t.type,
    bcAmount: t.bcAmount,
    balanceAfter: t.balanceAfter,
    priceUSD: t.priceUSD,
    reference: t.reference,
    packageName: t.packageName,
    gatewayName: t.gatewayName,
    auctionId: t.auctionId,
    auctionTitle: t.auctionTitle,
    status: t.status,
    note: t.note,
    createdAt: t.createdAt.toISOString(),
  }
}

/** Round to 2dp to avoid float artifacts on money values. */
export function money(n: number): number {
  return Math.round(n * 100) / 100
}
