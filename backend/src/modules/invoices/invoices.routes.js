import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { authenticateToken } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../config/db.js';

const router = Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: req.user.id } });
      where.customerId = customer ? customer.id : 'none';
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 'Invoices retrieved successfully', { invoices });
  } catch (err) {
    next(err);
  }
});

// Generate invoice for a subscription (Step 5 of hackathon workflow)
router.post('/generate', authenticateToken, async (req, res, next) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return errorResponse(res, 'subscriptionId is required to generate invoice', [], 400);
    }

    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        customer: true,
        items: { include: { plan: { include: { product: true } } } },
      },
    });

    if (!sub) {
      return errorResponse(res, 'Subscription not found', [], 404);
    }

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: req.user.id } });
      if (!customer || sub.customerId !== customer.id) {
        return errorResponse(res, 'Forbidden: You cannot generate invoices for another customer.', [], 403);
      }
    }

    // Check for existing invoice for this period (Idempotency requirement)
    const existing = await prisma.invoice.findFirst({
      where: {
        subscriptionId: sub.id,
        billingPeriodStart: sub.currentPeriodStart,
        billingPeriodEnd: sub.currentPeriodEnd,
      },
    });

    if (existing) {
      return successResponse(res, 'Invoice already exists for this billing period', { invoice: existing });
    }

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: sub.customerId,
        subscriptionId: sub.id,
        status: 'ISSUED',
        issueDate: new Date(),
        dueDate,
        billingPeriodStart: sub.currentPeriodStart,
        billingPeriodEnd: sub.currentPeriodEnd,
        subtotal: sub.totalAmount,
        taxAmount: 0.0,
        discountAmount: 0.0,
        totalAmount: sub.totalAmount,
        paidAmount: 0.0,
        balanceAmount: sub.totalAmount,
        currency: sub.currency,
        notes: `Billing cycle invoice for subscription ${sub.subscriptionNumber}`,
        items: {
          create: sub.items.map((item) => ({
            planId: item.planId,
            description: `${item.plan?.product?.name || 'Product'} - ${item.plan?.name || 'Subscription Plan'}`,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    return successResponse(res, 'Invoice generated successfully', { invoice }, 201);
  } catch (err) {
    next(err);
  }
});


// Get Invoice Detail with ownership check
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: { include: { plan: true } },
        payments: true,
      },
    });

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', [], 404);
    }

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: req.user.id } });
      if (!customer || invoice.customerId !== customer.id) {
        return errorResponse(res, 'Forbidden: You can only view your own invoices.', [], 403);
      }
    }

    return successResponse(res, 'Invoice details retrieved successfully', { invoice });
  } catch (err) {
    next(err);
  }
});

