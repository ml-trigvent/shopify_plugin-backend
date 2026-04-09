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
app.post('/admin/re-register', async (req, res) => {
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

    // Re-register to the given renderUrl
    const topics = [
      { topic: 'orders/create', path: '/webhook/orders/create' },
      { topic: 'orders/updated', path: '/webhook/orders/updated' },
      { topic: 'orders/paid', path: '/webhook/orders/paid' },
      { topic: 'orders/cancelled', path: '/webhook/orders/cancelled' },
      { topic: 'fulfillments/create', path: '/webhook/fulfillments/create' },
      { topic: 'checkouts/create', path: '/webhook/checkouts/create' },
      { topic: 'checkouts/update', path: '/webhook/checkouts/update' },
      { topic: 'carts/create', path: '/webhook/carts/create' },
      { topic: 'carts/update', path: '/webhook/carts/update' },
    ];
    const results = [];
    for (const wh of topics) {
      try {
        const r = await axios.post(`${base}/webhooks.json`,
          { webhook: { topic: wh.topic, address: `${renderUrl}${wh.path}`, format: 'json' } },
          { headers });
        results.push({ topic: wh.topic, status: 'ok', address: r.data.webhook.address });
      } catch (e) {
        results.push({ topic: wh.topic, status: 'failed', error: e.response?.data || e.message });
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
