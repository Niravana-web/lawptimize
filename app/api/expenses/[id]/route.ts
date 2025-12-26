import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Expense, OrganizationMember } from "@/lib/models";
import mongoose from "mongoose";

/**
 * GET /api/expenses/[id]
 * Fetch a single expense
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

    // Fetch expense
    const expense = await Expense.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: membership.organizationId,
    })
      .populate('caseId', 'title caseNumber')
      .populate('clientId', 'name email');

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      expense: {
        id: expense._id.toString(),
        description: expense.description,
        category: expense.category,
        date: formatDate(expense.date),
        amount: expense.amount,
        caseId: expense.caseId ? (expense.caseId as any)._id.toString() : undefined,
        caseName: expense.caseId ? (expense.caseId as any).title : undefined,
        clientId: expense.clientId ? (expense.clientId as any)._id.toString() : undefined,
        clientName: expense.clientId ? (expense.clientId as any).name : undefined,
        billable: expense.billable,
        invoiced: expense.invoiced,
        invoiceId: expense.invoiceId ? expense.invoiceId.toString() : undefined,
      },
    });
  } catch (error: any) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/expenses/[id]
 * Update an expense
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

    // Find expense
    const expense = await Expense.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: membership.organizationId,
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Security: Cannot update if already invoiced
    if (expense.invoiced) {
      return NextResponse.json(
        { error: "Cannot update an expense that has already been invoiced" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { description, category, date, amount, caseId, clientId, billable } = body;

    // Update fields
    if (description !== undefined) expense.description = description;
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = new Date(date);
    if (amount !== undefined) {
      if (amount < 0) {
        return NextResponse.json(
          { error: "Amount must be positive" },
          { status: 400 }
        );
      }
      expense.amount = amount;
    }
    if (caseId !== undefined) {
      expense.caseId = caseId ? new mongoose.Types.ObjectId(caseId) : undefined;
    }
    if (clientId !== undefined) {
      expense.clientId = clientId ? new mongoose.Types.ObjectId(clientId) : undefined;
    }
    if (billable !== undefined) expense.billable = billable;

    await expense.save();

    // Populate for response
    await expense.populate('caseId', 'title caseNumber');
    await expense.populate('clientId', 'name email');

    return NextResponse.json({
      success: true,
      expense: {
        id: expense._id.toString(),
        description: expense.description,
        category: expense.category,
        date: formatDate(expense.date),
        amount: expense.amount,
        caseId: expense.caseId ? (expense.caseId as any)._id.toString() : undefined,
        caseName: expense.caseId ? (expense.caseId as any).title : undefined,
        clientId: expense.clientId ? (expense.clientId as any)._id.toString() : undefined,
        clientName: expense.clientId ? (expense.clientId as any).name : undefined,
        billable: expense.billable,
        invoiced: expense.invoiced,
      },
    });
  } catch (error: any) {
    console.error("Error updating expense:", error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { error: "Validation error", message: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update expense", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/expenses/[id]
 * Delete an expense
 */
export async function DELETE(
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

    // Find expense
    const expense = await Expense.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: membership.organizationId,
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Security: Cannot delete if already invoiced
    if (expense.invoiced) {
      return NextResponse.json(
        { error: "Cannot delete an expense that has already been invoiced" },
        { status: 403 }
      );
    }

    // Delete expense
    await Expense.deleteOne({ _id: expense._id });

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense", message: error.message },
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
