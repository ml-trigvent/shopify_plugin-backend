const db = require('./config/db');
require('dotenv').config();

async function check() {
    try {
        const [rows] = await db.execute('SELECT * FROM stores');
        console.log('--- STORES TABLE ---');
        console.log(JSON.stringify(rows, null, 2));

        const [logs] = await db.execute('SELECT * FROM logs LIMIT 5');
        console.log('\n--- RECENT LOGS ---');
        console.log(JSON.stringify(logs, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err.message);
        process.exit(1);
    }
}
check();
