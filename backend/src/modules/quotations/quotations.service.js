import prisma from '../../config/db.js';
import { generateQuotationNumber } from '../../utils/invoiceNumber.js';

export const quotationsService = {
  /**
   * List quotations with role-based filtering
   */
  async listQuotations(user, query = {}) {
    const where = {};
    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: user.id } });
      where.customerId = customer ? customer.id : 'none';
    } else if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    return prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        items: {
          include: { plan: { include: { product: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get single quotation by ID
   */
  async getQuotationById(id, user) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        items: {
          include: { plan: { include: { product: true } } },
        },
      },
    });

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({ where: { userId: user.id } });
      if (!customer || quotation.customerId !== customer.id) {
        throw new Error('Unauthorized to view this quotation');
      }
    }

    return quotation;
  },

  /**
   * Create a new quotation with calculations
   */
  async createQuotation(userId, data) {
    const {
      customerId,
      validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
      items = [],
      notes,
      terms,
      discountCode,
    } = data;

    if (!customerId) {
      throw new Error('Customer is required');
    }

    if (!items || items.length === 0) {
      throw new Error('Quotation must contain at least one line item');
    }

    // Process line items & fetch plan prices
    let subtotal = 0;
    let totalTax = 0;
    const processedItems = [];

    for (const item of items) {
      const plan = await prisma.plan.findUnique({
        where: { id: item.planId },
        include: { product: true },
      });

      if (!plan) {
        throw new Error(`Plan with ID ${item.planId} not found`);
      }

      const quantity = Math.max(1, parseInt(item.quantity || 1, 10));
      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : Number(plan.price);
      const taxPercent = Number(item.taxPercent || 0);
      const discountPercent = Number(item.discountPercent || 0);

      const rawLineTotal = quantity * unitPrice;
      const lineDiscount = rawLineTotal * (discountPercent / 100);
      const taxableLineAmount = rawLineTotal - lineDiscount;
      const lineTax = taxableLineAmount * (taxPercent / 100);
      const finalLineTotal = taxableLineAmount + lineTax;

      subtotal += rawLineTotal;
      totalTax += lineTax;

      processedItems.push({
        planId: plan.id,
        description: item.description || `${plan.product?.name || 'Software'} - ${plan.name}`,
        quantity,
        unitPrice,
        taxPercent,
        discountPercent,
        lineTotal: Number(finalLineTotal.toFixed(2)),
      });
    }

    // Apply global discount if provided
    let discountAmount = 0;
    if (discountCode) {
      const discount = await prisma.discount.findUnique({
        where: { code: discountCode },
      });
      if (discount && discount.active) {
        if (discount.type === 'PERCENTAGE') {
          discountAmount = (subtotal * Number(discount.value)) / 100;
        } else {
          discountAmount = Number(discount.value);
        }
        if (discount.maxDiscountAmount && discountAmount > Number(discount.maxDiscountAmount)) {
          discountAmount = Number(discount.maxDiscountAmount);
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount + totalTax);
    const quotationNumber = generateQuotationNumber();

    return prisma.quotation.create({
      data: {
        quotationNumber,
        customerId,
        createdById: userId,
        status: data.status || 'DRAFT',
        validUntil: new Date(validUntil),
        subtotal: Number(subtotal.toFixed(2)),
        taxAmount: Number(totalTax.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        currency: 'USD',
        notes,
        terms,
        items: {
          create: processedItems,
        },
      },
      include: {
        customer: true,
        items: { include: { plan: true } },
      },
    });
  },

  /**
   * Update quotation status (e.g. DRAFT -> SENT -> ACCEPTED / REJECTED)
   */
  async updateStatus(id, status, user) {
    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    const allowedStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED'];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    return prisma.quotation.update({
      where: { id },
      data: { status },
      include: { customer: true, items: true },
    });
  },
};
