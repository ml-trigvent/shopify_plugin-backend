const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    console.log('Connecting to Aiven MySQL...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false },
        multipleStatements: true
    });

    console.log('Connected. Reading database schema...');
    let sql = fs.readFileSync('config/database.sql', 'utf8');

    // Remove CREATE DATABASE and USE statements to avoid Aiven permissions issues
    sql = sql.replace(/CREATE DATABASE IF NOT EXISTS shopify_plugin;/g, '');
    sql = sql.replace(/USE shopify_plugin;/g, '');

    console.log('Migrating schema...');
    await connection.query(sql);

    console.log('Database schema migrated to Aiven successfully!');
    await connection.end();
}

run().catch(err => {
    console.error('Migration Failed:', err);
    process.exit(1);
});
