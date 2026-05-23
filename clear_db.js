const { pool } = require('./config/db');

async function clearDB() {
    console.log('Clearing database tables...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Truncate tables in reverse dependency order
        // CASCADE will handle foreign keys if any are missed
        await client.query('TRUNCATE TABLE daily_tasks CASCADE');
        await client.query('TRUNCATE TABLE email_verifications CASCADE');
        await client.query('TRUNCATE TABLE master_tasks CASCADE');
        await client.query('TRUNCATE TABLE refresh_tokens CASCADE');
        await client.query('TRUNCATE TABLE user_relationships CASCADE');
        await client.query('TRUNCATE TABLE user_routines CASCADE');
        await client.query('TRUNCATE TABLE users CASCADE');


        // Reset identity sequences for tables with SERIAL/IDENTITY
        await client.query('ALTER SEQUENCE user_routines_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE email_verifications_id_seq RESTART WITH 1');

        await client.query('COMMIT');
        console.log('SUCCESS: All user data has been cleared.');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('FAILED: Error clearing database:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

clearDB();
