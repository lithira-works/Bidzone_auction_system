import mongoose, { Schema, type Document, type Model } from 'mongoose'

/* ═══════════════════════════════════════════════════════════
   BIDZONE CURRENCY (BC) — database models
   - CoinPackage:     admin-managed store packages
   - CoinSettings:    singleton config (rate, caps, custom amount)
   - PaymentGateway:  admin-managed payment options
   - CoinTransaction: immutable wallet ledger (audit trail)
   ═══════════════════════════════════════════════════════════ */

/* ── Coin package ── */
export interface ICoinPackage extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  /** Base BC credited */
  bcAmount: number
  /** Extra bonus BC on top of base */
  bonusBc: number
  /** Real-money price in USD — authoritative, set by admin */
  priceUSD: number
  /** Optional marketing badge, e.g. "Popular", "Best Value" */
  badge: string
  /** Visual tier used by the store UI (bronze/silver/gold/…) */
  tier: 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  active: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const CoinPackageSchema = new Schema<ICoinPackage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    bcAmount: { type: Number, required: true, min: 1 },
    bonusBc: { type: Number, default: 0, min: 0 },
    priceUSD: { type: Number, required: true, min: 0.01 },
    badge: { type: String, default: '', trim: true, maxlength: 30 },
    tier: {
      type: String,
      enum: ['starter', 'bronze', 'silver', 'gold', 'platinum', 'diamond'],
      default: 'starter',
    },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
)

CoinPackageSchema.index({ active: 1, sortOrder: 1 })

export const CoinPackageModel: Model<ICoinPackage> =
  (mongoose.models.CoinPackage as Model<ICoinPackage>) ??
  mongoose.model<ICoinPackage>('CoinPackage', CoinPackageSchema)

/* ── Coin settings (singleton) ── */
export interface ICoinSettings extends Document {
  _id: mongoose.Types.ObjectId
  /** Fixed key so only one settings document can exist */
  key: 'global'
  /** Custom amount purchase enabled */
  customEnabled: boolean
  /** Min / max BC for a single custom purchase */
  customMinBc: number
  customMaxBc: number
  /** USD price per 1 BC for custom purchases */
  usdPerBc: number
  /** Max BC a user may purchase within a rolling 24h window (0 = unlimited) */
  dailyPurchaseCapBc: number
  /** Max BC a wallet can hold (0 = unlimited) */
  maxWalletBc: number
  /** Email of the admin who last updated settings */
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

const CoinSettingsSchema = new Schema<ICoinSettings>(
  {
    key: { type: String, default: 'global', unique: true },
    customEnabled: { type: Boolean, default: true },
    customMinBc: { type: Number, default: 100, min: 1 },
    customMaxBc: { type: Number, default: 50000, min: 1 },
    usdPerBc: { type: Number, default: 0.01, min: 0.0001 },
    dailyPurchaseCapBc: { type: Number, default: 100000, min: 0 },
    maxWalletBc: { type: Number, default: 1000000, min: 0 },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true },
)

export const CoinSettingsModel: Model<ICoinSettings> =
  (mongoose.models.CoinSettings as Model<ICoinSettings>) ??
  mongoose.model<ICoinSettings>('CoinSettings', CoinSettingsSchema)

/* ── Payment gateway ── */
export interface IPaymentGateway extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  provider: 'card' | 'paypal' | 'bank_transfer' | 'mobile_wallet' | 'crypto'
  /** Processing fee added at checkout, e.g. 2.9 (%) */
  feePercent: number
  enabled: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const PaymentGatewaySchema = new Schema<IPaymentGateway>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    provider: {
      type: String,
      enum: ['card', 'paypal', 'bank_transfer', 'mobile_wallet', 'crypto'],
      required: true,
    },
    feePercent: { type: Number, default: 0, min: 0, max: 30 },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
)

PaymentGatewaySchema.index({ enabled: 1, sortOrder: 1 })

export const PaymentGatewayModel: Model<IPaymentGateway> =
  (mongoose.models.PaymentGateway as Model<IPaymentGateway>) ??
  mongoose.model<IPaymentGateway>('PaymentGateway', PaymentGatewaySchema)

/* ── Coin transaction (immutable ledger) ── */
export type CoinTxType =
  | 'purchase'      /* bought BC with real money            (+) */
  | 'bid_hold'      /* BC held while user is highest bidder (-) */
  | 'bid_release'   /* hold refunded after being outbid     (+) */
  | 'spend'         /* BC spent on a won auction            (-) */
  | 'refund'        /* admin/system refund                  (+) */
  | 'admin_credit'  /* manual admin adjustment              (+) */
  | 'admin_debit'   /* manual admin adjustment              (-) */

export interface ICoinTransaction extends Document {
  _id: mongoose.Types.ObjectId
  userId: string
  type: CoinTxType
  /** Signed BC delta: positive = credit, negative = debit */
  bcAmount: number
  /** Wallet balance snapshot after this transaction */
  balanceAfter: number
  /** For purchases: what was paid in real money */
  priceUSD: number | null
  /** Unique payment reference (idempotency + receipts) */
  reference: string
  packageId: string | null
  packageName: string
  gatewayId: string | null
  gatewayName: string
  auctionId: string | null
  auctionTitle: string
  status: 'completed' | 'pending' | 'failed'
  note: string
  createdAt: Date
}

const CoinTransactionSchema = new Schema<ICoinTransaction>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['purchase', 'bid_hold', 'bid_release', 'spend', 'refund', 'admin_credit', 'admin_debit'],
      required: true,
    },
    bcAmount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true, min: 0 },
    priceUSD: { type: Number, default: null },
    reference: { type: String, required: true, unique: true },
    packageId: { type: String, default: null },
    packageName: { type: String, default: '' },
    gatewayId: { type: String, default: null },
    gatewayName: { type: String, default: '' },
    auctionId: { type: String, default: null },
    auctionTitle: { type: String, default: '' },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
    note: { type: String, default: '', maxlength: 300 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
)

CoinTransactionSchema.index({ userId: 1, createdAt: -1 })
CoinTransactionSchema.index({ userId: 1, type: 1, createdAt: -1 })

export const CoinTransactionModel: Model<ICoinTransaction> =
  (mongoose.models.CoinTransaction as Model<ICoinTransaction>) ??
  mongoose.model<ICoinTransaction>('CoinTransaction', CoinTransactionSchema)
