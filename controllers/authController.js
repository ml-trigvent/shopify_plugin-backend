const crypto = require('crypto');
const Store = require('../models/Store');
const { exchangeToken, registerWebhooks } = require('../services/shopify.service');

// GET /auth/shopify?shop=xxx.myshopify.com
async function install(req, res) {
  const { shop } = req.query;

  if (!shop || !shop.includes('.myshopify.com')) {
    return res.status(400).json({ error: 'Invalid shop domain' });
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${process.env.APP_URL}/auth/callback`;
  const scopes = process.env.SHOPIFY_SCOPES;

  const authUrl =
    `https://${shop}/admin/oauth/authorize?` +
    `client_id=${process.env.SHOPIFY_API_KEY}&` +
    `scope=${scopes}&` +
    `redirect_uri=${redirectUri}&` +
    `state=${nonce}`;

  console.log(`Starting install flow for shop: ${shop}`);
  res.redirect(authUrl);
}

// GET /auth/callback
async function callback(req, res) {
  const { shop, code, state } = req.query;
  console.log(`Received OAuth callback for shop: ${shop}`);

  if (!shop || !code) {
    console.error('Callback failed: Missing shop or code');
    return res.status(400).json({ error: 'Missing shop or code' });
  }

  try {
    console.log(`Exchanging token for ${shop}...`);
    const accessToken = await exchangeToken(shop, code);
    console.log(`Token exchanged successfully for ${shop}`);

    console.log(`Saving store ${shop} to database...`);
    await Store.upsert(shop, accessToken);

    console.log(`Registering webhooks for ${shop}...`);
    await registerWebhooks(shop, accessToken);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    console.log(`OAuth complete for ${shop}. Redirecting to frontend...`);
    res.redirect(`${frontendUrl}?shop=${shop}`);
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.status(500).json({ error: 'OAuth failed: ' + err.message });
  }
}

module.exports = { install, callback };
