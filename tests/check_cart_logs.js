const db = require('../config/db');
require('dotenv').config({ path: './backend/.env' });

async function checkCartLogs() {
    try {
        const [rows] = await db.execute('SELECT id, event_type, payload, created_at FROM logs WHERE event_type LIKE "cart_%" ORDER BY created_at DESC LIMIT 3');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err.message);
        process.exit(1);
    }
}
checkCartLogs();
