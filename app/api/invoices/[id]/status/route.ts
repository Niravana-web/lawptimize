import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Invoice, OrganizationMember } from "@/lib/models";
import mongoose from "mongoose";

// Allowed status transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SENT'],
  SENT: ['PAID', 'OVERDUE'],
  OVERDUE: ['PAID'],
  PAID: [], // No transitions from PAID (immutable)
};

/**
 * PATCH /api/invoices/[id]/status
 * Update invoice status with validation
 */
export async function PATCH(
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
    const { status } = body;

    // Validate status is provided
    if (!status) {
      return NextResponse.json(
        { error: "Missing required field: status" },
        { status: 400 }
      );
    }

    // Validate status is valid
    const validStatuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // If status hasn't changed, return success
    if (invoice.status === status) {
      await invoice.populate('clientId', 'name email phone');
      return NextResponse.json({
        success: true,
        message: "Status unchanged",
        invoice: transformInvoice(invoice),
      });
    }

    // Validate transition is allowed
    const currentStatus = invoice.status;
    const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus];

    if (!allowedNextStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentStatus} to ${status}`,
          message: `Allowed transitions from ${currentStatus}: ${allowedNextStatuses.length > 0 ? allowedNextStatuses.join(', ') : 'None (status is final)'}`,
        },
        { status: 400 }
      );
    }

    // Update status and set timestamps
    invoice.status = status;

    if (status === 'SENT' && !invoice.sentAt) {
      invoice.sentAt = new Date();
    }

    if (status === 'PAID' && !invoice.paidAt) {
      invoice.paidAt = new Date();
    }

    await invoice.save();

    // Populate client for response
    await invoice.populate('clientId', 'name email phone');

    return NextResponse.json({
      success: true,
      message: `Invoice status updated from ${currentStatus} to ${status}`,
      invoice: transformInvoice(invoice),
    });
  } catch (error: any) {
    console.error("Error updating invoice status:", error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { error: "Validation error", message: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update invoice status", message: error.message },
      { status: 500 }
    );
  }
}

function transformInvoice(invoice: any) {
  return {
    id: invoice._id.toString(),
    invoiceNumber: invoice.invoiceNumber,
    clientId: invoice.clientId._id.toString(),
    clientName: invoice.clientId.name,
    clientEmail: invoice.clientId.email,
    issueDate: formatDate(invoice.issueDate),
    dueDate: formatDate(invoice.dueDate),
    amount: invoice.amount,
    status: invoice.status,
    items: invoice.items.map((item: any) => ({
      description: item.description,
      amount: item.amount,
      expenseId: item.expenseId ? item.expenseId.toString() : undefined,
    })),
    notes: invoice.notes || '',
    pdfUrl: invoice.pdfUrl || '',
    sentAt: invoice.sentAt ? invoice.sentAt.toISOString() : undefined,
    paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : undefined,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}
