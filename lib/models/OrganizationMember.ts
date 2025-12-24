import mongoose, { Schema, Document, Model } from 'mongoose';

export type MemberRole = 'admin' | 'user';
export type MemberStatus = 'active' | 'invited' | 'inactive';

export interface IOrganizationMember extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  userId: string; // Clerk user ID
  email: string;
  firstName?: string;
  lastName?: string;
  role: MemberRole;
  status: MemberStatus;
  invitedBy?: string; // Clerk user ID of inviter
  invitedAt?: Date;
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationMemberSchema = new Schema<IOrganizationMember>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'inactive'],
      default: 'active',
    },
    invitedBy: {
      type: String,
    },
    invitedAt: {
      type: Date,
    },
    joinedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: process.env.DATABASE_SCHEMA ? `${process.env.DATABASE_SCHEMA}_organization_members` : 'organization_members',
  }
);

// Compound indexes for faster queries
OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
OrganizationMemberSchema.index({ organizationId: 1, role: 1 });
OrganizationMemberSchema.index({ email: 1 });

// Prevent model recompilation in development
const OrganizationMember: Model<IOrganizationMember> =
  mongoose.models.OrganizationMember || mongoose.model<IOrganizationMember>('OrganizationMember', OrganizationMemberSchema);

export default OrganizationMember;
