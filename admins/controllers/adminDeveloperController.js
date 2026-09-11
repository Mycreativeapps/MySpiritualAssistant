const db = require('../../config/db');
const responseHandler = require('../../utils/responseHandler');
const { sendNotification } = require('../../services/notificationService');

/**
 * Fetch All App Settings
 */
exports.getAppSettings = async (req, res) => {
    try {
        const result = await db.query('SELECT key, value, updated_at FROM app_settings ORDER BY key ASC');
        const settingsMap = {};
        result.rows.forEach(row => {
            let parsedVal = row.value;
            try {
                if (typeof parsedVal === 'string') {
                    parsedVal = JSON.parse(parsedVal);
                }
            } catch (e) {}
            settingsMap[row.key] = parsedVal;
        });
        responseHandler.success(res, 'App settings fetched successfully', settingsMap);
    } catch (err) {
        console.error('adminDeveloperController.getAppSettings Error:', err);
        responseHandler.error(res, 'Failed to fetch app settings');
    }
};

/**
 * Update Specific App Setting Key
 */
exports.updateAppSetting = async (req, res) => {
    const { key, value } = req.body;
    if (!key) return responseHandler.error(res, 'Setting key is required', 400);

    try {
        if (key === 'users_limit') {
            const numVal = parseInt(value, 10);
            if (isNaN(numVal) || numVal < 1) {
                return responseHandler.error(res, 'Users limit must be a valid positive number', 400);
            }
            const countRes = await db.query('SELECT COUNT(*) FROM users');
            const currentUsers = parseInt(countRes.rows[0].count, 10);
            if (numVal < currentUsers) {
                return responseHandler.error(
                    res,
                    `Cannot set Max Users Limit to ${numVal}. Total registered users count in database is currently ${currentUsers}.`,
                    400
                );
            }
        }

        const result = await db.query(
            `INSERT INTO app_settings (key, value, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (key) 
             DO UPDATE SET value = $2, updated_at = NOW()
             RETURNING *`,
            [key, JSON.stringify(value)]
        );
        responseHandler.success(res, `Setting '${key}' updated successfully`, result.rows[0]);
    } catch (err) {
        console.error('adminDeveloperController.updateAppSetting Error:', err);
        responseHandler.error(res, 'Failed to update app setting');
    }
};

/**
 * Trigger Developer Test Notification
 */
exports.sendTestNotification = async (req, res) => {
    const { fcm_token, title, body } = req.body;
    if (!fcm_token) return responseHandler.error(res, 'FCM token is required', 400);

    try {
        await sendNotification(fcm_token, {
            title: title || '🛠️ Developer Test Notification',
            body: body || 'This is a test notification triggered from the Admin Developer Panel.'
        });
        responseHandler.success(res, 'Test notification dispatched successfully');
    } catch (err) {
        console.error('adminDeveloperController.sendTestNotification Error:', err);
        responseHandler.error(res, 'Failed to send test notification');
    }
};

/**
 * Developer System Health Check
 */
exports.getSystemHealth = async (req, res) => {
    try {
        const dbStart = Date.now();
        await db.query('SELECT 1');
        const dbLatencyMs = Date.now() - dbStart;

        responseHandler.success(res, 'Developer system health retrieved', {
            serverTime: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
            nodeVersion: process.version,
            dbStatus: 'CONNECTED',
            dbLatencyMs,
            env: process.env.NODE_ENV || 'development'
        });
    } catch (err) {
        console.error('adminDeveloperController.getSystemHealth Error:', err);
        responseHandler.error(res, 'System health check failed');
    }
};

/**
 * Developer Database Maintenance & Clearing Tool
 * Targets: 'tasks_only' | 'entire_db' | 'custom_tables'
 */
exports.clearDatabaseTarget = async (req, res) => {
    const { target, tables } = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        let messageDetails = '';

        if (target === 'tasks_only') {
            // Clears all assigned routines and daily task logs while keeping users intact.
            // Executing in a single TRUNCATE statement with CASCADE avoids foreign key sequence locking
            await client.query('TRUNCATE TABLE daily_tasks, user_routines CASCADE');
            await client.query('ALTER SEQUENCE IF EXISTS user_routines_id_seq RESTART WITH 1');
            messageDetails = 'All user routines and daily task logs have been cleared successfully.';
        } else if (target === 'entire_db') {
            // Clears all application user data, routines, tasks, tokens in one atomic CASCADE call
            await client.query('TRUNCATE TABLE daily_tasks, user_routines, user_relationships, email_verifications, refresh_tokens, broadcast_notifications, users CASCADE');

            await client.query('ALTER SEQUENCE IF EXISTS user_routines_id_seq RESTART WITH 1');
            await client.query('ALTER SEQUENCE IF EXISTS email_verifications_id_seq RESTART WITH 1');
            messageDetails = 'Entire Database cleared successfully (all users, routines, and task entries reset).';
        } else if (target === 'custom_tables' && Array.isArray(tables) && tables.length > 0) {
            // Safe whitelist of clearable tables
            const allowedTables = [
                'daily_tasks',
                'user_routines',
                'user_relationships',
                'master_tasks',
                'refresh_tokens',
                'email_verifications',
                'broadcast_notifications',
                'app_settings',
                'users'
            ];

            const selectedTables = tables.filter(t => allowedTables.includes(t));
            if (selectedTables.length === 0) {
                await client.query('ROLLBACK');
                return responseHandler.error(res, 'No valid clearable tables selected', 400);
            }

            // Truncate all selected tables at once in a single SQL command with CASCADE.
            // This prevents foreign key deadlocks/conflicts between dependent tables!
            const truncateQuery = `TRUNCATE TABLE ${selectedTables.join(', ')} CASCADE`;
            await client.query(truncateQuery);

            messageDetails = `Selected tables cleared successfully: [${selectedTables.join(', ')}].`;
        } else {
            await client.query('ROLLBACK');
            return responseHandler.error(res, 'Invalid clear target option specified', 400);
        }

        await client.query('COMMIT');
        responseHandler.success(res, messageDetails);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('adminDeveloperController.clearDatabaseTarget Error:', err);
        responseHandler.error(res, 'Database maintenance operation failed: ' + err.message);
    } finally {
        client.release();
    }
};