// Generate and stream tax-compliant PDF invoice
router.get('/:id/pdf', authenticateToken, async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: { include: { plan: true } },
        payments: true,
      },
    });

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', [], 404);
    }

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: req.user.id } });
      if (!customer || invoice.customerId !== customer.id) {
        return errorResponse(res, 'Forbidden: You cannot download invoices belonging to other customers.', [], 403);
      }
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(22)
      .fillColor('#4338ca')
      .text('BRIGHTLOOP SOFTWARE', 50, 50, { bold: true })
      .fontSize(10)
      .fillColor('#64748b')
      .text('Subscription Billing & License Management', 50, 78)
      .text('support@brightloop.io | www.brightloop.io', 50, 92);

    doc
      .fontSize(16)
      .fillColor('#0f172a')
      .text('INVOICE', 400, 50, { align: 'right' })
      .fontSize(10)
      .fillColor('#475569')
      .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 72, { align: 'right' })
      .text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 400, 86, { align: 'right' })
      .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 100, { align: 'right' })
      .text(`Status: ${invoice.status}`, 400, 114, { align: 'right' });

    doc.moveTo(50, 135).lineTo(550, 135).strokeColor('#e2e8f0').stroke();

    // Bill To section
    doc
      .fontSize(11)
      .fillColor('#334155')
      .text('BILL TO:', 50, 150, { bold: true })
      .fontSize(10)
      .fillColor('#0f172a')
      .text(invoice.customer.name, 50, 166)
      .text(invoice.customer.companyName || 'Valued Customer', 50, 180)
      .text(invoice.customer.email, 50, 194)
      .text(invoice.customer.address || '', 50, 208);

    // Table Header
    const tableTop = 245;
    doc
      .rect(50, tableTop, 500, 24)
      .fill('#f1f5f9');

    doc
      .fontSize(9)
      .fillColor('#1e293b')
      .text('ITEM / PLAN', 60, tableTop + 7, { bold: true })
      .text('QTY', 290, tableTop + 7, { width: 40, align: 'center', bold: true })
      .text('UNIT PRICE', 340, tableTop + 7, { width: 70, align: 'right', bold: true })
      .text('TAX', 420, tableTop + 7, { width: 50, align: 'right', bold: true })
      .text('TOTAL', 480, tableTop + 7, { width: 60, align: 'right', bold: true });

    let currentY = tableTop + 30;

    (invoice.items || []).forEach((item) => {
      doc
        .fontSize(9)
        .fillColor('#334155')
        .text(item.description || item.plan?.name || 'Subscription License', 60, currentY, { width: 220 })
        .text(item.quantity.toString(), 290, currentY, { width: 40, align: 'center' })
        .text(`$${Number(item.unitPrice).toFixed(2)}`, 340, currentY, { width: 70, align: 'right' })
        .text(`${Number(item.taxPercent || 0)}%`, 420, currentY, { width: 50, align: 'right' })
        .text(`$${Number(item.lineTotal).toFixed(2)}`, 480, currentY, { width: 60, align: 'right' });

      currentY += 22;
    });

    doc.moveTo(50, currentY + 10).lineTo(550, currentY + 10).strokeColor('#e2e8f0').stroke();

    // Summary calculation block
    const summaryTop = currentY + 20;
    doc
      .fontSize(10)
      .fillColor('#64748b')
      .text('Subtotal:', 350, summaryTop, { width: 100, align: 'right' })
      .fillColor('#0f172a')
      .text(`$${Number(invoice.subtotal).toFixed(2)}`, 460, summaryTop, { width: 80, align: 'right' })

      .fillColor('#64748b')
      .text('Discount:', 350, summaryTop + 16, { width: 100, align: 'right' })
      .fillColor('#0f172a')
      .text(`-$${Number(invoice.discountAmount || 0).toFixed(2)}`, 460, summaryTop + 16, { width: 80, align: 'right' })

      .fillColor('#64748b')
      .text('Tax Amount:', 350, summaryTop + 32, { width: 100, align: 'right' })
      .fillColor('#0f172a')
      .text(`$${Number(invoice.taxAmount || 0).toFixed(2)}`, 460, summaryTop + 32, { width: 80, align: 'right' })

      .fontSize(11)
      .fillColor('#4338ca')
      .text('Total Amount:', 350, summaryTop + 52, { width: 100, align: 'right', bold: true })
      .text(`$${Number(invoice.totalAmount).toFixed(2)}`, 460, summaryTop + 52, { width: 80, align: 'right', bold: true })

      .fontSize(10)
      .fillColor('#16a34a')
      .text('Paid Amount:', 350, summaryTop + 72, { width: 100, align: 'right' })
      .text(`$${Number(invoice.paidAmount).toFixed(2)}`, 460, summaryTop + 72, { width: 80, align: 'right' })

      .fillColor('#dc2626')
      .text('Outstanding Balance:', 350, summaryTop + 90, { width: 100, align: 'right', bold: true })
      .text(`$${Number(invoice.balanceAmount).toFixed(2)}`, 460, summaryTop + 90, { width: 80, align: 'right', bold: true });

    // Payment notes and footer
    doc
      .fontSize(9)
      .fillColor('#94a3b8')
      .text('Payment Terms: Net 30 days from invoice issue date.', 50, 720)
      .text('Thank you for choosing Brightloop Software Subscription Services.', 50, 735);

    doc.end();
  } catch (err) {
    next(err);
  }
});

export default router;

