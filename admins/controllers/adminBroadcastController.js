const db = require('../../config/db');
const responseHandler = require('../../utils/responseHandler');
const { sendNotification } = require('../../services/notificationService');

/**
 * Dispatch Push Notification Broadcast to Target Group
 */
exports.sendBroadcast = async (req, res) => {
    const { target_type, target_role, target_user_ids, title, body } = req.body;
    const senderId = req.user.id;

    if (!title || !body) {
        return responseHandler.error(res, 'Notification title and body are required', 400);
    }

    if (!target_type || !['everyone', 'role', 'users'].includes(target_type)) {
        return responseHandler.error(res, 'Invalid target_type. Must be everyone, role, or users.', 400);
    }

    if (target_type === 'role' && !target_role) {
        return responseHandler.error(res, 'target_role is required when target_type is role', 400);
    }

    if (target_type === 'users' && (!Array.isArray(target_user_ids) || target_user_ids.length === 0)) {
        return responseHandler.error(res, 'target_user_ids array is required when target_type is users', 400);
    }

    try {
        // Fetch sender name
        const senderRes = await db.query('SELECT name FROM users WHERE id = $1', [senderId]);
        const senderName = senderRes.rows[0]?.name || 'Admin';

        // Query targeted users
        let userQuery = 'SELECT id, name, email, fcm_token FROM users WHERE is_active = TRUE';
        let queryParams = [];

        if (target_type === 'role') {
            userQuery += ' AND role = $1';
            queryParams.push(target_role);
        } else if (target_type === 'users') {
            userQuery += ' AND id = ANY($1)';
            queryParams.push(target_user_ids);
        }

        const usersRes = await db.query(userQuery, queryParams);
        const targetedUsers = usersRes.rows;
        const targetCount = targetedUsers.length;

        // Filter users with valid FCM tokens
        const usersWithToken = targetedUsers.filter(u => u.fcm_token && u.fcm_token.trim() !== '');
        const activeTokensCount = usersWithToken.length;

        let successCount = 0;

        // Dispatch FCM notifications
        for (const user of usersWithToken) {
            try {
                const response = await sendNotification(user.fcm_token, { title, body });
                if (response) {
                    successCount++;
                }
            } catch (err) {
                console.error(`Broadcast error for user ${user.id}:`, err.message);
            }
        }

        // Targeted users info summary
        const targetUsersInfo = targetedUsers.map(u => ({ id: u.id, name: u.name, email: u.email }));

        // Insert broadcast log
        await db.query(
            `INSERT INTO broadcast_logs (sender_id, sender_name, target_type, target_role, target_count, success_count, title, body, target_users_info, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
            [senderId, senderName, target_type, target_role || null, targetCount, successCount, title, body, JSON.stringify(targetUsersInfo)]
        );

        return responseHandler.success(res, 'Broadcast dispatched successfully', {
            targetCount,
            activeTokensCount,
            successCount,
            title,
            body
        });
    } catch (err) {
        console.error('adminBroadcastController.sendBroadcast Error:', err);
        return responseHandler.error(res, 'Failed to dispatch broadcast notification');
    }
};

/**
 * Fetch Broadcast History Logs
 */
exports.getBroadcastHistory = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, sender_id, sender_name, target_type, target_role, target_count, success_count, title, body, target_users_info, created_at
             FROM broadcast_logs
             ORDER BY created_at DESC
             LIMIT 50`
        );
        return responseHandler.success(res, 'Broadcast history fetched successfully', result.rows);
    } catch (err) {
        console.error('adminBroadcastController.getBroadcastHistory Error:', err);
        return responseHandler.error(res, 'Failed to fetch broadcast history');
    }
};
