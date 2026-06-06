import mongoose, { Schema, type Document, type Model } from 'mongoose'

export type ModerationStatus = 'pending' | 'approved' | 'rejected'
export type ListingSource = 'admin' | 'seller'

export interface IAuction extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  image: string
  images?: string[]
  category: string
  currentBid: number
  buyNow?: number
  reservePrice?: number
  bids: number
  timeLeft: string
  urgent: boolean
  featured: boolean
  sellerName?: string
  sellerId?: string
  listingDescription?: string
  condition?: string
  auctionEndsAt?: Date
  auctionCreatedAt: Date
  moderationStatus: ModerationStatus
  listingSource: ListingSource
  createdAt: Date
  updatedAt: Date
}

const AuctionSchema = new Schema<IAuction>(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    images: { type: [String], default: undefined },
    category: { type: String, required: true, trim: true },
    currentBid: { type: Number, required: true, min: 0 },
    buyNow: { type: Number },
    reservePrice: { type: Number },
    bids: { type: Number, default: 0 },
    timeLeft: { type: String, default: '' },
    urgent: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    sellerName: { type: String, trim: true },
    sellerId: { type: String, index: true },
    listingDescription: { type: String },
    condition: { type: String },
    auctionEndsAt: { type: Date },
    auctionCreatedAt: { type: Date, default: Date.now },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    listingSource: {
      type: String,
      enum: ['admin', 'seller'],
      default: 'seller',
    },
  },
  { timestamps: true },
)

AuctionSchema.index({ category: 1 })
AuctionSchema.index({ auctionEndsAt: 1 })
AuctionSchema.index({ moderationStatus: 1, auctionCreatedAt: -1 })

export const AuctionModel: Model<IAuction> =
  (mongoose.models.Auction as Model<IAuction>) ??
  mongoose.model<IAuction>('Auction', AuctionSchema)
