import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvoiceCounter extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  year: number;
  sequence: number;
}

const InvoiceCounterSchema = new Schema<IInvoiceCounter>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    sequence: {
      type: Number,
      required: [true, 'Sequence is required'],
      default: 0,
    },
  },
  {
    collection: process.env.DATABASE_SCHEMA
      ? `${process.env.DATABASE_SCHEMA}_invoice_counters`
      : 'invoice_counters',
  }
);

// Compound unique index for organization + year
InvoiceCounterSchema.index({ organizationId: 1, year: 1 }, { unique: true });

// Prevent model recompilation in development
const InvoiceCounter: Model<IInvoiceCounter> =
  mongoose.models.InvoiceCounter ||
  mongoose.model<IInvoiceCounter>('InvoiceCounter', InvoiceCounterSchema);

export default InvoiceCounter;
