const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    // Uncomment the one you want to use:
    connectionString: process.env.PROD_DB_URL,
    // connectionString: process.env.DEV_DB_URL,
    // connectionString: process.env.DATABASE_URL,
    // connectionString: process.env.DATABASE_URL_SUPABASE,
    // Add SSL configuration if needed for production (e.g., Heroku/AWS)
    // ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test connection on startup
(async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('Database connected successfully');
    } catch (err) {
        console.error('Database connection failed:', err);
    }
})();

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
