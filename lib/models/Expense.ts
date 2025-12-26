import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  description: string;
  category: string;
  date: Date;
  amount: number;
  caseId?: mongoose.Types.ObjectId; // Reference to Case
  clientId?: mongoose.Types.ObjectId; // Reference to Client
  billable: boolean;
  invoiced: boolean;
  invoiceId?: mongoose.Types.ObjectId; // Reference to Invoice
  receiptUrl?: string; // Future: file upload
  createdBy: string; // Clerk user ID
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Court Fees',
        'Travel',
        'Legal Services',
        'Professional Services',
        'Subscriptions',
        'Office Supplies',
        'Communication',
        'Other',
      ],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
    },
    billable: {
      type: Boolean,
      default: true,
    },
    invoiced: {
      type: Boolean,
      default: false,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      index: true,
    },
    receiptUrl: {
      type: String,
    },
    createdBy: {
      type: String,
      required: [true, 'Creator user ID is required'],
    },
  },
  {
    timestamps: true,
    collection: process.env.DATABASE_SCHEMA ? `${process.env.DATABASE_SCHEMA}_expenses` : 'expenses',
  }
);

// Compound index for billable expense queries
ExpenseSchema.index({ organizationId: 1, billable: 1, invoiced: 1 });

// Index for date sorting
ExpenseSchema.index({ organizationId: 1, date: -1 });

// Index for recent expenses
ExpenseSchema.index({ createdAt: -1 });

// Prevent model recompilation in development
const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
