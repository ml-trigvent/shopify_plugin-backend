const Store = require('../models/Store');
const Log = require('../models/Log');
const { registerWebhooks } = require('../services/shopify.service');
const { sendToEasyClient } = require('../services/easyClient.service');

// POST /api/settings
async function saveSettings(req, res) {
  const { shop, easy_client_api_key, event_preferences } = req.body;

  if (!shop) return res.status(400).json({ error: 'shop is required' });

  try {
    await Store.updateSettings(shop, easy_client_api_key, event_preferences);
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/settings?shop=xxx
async function getSettings(req, res) {
  let { shop } = req.query;
  // Handle array if duplicated
  if (Array.isArray(shop)) shop = shop[0];

  if (!shop) return res.status(400).json({ error: 'shop is required' });

  try {
    const store = await Store.findByDomain(shop);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    // Automatically sync webhooks with current APP_URL
    if (store.access_token) {
      console.log(`Syncing webhooks for ${shop}...`);
      await registerWebhooks(shop, store.access_token);
    }

    res.json({
      success: true,
      data: {
        shopDomain: store.shop_domain,
        isActive: store.is_active,
        hasApiKey: !!store.easy_client_api_key,
        eventPreferences: store.event_preferences || {},
        createdAt: store.created_at,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/logs?shop=xxx
async function getLogs(req, res) {
  let { shop, page = 1, limit = 10, search = '' } = req.query;
  // Handle array if duplicated
  if (Array.isArray(shop)) shop = shop[0];

  if (!shop) return res.status(400).json({ error: 'shop is required' });

  try {
    const logsData = await Log.findByShop(shop, page, limit, search);
    res.json({
      success: true,
      data: logsData.data,
      pagination: {
        total: logsData.total,
        page: logsData.page,
        limit: logsData.limit,
        totalPages: logsData.totalPages
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/logs/:id/retry
async function retryLog(req, res) {
  const { id } = req.params;
  try {
    const log = await Log.findById(id);
    if (!log) return res.status(404).json({ error: 'Log not found' });

    let payload = log.payload;
    if (typeof payload === 'string') {
      payload = JSON.parse(payload);
    }
    
    // Attempt resend
    const result = await sendToEasyClient(log.shop_domain, payload);
    
    if (result.success) {
      res.json({ success: true, message: 'Retry successful', data: result.data });
    } else {
      res.status(400).json({ success: false, error: result.error || result.reason });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { saveSettings, getSettings, getLogs, retryLog };
