const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.enabled = false;
    this.from = process.env.EMAIL_FROM || 'AgroLens <no-reply@agrolens.app>';
    this.init();
  }

  init() {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    if (!host || !port || !user || !pass) {
      console.warn('[EmailService] SMTP not configured. Email features disabled. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS to enable.');
      this.enabled = false;
      this.transporter = null;
      return;
    }
    try {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false },
      });
      this.enabled = true;
      console.log('[EmailService] SMTP configured and enabled.');
    } catch (e) {
      console.error('[EmailService] Failed to initialize transporter:', e.message);
      this.enabled = false;
      this.transporter = null;
    }
  }

  async sendMail(options) {
    if (!this.enabled || !this.transporter) {
      console.warn('[EmailService] Emails disabled. Would have sent:', JSON.stringify(options, null, 2));
      return { sent: false, skipped: true, reason: 'SMTP not configured' };
    }
    try {
      const info = await this.transporter.sendMail({
        from: options.from || this.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || undefined,
        attachments: options.attachments || undefined,
      });
      console.log(`[EmailService] Sent to ${options.to}: ${info.messageId}`);
      return { sent: true, messageId: info.messageId, skipped: false };
    } catch (e) {
      console.error('[EmailService] Send failed:', e.message);
      return { sent: false, skipped: false, error: e.message };
    }
  }

  async sendPasswordReset(userEmail, userName, resetToken, resetUrl) {
    const subject = 'AgroLens - Password Reset Request';
    const text =
      `Hi ${userName || 'Farmer'},\n\n` +
      `You requested a password reset for your AgroLens account.\n\n` +
      `Reset Token:\n${resetToken}\n\n` +
      `Or click this link (if your client supports it):\n${resetUrl}\n\n` +
      `This token expires in 60 minutes.\n\n` +
      `If you did not request this, you can safely ignore this email.\n\n` +
      `The AgroLens Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <div style="padding: 24px; background: #e8f5e9; border-top: 4px solid #2e7d32;">
          <h2 style="margin: 0; color: #1a3a2a;">AgroLens Password Reset</h2>
        </div>
        <div style="padding: 24px; background: #fff;">
          <p>Hi ${userName || 'Farmer'},</p>
          <p>You requested a password reset for your AgroLens account.</p>
          <div style="background: #f5f9f5; border-left: 4px solid #2e7d32; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-weight: bold;">Reset Token:</p>
            <code style="background: #1a3a2a; color: #fff; padding: 6px 10px; border-radius: 6px; display: inline-block; letter-spacing: 1px;">${resetToken}</code>
          </div>
          <p>If you have a reset password screen open, copy and paste the token above and choose a new password.</p>
          <p style="color: #555; font-size: 13px;">This token expires in 60 minutes. If you did not request this, ignore this email.</p>
        </div>
        <div style="padding: 16px 24px; background: #f5f9f5; color: #5a7a6a; font-size: 12px; text-align: center;">
          AgroLens - Detect, Diagnose, Defend
        </div>
      </div>
    `;
    return this.sendMail({ to: userEmail, subject, text, html });
  }

  async sendWelcome(userEmail, userName) {
    const subject = 'Welcome to AgroLens!';
    const text =
      `Hi ${userName || 'Farmer'},\n\n` +
      `Welcome to AgroLens, your tomato leaf disease detection assistant.\n\n` +
      `Start by scanning a tomato leaf and get instant results with actionable treatments.\n\n` +
      `Thank you for joining us!\nThe AgroLens Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <div style="padding: 24px; background: #e8f5e9; border-top: 4px solid #2e7d32;">
          <h2 style="margin: 0; color: #1a3a2a;">Welcome to AgroLens!</h2>
        </div>
        <div style="padding: 24px; background: #fff;">
          <p>Hi ${userName || 'Farmer'},</p>
          <p>Thank you for creating an AgroLens account.</p>
          <p>Scan a tomato leaf to instantly detect diseases and get treatment guidance powered by machine learning.</p>
          <p>Happy farming!</p>
          <p style="color: #2e7d32; font-weight: bold;">The AgroLens Team</p>
        </div>
      </div>
    `;
    return this.sendMail({ to: userEmail, subject, text, html });
  }
}

module.exports = new EmailService();
