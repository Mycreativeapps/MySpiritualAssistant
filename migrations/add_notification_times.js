const { pool } = require('../config/db');

const migrate = async () => {
    try {
        console.log('Adding notification_times column to master_tasks and user_routines...');

        await pool.query(`
            ALTER TABLE master_tasks ADD COLUMN IF NOT EXISTS notification_times JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('Added to master_tasks');

        await pool.query(`
            ALTER TABLE user_routines ADD COLUMN IF NOT EXISTS notification_times JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('Added to user_routines');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
