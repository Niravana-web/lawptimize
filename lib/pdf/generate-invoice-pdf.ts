import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceTemplate } from './invoice-template';
import * as fs from 'fs/promises';
import * as path from 'path';

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  notes?: string;
}

interface ClientData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  gstin?: string;
}

interface OrganizationData {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

/**
 * Generate PDF for an invoice and save it to the filesystem
 * @param invoice Invoice data
 * @param client Client data
 * @param organization Organization data
 * @returns Path to the generated PDF file (relative to public directory)
 */
export async function generateInvoicePDF(
  invoice: InvoiceData,
  client: ClientData,
  organization: OrganizationData
): Promise<string> {
  try {
    // Render the PDF template to a buffer
    const pdfBuffer = await renderToBuffer(
      InvoiceTemplate({
        invoice,
        client,
        organization,
      })
    );

    // Ensure invoices directory exists
    const invoicesDir = path.join(process.cwd(), 'public', 'invoices');
    await fs.mkdir(invoicesDir, { recursive: true });

    // Generate filename: {invoiceNumber}.pdf
    const filename = `${invoice.invoiceNumber}.pdf`;
    const filePath = path.join(invoicesDir, filename);

    // Write PDF buffer to file
    await fs.writeFile(filePath, pdfBuffer);

    // Return relative path (for storing in database)
    const relativePath = `/invoices/${filename}`;

    return relativePath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a PDF file from the filesystem
 * @param pdfUrl Path to the PDF file (relative to public directory)
 */
export async function deleteInvoicePDF(pdfUrl: string): Promise<void> {
  try {
    if (!pdfUrl) return;

    const filePath = path.join(process.cwd(), 'public', pdfUrl);
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore errors if file doesn't exist
    console.warn('Failed to delete PDF file:', error);
  }
}
