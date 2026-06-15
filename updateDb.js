const db = require('./config/db');

(async () => {
    try {
        await db.query('ALTER TABLE users ADD COLUMN year_of_birth INT');
        console.log('Successfully added year_of_birth to users table');
    } catch (e) {
        if (e.code === '42701') {
            console.log('Column year_of_birth already exists');
        } else {
            console.error('Failed to update DB schema:', e);
        }
    } finally {
        process.exit(0);
    }
})();
