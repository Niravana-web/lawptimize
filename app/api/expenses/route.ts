import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Expense, OrganizationMember } from "@/lib/models";
import mongoose from "mongoose";

/**
 * GET /api/expenses
 * Fetch all expenses for the user's organization with optional filters
 */
export async function GET(request: Request) {
  try {
    const user = await currentUser();

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

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const billable = searchParams.get('billable');
    const invoiced = searchParams.get('invoiced');
    const category = searchParams.get('category');
    const caseId = searchParams.get('caseId');
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const query: any = {
      organizationId: membership.organizationId,
    };

    if (billable !== null) {
      query.billable = billable === 'true';
    }

    if (invoiced !== null) {
      query.invoiced = invoiced === 'true';
    }

    if (category) {
      query.category = category;
    }

    if (caseId) {
      query.caseId = new mongoose.Types.ObjectId(caseId);
    }

    if (clientId) {
      query.clientId = new mongoose.Types.ObjectId(clientId);
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Fetch expenses with populated references
    const expenses = await Expense.find(query)
      .populate('caseId', 'title caseNumber')
      .populate('clientId', 'name email')
      .sort({ date: -1 });

    // Calculate summary statistics
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const billableUninvoiced = expenses
      .filter((exp) => exp.billable && !exp.invoiced)
      .reduce((sum, exp) => sum + exp.amount, 0);

    // Transform for frontend
    const transformedExpenses = expenses.map((exp: any) => ({
      id: exp._id.toString(),
      description: exp.description,
      category: exp.category,
      date: formatDate(exp.date),
      amount: exp.amount,
      caseId: exp.caseId ? exp.caseId._id.toString() : undefined,
      caseName: exp.caseId ? exp.caseId.title : undefined,
      caseNumber: exp.caseId ? exp.caseId.caseNumber : undefined,
      clientId: exp.clientId ? exp.clientId._id.toString() : undefined,
      clientName: exp.clientId ? exp.clientId.name : undefined,
      billable: exp.billable,
      invoiced: exp.invoiced,
      invoiceId: exp.invoiceId ? exp.invoiceId.toString() : undefined,
      createdAt: exp.createdAt.toISOString(),
      updatedAt: exp.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      expenses: transformedExpenses,
      summary: {
        total,
        billableUninvoiced,
        count: transformedExpenses.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expenses
 * Create a new expense
 */
export async function POST(request: Request) {
  try {
    const user = await currentUser();

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

    const body = await request.json();
    const { description, category, date, amount, caseId, clientId, billable } = body;

    // Validate required fields
    if (!description || !category || !date || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: description, category, date, amount" },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount < 0) {
      return NextResponse.json(
        { error: "Amount must be positive" },
        { status: 400 }
      );
    }

    // Create the expense
    const newExpense = await Expense.create({
      organizationId: membership.organizationId,
      description,
      category,
      date: new Date(date),
      amount,
      caseId: caseId ? new mongoose.Types.ObjectId(caseId) : undefined,
      clientId: clientId ? new mongoose.Types.ObjectId(clientId) : undefined,
      billable: billable !== undefined ? billable : true,
      invoiced: false,
      createdBy: user.id,
    });

    // Populate references for response
    await newExpense.populate('caseId', 'title caseNumber');
    await newExpense.populate('clientId', 'name email');

    return NextResponse.json({
      success: true,
      expense: {
        id: newExpense._id.toString(),
        description: newExpense.description,
        category: newExpense.category,
        date: formatDate(newExpense.date),
        amount: newExpense.amount,
        caseId: newExpense.caseId ? (newExpense.caseId as any)._id.toString() : undefined,
        caseName: newExpense.caseId ? (newExpense.caseId as any).title : undefined,
        caseNumber: newExpense.caseId ? (newExpense.caseId as any).caseNumber : undefined,
        clientId: newExpense.clientId ? (newExpense.clientId as any)._id.toString() : undefined,
        clientName: newExpense.clientId ? (newExpense.clientId as any).name : undefined,
        billable: newExpense.billable,
        invoiced: newExpense.invoiced,
        createdAt: newExpense.createdAt.toISOString(),
        updatedAt: newExpense.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error creating expense:", error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { error: "Validation error", message: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create expense", message: error.message },
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
