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
                    SELECT concat(floor(extract(epoch from now() * 1000))::text, '_', substr(md5(random()::text), 1, 4)), ur.id, ur.user_id, $1, 0
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
                    ur.notification_times as custom_notification_times,
                    mt.notification_times as master_notification_times,
                    u.fcm_token, 
                    u.timezone, 
                    u.id as user_id,
                    u.name as user_name,
                    COALESCE(ur.options, mt.options) as options,
                    dt.id as daily_task_id,
                    dt.score,
                    dt.last_notified_at
                FROM user_routines ur
                JOIN users u ON ur.user_id = u.id
                JOIN daily_tasks dt ON dt.routine_id = ur.id 
                    AND dt.date = (CURRENT_TIMESTAMP AT TIME ZONE REPLACE(u.timezone, 'Asia/Calcutta', 'Asia/Kolkata'))::date
                LEFT JOIN master_tasks mt ON ur.master_task_id = mt.id
                WHERE ur.is_active = true 
                AND COALESCE(ur.notifications_enabled, true) = true
                AND u.fcm_token IS NOT NULL 
                AND u.is_active = true
                AND (dt.last_notified_at IS NULL OR dt.last_notified_at < NOW() - INTERVAL '1 hour')
            `);

            for (const row of result.rows) {
                // Check if the task has reached its maximum score
                const optionsObj = row.options ? (typeof row.options === 'string' ? JSON.parse(row.options) : row.options) : {};
                const scores = Object.keys(optionsObj).map(Number).filter(n => !isNaN(n));
                const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
                
                // If the user already achieved the max score for today, don't notify
                if (maxScore > 0 && row.score >= maxScore) continue;
                if (maxScore === 0 && row.score > 0) continue;

                const userTime = moment().tz(row.timezone);
                
                let notificationTimes = row.custom_notification_times;
                if (!notificationTimes || notificationTimes.length === 0) {
                    notificationTimes = row.master_notification_times;
                }
                const timesToCheck = (notificationTimes && notificationTimes.length > 0) ? notificationTimes : (row.scheduled_time ? [row.scheduled_time] : []);
                
                let shouldNotify = false;
                for (const t of timesToCheck) {
                    const taskTime = moment(t, 'HH:mm:ss');
                    // Calculate difference in minutes ignoring seconds
                    // Positive = task is in the future, 0 = right now, negative = past
                    const diffMinutes = moment.duration(taskTime.diff(moment(userTime.format('HH:mm'), 'HH:mm'))).asMinutes();

                    // Send at EXACT scheduled time, with up to a 5 minute grace period
                    // in case the server cron was slightly delayed.
                    if (diffMinutes <= 0 && diffMinutes > -5) {
                        shouldNotify = true;
                        break;
                    }
                }

                if (shouldNotify) {
                    console.log(`Sending exact-time alert for task: ${row.routine_name} to user ${row?.user_name || 'user'}`);

                    const optionsPayload = typeof row.options === 'string' ? row.options : JSON.stringify(row.options || {});

                    const notifResult = await sendNotification(row.fcm_token, {
                        data: {
                            title: '🕉️ ' + row.routine_name,
                            body: `Time for your spiritual practice!`,
                            daily_task_id: String(row.daily_task_id),
                            options: optionsPayload
                        }
                    });

                    if (notifResult) {
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
