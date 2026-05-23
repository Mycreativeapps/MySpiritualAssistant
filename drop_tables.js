const { pool } = require('./config/db');

async function dropTables() {
    try {
        await pool.query(`
            DROP TABLE IF EXISTS daily_tasks, email_verifications, master_tasks, refresh_tokens, user_relationships, user_routines, users CASCADE;
        `);
        console.log('Tables dropped successfully');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dropTables();