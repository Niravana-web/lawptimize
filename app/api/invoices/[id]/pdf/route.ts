import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Invoice, OrganizationMember, Organization } from "@/lib/models";
import { generateInvoicePDF } from "@/lib/pdf/generate-invoice-pdf";
import mongoose from "mongoose";
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * GET /api/invoices/[id]/pdf
 * Generate or retrieve PDF for an invoice
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

    // Fetch invoice with client data
    const invoice = await Invoice.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: membership.organizationId,
    }).populate('clientId');

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Fetch organization data
    const organization = await Organization.findById(membership.organizationId);

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const client = invoice.clientId as any;

    // Always generate fresh PDF (we delete PDFs after email send to save storage)
    const pdfPath = await generateInvoicePDF(
      {
        invoiceNumber: invoice.invoiceNumber,
        issueDate: formatDate(invoice.issueDate),
        dueDate: formatDate(invoice.dueDate),
        amount: invoice.amount,
        status: invoice.status,
        items: invoice.items.map((item) => ({
          description: item.description,
          amount: item.amount,
        })),
        notes: invoice.notes,
      },
      {
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        gstin: client.gstin,
      },
      {
        name: organization.name,
        address: organization.address,
        email: organization.email,
        phone: organization.phone,
      }
    );

    // Read PDF file
    const fullPath = path.join(process.cwd(), 'public', pdfPath);
    const pdfBuffer = await fs.readFile(fullPath);

    // Delete PDF file after reading to save storage
    try {
      await fs.unlink(fullPath);
      console.log(`Deleted temporary PDF file: ${pdfPath}`);
    } catch (deleteError) {
      // Log error but don't fail the request - user got their PDF
      console.error(`Failed to delete temporary PDF file ${pdfPath}:`, deleteError);
    }

    // Return PDF file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating/fetching PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate/fetch PDF", message: error.message },
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
