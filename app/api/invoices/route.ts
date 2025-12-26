import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Invoice, OrganizationMember } from "@/lib/models";
import mongoose from "mongoose";

/**
 * GET /api/invoices
 * Fetch all invoices for the user's organization with optional filters
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const query: any = {
      organizationId: membership.organizationId,
    };

    if (status) {
      query.status = status;
    }

    if (clientId) {
      query.clientId = new mongoose.Types.ObjectId(clientId);
    }

    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) {
        query.issueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.issueDate.$lte = new Date(endDate);
      }
    }

    // Fetch invoices with populated client data
    const invoices = await Invoice.find(query)
      .populate('clientId', 'name email phone')
      .sort({ createdAt: -1 });

    // Auto-update OVERDUE status
    const now = new Date();
    const updatePromises = invoices.map(async (invoice) => {
      if (invoice.status === 'SENT' && new Date(invoice.dueDate) < now) {
        invoice.status = 'OVERDUE';
        await invoice.save();
      }
      return invoice;
    });
    await Promise.all(updatePromises);

    // Calculate summary statistics
    const totalRevenue = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const pendingAmount = invoices
      .filter((inv) => inv.status === 'SENT' || inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const overdueCount = invoices.filter((inv) => inv.status === 'OVERDUE').length;

    // Transform for frontend
    const transformedInvoices = invoices.map((inv: any) => ({
      id: inv._id.toString(),
      invoiceNumber: inv.invoiceNumber,
      clientId: inv.clientId._id.toString(),
      clientName: inv.clientId.name,
      clientEmail: inv.clientId.email,
      issueDate: formatDate(inv.issueDate),
      dueDate: formatDate(inv.dueDate),
      amount: inv.amount,
      status: inv.status,
      items: inv.items.map((item: any) => ({
        description: item.description,
        amount: item.amount,
        expenseId: item.expenseId ? item.expenseId.toString() : undefined,
      })),
      notes: inv.notes || '',
      pdfUrl: inv.pdfUrl || '',
      sentAt: inv.sentAt ? inv.sentAt.toISOString() : undefined,
      paidAt: inv.paidAt ? inv.paidAt.toISOString() : undefined,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      invoices: transformedInvoices,
      summary: {
        totalRevenue,
        pendingAmount,
        overdueCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices
 * Create a new invoice
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
    const { clientId, issueDate, dueDate, items, notes } = body;

    // Validate required fields
    if (!clientId || !issueDate || !dueDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, issueDate, dueDate, items" },
        { status: 400 }
      );
    }

    // Validate client exists and belongs to organization
    const clientObjectId = new mongoose.Types.ObjectId(clientId);

    // Create the invoice (invoice number will be auto-generated)
    const newInvoice = await Invoice.create({
      organizationId: membership.organizationId,
      clientId: clientObjectId,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      status: 'DRAFT',
      items: items.map((item: any) => ({
        description: item.description,
        amount: item.amount,
        expenseId: item.expenseId ? new mongoose.Types.ObjectId(item.expenseId) : undefined,
      })),
      notes: notes || undefined,
      createdBy: user.id,
    });

    // Populate client for response
    await newInvoice.populate('clientId', 'name email phone');

    return NextResponse.json({
      success: true,
      invoice: {
        id: newInvoice._id.toString(),
        invoiceNumber: newInvoice.invoiceNumber,
        clientId: (newInvoice.clientId as any)._id.toString(),
        clientName: (newInvoice.clientId as any).name,
        clientEmail: (newInvoice.clientId as any).email,
        issueDate: formatDate(newInvoice.issueDate),
        dueDate: formatDate(newInvoice.dueDate),
        amount: newInvoice.amount,
        status: newInvoice.status,
        items: newInvoice.items.map((item) => ({
          description: item.description,
          amount: item.amount,
          expenseId: item.expenseId ? item.expenseId.toString() : undefined,
        })),
        notes: newInvoice.notes || '',
        createdAt: newInvoice.createdAt.toISOString(),
        updatedAt: newInvoice.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error creating invoice:", error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { error: "Validation error", message: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create invoice", message: error.message },
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
