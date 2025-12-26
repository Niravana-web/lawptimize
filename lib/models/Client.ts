import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClient extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  gstin?: string; // GST Identification Number (India)
  createdBy: string; // Clerk user ID
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [200, 'Client name cannot exceed 200 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    createdBy: {
      type: String,
      required: [true, 'Creator user ID is required'],
    },
  },
  {
    timestamps: true,
    collection: process.env.DATABASE_SCHEMA ? `${process.env.DATABASE_SCHEMA}_clients` : 'clients',
  }
);

// Compound index for organization + name uniqueness
ClientSchema.index({ organizationId: 1, name: 1 }, { unique: true });

// Index for email lookup
ClientSchema.index({ email: 1 });

// Prevent model recompilation in development
const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);

export default Client;
