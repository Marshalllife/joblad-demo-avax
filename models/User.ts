import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IUser extends Document {
  _id: Types.ObjectId
  email: string
  name: string
  role: 'seeker' | 'provider' | null
  // Provider fields
  skills: Array<{ skillId: number; skillName: string; professionalTitle: string }>
  rate: { min: number; max: number; currency: string }
  location: { city: string; country: string; coordinates: [number, number]; address?: string }
  bio: string
  // Credential NFT (provider)
  credentialTokenId: string | null
  credentialTxHash: string | null
  // Seeker fields
  preferredSkills: string[]
  // Wallet (Avalanche Fuji)
  walletAddress: string
  encryptedPrivateKey: string
  avaxBalance: number
  lockedBalance: number
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: '' },
    role: { type: String, enum: ['seeker', 'provider', null], default: null },
    skills: [
      {
        skillId: Number,
        skillName: String,
        professionalTitle: String,
      },
    ],
    rate: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'AVAX' },
    },
    location: {
      city: { type: String, default: '' },
      country: { type: String, default: 'Nigeria' },
      coordinates: { type: [Number], default: [3.3792, 6.5244] }, // Lagos default
      address: String,
    },
    bio: { type: String, default: '' },
    credentialTokenId: { type: String, default: null },
    credentialTxHash: { type: String, default: null },
    preferredSkills: [String],
    walletAddress: { type: String, default: '' },
    encryptedPrivateKey: { type: String, default: '' },
    avaxBalance: { type: Number, default: 0 },
    lockedBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
)

UserSchema.index({ email: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ 'skills.skillName': 1 })
UserSchema.index({ 'location.city': 1 })

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
