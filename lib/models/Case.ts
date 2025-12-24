import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICase extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  title: string;
  caseNumber: string;
  court: string;
  client: string;
  description?: string;
  stage: 'FILING' | 'HEARING' | 'ARGUMENTS' | 'JUDGMENT';
  stageProgress: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  nextDate?: Date;
  filedDate?: Date;
  status: 'active' | 'closed' | 'archived';
  createdBy: string; // Clerk user ID
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema = new Schema<ICase>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Case title is required'],
      trim: true,
      maxlength: [200, 'Case title cannot exceed 200 characters'],
    },
    caseNumber: {
      type: String,
      required: [true, 'Case number is required'],
      trim: true,
    },
    court: {
      type: String,
      required: [true, 'Court name is required'],
      trim: true,
    },
    client: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    stage: {
      type: String,
      enum: ['FILING', 'HEARING', 'ARGUMENTS', 'JUDGMENT'],
      default: 'FILING',
    },
    stageProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    nextDate: {
      type: Date,
    },
    filedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'archived'],
      default: 'active',
    },
    createdBy: {
      type: String,
      required: [true, 'Creator user ID is required'],
    },
  },
  {
    timestamps: true,
    collection: process.env.DATABASE_SCHEMA ? `${process.env.DATABASE_SCHEMA}_cases` : 'cases',
  }
);

// Compound index for organization + case number uniqueness
CaseSchema.index({ organizationId: 1, caseNumber: 1 }, { unique: true });

// Index for sorting by dates
CaseSchema.index({ nextDate: 1 });
CaseSchema.index({ createdAt: -1 });

// Prevent model recompilation in development
const Case: Model<ICase> =
  mongoose.models.Case || mongoose.model<ICase>('Case', CaseSchema);

export default Case;
