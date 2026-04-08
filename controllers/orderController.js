const Order = require('../models/Order');

// GET /api/orders?shop=xxx
async function getOrders(req, res) {
  let { shop } = req.query;
  if (Array.isArray(shop)) shop = shop[0];
  if (!shop) return res.status(400).json({ error: 'shop is required' });

  try {
    const orders = await Order.findByShop(shop);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/orders/stats?shop=xxx
async function getStats(req, res) {
  let { shop } = req.query;
  if (Array.isArray(shop)) shop = shop[0];
  if (!shop) return res.status(400).json({ error: 'shop is required' });

  try {
    const stats = await Order.getStats(shop);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { getOrders, getStats };
