import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Client, OrganizationMember, Invoice, Expense } from "@/lib/models";
import mongoose from "mongoose";

/**
 * GET /api/clients/[id]
 * Fetch a single client
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

    // Fetch client
    const client = await Client.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: membership.organizationId,
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      client: {
        id: client._id.toString(),
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        address: client.address || '',
        gstin: client.gstin || '',
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/clients/[id]
 * Update a client
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

    // Find client
    const client = await Client.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: membership.organizationId,
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, phone, address, gstin } = body;

    // Update fields
    if (name !== undefined) client.name = name;
    if (email !== undefined) client.email = email.toLowerCase();
    if (phone !== undefined) client.phone = phone || undefined;
    if (address !== undefined) client.address = address || undefined;
    if (gstin !== undefined) client.gstin = gstin ? gstin.toUpperCase() : undefined;

    await client.save();

    return NextResponse.json({
      success: true,
      client: {
        id: client._id.toString(),
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        address: client.address || '',
        gstin: client.gstin || '',
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error updating client:", error);

    // Handle duplicate client name error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A client with this name already exists in your organization" },
        { status: 409 }
      );
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { error: "Validation error", message: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update client", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]
 * Delete a client
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

    // Find client
    const client = await Client.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: membership.organizationId,
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if client has any invoices or expenses
    const invoiceCount = await Invoice.countDocuments({ clientId: client._id });
    const expenseCount = await Expense.countDocuments({ clientId: client._id });

    if (invoiceCount > 0 || expenseCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete client with existing invoices or expenses",
          message: `This client has ${invoiceCount} invoice(s) and ${expenseCount} expense(s). Please remove these first.`
        },
        { status: 409 }
      );
    }

    // Delete client
    await Client.deleteOne({ _id: client._id });

    return NextResponse.json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client", message: error.message },
      { status: 500 }
    );
  }
}
