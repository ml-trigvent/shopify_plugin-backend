const axios = require('axios');

const SHOPIFY_API_VERSION = '2024-01';

async function registerWebhooks(shop, accessToken) {
  const webhooks = [
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
  for (const wh of webhooks) {
    try {
      const res = await axios.post(
        `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`,
        {
          webhook: {
            topic: wh.topic,
            address: `${process.env.APP_URL}${wh.path}`,
            format: 'json',
          },
        },
        { headers: { 'X-Shopify-Access-Token': accessToken } }
      );
      results.push({ topic: wh.topic, status: 'registered', id: res.data.webhook?.id });
      console.log(`Webhook registered: ${wh.topic}`);
    } catch (err) {
      const msg = err.response?.data?.errors || err.message;
      if (typeof msg === 'object' && msg.address && msg.address[0] === 'for this topic has already been taken') {
        results.push({ topic: wh.topic, status: 'already_registered' });
        console.log(`Webhook already registered: ${wh.topic}`);
      } else {
        results.push({ topic: wh.topic, status: 'failed', error: msg });
        console.error(`Webhook failed [${wh.topic}]:`, msg);
      }
    }
  }
  return results;
}

async function getShopInfo(shop, accessToken) {
  const res = await axios.get(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/shop.json`,
    { headers: { 'X-Shopify-Access-Token': accessToken } }
  );
  return res.data.shop;
}

async function exchangeToken(shop, code) {
  const res = await axios.post(
    `https://${shop}/admin/oauth/access_token`,
    {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }
  );
  return res.data.access_token;
}

module.exports = { registerWebhooks, getShopInfo, exchangeToken };
