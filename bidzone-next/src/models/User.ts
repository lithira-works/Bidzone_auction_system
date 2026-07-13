import mongoose, { Schema, type Document, type Model } from 'mongoose'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  role: 'bidder' | 'seller' | 'admin'
  /** Set only via ADMIN_EMAILS env sync — cannot be demoted from admin console */
  isSuperAdmin: boolean
  /** Promoted by an existing admin — can be demoted unless also super admin */
  delegatedAdmin: boolean
  fullName: string
  email: string
  passwordHash: string
  address: string
  city: string
  phone: string
  phoneVerified: boolean
  kycStatus: 'not_required' | 'pending' | 'verified' | 'rejected'
  listingAllowed: boolean
  fraudCheckPassed: boolean
  avatarUrl: string | null
  /** Seller profile fields — populated during seller application */
  businessName: string
  businessType: 'individual' | 'registered_business' | 'cooperative' | ''
  businessDescription: string
  kycSubmittedAt: Date | null
  /** Admin notes shown to seller on approval/rejection */
  kycNotes: string
  /* ── KYC identity documents (data URLs, admin-eyes only) ── */
  kycDocType: 'nic' | 'driving_license' | ''
  kycDocFront: string
  kycDocBack: string
  kycSelfie: string
  kycReviewedAt: Date | null
  /** Email of the admin who made the last KYC decision (audit trail) */
  kycReviewedBy: string
  /** BidZone Currency wallet balance (whole BC units) */
  bcBalance: number
  /* ── Moderation: bans, temporary suspensions & privilege restrictions ── */
  accountStatus: 'active' | 'banned' | 'suspended'
  /** Suspension expiry — account auto-reinstates once this passes */
  suspendedUntil: Date | null
  /** Reason shown to the user for the current ban/suspension */
  statusReason: string
  statusUpdatedAt: Date | null
  /** Email of the admin who applied the last status change (audit trail) */
  statusUpdatedBy: string
  /** Independently revokes buyer privileges (bidding, coin purchases) without a full ban */
  biddingBlocked: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    role: { type: String, enum: ['bidder', 'seller', 'admin'], required: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    phoneVerified: { type: Boolean, default: false },
    kycStatus: {
      type: String,
      enum: ['not_required', 'pending', 'verified', 'rejected'],
      default: 'not_required',
    },
    listingAllowed: { type: Boolean, default: false },
    fraudCheckPassed: { type: Boolean, default: false },
    avatarUrl: { type: String, default: null },
    isSuperAdmin: { type: Boolean, default: false },
    delegatedAdmin: { type: Boolean, default: false },
    businessName: { type: String, default: '', trim: true },
    businessType: {
      type: String,
      enum: ['individual', 'registered_business', 'cooperative', ''],
      default: '',
    },
    businessDescription: { type: String, default: '', trim: true },
    kycSubmittedAt: { type: Date, default: null },
    kycNotes: { type: String, default: '', trim: true },
    kycDocType: { type: String, enum: ['nic', 'driving_license', ''], default: '' },
    /* select:false — documents never leave the DB unless explicitly requested by admin routes */
    kycDocFront: { type: String, default: '', select: false },
    kycDocBack: { type: String, default: '', select: false },
    kycSelfie: { type: String, default: '', select: false },
    kycReviewedAt: { type: Date, default: null },
    kycReviewedBy: { type: String, default: '', trim: true },
    bcBalance: { type: Number, default: 0, min: 0 },
    accountStatus: { type: String, enum: ['active', 'banned', 'suspended'], default: 'active' },
    suspendedUntil: { type: Date, default: null },
    statusReason: { type: String, default: '', trim: true },
    statusUpdatedAt: { type: Date, default: null },
    statusUpdatedBy: { type: String, default: '', trim: true },
    biddingBlocked: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>('User', UserSchema)
