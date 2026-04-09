const db = require('../config/db');

class Log {
  static async create(shopDomain, eventType, payload, status = 'received', response = null) {
    await db.query(
      `INSERT INTO logs (shop_domain, event_type, payload, status, response)
       VALUES (?, ?, ?, ?, ?)`,
      [shopDomain, eventType, JSON.stringify(payload), status, response]
    );
  }

  static async findByShop(shopDomain, limit = 50) {
    const [rows] = await db.query(
      `SELECT id, shop_domain, event_type, payload, status, response, created_at
       FROM logs WHERE shop_domain = ?
       ORDER BY created_at DESC LIMIT ?`,
      [shopDomain, Number(limit)]
    );
    return rows;
  }

  static async updateStatus(id, status, response) {
    await db.query(
      'UPDATE logs SET status = ?, response = ? WHERE id = ?',
      [status, response, id]
    );
  }
}

module.exports = Log;
