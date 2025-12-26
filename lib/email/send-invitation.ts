import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key_for_build');

interface InvitationEmailData {
  invitedEmail: string;
  organizationName: string;
  inviterName: string;
  inviteLink: string;
}

/**
 * Send team invitation email
 * @param data Invitation data
 * @returns Resend email ID
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<string> {
  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder_key_for_build') {
      throw new Error('RESEND_API_KEY is not configured. Please add it to your .env file to enable email sending.');
    }

    // Determine sender email address
    const fromEmail = process.env.EMAIL_FROM_NOREPLY || `noreply@${process.env.EMAIL_DOMAIN || 'niravana.in'}`;

    // Prepare email content
    const subject = `${data.inviterName} invited you to join ${data.organizationName} on Lawptimize`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 20px 0;
      font-size: 16px;
      line-height: 1.6;
    }
    .invitation-box {
      background-color: #f0f9ff;
      border-left: 4px solid #0891b2;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .invitation-box p {
      margin: 5px 0;
      font-size: 14px;
    }
    .invitation-box strong {
      color: #0891b2;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%);
    }
    .alternative-link {
      margin-top: 30px;
      padding: 20px;
      background-color: #f8fafc;
      border-radius: 4px;
      font-size: 13px;
      color: #64748b;
    }
    .alternative-link p {
      margin: 5px 0;
    }
    .alternative-link a {
      color: #0891b2;
      word-break: break-all;
    }
    .footer {
      text-align: center;
      padding: 30px;
      background-color: #f8fafc;
      color: #64748b;
      font-size: 14px;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 You're Invited!</h1>
      <p>Join your team on Lawptimize</p>
    </div>

    <div class="content">
      <p>Hello,</p>

      <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> on Lawptimize, a comprehensive legal practice management platform.</p>

      <div class="invitation-box">
        <p><strong>Organization:</strong> ${data.organizationName}</p>
        <p><strong>Invited by:</strong> ${data.inviterName}</p>
        <p><strong>Role:</strong> Team Member</p>
      </div>

      <p>As a team member, you'll be able to:</p>
      <ul style="margin: 20px 0; padding-left: 20px;">
        <li>Manage cases and clients</li>
        <li>Track tasks and deadlines</li>
        <li>Handle invoices and expenses</li>
        <li>Collaborate with your team</li>
      </ul>

      <div style="text-align: center;">
        <a href="${data.inviteLink}" class="cta-button">Accept Invitation</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
        This invitation link will remain active. Once you accept, you'll be able to access your organization's workspace immediately.
      </p>

      <div class="alternative-link">
        <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
        <p><a href="${data.inviteLink}">${data.inviteLink}</a></p>
      </div>
    </div>

    <div class="footer">
      <p><strong>Lawptimize</strong> - Legal Practice Management</p>
      <p>This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version
    const textContent = `
You're Invited to Join ${data.organizationName} on Lawptimize!

${data.inviterName} has invited you to join ${data.organizationName} on Lawptimize, a comprehensive legal practice management platform.

Organization: ${data.organizationName}
Invited by: ${data.inviterName}
Role: Team Member

As a team member, you'll be able to:
- Manage cases and clients
- Track tasks and deadlines
- Handle invoices and expenses
- Collaborate with your team

Accept your invitation by clicking this link:
${data.inviteLink}

This invitation link will remain active. Once you accept, you'll be able to access your organization's workspace immediately.

---
Lawptimize - Legal Practice Management
This is an automated email. Please do not reply directly to this message.
    `;

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: `Lawptimize <${fromEmail}>`,
      to: data.invitedEmail,
      subject,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message || JSON.stringify(error)}`);
    }

    if (!emailData || !emailData.id) {
      throw new Error('No email ID returned from Resend');
    }

    return emailData.id;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw new Error(`Failed to send invitation email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
