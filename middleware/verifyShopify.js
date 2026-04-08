const crypto = require('crypto');

function verifyShopifyWebhook(req, res, next) {
  const hmac = req.headers['x-shopify-hmac-sha256'];

  if (!hmac) {
    return res.status(401).json({ error: 'Missing HMAC header' });
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    return res.status(400).json({ error: 'No raw body available' });
  }

  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');

  if (hash !== hmac) {
    console.warn('Invalid webhook signature from:', req.headers['x-shopify-shop-domain']);
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
}

module.exports = verifyShopifyWebhook;
