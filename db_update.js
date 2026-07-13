const { pool } = require('./config/db');

const updateDatabase = async () => {
    try {
        console.log('Starting database update...');
        
        // Check if last_logout_date exists and drop it
        await pool.query(`ALTER TABLE users DROP COLUMN IF EXISTS last_logout_date`);
        
        // Check if last_active_at exists and rename it to last_app_opened
        const checkCol = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' and column_name='last_active_at'
        `);
        
        if (checkCol.rows.length > 0) {
            await pool.query(`ALTER TABLE users RENAME COLUMN last_active_at TO last_app_opened`);
            console.log('Renamed last_active_at to last_app_opened.');
        } else {
            // Check if last_app_opened already exists
            const checkOpened = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' and column_name='last_app_opened'
            `);
            if (checkOpened.rows.length === 0) {
                await pool.query(`ALTER TABLE users ADD COLUMN last_app_opened TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
                console.log('Added last_app_opened column.');
            }
        }
        
        console.log('Successfully updated users table schema.');
    } catch (err) {
        console.error('Error updating database:', err);
    } finally {
        process.exit();
    }
};

updateDatabase();