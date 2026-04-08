const Store = require('../models/Store');
const Log = require('../models/Log');
const { registerWebhooks } = require('../services/shopify.service');

// POST /api/settings
async function saveSettings(req, res) {
  const { shop, easy_client_api_key } = req.body;

  if (!shop) return res.status(400).json({ error: 'shop is required' });

  try {
    await Store.updateEasyClientKey(shop, easy_client_api_key);
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
        createdAt: store.created_at,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/logs?shop=xxx
async function getLogs(req, res) {
  let { shop } = req.query;
  // Handle array if duplicated
  if (Array.isArray(shop)) shop = shop[0];

  if (!shop) return res.status(400).json({ error: 'shop is required' });

  try {
    const logs = await Log.findByShop(shop);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { saveSettings, getSettings, getLogs };
