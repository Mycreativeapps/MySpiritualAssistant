const cron = require('node-cron');
const moment = require('moment-timezone');
const db = require('../config/db');

/**
 * Cron job running every 15 minutes.
 * Finds timezones where it's currently midnight (00:00 - 00:14)
 * and generates daily tasks for active users in those timezones.
 */
const { sendNotification } = require('./notificationService');

/**
 * Cron job running every 15 minutes.
 * Finds timezones where it's currently midnight (00:00 - 00:14)
 * and generates daily tasks for active users in those timezones.
 */
const initCronJobs = () => {
    // 1. Task Generation Job (Every 15 mins)
    cron.schedule('*/15 * * * *', async () => {
        console.log('Running cron task for daily task generation');
        try {
            const tzResult = await db.query('SELECT DISTINCT timezone FROM users WHERE timezone IS NOT NULL');
            const timezones = tzResult.rows.map(r => r.timezone);

            for (const tz of timezones) {
                const now = moment().tz(tz);
                const dateStr = now.format('YYYY-MM-DD');
                await db.query(`
                    INSERT INTO daily_tasks (id, routine_id, user_id, date, score)
                    SELECT concat(floor(extract(epoch from now()) * 1000)::text, '_', substr(md5(random()::text), 1, 4)), ur.id, ur.user_id, $1, 0
                    FROM user_routines ur
                    JOIN users u ON ur.user_id = u.id
                    WHERE u.timezone = $2 
                    AND ur.is_active = true
                    AND u.is_active = true
                    AND (ur.start_date IS NULL OR ur.start_date <= $1)
                    AND (ur.end_date IS NULL OR ur.end_date >= $1)
                    AND NOT EXISTS (
                        SELECT 1 FROM daily_tasks dt 
                        WHERE dt.routine_id = ur.id AND dt.date = $1
                    )
                `, [dateStr, tz]);
            }
        } catch (err) {
            console.error('Error in task generation cron:', err);
        }
    });

    // 2. Notification Alert Job - DISABLED (Handled locally on client via 7-day AlarmManager triggers in notificationScheduler.ts)
    // cron.schedule('* * * * *', async () => { ... });
};

module.exports = { initCronJobs };
