import nodemailer from 'nodemailer';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('EmailService');

class EmailService {
  constructor() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      logger.warn('Email service not configured - check EMAIL_USER and EMAIL_PASSWORD');
      this.transporter = null;
    } else {
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email, verificationLink) {
    if (!this.transporter) {
      logger.warn('Email service not configured, skipping verification email');
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'MeterFlow - Verify Your Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to MeterFlow</h1>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
              Verify Email
            </a>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">
              If you didn't sign up for MeterFlow, please ignore this email.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.success(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(email, invoiceData, pdfBuffer) {
    if (!this.transporter) {
      logger.warn('Email service not configured, skipping invoice email');
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `MeterFlow Invoice - ${invoiceData.invoiceNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Invoice #${invoiceData.invoiceNumber}</h1>
            <p>Hello ${invoiceData.userName},</p>
            <p>Please find your invoice attached below:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Description</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Amount</th>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 10px;">API Requests</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">$${invoiceData.amount.toFixed(2)}</td>
              </tr>
            </table>

            <h3 style="color: #333;">Total: $${invoiceData.amount.toFixed(2)}</h3>
            <p style="color: #666; margin-top: 20px;">
              Billing Period: ${invoiceData.startDate} to ${invoiceData.endDate}
            </p>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">
              Please review the attached PDF for detailed information about your usage and billing.
            </p>
          </div>
        `,
        attachments: [
          {
            filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      await this.transporter.sendMail(mailOptions);
      logger.success(`Invoice email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send invoice email to ${email}`, error);
      throw error;
    }
  }

  /**
   * Send rate limit warning email
   */
  async sendRateLimitWarning(email, userName, apiName, currentUsage, limit) {
    if (!this.transporter) {
      logger.warn('Email service not configured, skipping rate limit warning');
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'MeterFlow - Rate Limit Warning',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ff6b6b;">Rate Limit Warning</h1>
            <p>Hello ${userName},</p>
            <p>Your API "${apiName}" has reached <strong>${((currentUsage/limit)*100).toFixed(1)}%</strong> of its rate limit.</p>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p><strong>Current Usage:</strong> ${currentUsage.toLocaleString()} requests</p>
              <p><strong>Limit:</strong> ${limit.toLocaleString()} requests</p>
            </div>

            <p>Please consider upgrading your plan to avoid service interruption.</p>
            <a href="${process.env.APP_URL}/billing" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
              View Billing Plans
            </a>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.success(`Rate limit warning sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send rate limit warning to ${email}`, error);
      throw error;
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(email, userName, amount, invoiceId) {
    if (!this.transporter) {
      logger.warn('Email service not configured, skipping payment confirmation');
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'MeterFlow - Payment Confirmation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #28a745;">Payment Received</h1>
            <p>Hello ${userName},</p>
            <p>We have successfully received your payment of <strong>$${amount.toFixed(2)}</strong>.</p>
            
            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
              <p><strong>Invoice ID:</strong> ${invoiceId}</p>
              <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p>Thank you for your business!</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.success(`Payment confirmation sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send payment confirmation to ${email}`, error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetLink) {
    if (!this.transporter) {
      logger.warn('Email service not configured, skipping password reset email');
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'MeterFlow - Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Password Reset Request</h1>
            <p>We received a request to reset your password. Click the link below to proceed:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.success(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${email}`, error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    try {
      await this.transporter.verify();
      logger.success('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', error);
      throw error;
    }
  }
}

export default new EmailService();
