import mongoose, { Schema, type Document, type Model } from 'mongoose'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  role: 'bidder' | 'seller'
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
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    role: { type: String, enum: ['bidder', 'seller'], required: true },
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
  },
  { timestamps: true },
)

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>('User', UserSchema)
