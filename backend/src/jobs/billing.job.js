import cron from 'node-cron';
import prisma from '../config/db.js';
import { invoicesService } from '../modules/invoices/invoices.service.js';

/**
 * Scan for subscriptions that are due for billing and generate invoices idempotently
 */
export const runDueSubscriptionsBilling = async () => {
  console.log('[Billing Job] Starting scheduled scan for due subscriptions...');
  try {
    const now = new Date();
    // Subscriptions that are ACTIVE, autoRenew = true, and currentPeriodEnd <= now
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        autoRenew: true,
        currentPeriodEnd: { lte: now },
      },
      include: { customer: true, items: true },
    });

    console.log(`[Billing Job] Found ${dueSubscriptions.length} due subscriptions.`);

    let generatedCount = 0;
    for (const sub of dueSubscriptions) {
      try {
        const result = await invoicesService.generateFromSubscription(sub.id, { id: 'system', role: 'SYSTEM' });
        if (!result.alreadyGenerated) {
          generatedCount++;
        }
      } catch (err) {
        console.error(`[Billing Job] Error billing subscription ${sub.subscriptionNumber}:`, err.message);
      }
    }

    console.log(`[Billing Job] Finished scan. Generated ${generatedCount} new invoices.`);
  } catch (error) {
    console.error('[Billing Job] Failed to run billing scan:', error.message);
  }
};

/**
 * Initialize billing cron job (Runs daily at midnight by default: 0 0 * * *)
 */
export const initBillingJob = () => {
  // Run daily at midnight
  cron.schedule('0 0 * * *', () => {
    runDueSubscriptionsBilling();
  });
  console.log('[Billing Job] Recurring billing job initialized (0 0 * * *)');
};
