import mongoose, { Schema, Document, Model } from 'mongoose';
import InvoiceCounter from './InvoiceCounter';

export interface IInvoice extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  invoiceNumber: string; // Auto: INV-YYYY-XXX
  clientId: mongoose.Types.ObjectId; // Reference to Client
  issueDate: Date;
  dueDate: Date;
  amount: number; // Auto-calculated from items
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  items: Array<{
    description: string;
    amount: number;
    expenseId?: mongoose.Types.ObjectId;
  }>;
  notes?: string;
  pdfUrl?: string; // Stored PDF path
  sentAt?: Date;
  paidAt?: Date;
  createdBy: string; // Clerk user ID
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
      index: true,
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    amount: {
      type: Number,
      min: [0, 'Amount must be positive'],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE'],
      default: 'DRAFT',
    },
    items: [
      {
        description: {
          type: String,
          required: [true, 'Item description is required'],
          trim: true,
          maxlength: [300, 'Item description cannot exceed 300 characters'],
        },
        amount: {
          type: Number,
          required: [true, 'Item amount is required'],
          min: [0, 'Item amount must be positive'],
        },
        expenseId: {
          type: Schema.Types.ObjectId,
          ref: 'Expense',
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    pdfUrl: {
      type: String,
    },
    sentAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    createdBy: {
      type: String,
      required: [true, 'Creator user ID is required'],
    },
  },
  {
    timestamps: true,
    collection: process.env.DATABASE_SCHEMA ? `${process.env.DATABASE_SCHEMA}_invoices` : 'invoices',
  }
);

// Compound unique index for organization + invoice number
InvoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });

// Index for status filtering
InvoiceSchema.index({ organizationId: 1, status: 1 });

// Index for due date sorting
InvoiceSchema.index({ organizationId: 1, dueDate: 1 });

// Index for recent invoices
InvoiceSchema.index({ createdAt: -1 });

// Pre-save hook: Auto-calculate total amount from items
InvoiceSchema.pre('save', function () {
  if (this.items && this.items.length > 0) {
    this.amount = this.items.reduce((total, item) => total + item.amount, 0);
  }
});

// Pre-save hook: Validate dueDate >= issueDate
InvoiceSchema.pre('save', function () {
  if (this.dueDate < this.issueDate) {
    throw new Error('Due date must be on or after issue date');
  }
});

// Pre-save hook: Auto-generate invoice number if not provided
InvoiceSchema.pre('save', async function () {
  if (this.isNew && !this.invoiceNumber) {
    const year = new Date(this.issueDate).getFullYear();

    // Atomic increment using findOneAndUpdate
    const counter = await InvoiceCounter.findOneAndUpdate(
      { organizationId: this.organizationId, year },
      { $inc: { sequence: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Generate invoice number: INV-YYYY-XXX
    this.invoiceNumber = `INV-${year}-${String(counter.sequence).padStart(3, '0')}`;
  }
});

// Prevent model recompilation in development - force refresh if schema changed
if (mongoose.models.Invoice) {
  delete mongoose.models.Invoice;
}
const Invoice: Model<IInvoice> = mongoose.model<IInvoice>('Invoice', InvoiceSchema);

export default Invoice;
