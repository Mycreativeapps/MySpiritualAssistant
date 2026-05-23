const db = require('../config/db');
const responseHandler = require('../utils/responseHandler');
const { generateTimestampId } = require('../utils/idGenerator');
const { sendNotification } = require('../services/notificationService');

/**
 * Tasks Management
 */

exports.createMasterTask = async (req, res) => {
    const { task_name, scheduled_time, options } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO master_tasks (task_name, scheduled_time, options, updated_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [task_name, scheduled_time, JSON.stringify(options), req.user.id]
        );
        responseHandler.success(res, 'Master task created successfully', result.rows[0], 201);
    } catch (err) {
        console.error('createMasterTask Error:', err);
        responseHandler.error(res, 'Failed to create master task');
    }
};

exports.updateMasterTask = async (req, res) => {
    const { id } = req.params;
    const { task_name, scheduled_time, options, is_active } = req.body;
    try {
        const result = await db.query(
            `UPDATE master_tasks 
             SET task_name = COALESCE($1, task_name), 
                 scheduled_time = COALESCE($2, scheduled_time), 
                 options = COALESCE($3, options), 
                 is_active = COALESCE($4, is_active),
                 updated_at = NOW(),
                 updated_by = $5 
             WHERE id = $6 RETURNING *`,
            [task_name, scheduled_time, options ? JSON.stringify(options) : null, is_active, req.user.id, id]
        );
        if (result.rows.length === 0) return responseHandler.error(res, 'Task not found', 404);
        responseHandler.success(res, 'Master task updated successfully', result.rows[0]);
    } catch (err) {
        console.error('updateMasterTask Error:', err);
        responseHandler.error(res, 'Failed to update master task');
    }
};

exports.deleteMasterTask = async (req, res) => {
    const { id } = req.params;
    try {
        // Soft delete/deactivate
        const result = await db.query(
            'UPDATE master_tasks SET is_active = false, updated_at = NOW(), updated_by = $1 WHERE id = $2 RETURNING *',
            [req.user.id, id]
        );
        if (result.rows.length === 0) return responseHandler.error(res, 'Task not found', 404);
        responseHandler.success(res, 'Master task deactivated successfully');
    } catch (err) {
        console.error('deleteMasterTask Error:', err);
        responseHandler.error(res, 'Failed to deactivate master task');
    }
};

/**
 * User Management
 */

exports.listUsers = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, email, phone_number, role, created_at, last_active_at, is_active FROM users ORDER BY created_at DESC'
        );
        responseHandler.success(res, 'Users fetched successfully', result.rows);
    } catch (err) {
        console.error('listUsers Error:', err);
        responseHandler.error(res, 'Failed to fetch users');
    }
};

exports.updateUserRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['devotee', 'admin'].includes(role)) {
        return responseHandler.error(res, 'Invalid role', 400);
    }

    try {
        const result = await db.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, role, fcm_token',
            [role, userId]
        );
        if (result.rows.length === 0) return responseHandler.error(res, 'User unrecognized', 404);
        
        const user = result.rows[0];

        // Send Notification if promoted to admin
        if (role === 'admin' && user.fcm_token) {
            sendNotification(user.fcm_token, {
                title: 'Promotion!',
                body: 'Congratulations! You have been promoted to Admin.'
            });
        }

        responseHandler.success(res, 'User role updated successfully', { id: user.id, name: user.name, role: user.role });
    } catch (err) {
        console.error('updateUserRole Error:', err);
        responseHandler.error(res, 'Failed to update user role');
    }
};

exports.getSystemStats = async (req, res) => {
    try {
        const adminCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
        const devoteeCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'devotee'");
        const activeTasks = await db.query("SELECT COUNT(*) FROM master_tasks WHERE is_active = true");

        responseHandler.success(res, 'System stats fetched successfully', {
            admins: parseInt(adminCount.rows[0].count),
            devotees: parseInt(devoteeCount.rows[0].count),
            activeMasterTasks: parseInt(activeTasks.rows[0].count)
        });
    } catch (err) {
        console.error('getSystemStats Error:', err);
        responseHandler.error(res, 'Failed to fetch system stats');
    }
};
