import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Client, OrganizationMember } from "@/lib/models";

/**
 * GET /api/clients
 * Fetch all clients for the user's organization
 */
export async function GET() {
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

    // Fetch clients for this organization
    const clients = await Client.find({
      organizationId: membership.organizationId,
    }).sort({ createdAt: -1 });

    // Transform for frontend
    const transformedClients = clients.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      email: c.email,
      phone: c.phone || '',
      address: c.address || '',
      gstin: c.gstin || '',
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      clients: transformedClients,
      count: transformedClients.length,
    });
  } catch (error: any) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients
 * Create a new client
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
    const { name, email, phone, address, gstin } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: name, email" },
        { status: 400 }
      );
    }

    // Create the client
    const newClient = await Client.create({
      organizationId: membership.organizationId,
      name,
      email: email.toLowerCase(),
      phone: phone || undefined,
      address: address || undefined,
      gstin: gstin ? gstin.toUpperCase() : undefined,
      createdBy: user.id,
    });

    return NextResponse.json({
      success: true,
      client: {
        id: newClient._id.toString(),
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone || '',
        address: newClient.address || '',
        gstin: newClient.gstin || '',
        createdAt: newClient.createdAt.toISOString(),
        updatedAt: newClient.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error creating client:", error);

    // Handle duplicate client name error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A client with this name already exists in your organization" },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return NextResponse.json(
        { error: "Validation error", message: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create client", message: error.message },
      { status: 500 }
    );
  }
}
