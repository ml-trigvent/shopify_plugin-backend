const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Store = require('./models/Store');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS — allow React frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// JSON body parser with raw body capture for Shopify webhooks
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// Health check & Automatic Webhook Sync
app.get('/', async (req, res) => {
  let { shop } = req.query;

  if (shop) {
    // Normalize: remove trailing dot and add .myshopify.com if missing
    shop = shop.replace(/\.$/, '');
    if (!shop.includes('.')) {
      shop = `${shop}.myshopify.com`;
    }
  }

  console.log('Incoming request to root / with normalized shop:', shop);

  if (shop) {
    try {
      const store = await Store.findByDomain(shop);
      if (store && store.access_token) {
        console.log(`Syncing webhooks for ${shop}...`);
        await require('./services/shopify.service').registerWebhooks(shop, store.access_token);
      } else {
        console.warn(`Shop ${shop} found in request but not in database!`);
      }
    } catch (err) {
      console.error('Webhook sync failed on load:', err.message);
    }
  }

  res.json({
    status: 'ok',
    message: 'Shopify Easy Client Plugin API',
    version: '1.0.0',
    synced_shop: shop || 'none'
  });
});

// Temporary: Admin endpoint to delete + re-register all webhooks to Render
app.post('/admin/re-register-webhooks', async (req, res) => {
  const { shop, renderUrl } = req.body;
  if (!shop || !renderUrl) return res.status(400).json({ error: 'shop and renderUrl required' });

  try {
    const store = await Store.findByDomain(shop);
    if (!store?.access_token) return res.status(404).json({ error: 'Store not found or no access_token' });

    const axios = require('axios');
    const token = store.access_token;
    const headers = { 'X-Shopify-Access-Token': token };
    const base = `https://${shop}/admin/api/2024-01`;

    // Delete all existing webhooks
    const listRes = await axios.get(`${base}/webhooks.json`, { headers });
    const existing = listRes.data.webhooks || [];
    for (const wh of existing) {
      await axios.delete(`${base}/webhooks/${wh.id}.json`, { headers });
    }

    // Re-register to Render
    const topics = [
      'orders/create', 'orders/updated', 'orders/paid', 'orders/cancelled',
      'fulfillments/create', 'checkouts/create', 'checkouts/update',
      'carts/create', 'carts/update',
    ];
    const results = [];
    for (const topic of topics) {
      const path = '/webhook/' + topic.replace('/', 's/').replace('orders/s/', 'orders/');
      const address = `${renderUrl}/webhook/${topic.replace('/', '/')}`;
      try {
        const r = await axios.post(`${base}/webhooks.json`,
          { webhook: { topic, address: `${renderUrl}/webhook/${topic.split('/')[0]}s/${topic.split('/')[1]}`, format: 'json' } },
          { headers });
        results.push({ topic, status: 'registered', id: r.data.webhook.id, address: r.data.webhook.address });
      } catch (e) {
        results.push({ topic, status: 'failed', error: e.response?.data || e.message });
      }
    }

    res.json({ success: true, deleted: existing.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes
app.use('/auth', require('./routes/auth.routes'));
app.use('/webhook', require('./routes/webhook.routes'));
app.use('/api', require('./routes/order.routes'));
app.use('/api', require('./routes/settings.routes'));

// Global error handler — must be last
app.use(errorHandler);

module.exports = app;
