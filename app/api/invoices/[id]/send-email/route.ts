import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Invoice, OrganizationMember, Organization } from "@/lib/models";
import { generateInvoicePDF } from "@/lib/pdf/generate-invoice-pdf";
import { sendInvoiceEmail } from "@/lib/email/send-invoice";
import mongoose from "mongoose";
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * POST /api/invoices/[id]/send-email
 * Send invoice via email (generates PDF if needed, sends email, updates status to SENT)
 */
export async function POST(
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

    // Generate PDF if it doesn't exist
    let pdfPath = invoice.pdfUrl;

    if (!pdfPath) {
      pdfPath = await generateInvoicePDF(
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

      // Update invoice with PDF path
      invoice.pdfUrl = pdfPath;
    }

    // Send email with PDF attachment
    const emailId = await sendInvoiceEmail(
      {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        issueDate: formatDate(invoice.issueDate),
        dueDate: formatDate(invoice.dueDate),
        notes: invoice.notes,
      },
      {
        name: client.name,
        email: client.email,
      },
      {
        name: organization.name,
        email: organization.email,
      },
      pdfPath
    );

    // Delete PDF file after successful email send to save storage
    try {
      const fullPdfPath = path.join(process.cwd(), 'public', pdfPath);
      await fs.unlink(fullPdfPath);
      console.log(`Deleted PDF file: ${pdfPath}`);
    } catch (deleteError) {
      // Log error but don't fail the request - email was sent successfully
      console.error(`Failed to delete PDF file ${pdfPath}:`, deleteError);
    }

    // Update invoice status to SENT and set sentAt timestamp
    // Clear pdfUrl since file is deleted
    if (invoice.status === 'DRAFT') {
      invoice.status = 'SENT';
    }
    if (!invoice.sentAt) {
      invoice.sentAt = new Date();
    }
    invoice.pdfUrl = undefined; // Clear PDF URL since file is deleted

    await invoice.save();

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} sent successfully to ${client.email}`,
      emailId,
      invoice: {
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        sentAt: invoice.sentAt.toISOString(),
        pdfUrl: undefined,
      },
    });
  } catch (error: any) {
    console.error("Error sending invoice email:", error);

    // Provide more specific error messages
    if (error.message.includes('RESEND_API_KEY')) {
      return NextResponse.json(
        { error: "Email service not configured", message: "RESEND_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send invoice email", message: error.message },
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
