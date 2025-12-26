import { Resend } from 'resend';
import * as fs from 'fs/promises';
import * as path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_for_build');

interface InvoiceEmailData {
  invoiceNumber: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  notes?: string;
}

interface ClientEmailData {
  name: string;
  email: string;
}

interface OrganizationEmailData {
  name: string;
  email?: string;
}

/**
 * Send invoice email to client with PDF attachment
 * @param invoice Invoice data
 * @param client Client data
 * @param organization Organization data
 * @param pdfPath Path to PDF file (relative to public directory)
 * @returns Resend email ID
 */
export async function sendInvoiceEmail(
  invoice: InvoiceEmailData,
  client: ClientEmailData,
  organization: OrganizationEmailData,
  pdfPath: string
): Promise<string> {
  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder_key_for_build') {
      throw new Error('RESEND_API_KEY is not configured. Please add it to your .env file to enable email sending.');
    }

    // Read PDF file as base64
    const fullPath = path.join(process.cwd(), 'public', pdfPath);
    const pdfBuffer = await fs.readFile(fullPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Prepare email content
    const subject = `Invoice ${invoice.invoiceNumber} from ${organization.name}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #0891b2;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f8fafc;
      padding: 30px;
      border: 1px solid #e2e8f0;
    }
    .invoice-details {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-label {
      font-weight: bold;
      color: #64748b;
    }
    .detail-value {
      color: #1e293b;
    }
    .amount {
      font-size: 24px;
      font-weight: bold;
      color: #0891b2;
    }
    .notes {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #64748b;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${organization.name}</h1>
      <p>Invoice ${invoice.invoiceNumber}</p>
    </div>

    <div class="content">
      <p>Dear ${client.name},</p>

      <p>Please find attached invoice <strong>${invoice.invoiceNumber}</strong> for your review.</p>

      <div class="invoice-details">
        <div class="detail-row">
          <span class="detail-label">Invoice Number:</span>
          <span class="detail-value">${invoice.invoiceNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Issue Date:</span>
          <span class="detail-value">${invoice.issueDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Due Date:</span>
          <span class="detail-value">${invoice.dueDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Amount:</span>
          <span class="amount">₹${invoice.amount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      ${invoice.notes ? `
      <div class="notes">
        <strong>Note:</strong><br/>
        ${invoice.notes}
      </div>
      ` : ''}

      <p>Please process the payment by the due date. If you have any questions regarding this invoice, please don't hesitate to contact us.</p>

      <p>Thank you for your business!</p>

      <p>Best regards,<br/>
      <strong>${organization.name}</strong></p>
    </div>

    <div class="footer">
      <p>This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version
    const textContent = `
Dear ${client.name},

Please find attached invoice ${invoice.invoiceNumber} for your review.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Issue Date: ${invoice.issueDate}
- Due Date: ${invoice.dueDate}
- Total Amount: ₹${invoice.amount.toLocaleString('en-IN')}

${invoice.notes ? `Note: ${invoice.notes}\n\n` : ''}
Please process the payment by the due date. If you have any questions regarding this invoice, please don't hesitate to contact us.

Thank you for your business!

Best regards,
${organization.name}
    `;

    // Determine sender email address
    const fromEmail = process.env.EMAIL_FROM_INVOICES || `invoices@${process.env.EMAIL_DOMAIN || 'niravana.in'}`;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: `${organization.name} <${fromEmail}>`,
      to: client.email,
      subject,
      html: htmlContent,
      text: textContent,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message || JSON.stringify(error)}`);
    }

    if (!data || !data.id) {
      throw new Error('No email ID returned from Resend');
    }

    return data.id;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw new Error(`Failed to send invoice email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
