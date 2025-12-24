import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  createdBy: string; // Clerk user ID
  settings: {
    defaultCurrency?: string;
    timezone?: string;
    billingEmail?: string;
  };
  subscription: {
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled' | 'past_due';
    validUntil?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Organization slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    createdBy: {
      type: String,
      required: [true, 'Creator user ID is required'],
      index: true,
    },
    settings: {
      defaultCurrency: {
        type: String,
        default: 'USD',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      billingEmail: {
        type: String,
        trim: true,
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'starter', 'professional', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'cancelled', 'past_due'],
        default: 'active',
      },
      validUntil: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    collection: process.env.DATABASE_SCHEMA ? `${process.env.DATABASE_SCHEMA}_organizations` : 'organizations',
  }
);

// Index for createdAt (slug index is defined in schema with unique: true)
OrganizationSchema.index({ createdAt: -1 });

// Prevent model recompilation in development
const Organization: Model<IOrganization> =
  mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);

export default Organization;
