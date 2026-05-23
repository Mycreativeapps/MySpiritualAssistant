const { pool } = require('../config/db');

async function migrate() {
    try {
        console.log('Running migration: adds options to user_routines...');
        await pool.query(`
            ALTER TABLE user_routines 
            ADD COLUMN IF NOT EXISTS options JSONB;
        `);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
