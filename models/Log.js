const db = require('../config/db');

class Log {
  static async create(shopDomain, eventType, payload, status = 'received', response = null) {
    await db.query(
      `INSERT INTO logs (shop_domain, event_type, payload, status, response)
       VALUES (?, ?, ?, ?, ?)`,
      [shopDomain, eventType, JSON.stringify(payload), status, response]
    );
  }

  static async findByShop(shopDomain, page = 1, limit = 10) {
    const offset = (Number(page) - 1) * Number(limit);
    const [rows] = await db.query(
      `SELECT id, shop_domain, event_type, payload, status, response, created_at
       FROM logs WHERE shop_domain = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [shopDomain, Number(limit), Number(offset)]
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM logs WHERE shop_domain = ?`,
      [shopDomain]
    );

    return {
      data: rows,
      total: countRows[0].total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(countRows[0].total / Number(limit))
    };
  }

  static async updateStatus(id, status, response) {
    await db.query(
      'UPDATE logs SET status = ?, response = ? WHERE id = ?',
      [status, response, id]
    );
  }
}

module.exports = Log;
