/**
 * Generates formatted document numbers with timestamps and random sequences
 * Examples: QT-202610-A1B2, SUB-202610-C3D4, INV-202610-E5F6
 */

export const generateQuotationNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `QT-${dateStr}-${rand}`;
};

export const generateSubscriptionNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SUB-${dateStr}-${rand}`;
};

export const generateInvoiceNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${dateStr}-${rand}`;
};

export const generatePaymentNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY-${dateStr}-${rand}`;
};
