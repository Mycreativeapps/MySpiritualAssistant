const db = require('./config/db');

async function fixConstraint() {
    try {
        console.log('Connecting to db...');

        // 1. Drop existing check constraints on score
        await db.query(`ALTER TABLE daily_tasks DROP CONSTRAINT IF EXISTS daily_tasks_score_check;`);

        // 2. Add an updated constraint for 0 to 10, or simply rely on the app logic
        await db.query(`ALTER TABLE daily_tasks ADD CONSTRAINT daily_tasks_score_check CHECK (score >= 0 AND score <= 10);`);

        console.log('Successfully updated daily_tasks score constraint to allow up to 10!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixConstraint();
