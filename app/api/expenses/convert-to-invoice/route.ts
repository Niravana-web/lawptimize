import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Expense, Invoice, OrganizationMember } from "@/lib/models";
import mongoose from "mongoose";

/**
 * POST /api/expenses/convert-to-invoice
 * Convert multiple expenses to an invoice (transaction-based)
 */
export async function POST(request: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await currentUser();

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

    const body = await request.json();
    const { expenseIds, clientId, issueDate, dueDate, notes } = body;

    // Validate required fields
    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { error: "Missing required field: expenseIds (must be non-empty array)" },
        { status: 400 }
      );
    }

    if (!clientId) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { error: "Missing required field: clientId" },
        { status: 400 }
      );
    }

    if (!issueDate) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { error: "Missing required field: issueDate" },
        { status: 400 }
      );
    }

    if (!dueDate) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { error: "Missing required field: dueDate" },
        { status: 400 }
      );
    }

    // Convert expense IDs to ObjectIds
    const expenseObjectIds = expenseIds.map((id: string) => new mongoose.Types.ObjectId(id));

    // Fetch all expenses
    const expenses = await Expense.find({
      _id: { $in: expenseObjectIds },
      organizationId: membership.organizationId,
    }).session(session);

    // Validate all expenses exist
    if (expenses.length !== expenseIds.length) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { error: "Some expenses not found or do not belong to your organization" },
        { status: 404 }
      );
    }

    // Validate all expenses are billable and not invoiced
    const nonBillableExpenses = expenses.filter((exp) => !exp.billable);
    if (nonBillableExpenses.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        {
          error: "All expenses must be billable",
          message: `Found ${nonBillableExpenses.length} non-billable expense(s)`
        },
        { status: 400 }
      );
    }

    const alreadyInvoicedExpenses = expenses.filter((exp) => exp.invoiced);
    if (alreadyInvoicedExpenses.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        {
          error: "Some expenses have already been invoiced",
          message: `Found ${alreadyInvoicedExpenses.length} already invoiced expense(s)`
        },
        { status: 400 }
      );
    }

    // Create invoice items from expenses
    const items = expenses.map((exp) => ({
      description: exp.description,
      amount: exp.amount,
      expenseId: exp._id,
    }));

    // Create invoice (invoice number will be auto-generated)
    const newInvoice = await Invoice.create(
      [
        {
          organizationId: membership.organizationId,
          clientId: new mongoose.Types.ObjectId(clientId),
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          status: 'DRAFT',
          items,
          notes: notes || undefined,
          createdBy: user.id,
        },
      ],
      { session }
    );

    const invoice = newInvoice[0];

    // Update all expenses to mark them as invoiced
    await Expense.updateMany(
      { _id: { $in: expenseObjectIds } },
      {
        $set: {
          invoiced: true,
          invoiceId: invoice._id,
        },
      },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Populate client for response
    await invoice.populate('clientId', 'name email phone');

    return NextResponse.json({
      success: true,
      message: `Successfully converted ${expenseIds.length} expense(s) to invoice`,
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
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error converting expenses to invoice:", error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { error: "Validation error", message: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to convert expenses to invoice", message: error.message },
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
