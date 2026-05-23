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
                if (now.hour() === 0 && now.minute() < 15) {
                    const dateStr = now.format('YYYY-MM-DD');
                    await db.query(`
                        INSERT INTO daily_tasks (routine_id, user_id, date, score)
                        SELECT ur.id, ur.user_id, $1, 0
                        FROM user_routines ur
                        JOIN users u ON ur.user_id = u.id
                        WHERE u.timezone = $2 
                        AND ur.is_active = true
                        AND u.is_active = true
                        AND NOT EXISTS (
                            SELECT 1 FROM daily_tasks dt 
                            WHERE dt.routine_id = ur.id AND dt.date = $1
                        )
                    `, [dateStr, tz]);
                }
            }
        } catch (err) {
            console.error('Error in task generation cron:', err);
        }
    });

    // 2. Notification Alert Job (Every minute)
    cron.schedule('* * * * *', async () => {
        try {
            // Get all active routines for users with FCM tokens and their daily task IDs
            // Join with users and daily_tasks using the user's local date
            const result = await db.query(`
                SELECT 
                    ur.task_name as routine_name, 
                    ur.scheduled_time, 
                    u.fcm_token, 
                    u.timezone, 
                    u.id as user_id,
                    u.name as user_name,
                    mt.options as options,
                    dt.id as daily_task_id,
                    dt.last_notified_at
                FROM user_routines ur
                JOIN users u ON ur.user_id = u.id
                JOIN daily_tasks dt ON dt.routine_id = ur.id 
                    AND dt.date = (CURRENT_TIMESTAMP AT TIME ZONE u.timezone)::date
                LEFT JOIN master_tasks mt ON ur.master_task_id = mt.id
                WHERE ur.is_active = true 
                AND u.fcm_token IS NOT NULL 
                AND ur.scheduled_time IS NOT NULL
                AND u.is_active = true
                AND (dt.last_notified_at IS NULL OR dt.last_notified_at < NOW() - INTERVAL '1 hour')
                AND dt.score = 0
            `);

            for (const row of result.rows) {
                const userTime = moment().tz(row.timezone);
                const taskTime = moment(row.scheduled_time, 'HH:mm:ss');

                // Calculate difference in minutes
                const diffMinutes = moment.duration(taskTime.diff(moment(userTime.format('HH:mm:ss'), 'HH:mm:ss'))).asMinutes();

                // Send if task is in 4 to 6 minutes
                if (diffMinutes > 4 && diffMinutes <= 5) {
                    console.log(`Sending alert for task: ${row.routine_name} to user ${row?.user_name || 'user'}. Diff: ${diffMinutes.toFixed(2)}m`);

                    const result = await sendNotification(row.fcm_token, {
                        data: {
                            title: 'Upcoming Task Alert! 🕉️',
                            body: `Your task "${row.routine_name}" starts in 5 minutes. Ready?`,
                            daily_task_id: String(row.daily_task_id),
                            options: JSON.stringify(row.options || [])
                        }
                    });

                    if (result) {
                        await db.query('UPDATE daily_tasks SET last_notified_at = NOW() WHERE id = $1', [row.daily_task_id]);
                    }
                }
            }
        } catch (err) {
            console.error('Error in notification cron:', err);
        }
    });
};

module.exports = { initCronJobs };
