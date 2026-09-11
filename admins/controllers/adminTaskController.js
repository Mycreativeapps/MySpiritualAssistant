const db = require('../../config/db');
const responseHandler = require('../../utils/responseHandler');

/**
 * Fetch All Master Tasks
 */
exports.listMasterTasks = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM master_tasks ORDER BY id ASC');
        responseHandler.success(res, 'Master tasks fetched successfully', result.rows);
    } catch (err) {
        console.error('adminTaskController.listMasterTasks Error:', err);
        responseHandler.error(res, 'Failed to fetch master tasks');
    }
};

/**
 * Create New Master Task
 */
exports.createMasterTask = async (req, res) => {
    const { task_name, scheduled_time, notification_times, options, is_active } = req.body;

    if (!task_name) {
        return responseHandler.error(res, 'Task name is required', 400);
    }

    try {
        const result = await db.query(
            `INSERT INTO master_tasks (task_name, scheduled_time, notification_times, options, is_active, updated_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                task_name,
                scheduled_time || '06:00',
                JSON.stringify(notification_times || []),
                JSON.stringify(options || {}),
                is_active !== undefined ? is_active : true,
                req.user.id
            ]
        );
        responseHandler.success(res, 'Master task created successfully', result.rows[0], 201);
    } catch (err) {
        console.error('adminTaskController.createMasterTask Error:', err);
        responseHandler.error(res, 'Failed to create master task');
    }
};

/**
 * Update Existing Master Task
 */
exports.updateMasterTask = async (req, res) => {
    const { id } = req.params;
    const { task_name, scheduled_time, notification_times, options, is_active } = req.body;

    try {
        const result = await db.query(
            `UPDATE master_tasks 
             SET task_name = COALESCE($1, task_name),
                 scheduled_time = COALESCE($2, scheduled_time),
                 notification_times = COALESCE($3, notification_times),
                 options = COALESCE($4, options),
                 is_active = COALESCE($5, is_active),
                 updated_at = NOW(),
                 updated_by = $6
             WHERE id = $7
             RETURNING *`,
            [
                task_name || null,
                scheduled_time || null,
                notification_times ? JSON.stringify(notification_times) : null,
                options ? JSON.stringify(options) : null,
                is_active !== undefined ? is_active : null,
                req.user.id,
                id
            ]
        );

        if (result.rows.length === 0) {
            return responseHandler.error(res, 'Master task not found', 404);
        }

        responseHandler.success(res, 'Master task updated successfully', result.rows[0]);
    } catch (err) {
        console.error('adminTaskController.updateMasterTask Error:', err);
        responseHandler.error(res, 'Failed to update master task');
    }
};

/**
 * Toggle Active Status (Enable / Disable)
 */
exports.toggleMasterTaskStatus = async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
        return responseHandler.error(res, 'Active status (is_active) is required', 400);
    }

    try {
        const result = await db.query(
            `UPDATE master_tasks 
             SET is_active = $1,
                 updated_at = NOW(),
                 updated_by = $2
             WHERE id = $3
             RETURNING *`,
            [is_active, req.user.id, id]
        );

        if (result.rows.length === 0) {
            return responseHandler.error(res, 'Master task not found', 404);
        }

        responseHandler.success(
            res,
            `Master task ${is_active ? 'enabled' : 'disabled'} successfully`,
            result.rows[0]
        );
    } catch (err) {
        console.error('adminTaskController.toggleMasterTaskStatus Error:', err);
        responseHandler.error(res, 'Failed to toggle master task status');
    }
};

/**
 * Delete Master Task (Hard Delete or Deactivate)
 */
exports.deleteMasterTask = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM master_tasks WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return responseHandler.error(res, 'Master task not found', 404);
        }
        responseHandler.success(res, 'Master task deleted successfully', result.rows[0]);
    } catch (err) {
        console.error('adminTaskController.deleteMasterTask Error:', err);
        responseHandler.error(res, 'Failed to delete master task');
    }
};
