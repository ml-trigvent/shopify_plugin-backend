const db = require('../config/db');

class Log {
  static async create(shopDomain, eventType, payload, status = 'received', response = null) {
    await db.query(
      `INSERT INTO logs (shop_domain, event_type, payload, status, response)
       VALUES (?, ?, ?, ?, ?)`,
      [shopDomain, eventType, JSON.stringify(payload), status, response]
    );
  }

  static async findByShop(shopDomain, page = 1, limit = 10, search = '') {
    const offset = (Number(page) - 1) * Number(limit);
    let query = `SELECT id, shop_domain, event_type, payload, status, response, created_at FROM logs WHERE shop_domain = ?`;
    let countQuery = `SELECT COUNT(*) as total FROM logs WHERE shop_domain = ?`;
    let params = [shopDomain];
    let countParams = [shopDomain];

    if (search) {
      query += ` AND (event_type LIKE ? OR payload LIKE ?)`;
      countQuery += ` AND (event_type LIKE ? OR payload LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await db.query(query, params);
    const [countRows] = await db.query(countQuery, countParams);

    return {
      data: rows,
      total: countRows[0].total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(countRows[0].total / Number(limit))
    };
  }

  static async findById(id) {
    const [rows] = await db.query(
      'SELECT id, shop_domain, event_type, payload, status, response, created_at FROM logs WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async updateStatus(id, status, response) {
    await db.query(
      'UPDATE logs SET status = ?, response = ? WHERE id = ?',
      [status, response, id]
    );
  }
}

module.exports = Log;
