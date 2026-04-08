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

// Routes
app.use('/auth', require('./routes/auth.routes'));
app.use('/webhook', require('./routes/webhook.routes'));
app.use('/api', require('./routes/order.routes'));
app.use('/api', require('./routes/settings.routes'));

// Global error handler — must be last
app.use(errorHandler);

module.exports = app;
