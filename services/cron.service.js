const db = require('../config/db');
const { sendToEasyClient } = require('./easyClient.service');
const Store = require('../models/Store');

// Run every hour
const INTERVAL = 60 * 60 * 1000;
// Checkouts created between 1 to 24 hours ago
const MIN_HOURS = 1;
const MAX_HOURS = 24;

async function checkAbandonedCarts() {
  console.log('Running abandoned cart check...');
  try {
    const stores = await Store.findAll();
    for (const store of stores) {
      if (!store.is_active) continue;

      // Find checkouts from the last 1-24 hours
      // In a real app we'd parse the token specifically, but here payload contains checkout token
      const [checkouts] = await db.query(
        `SELECT * FROM logs 
         WHERE shop_domain = ? 
         AND event_type = 'checkout_created'
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
         AND created_at <= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
        [store.shop_domain, MAX_HOURS, MIN_HOURS]
      );

      for (const checkoutLog of checkouts) {
        const payload = typeof checkoutLog.payload === 'string' 
            ? JSON.parse(checkoutLog.payload) 
            : checkoutLog.payload;

        const email = payload.customer?.email || payload.email;
        if (!email) continue;

        // Has this customer made an order since this checkout?
        const [orders] = await db.query(
          `SELECT id FROM orders 
           WHERE shop_domain = ? 
           AND customer_email = ? 
           AND created_at >= ?`,
          [store.shop_domain, email, checkoutLog.created_at]
        );

        // Also check if we already sent a reminder (we log it as abandoned_cart_reminder)
        const [reminders] = await db.query(
          `SELECT id FROM logs 
           WHERE shop_domain = ? 
           AND event_type = 'abandoned_cart_reminder'
           AND JSON_EXTRACT(payload, '$.checkoutId') = ?`,
          [store.shop_domain, payload.token]
        );

        if (orders.length === 0 && reminders.length === 0) {
          // It's abandoned and we haven't reminded them!
          const { extractCheckoutPayload } = require('./webhook.service');
          const data = extractCheckoutPayload(payload, store.shop_domain);

          await sendToEasyClient(store.shop_domain, {
            ...data.easyClientPayload,
            event: 'abandoned_cart_reminder',
          });
        }
      }
    }
  } catch (err) {
    console.error('Abandoned cart cron error:', err.message);
  }
}

function startCron() {
  setInterval(checkAbandonedCarts, INTERVAL);
  console.log('Abandoned Cart Recovery cron started.');
}

module.exports = { startCron, checkAbandonedCarts };
