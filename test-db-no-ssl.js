require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        // Try without SSL first to isolate the issue
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT),
            enableConnectionPooling: true
        });

        const result = await connection.query('SELECT 1 as test');
        console.log('✅ Connected successfully!', result[0]);
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.log('❌ Connection Error:', error.message);
        process.exit(1);
    }
}

testConnection();
