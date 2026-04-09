const db = require('../config/db');

class Order {
  static async create(data) {
    const {
      shopDomain, shopifyOrderId, customerName,
      customerPhone, customerEmail, productName,
      price, quantity,
    } = data;

    await db.query(
      `INSERT INTO orders
       (shop_domain, shopify_order_id, customer_name, customer_phone,
        customer_email, product_name, price, quantity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'placed')`,
      [shopDomain, shopifyOrderId, customerName, customerPhone,
        customerEmail, productName, price, quantity]
    );
  }

  static async updateStatus(shopDomain, shopifyOrderId, status) {
    await db.query(
      `UPDATE orders SET status = ?, updated_at = NOW()
       WHERE shop_domain = ? AND shopify_order_id = ?`,
      [status, shopDomain, shopifyOrderId]
    );
  }

  static async updateTracking(shopDomain, shopifyOrderId, trackingNumber) {
    await db.query(
      `UPDATE orders SET status = 'shipped', tracking_number = ?, updated_at = NOW()
       WHERE shop_domain = ? AND shopify_order_id = ?`,
      [trackingNumber, shopDomain, shopifyOrderId]
    );
  }

  static async findByShop(shopDomain, limit = 50) {
    const [rows] = await db.query(
      `SELECT * FROM orders WHERE shop_domain = ?
       ORDER BY created_at DESC LIMIT ?`,
      [shopDomain, Number(limit)]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async getStats(shopDomain) {
    const [rows] = await db.query(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'placed' THEN 1 ELSE 0 END) as placed,
         SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
         SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
         SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
         SUM(price) as total_revenue
       FROM orders WHERE shop_domain = ?`,
      [shopDomain]
    );
    return rows[0];
  }
}

module.exports = Order;
