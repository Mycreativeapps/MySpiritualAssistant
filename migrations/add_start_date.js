const { pool } = require('../config/db');

const addStartDate = async () => {
    try {
        await pool.query('ALTER TABLE user_routines ADD COLUMN IF NOT EXISTS start_date DATE;');
        console.log('Added start_date to user_routines');
    } catch (err) {
        console.error('Error adding start_date:', err);
    } finally {
        pool.end();
    }
};

addStartDate();
