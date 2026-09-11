const db = require('../../config/db');
const responseHandler = require('../../utils/responseHandler');
const { sendNotification } = require('../../services/notificationService');

/**
 * Get Paginated List of Users with Search & Filters
 */
exports.listUsers = async (req, res) => {
    try {
        // Ensure columns exist in DB
        db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS app_version VARCHAR(50) DEFAULT 'v1.0.0',
            ADD COLUMN IF NOT EXISTS permissions_status JSONB DEFAULT '{"camera": "off", "location": "off", "media": "off", "battery": "off"}'::jsonb;
        `).catch(() => {});

        const { search = '', role = '', status = '', page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClauses = [];
        let params = [];
        let paramIdx = 1;

        if (search.trim()) {
            whereClauses.push(`(name ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR phone_number ILIKE $${paramIdx})`);
            params.push(`%${search.trim()}%`);
            paramIdx++;
        }

        if (role.trim()) {
            whereClauses.push(`role = $${paramIdx}`);
            params.push(role.trim());
            paramIdx++;
        }

        if (status.trim()) {
            const isActive = status === 'active';
            whereClauses.push(`is_active = $${paramIdx}`);
            params.push(isActive);
            paramIdx++;
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Count Total
        const countQuery = `SELECT COUNT(*) FROM users ${whereSql}`;
        const countRes = await db.query(countQuery, params);
        const totalUsers = parseInt(countRes.rows[0].count);

        // Fetch Data
        const dataQuery = `
            SELECT id, name, email, phone_number, role, is_active, created_at, last_app_opened, profile_url, gender, timezone, fcm_token, year_of_birth, is_logged_in, app_version, permissions_status
            FROM users
            ${whereSql}
            ORDER BY created_at DESC
            LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;
        const dataRes = await db.query(dataQuery, [...params, parseInt(limit), offset]);

        // Fetch Max Users Limit from app_settings
        let maxUsers = 100;
        try {
            const limitRes = await db.query("SELECT value FROM app_settings WHERE key = 'users_limit'");
            if (limitRes.rows.length > 0) {
                let val = limitRes.rows[0].value;
                if (typeof val === 'string') {
                    try { val = JSON.parse(val); } catch (e) {}
                }
                const parsed = parseInt(val, 10);
                if (!isNaN(parsed)) maxUsers = parsed;
            }
        } catch (e) {
            console.error('Error fetching users_limit:', e);
        }

        responseHandler.success(res, 'Users fetched successfully', {
            users: dataRes.rows,
            pagination: {
                total: totalUsers,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalUsers / parseInt(limit)),
                maxUsers: maxUsers
            }
        });
    } catch (err) {
        console.error('adminUserController.listUsers Error:', err);
        responseHandler.error(res, 'Failed to fetch users');
    }
};

/**
 * Update User Role (devotee | admin | super-admin)
 */
exports.updateUserRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['devotee', 'admin', 'super-admin'].includes(role)) {
        return responseHandler.error(res, 'Invalid role. Must be devotee, admin, or super-admin.', 400);
    }

    try {
        const result = await db.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, role, email, fcm_token',
            [role, userId]
        );

        if (result.rows.length === 0) return responseHandler.error(res, 'User not found', 404);

        const user = result.rows[0];

        // Send Push Notification if promoted
        if ((role === 'admin' || role === 'super-admin') && user.fcm_token) {
            sendNotification(user.fcm_token, {
                title: 'Role Promoted!',
                body: `Congratulations! You have been granted the ${role.toUpperCase()} role.`
            }).catch(e => console.error('FCM Notification error:', e));
        }

        responseHandler.success(res, `User role updated to ${role} successfully`, user);
    } catch (err) {
        console.error('adminUserController.updateUserRole Error:', err);
        responseHandler.error(res, 'Failed to update user role');
    }
};

/**
 * Toggle User Active Status (Block / Unblock)
 */
exports.toggleUserStatus = async (req, res) => {
    const { userId } = req.params;
    const { is_active } = req.body;

    try {
        const result = await db.query(
            'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, is_active',
            [is_active, userId]
        );

        if (result.rows.length === 0) return responseHandler.error(res, 'User not found', 404);

        const statusMsg = is_active ? 'activated' : 'suspended';
        responseHandler.success(res, `User account ${statusMsg} successfully`, result.rows[0]);
    } catch (err) {
        console.error('adminUserController.toggleUserStatus Error:', err);
        responseHandler.error(res, 'Failed to update user status');
    }
};

/**
 * Soft Delete User Account
 */
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Soft delete user by updating is_active = false and setting deleted_at timestamp
        db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        `).catch(() => {});

        const result = await db.query(
            `UPDATE users 
             SET is_active = false, 
                 deleted_at = NOW() 
             WHERE id = $1 
             RETURNING id, name, email`,
            [userId]
        );

        if (result.rows.length === 0) return responseHandler.error(res, 'User not found', 404);

        responseHandler.success(res, `User account soft deleted successfully`, result.rows[0]);
    } catch (err) {
        console.error('adminUserController.deleteUser Error:', err);
        responseHandler.error(res, 'Failed to soft delete user');
    }
};

/**
 * Clear All Assigned Tasks & Routines for a Specific User
 */
exports.clearUserTasks = async (req, res) => {
    const { userId } = req.params;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. First remove generated daily task entries for this user to satisfy foreign key constraints
        const dailyRes = await client.query(
            'DELETE FROM daily_tasks WHERE user_id = $1 RETURNING id',
            [userId]
        );

        // 2. Then remove user routines
        const routineRes = await client.query(
            'DELETE FROM user_routines WHERE user_id = $1 RETURNING id',
            [userId]
        );

        await client.query('COMMIT');

        responseHandler.success(res, 'User tasks and routines cleared successfully', {
            clearedRoutinesCount: routineRes.rowCount,
            clearedDailyTasksCount: dailyRes.rowCount
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('adminUserController.clearUserTasks Error:', err);
        responseHandler.error(res, 'Failed to clear user tasks');
    } finally {
        client.release();
    }
};

/**
 * Get Comprehensive System Overview & Statistics
 */
exports.getSystemOverview = async (req, res) => {
    try {
        const [totalRes, devoteeRes, adminRes, superAdminRes, activeTasksRes] = await Promise.all([
            db.query('SELECT COUNT(*) FROM users'),
            db.query("SELECT COUNT(*) FROM users WHERE role = 'devotee'"),
            db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'"),
            db.query("SELECT COUNT(*) FROM users WHERE role = 'super-admin'"),
            db.query("SELECT COUNT(*) FROM master_tasks WHERE is_active = true")
        ]);

        responseHandler.success(res, 'System stats fetched successfully', {
            totalUsers: parseInt(totalRes.rows[0].count),
            devotees: parseInt(devoteeRes.rows[0].count),
            admins: parseInt(adminRes.rows[0].count),
            superAdmins: parseInt(superAdminRes.rows[0].count),
            activeMasterTasks: parseInt(activeTasksRes.rows[0].count)
        });
    } catch (err) {
        console.error('adminUserController.getSystemOverview Error:', err);
        responseHandler.error(res, 'Failed to fetch system overview');
    }
};
