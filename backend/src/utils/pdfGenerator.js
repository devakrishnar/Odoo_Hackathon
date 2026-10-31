import PDFDocument from 'pdfkit';

/**
 * Generates an invoice PDF stream
 * @param {Object} invoice - Invoice object with customer, items, and totals
 * @param {import('express').Response} res - Express response stream
 */
export const generateInvoicePDF = (invoice, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Stream directly to response
  doc.pipe(res);

  // Header / Branding
  doc
    .fillColor('#0f172a')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('Brightloop Software', 50, 50)
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#64748b')
    .text('Subscription Billing & SaaS Management', 50, 80)
    .text('support@brightloop.io | www.brightloop.io', 50, 95);

  // Invoice Title & Meta
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor('#059669') // Emerald primary
    .text('INVOICE', 400, 50, { align: 'right' })
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#334155')
    .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 75, { align: 'right' })
    .text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 400, 90, { align: 'right' })
    .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 105, { align: 'right' })
    .text(`Status: ${invoice.status}`, 400, 120, { align: 'right' });

  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, 145).lineTo(550, 145).stroke();

  // Customer Details
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text('Billed To:', 50, 160)
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#334155')
    .text(invoice.customer?.name || 'Valued Customer', 50, 178)
    .text(invoice.customer?.companyName || '', 50, 192)
    .text(invoice.customer?.email || '', 50, 206)
    .text(invoice.customer?.address || '', 50, 220);

  // Billing Period
  if (invoice.billingPeriodStart && invoice.billingPeriodEnd) {
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#475569')
      .text('Billing Period:', 350, 160)
      .font('Helvetica')
      .text(
        `${new Date(invoice.billingPeriodStart).toLocaleDateString()} - ${new Date(
          invoice.billingPeriodEnd
        ).toLocaleDateString()}`,
        350,
        178
      );
  }

  // Items Table Header
  const tableTop = 260;
  doc
    .rect(50, tableTop, 500, 24)
    .fill('#f8fafc')
    .stroke('#e2e8f0');

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#475569')
    .text('DESCRIPTION / PLAN', 60, tableTop + 7)
    .text('QTY', 300, tableTop + 7, { width: 40, align: 'center' })
    .text('UNIT PRICE', 350, tableTop + 7, { width: 70, align: 'right' })
    .text('TAX', 425, tableTop + 7, { width: 40, align: 'right' })
    .text('TOTAL', 475, tableTop + 7, { width: 65, align: 'right' });

  // Items rows
  let currentY = tableTop + 28;
  const items = invoice.items || [];

  items.forEach((item) => {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#1e293b')
      .text(item.description || item.plan?.name || 'Service Plan', 60, currentY, { width: 230 })
      .text(String(item.quantity || 1), 300, currentY, { width: 40, align: 'center' })
      .text(`$${Number(item.unitPrice).toFixed(2)}`, 350, currentY, { width: 70, align: 'right' })
      .text(`${Number(item.taxPercent || 0)}%`, 425, currentY, { width: 40, align: 'right' })
      .text(`$${Number(item.lineTotal).toFixed(2)}`, 475, currentY, { width: 65, align: 'right' });

    currentY += 24;
    doc.strokeColor('#f1f5f9').lineWidth(0.5).moveTo(50, currentY - 4).lineTo(550, currentY - 4).stroke();
  });

  // Summary / Totals
  const summaryTop = Math.max(currentY + 20, 380);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#64748b')
    .text('Subtotal:', 350, summaryTop)
    .text(`$${Number(invoice.subtotal).toFixed(2)}`, 450, summaryTop, { width: 90, align: 'right' });

  if (Number(invoice.discountAmount) > 0) {
    doc
      .text('Discount:', 350, summaryTop + 18)
      .text(`-$${Number(invoice.discountAmount).toFixed(2)}`, 450, summaryTop + 18, { width: 90, align: 'right' });
  }

  doc
    .text('Tax:', 350, summaryTop + 36)
    .text(`+$${Number(invoice.taxAmount).toFixed(2)}`, 450, summaryTop + 36, { width: 90, align: 'right' });

  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(350, summaryTop + 54).lineTo(540, summaryTop + 54).stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#0f172a')
    .text('Total Amount:', 350, summaryTop + 62)
    .text(`$${Number(invoice.totalAmount).toFixed(2)}`, 450, summaryTop + 62, { width: 90, align: 'right' });

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#059669')
    .text('Paid Amount:', 350, summaryTop + 82)
    .text(`$${Number(invoice.paidAmount).toFixed(2)}`, 450, summaryTop + 82, { width: 90, align: 'right' });

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(Number(invoice.balanceAmount) > 0 ? '#dc2626' : '#059669')
    .text('Balance Due:', 350, summaryTop + 100)
    .text(`$${Number(invoice.balanceAmount).toFixed(2)}`, 450, summaryTop + 100, { width: 90, align: 'right' });

  // Footer
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text('Thank you for choosing Brightloop Software. Payment terms: Due upon receipt.', 50, 700, {
      align: 'center',
      width: 500,
    });

  doc.end();
};
