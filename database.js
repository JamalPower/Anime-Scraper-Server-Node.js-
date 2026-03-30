const knex = require("knex");
require('dotenv').config();

// Create database connection with proper configuration for Aiven
const db = knex({
    client: "mysql2",
    connection: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: "amazon", // Aiven uses Amazon SSL certificates
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
    },
    pool: { min: 0, max: 5 },
    acquireConnectionTimeout: 10000,
});

module.exports = db;
