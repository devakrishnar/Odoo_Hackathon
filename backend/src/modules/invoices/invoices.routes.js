import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { invoicesService } from './invoices.service.js';
import { generateInvoicePDF } from '../../utils/pdfGenerator.js';

const router = Router();

// GET all invoices (role-aware: customers see their own, staff/admin see all)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const invoices = await invoicesService.listInvoices(req.user, req.query);
    return successResponse(res, 'Invoices retrieved successfully', { invoices });
  } catch (err) {
    next(err);
  }
});

// GET single invoice by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const invoice = await invoicesService.getInvoiceById(req.params.id, req.user);
    return successResponse(res, 'Invoice details retrieved', { invoice });
  } catch (err) {
    return errorResponse(res, err.message, [], 404);
  }
});

// GET PDF of an invoice
router.get('/:id/pdf', authenticateToken, async (req, res, next) => {
  try {
    const invoice = await invoicesService.getInvoiceById(req.params.id, req.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`
    );

    generateInvoicePDF(invoice, res);
  } catch (err) {
    return errorResponse(res, err.message, [], 404);
  }
});

// POST generate invoice from due subscription
router.post('/generate', authenticateToken, async (req, res, next) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return errorResponse(res, 'subscriptionId is required to generate invoice', [], 400);
    }

    const result = await invoicesService.generateFromSubscription(subscriptionId, req.user);
    return successResponse(res, result.message, { invoice: result.invoice, alreadyGenerated: result.alreadyGenerated }, 201);
  } catch (err) {
    return errorResponse(res, err.message, [], 400);
  }
});

// PATCH invoice status
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const invoice = await invoicesService.updateStatus(req.params.id, status, req.user);
    return successResponse(res, `Invoice marked as ${status}`, { invoice });
  } catch (err) {
    return errorResponse(res, err.message, [], 400);
  }
});

export default router;
