require('dotenv').config();
const pool = require('./database.js');

async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Connected to Supabase!');
        console.log('Current timestamp:', result.rows[0]);
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.log('❌ Connection Error:', error.message);
        process.exit(1);
    }
}

testConnection();
