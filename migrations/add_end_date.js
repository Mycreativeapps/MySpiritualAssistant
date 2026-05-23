const { pool } = require('../config/db');

const addEndDate = async () => {
    try {
        await pool.query('ALTER TABLE user_routines ADD COLUMN IF NOT EXISTS end_date DATE;');
        console.log('Added end_date to user_routines');
    } catch (err) {
        console.error('Error adding end_date:', err);
    } finally {
        pool.end();
    }
};

addEndDate();
