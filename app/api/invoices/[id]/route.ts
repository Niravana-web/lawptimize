import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Invoice, Expense, OrganizationMember } from "@/lib/models";
import mongoose from "mongoose";
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * GET /api/invoices/[id]
 * Fetch a single invoice
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get user's organization membership
    const membership = await OrganizationMember.findOne({ userId: user.id });

    if (!membership) {
      return NextResponse.json(
        { error: "User is not part of any organization" },
        { status: 403 }
      );
    }

    // Fetch invoice
    const invoice = await Invoice.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: membership.organizationId,
    }).populate('clientId', 'name email phone');

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        clientId: (invoice.clientId as any)._id.toString(),
        clientName: (invoice.clientId as any).name,
        clientEmail: (invoice.clientId as any).email,
        issueDate: formatDate(invoice.issueDate),
        dueDate: formatDate(invoice.dueDate),
        amount: invoice.amount,
        status: invoice.status,
        items: invoice.items.map((item) => ({
          description: item.description,
          amount: item.amount,
          expenseId: item.expenseId ? item.expenseId.toString() : undefined,
        })),
        notes: invoice.notes || '',
        pdfUrl: invoice.pdfUrl || '',
        sentAt: invoice.sentAt ? invoice.sentAt.toISOString() : undefined,
        paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : undefined,
      },
    });
  } catch (error: any) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/invoices/[id]
 * Update an invoice
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get user's organization membership
    const membership = await OrganizationMember.findOne({ userId: user.id });

    if (!membership) {
      return NextResponse.json(
        { error: "User is not part of any organization" },
        { status: 403 }
      );
    }

    // Find invoice
    const invoice = await Invoice.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: membership.organizationId,
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const body = await request.json();

    // Security: Only DRAFT invoices can be fully edited
    if (invoice.status !== 'DRAFT') {
      // For non-draft invoices, only allow status updates
      if (body.status && body.status !== invoice.status) {
        return NextResponse.json(
          { error: "Non-draft invoices can only be updated via the status endpoint" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Cannot edit a non-draft invoice. Only DRAFT invoices can be fully edited." },
        { status: 403 }
      );
    }

    const { clientId, dueDate, items, notes } = body;

    // Update fields
    if (clientId !== undefined) {
      invoice.clientId = new mongoose.Types.ObjectId(clientId);
    }
    if (dueDate !== undefined) {
      invoice.dueDate = new Date(dueDate);
    }
    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: "Invoice must have at least one item" },
          { status: 400 }
        );
      }
      invoice.items = items.map((item: any) => ({
        description: item.description,
        amount: item.amount,
        expenseId: item.expenseId ? new mongoose.Types.ObjectId(item.expenseId) : undefined,
      }));
    }
    if (notes !== undefined) {
      invoice.notes = notes || undefined;
    }

    await invoice.save();

    // Populate for response
    await invoice.populate('clientId', 'name email phone');

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        clientId: (invoice.clientId as any)._id.toString(),
        clientName: (invoice.clientId as any).name,
        clientEmail: (invoice.clientId as any).email,
        issueDate: formatDate(invoice.issueDate),
        dueDate: formatDate(invoice.dueDate),
        amount: invoice.amount,
        status: invoice.status,
        items: invoice.items.map((item) => ({
          description: item.description,
          amount: item.amount,
          expenseId: item.expenseId ? item.expenseId.toString() : undefined,
        })),
        notes: invoice.notes || '',
      },
    });
  } catch (error: any) {
    console.error("Error updating invoice:", error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { error: "Validation error", message: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update invoice", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[id]
 * Delete an invoice (only DRAFT invoices)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await currentUser();
    const { id } = await params;

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get user's organization membership
    const membership = await OrganizationMember.findOne({ userId: user.id });

    if (!membership) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { error: "User is not part of any organization" },
        { status: 403 }
      );
    }

    // Find invoice
    const invoice = await Invoice.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: membership.organizationId,
    });

    if (!invoice) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Security: Can only delete DRAFT invoices
    if (invoice.status !== 'DRAFT') {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { error: "Can only delete DRAFT invoices. Non-draft invoices cannot be deleted." },
        { status: 403 }
      );
    }

    // Unlink all expenses associated with this invoice
    await Expense.updateMany(
      { invoiceId: invoice._id },
      { $set: { invoiced: false }, $unset: { invoiceId: 1 } },
      { session }
    );

    // Delete PDF file if exists
    if (invoice.pdfUrl) {
      try {
        const pdfPath = path.join(process.cwd(), 'public', invoice.pdfUrl);
        await fs.unlink(pdfPath);
      } catch (err) {
        // Ignore file deletion errors
        console.warn('Failed to delete PDF file:', err);
      }
    }

    // Delete invoice
    await Invoice.deleteOne({ _id: invoice._id }, { session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully and associated expenses unlinked",
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice", message: error.message },
      { status: 500 }
    );
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}
