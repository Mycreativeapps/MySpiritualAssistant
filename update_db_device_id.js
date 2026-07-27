const db = require('./config/db');

const updateDB = async () => {
    try {
        console.log('Connecting to database...');
        await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);');
        console.log('Successfully added device_id column to users table.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating database:', err);
        process.exit(1);
    }
};

updateDB();
