const { pool } = require('./config/db');

async function migrate() {
    console.log('Starting migration: Adding unique constraints...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Add unique constraint to user_routines
        console.log('Adding unique constraint to user_routines...');
        await client.query(`
            ALTER TABLE user_routines 
            ADD CONSTRAINT unique_user_master_task UNIQUE (user_id, master_task_id)
        `);

        // 2. Add unique constraint to daily_tasks
        console.log('Adding unique constraint to daily_tasks...');
        await client.query(`
            ALTER TABLE daily_tasks 
            ADD CONSTRAINT unique_routine_date UNIQUE (routine_id, date)
        `);

        await client.query('COMMIT');
        console.log('SUCCESS: Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('FAILED: Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

migrate();
