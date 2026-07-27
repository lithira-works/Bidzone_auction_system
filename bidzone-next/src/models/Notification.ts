import mongoose, { Schema, type Document, type Model } from 'mongoose'

export type NotificationKind =
  | 'outbid'
  | 'bid_placed'
  | 'won'
  | 'payment'
  | 'lot_broadcast'
  | 'seller_approved'
  | 'seller_rejected'
  | 'listing_approved'
  | 'listing_rejected'
  | 'account_banned'
  | 'account_suspended'
  | 'account_reinstated'
  | 'seller_role_removed'
  | 'bidding_blocked'
  | 'bidding_restored'
  | 'admin_warning'
  | 'listing_removed'

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId
  userId: string
  kind: NotificationKind
  read: boolean
  meta: {
    itemKey?: string
    bidAmount?: number
    rawItem?: string
    paymentTotal?: number
    message?: string
    adminNote?: string
    listingTitle?: string
  }
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true },
    kind: {
      type: String,
      enum: [
        'outbid',
        'bid_placed',
        'won',
        'payment',
        'lot_broadcast',
        'seller_approved',
        'seller_rejected',
        'listing_approved',
        'listing_rejected',
        'account_banned',
        'account_suspended',
        'account_reinstated',
        'seller_role_removed',
        'bidding_blocked',
        'bidding_restored',
        'admin_warning',
        'listing_removed',
      ],
      required: true,
    },
    read: { type: Boolean, default: false },
    meta: {
      itemKey: { type: String },
      bidAmount: { type: Number },
      rawItem: { type: String },
      paymentTotal: { type: Number },
      message: { type: String },
      adminNote: { type: String },
      listingTitle: { type: String },
    },
  },
  { timestamps: true },
)

NotificationSchema.index({ userId: 1, createdAt: -1 })

export const NotificationModel: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ??
  mongoose.model<INotification>('Notification', NotificationSchema)
