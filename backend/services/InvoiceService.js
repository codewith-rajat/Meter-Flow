import PDFDocument from 'pdfkit';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('InvoiceService');

class InvoiceService {
  /**
   * Generate PDF invoice
   */
  generateInvoicePDF(invoiceData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        let pdfData = Buffer.alloc(0);

        doc.on('data', (chunk) => {
          pdfData = Buffer.concat([pdfData, chunk]);
        });

        doc.on('end', () => {
          logger.success(`Invoice PDF generated: ${invoiceData.invoiceNumber}`);
          resolve(pdfData);
        });

        doc.on('error', (error) => {
          logger.error('Error generating PDF', error);
          reject(error);
        });

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'left' });
        doc.fontSize(10).font('Helvetica').text(`Invoice #${invoiceData.invoiceNumber}`, { align: 'left' });
        doc.moveDown(0.5);

        // Company info (right side)
        doc.fontSize(12).font('Helvetica-Bold').text('MeterFlow', 550, 80);
        doc.fontSize(10).font('Helvetica');
        doc.text('API Billing Platform', 550, 100, { align: 'right' });
        doc.text(process.env.APP_URL || 'https://meterflow.io', 550, 115, { align: 'right' });

        // Bill To
        doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 180);
        doc.fontSize(10).font('Helvetica');
        doc.text(invoiceData.userName, 50, 200);
        doc.text(invoiceData.userEmail, 50, 215);

        // Invoice details (right side)
        const detailsX = 350;
        const detailsY = 180;
        doc.fontSize(10).font('Helvetica');
        doc.text('Issue Date:', detailsX, detailsY);
        doc.text(new Date(invoiceData.issuedAt).toLocaleDateString(), detailsX + 100, detailsY);

        doc.text('Due Date:', detailsX, detailsY + 20);
        doc.text(new Date(invoiceData.dueAt).toLocaleDateString(), detailsX + 100, detailsY + 20);

        doc.text('Status:', detailsX, detailsY + 40);
        doc.text(invoiceData.status.toUpperCase(), detailsX + 100, detailsY + 40);

        // Invoice items table
        doc.moveDown(2);
        const tableY = doc.y;

        // Table header
        doc.rect(50, tableY, 495, 25).fill('#f5f5f5');
        doc.fillColor('#000');
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('Description', 60, tableY + 7, { width: 250 });
        doc.text('Quantity', 320, tableY + 7, { width: 80, align: 'center' });
        doc.text('Unit Price', 410, tableY + 7, { width: 80, align: 'right' });
        doc.text('Total', 480, tableY + 7, { width: 60, align: 'right' });

        // Table rows
        doc.fontSize(10).font('Helvetica');
        let currentY = tableY + 30;

        invoiceData.items.forEach((item) => {
          doc.text(item.description, 60, currentY, { width: 250 });
          doc.text(item.quantity.toString(), 320, currentY, { width: 80, align: 'center' });
          doc.text(`$${item.unitPrice.toFixed(2)}`, 410, currentY, { width: 80, align: 'right' });
          doc.text(`$${item.total.toFixed(2)}`, 480, currentY, { width: 60, align: 'right' });
          currentY += 25;
        });

        // Subtotal, tax, total
        const summaryX = 420;
        currentY += 10;

        doc.fontSize(10).font('Helvetica');
        doc.text('Subtotal:', summaryX, currentY);
        doc.text(`$${invoiceData.subtotal.toFixed(2)}`, summaryX + 80, currentY, { align: 'right' });

        currentY += 20;
        if (invoiceData.tax > 0) {
          doc.text('Tax:', summaryX, currentY);
          doc.text(`$${invoiceData.tax.toFixed(2)}`, summaryX + 80, currentY, { align: 'right' });
          currentY += 20;
        }

        // Total (bold, larger)
        doc.fontSize(12).font('Helvetica-Bold');
        doc.rect(summaryX - 5, currentY - 5, 160, 25).stroke('#007bff');
        doc.text('Total:', summaryX, currentY + 5);
        doc.text(`$${invoiceData.total.toFixed(2)}`, summaryX + 80, currentY + 5, { align: 'right' });

        // Payment details
        doc.moveDown(3);
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Payment Details');
        doc.fontSize(9).font('Helvetica');

        if (invoiceData.paymentMethod) {
          doc.text(`Payment Method: ${invoiceData.paymentMethod}`);
        }

        if (invoiceData.paidAt) {
          doc.text(`Paid On: ${new Date(invoiceData.paidAt).toLocaleDateString()}`);
        }

        // Notes/terms
        if (invoiceData.notes) {
          doc.moveDown(1);
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text('Notes');
          doc.fontSize(9).font('Helvetica');
          doc.text(invoiceData.notes, { width: 495 });
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica').fillColor('#666');
        doc.text(
          'Thank you for using MeterFlow!',
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
        doc.text(
          'Questions? Contact support@meterflow.io',
          50,
          doc.page.height - 35,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        logger.error('Failed to generate invoice PDF', error);
        reject(error);
      }
    });
  }

  /**
   * Format invoice data for PDF
   */
  formatInvoiceData(invoiceRecord, billingData) {
    return {
      invoiceNumber: invoiceRecord.invoiceNumber,
      issuedAt: invoiceRecord.issuedAt,
      dueAt: invoiceRecord.dueAt,
      status: invoiceRecord.status,
      userName: billingData.userName,
      userEmail: billingData.userEmail,
      items: billingData.items || [
        {
          description: 'API Requests',
          quantity: billingData.requestsUsed || 0,
          unitPrice: billingData.pricePerRequest || 0,
          total: billingData.amount || 0
        }
      ],
      subtotal: billingData.amount || 0,
      tax: billingData.tax || 0,
      total: (billingData.amount || 0) + (billingData.tax || 0),
      paymentMethod: invoiceRecord.paymentMethod || 'Pending',
      paidAt: invoiceRecord.paidAt || null,
      notes: 'This is an automated invoice generated by MeterFlow. For inquiries, please contact us.'
    };
  }
}

export default new InvoiceService();
