const db = require('../config/db');

class Store {
  static async findByDomain(shopDomain) {
    const [rows] = await db.query(
      'SELECT * FROM stores WHERE shop_domain = ?',
      [shopDomain]
    );
    return rows[0] || null;
  }

  static async upsert(shopDomain, accessToken) {
    await db.query(
      `INSERT INTO stores (shop_domain, access_token)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE access_token = ?, updated_at = NOW()`,
      [shopDomain, accessToken, accessToken]
    );
    return this.findByDomain(shopDomain);
  }

  static async updateEasyClientKey(shopDomain, apiKey) {
    await db.query(
      'UPDATE stores SET easy_client_api_key = ? WHERE shop_domain = ?',
      [apiKey, shopDomain]
    );
  }

  static async getEasyClientKey(shopDomain) {
    const [rows] = await db.query(
      'SELECT easy_client_api_key FROM stores WHERE shop_domain = ?',
      [shopDomain]
    );
    return rows[0]?.easy_client_api_key || null;
  }

  static async findAll() {
    const [rows] = await db.query(
      'SELECT id, shop_domain, is_active, created_at FROM stores ORDER BY created_at DESC'
    );
    return rows;
  }
}

module.exports = Store;
