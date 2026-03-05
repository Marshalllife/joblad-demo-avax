import mongoose, { Schema, Document, Types } from 'mongoose'

export type RequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
export type SimulationStatus = 'accepted' | 'on_the_way' | 'arrived' | 'working' | 'completed'
export type EscrowStatus = 'held' | 'released' | 'refunded'

export interface IRequest extends Document {
  _id: Types.ObjectId
  requestType: 'auto_match' | 'board'
  status: RequestStatus
  seekerId: Types.ObjectId
  providerId?: Types.ObjectId
  jobDetails: {
    title: string
    description: string
    skill: string
    urgency: 'today' | 'this_week' | 'flexible'
  }
  budget: { amount: number; currency: string }
  location: { city: string; address?: string; coordinates?: [number, number] }
  escrow: {
    contractJobId: string
    txHash: string
    status: EscrowStatus
    releaseTxHash?: string
  }
  simulation: {
    providerLat: number
    providerLng: number
    estimatedMinutes: number
    startedAt?: Date
    completedAt?: Date
    currentStatus: SimulationStatus
  }
  boardData?: {
    applications: Array<{
      providerId: Types.ObjectId
      proposedAmount: number
      message?: string
      appliedAt: Date
      status: 'pending' | 'selected' | 'rejected'
    }>
    selectedApplicationId?: Types.ObjectId
    expiresAt: Date
  }
  rating?: number
  reputationTxHash?: string
  createdAt: Date
  updatedAt: Date
}

const RequestSchema = new Schema<IRequest>(
  {
    requestType: { type: String, enum: ['auto_match', 'board'], required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    seekerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'User' },
    jobDetails: {
      title: { type: String, required: true },
      description: { type: String, required: true },
      skill: { type: String, required: true },
      urgency: { type: String, enum: ['today', 'this_week', 'flexible'], required: true },
    },
    budget: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'AVAX' },
    },
    location: {
      city: String,
      address: String,
      coordinates: [Number],
    },
    escrow: {
      contractJobId: String,
      txHash: String,
      status: { type: String, enum: ['held', 'released', 'refunded'] },
      releaseTxHash: String,
    },
    simulation: {
      providerLat: Number,
      providerLng: Number,
      estimatedMinutes: Number,
      startedAt: Date,
      completedAt: Date,
      currentStatus: {
        type: String,
        enum: ['accepted', 'on_the_way', 'arrived', 'working', 'completed'],
        default: 'accepted',
      },
    },
    boardData: {
      applications: [
        {
          providerId: { type: Schema.Types.ObjectId, ref: 'User' },
          proposedAmount: Number,
          message: String,
          appliedAt: { type: Date, default: Date.now },
          status: {
            type: String,
            enum: ['pending', 'selected', 'rejected'],
            default: 'pending',
          },
        },
      ],
      selectedApplicationId: Schema.Types.ObjectId,
      expiresAt: Date,
    },
    rating: Number,
    reputationTxHash: String,
  },
  { timestamps: true }
)

RequestSchema.index({ seekerId: 1, status: 1 })
RequestSchema.index({ providerId: 1, status: 1 })
RequestSchema.index({ requestType: 1, status: 1 })
RequestSchema.index({ 'jobDetails.skill': 1 })

export default mongoose.models.Request || mongoose.model<IRequest>('Request', RequestSchema)
