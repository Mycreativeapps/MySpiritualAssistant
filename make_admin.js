const { pool } = require('./config/db');

async function makeAdmin(email) {
    try {
        const result = await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', email]);
        console.log(`User ${email} has been made admin`);
    } catch (error) {
        console.error('Error making user admin:', error);
    }
}

makeAdmin('brahawar2003@gmail.com')