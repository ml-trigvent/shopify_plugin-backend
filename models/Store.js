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

  static async updateSettings(shopDomain, apiKey, preferences = null) {
    if (apiKey) {
      await db.query(
        'UPDATE stores SET easy_client_api_key = ?, event_preferences = ? WHERE shop_domain = ?',
        [apiKey, preferences ? JSON.stringify(preferences) : null, shopDomain]
      );
    } else {
      await db.query(
        'UPDATE stores SET event_preferences = ? WHERE shop_domain = ?',
        [preferences ? JSON.stringify(preferences) : null, shopDomain]
      );
    }
  }

  static async getEasyClientConfig(shopDomain) {
    const [rows] = await db.query(
      'SELECT easy_client_api_key, event_preferences FROM stores WHERE shop_domain = ?',
      [shopDomain]
    );
    return rows[0] || null;
  }

  static async findAll() {
    const [rows] = await db.query(
      'SELECT id, shop_domain, is_active, created_at FROM stores ORDER BY created_at DESC'
    );
    return rows;
  }
}

module.exports = Store;
