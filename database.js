require('dotenv').config();
const knex = require("knex");

// Build connection string from environment variables
const connectionString = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?ssl=true`;

const db = knex({
    client: "mysql2",
    connection: connectionString
});

module.exports = db;
