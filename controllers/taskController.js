const db = require('../config/db');
const responseHandler = require('../utils/responseHandler');
const { generateTimestampId } = require('../utils/idGenerator');
const { sendNotification } = require('../services/notificationService');
const moment = require('moment-timezone');

/**
 * Normalizes time strings from various client formats (e.g., "6:25 pm", "18:25")
 * into a standard PostgreSQL-compatible 24-hour format (HH:mm).
 */
const normalizeTime = (timeStr) => {
    if (!timeStr) return null;
    // Replace non-breaking spaces if any, and trim
    const cleanTime = timeStr.replace(/\s/g, ' ').trim();
    const parsed = moment(cleanTime, ["h:mm a", "H:mm", "HH:mm"], true);
    return parsed.isValid() ? parsed.format("HH:mm") : timeStr;
};

/**
 * @openapi
 * /api/tasks/master:
 *   get:
 *     summary: Get all master tasks for Bhakti Health Score
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: List of master tasks grouped by category
 */
exports.getMasterTasks = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM master_tasks ORDER BY id ASC');

        responseHandler.success(res, 'Master tasks fetched successfully', result.rows);
    } catch (err) {
        console.error('Error fetching master tasks:', err);
        responseHandler.error(res, 'Error fetching master tasks');
    }
};

/**
 * @openapi
 * /api/tasks/assign:
 *   post:
 *     summary: Self-assign master tasks as routines
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskIds]
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items: { type: integer }
 *     responses:
 *       201:
 *         description: Tasks assigned successfully
 */
exports.assignTasks = async (req, res) => {
    const userId = req.user.id;
    const { taskIds, tasks, effectiveDate } = req.body;

    let tasksList = [];
    if (tasks && Array.isArray(tasks)) {
        tasksList = tasks;
    } else if (taskIds && Array.isArray(taskIds)) {
        tasksList = taskIds.map(id => ({ id, notify: true }));
    }

    if (tasksList.length < 5) {
        return responseHandler.error(res, 'Please select at least 5 tasks', 400);
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const ids = tasksList.map(t => t.id);

        // 1. Get task details for validation/logging
        const tasksResult = await client.query(
            'SELECT id, task_name, scheduled_time FROM master_tasks WHERE id = ANY($1)',
            [ids]
        );

        // 2. Mark existing routines as inactive if they are not in the new selection
        // This ensures the cron job next time only sees the new ones
        await client.query(
            'UPDATE user_routines SET is_active = false WHERE user_id = $1 AND master_task_id IS NOT NULL AND NOT (master_task_id = ANY($2))',
            [userId, ids]
        );

        // 3. Insert/Activate new routines
        const userResult = await client.query('SELECT timezone FROM users WHERE id = $1', [userId]);
        const userTimezone = userResult.rows[0]?.timezone || 'UTC';
        const moment = require('moment-timezone');
        const todayStr = moment().tz(userTimezone).format('YYYY-MM-DD');
        const targetDate = effectiveDate || todayStr;

        for (const task of tasksResult.rows) {
            const normalizedScheduledTime = normalizeTime(task.scheduled_time);
            const notify = tasksList.find(t => t.id === task.id)?.notify ?? true;
            
            const routineResult = await client.query(
                `INSERT INTO user_routines (user_id, master_task_id, task_name, scheduled_time, is_active, notifications_enabled, assigned_by) 
                 VALUES ($1, $2, $3, $4, true, $5, $1) 
                 ON CONFLICT (user_id, master_task_id) 
                 DO UPDATE SET is_active = true, scheduled_time = EXCLUDED.scheduled_time, notifications_enabled = EXCLUDED.notifications_enabled, assigned_by = EXCLUDED.assigned_by
                 RETURNING id`,
                [userId, task.id, task.task_name, normalizedScheduledTime, notify]
            );

            const routineId = routineResult.rows[0].id;

            // If effective date is Today or in the past (applied now), generate today's tasks
            if (targetDate <= todayStr) {
                const taskId = generateTimestampId();
                await client.query(`
                    INSERT INTO daily_tasks (id, routine_id, user_id, date, score)
                    VALUES ($1, $2, $3, $4, 0)
                    ON CONFLICT (routine_id, date) DO NOTHING
                `, [taskId, routineId, userId, todayStr]);
            }
        }

        // 4. If applying "From Now" (today), we might want to hide/remove today's tasks that were deactivated
        if (targetDate <= todayStr) {
            await client.query(`
                DELETE FROM daily_tasks 
                WHERE user_id = $1 AND date = $2 
                AND routine_id IN (
                    SELECT id FROM user_routines WHERE user_id = $1 AND is_active = false
                )
                AND (score = 0 OR score IS NULL)
            `, [userId, todayStr]);
        }

        // 5. Update level removed
        // await client.query('UPDATE users SET current_level = 2 WHERE id = $1', [userId]);

        await client.query('COMMIT');
        responseHandler.success(res, 'Tasks updated successfully', { effectiveDate: targetDate }, 201);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error assigning tasks:', err);
        responseHandler.error(res, 'Error assigning tasks');
    } finally {
        client.release();
    }
};

/**
 * @openapi
 * /api/tasks/assign-mentee:
 *   post:
 *     summary: Mentor assigns routines to a mentee
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mentee_id, taskIds]
 *             properties:
 *               mentee_id: { type: string }
 *               taskIds:
 *                 type: array
 *                 items: { type: integer }
 */
exports.assignTaskToMentee = async (req, res) => {
    const mentorId = req.user.id;
    const { mentee_id, taskIds, tasks, effectiveDate } = req.body;

    let tasksList = [];
    if (tasks && Array.isArray(tasks)) {
        tasksList = tasks;
    } else if (taskIds && Array.isArray(taskIds)) {
        tasksList = taskIds.map(id => ({ id, notify: true }));
    }

    if (!mentee_id || tasksList.length === 0) {
        return responseHandler.error(res, 'Mentee ID and at least one task are required', 400);
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verify mentor-mentee relationship: Is mentorId a parent of mentee_id?
        const relationshipCheck = await client.query(
            'SELECT 1 FROM user_relationships WHERE parent_id = $1 AND child_id = $2',
            [mentorId, mentee_id]
        );

        if (relationshipCheck.rows.length === 0) {
            return responseHandler.error(res, 'Access Denied: You are not the mentor of this user.', 403);
        }

        // 2. Get task details for validation/logging
        const ids = tasksList.map(t => t.id);
        const tasksResult = await client.query(
            'SELECT id, task_name, scheduled_time FROM master_tasks WHERE id = ANY($1)',
            [ids]
        );

        // 3. Mark existing routines for mentee as inactive if not in new selection
        await client.query(
            'UPDATE user_routines SET is_active = false WHERE user_id = $1 AND master_task_id IS NOT NULL AND NOT (master_task_id = ANY($2))',
            [mentee_id, ids]
        );

        // 4. Insert/Activate new routines for mentee
        const userResult = await client.query('SELECT timezone, fcm_token FROM users WHERE id = $1', [mentee_id]);
        const mentee = userResult.rows[0];
        const userTimezone = mentee?.timezone || 'UTC';
        const moment = require('moment-timezone');
        const todayStr = moment().tz(userTimezone).format('YYYY-MM-DD');
        const targetDate = effectiveDate || todayStr;

        for (const task of tasksResult.rows) {
            const normalizedScheduledTime = normalizeTime(task.scheduled_time);
            const notify = tasksList.find(t => t.id === task.id)?.notify ?? true;

            const routineResult = await client.query(
                `INSERT INTO user_routines (user_id, master_task_id, task_name, scheduled_time, is_active, notifications_enabled, assigned_by) 
                 VALUES ($1, $2, $3, $4, true, $5, $6) 
                 ON CONFLICT (user_id, master_task_id) 
                 DO UPDATE SET is_active = true, scheduled_time = EXCLUDED.scheduled_time, notifications_enabled = EXCLUDED.notifications_enabled, assigned_by = EXCLUDED.assigned_by
                 RETURNING id`,
                [mentee_id, task.id, task.task_name, normalizedScheduledTime, notify, mentorId]
            );

            const routineId = routineResult.rows[0].id;

            // If effective date is Today or in the past, generate today's tasks
            if (targetDate <= todayStr) {
                const taskId = generateTimestampId();
                await client.query(`
                    INSERT INTO daily_tasks (id, routine_id, user_id, date, score)
                    VALUES ($1, $2, $3, $4, 0)
                    ON CONFLICT (routine_id, date) DO NOTHING
                `, [taskId, routineId, mentee_id, todayStr]);
            }
        }

        // 5. Cleanup deactivated tasks for today if targetDate is today or past
        if (targetDate <= todayStr) {
            await client.query(`
                DELETE FROM daily_tasks 
                WHERE user_id = $1 AND date = $2 
                AND routine_id IN (
                    SELECT id FROM user_routines WHERE user_id = $1 AND is_active = false
                )
                AND (score = 0 OR score IS NULL)
            `, [mentee_id, todayStr]);
        }

        await client.query('COMMIT');

        // Send Notification
        if (mentee?.fcm_token) {
            sendNotification(mentee.fcm_token, {
                title: 'New Tasks Assigned',
                body: 'Your mentor has assigned new tasks for you.'
            });
        }

        responseHandler.success(res, 'Tasks assigned to mentee successfully', { effectiveDate: targetDate }, 201);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in assignTaskToMentee:', err);
        responseHandler.error(res, 'Error assigning tasks to mentee');
    } finally {
        client.release();
    }
};

/**
 * @openapi
 * /api/tasks/daily:
 *   get:
 *     summary: Get user's daily tasks with options
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
exports.getUserDailyTasks = async (req, res) => {
    const userId = req.user.id;
    let { date } = req.query;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Get user's timezone to calculate local "today"
        const userResult = await client.query('SELECT timezone FROM users WHERE id = $1', [userId]);
        const userTimezone = userResult.rows[0]?.timezone || 'UTC';
        const moment = require('moment-timezone');
        const todayStr = moment().tz(userTimezone).format('YYYY-MM-DD');
        
        if (!date) {
            date = todayStr;
        }

        // 1. Check if tasks already exist for this date
        // Join with user_routines to get scheduled_time
        const existingTasks = await client.query(`
            SELECT 
                dt.id as daily_task_id,
                ur.id as routine_id,
                dt.score,
                dt.completed_at,
                ur.task_name,
                ur.scheduled_time,
                ur.notifications_enabled,
                ur.assigned_by,
                mt.options as master_options,
                ur.options as custom_options
            FROM daily_tasks dt
            JOIN user_routines ur ON dt.routine_id = ur.id
            LEFT JOIN master_tasks mt ON ur.master_task_id = mt.id
            WHERE dt.user_id = $1 AND dt.date = $2
        `, [userId, date]);

        if (existingTasks.rows.length > 0) {
            const tasks = existingTasks.rows.map(task => ({
                ...task,
                options: task.custom_options || task.master_options
            }));
            await client.query('COMMIT');
            return responseHandler.success(res, 'Daily tasks fetched', tasks);
        }

        // 2. If no tasks exist and it's for Today or Future, auto-populate from active routines
        if (date >= todayStr) {
            // Check if user has ANY active routines valid for this date
            const routineCheck = await client.query(
                `SELECT COUNT(*) FROM user_routines 
                 WHERE user_id = $1 AND is_active = true 
                 AND (start_date IS NULL OR start_date <= $2)
                 AND (end_date IS NULL OR end_date >= $2)`,
                [userId, date]
            );

            if (parseInt(routineCheck.rows[0].count) === 0) {
                // If no routines, return empty list so mobile app shows selection screen
                await client.query('COMMIT');
                return responseHandler.success(res, 'No routines set', []);
            }

            // Now insert daily tasks from routines (including defaults if just added)
            // Note: For bulk auto-generation, we generate IDs for each
            const activeRoutines = await client.query(
                `SELECT id FROM user_routines 
                 WHERE user_id = $1 AND is_active = true 
                 AND (start_date IS NULL OR start_date <= $2)
                 AND (end_date IS NULL OR end_date >= $2)`,
                [userId, date]
            );
            for (const routine of activeRoutines.rows) {
                const taskId = generateTimestampId();
                await client.query(`
                    INSERT INTO daily_tasks (id, routine_id, user_id, date, score)
                    VALUES ($1, $2, $3, $4, 0)
                    ON CONFLICT (routine_id, date) DO NOTHING
                `, [taskId, routine.id, userId, date]);
            }

            // Fetch newly created tasks
            const newTasks = await client.query(`
                SELECT 
                    dt.id as daily_task_id,
                    ur.id as routine_id,
                    dt.score,
                    dt.completed_at,
                    ur.task_name,
                    ur.scheduled_time,
                    ur.notifications_enabled,
                    ur.assigned_by,
                    mt.options as master_options,
                    ur.options as custom_options
                FROM daily_tasks dt
                JOIN user_routines ur ON dt.routine_id = ur.id
                LEFT JOIN master_tasks mt ON ur.master_task_id = mt.id
                WHERE dt.user_id = $1 AND dt.date = $2
            `, [userId, date]);

            const tasks = newTasks.rows.map(task => ({
                ...task,
                options: task.custom_options || task.master_options
            }));

            await client.query('COMMIT');
            return responseHandler.success(res, 'Daily tasks auto-generated and fetched', tasks);
        }

        await client.query('COMMIT');
        responseHandler.success(res, 'No tasks found for this date', []);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in getUserDailyTasks:', err);
        responseHandler.error(res, 'Error fetching/generating daily tasks');
    } finally {
        client.release();
    }
};

/**
 * Routine Management
 */

exports.getRoutines = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.query(
            'SELECT * FROM user_routines WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        responseHandler.success(res, 'Routines fetched', result.rows);
    } catch (err) {
        console.error('getRoutines Error:', err);
        responseHandler.error(res, 'Failed to fetch routines');
    }
};

exports.createRoutine = async (req, res) => {
    const userId = req.user.id;
    const { task_name, scheduled_time, options, start_date, end_date, notifications_enabled } = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const normalizedScheduledTime = normalizeTime(scheduled_time);
        const notify = notifications_enabled ?? true;
        const routineResult = await client.query(
            `INSERT INTO user_routines (user_id, task_name, scheduled_time, options, start_date, end_date, is_active, notifications_enabled, assigned_by) 
             VALUES ($1, $2, $3, $4, $5, $6, true, $7, $1) RETURNING *`,
            [userId, task_name, normalizedScheduledTime, JSON.stringify(options || {}), start_date || null, end_date || null, notify]
        );

        const routineId = routineResult.rows[0].id;
        
        const userResult = await client.query('SELECT timezone FROM users WHERE id = $1', [userId]);
        const userTimezone = userResult.rows[0]?.timezone || 'UTC';
        const moment = require('moment-timezone');
        const todayStr = moment().tz(userTimezone).format('YYYY-MM-DD');
        
        const taskId = generateTimestampId();

        await client.query(`
            INSERT INTO daily_tasks (id, routine_id, user_id, date, score)
            VALUES ($1, $2, $3, $4, 0)
            ON CONFLICT (routine_id, date) DO NOTHING
        `, [taskId, routineId, userId, todayStr]);

        await client.query('COMMIT');
        responseHandler.success(res, 'Routine created', routineResult.rows[0], 201);
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('createRoutine Error:', err);
        responseHandler.error(res, 'Failed to create routine');
    } finally {
        if (client) client.release();
    }
};

exports.createRoutineForMentee = async (req, res) => {
    const mentorId = req.user.id;
    const { mentee_id, task_name, scheduled_time, options, start_date, end_date, notifications_enabled } = req.body;

    if (!mentee_id || !task_name) {
        return responseHandler.error(res, 'Mentee ID and Task Name are required', 400);
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verify mentor-mentee relationship
        const relationshipCheck = await client.query(
            'SELECT 1 FROM user_relationships WHERE parent_id = $1 AND child_id = $2',
            [mentorId, mentee_id]
        );

        if (relationshipCheck.rows.length === 0) {
            return responseHandler.error(res, 'Access Denied: You are not the mentor of this user.', 403);
        }

        const normalizedScheduledTime = normalizeTime(scheduled_time);
        const notify = notifications_enabled ?? true;
        const routineResult = await client.query(
            `INSERT INTO user_routines (user_id, task_name, scheduled_time, options, start_date, end_date, is_active, notifications_enabled, assigned_by) 
             VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8) RETURNING *`,
            [mentee_id, task_name, normalizedScheduledTime, JSON.stringify(options || {}), start_date || null, end_date || null, notify, mentorId]
        );

        const routineId = routineResult.rows[0].id;
        
        const userResult = await client.query('SELECT timezone, fcm_token FROM users WHERE id = $1', [mentee_id]);
        const mentee = userResult.rows[0];
        const userTimezone = mentee?.timezone || 'UTC';
        const moment = require('moment-timezone');
        const todayStr = moment().tz(userTimezone).format('YYYY-MM-DD');
        
        const taskId = generateTimestampId();

        await client.query(`
            INSERT INTO daily_tasks (id, routine_id, user_id, date, score)
            VALUES ($1, $2, $3, $4, 0)
            ON CONFLICT (routine_id, date) DO NOTHING
        `, [taskId, routineId, mentee_id, todayStr]);

        await client.query('COMMIT');

        // Send Notification
        if (mentee?.fcm_token) {
            sendNotification(mentee.fcm_token, {
                title: 'New Routine Assigned',
                body: `Your mentor has assigned a new routine: ${task_name}`
            });
        }

        responseHandler.success(res, 'Routine created for mentee', routineResult.rows[0], 201);
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('createRoutineForMentee Error:', err);
        responseHandler.error(res, 'Failed to create routine for mentee');
    } finally {
        if (client) client.release();
    }
};

exports.updateRoutine = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { task_name, scheduled_time, is_active, options, notifications_enabled } = req.body;
    try {
        // First check permissions
        const currentRoutine = await db.query('SELECT assigned_by FROM user_routines WHERE id = $1 AND user_id = $2', [id, userId]);
        if (currentRoutine.rows.length === 0) return responseHandler.error(res, 'Routine not found', 404);
        
        const routine = currentRoutine.rows[0];
        if (routine.assigned_by && routine.assigned_by !== userId) {
            return responseHandler.error(res, 'Cannot edit a task assigned by a mentor', 403);
        }

        const normalizedScheduledTime = normalizeTime(scheduled_time);
        const notify = notifications_enabled ?? true;
        const result = await db.query(
            'UPDATE user_routines SET task_name = $1, scheduled_time = $2, is_active = $3, options = $4, notifications_enabled = $5 WHERE id = $6 RETURNING *',
            [task_name, normalizedScheduledTime, is_active, JSON.stringify(options || {}), notify, id]
        );
        
        // Reset last_notified_at for today's pending tasks so the notification triggers again at the new time
        await db.query(
            'UPDATE daily_tasks SET last_notified_at = NULL WHERE routine_id = $1 AND score = 0',
            [id]
        );
        
        responseHandler.success(res, 'Routine updated', result.rows[0]);
    } catch (err) {
        console.error('updateRoutine Error:', err);
        responseHandler.error(res, 'Error updating routine');
    }
};

/**
 * @openapi
 * /api/tasks/routines/{id}:
 *   delete:
 *     summary: Soft delete a custom routine
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Routine deleted
 */
exports.deleteRoutine = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const currentRoutine = await db.query('SELECT assigned_by FROM user_routines WHERE id = $1 AND user_id = $2', [id, userId]);
        if (currentRoutine.rows.length === 0) return responseHandler.error(res, 'Routine not found', 404);
        
        const routine = currentRoutine.rows[0];
        if (routine.assigned_by && routine.assigned_by !== userId) {
            return responseHandler.error(res, 'Cannot delete a task assigned by a mentor', 403);
        }

        const result = await db.query(
            'UPDATE user_routines SET is_active = false WHERE id = $1 RETURNING id',
            [id]
        );

        // Delete any uncompleted daily tasks for this routine so they disappear immediately
        await db.query(
            'DELETE FROM daily_tasks WHERE routine_id = $1 AND completed_at IS NULL',
            [id]
        );
        responseHandler.success(res, 'Routine deleted');
    } catch (err) {
        console.error('deleteRoutine Error:', err);
        responseHandler.error(res, 'Failed to delete routine');
    }
};

/**
 * @openapi
 * /api/tasks/{id}/score:
 *   put:
 *     summary: Update score for a daily task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [score]
 *             properties:
 *               score: { type: integer, minimum: 0, maximum: 4 }
 */
exports.updateTaskScore = async (req, res) => {
    const { id } = req.params;
    const { score } = req.body;

    try {
        const result = await db.query(
            'UPDATE daily_tasks SET score = $1, completed_at = NOW() WHERE id = $2 RETURNING *',
            [score, id]
        );

        if (result.rows.length === 0) {
            return responseHandler.error(res, 'Task not found', 404);
        }

        responseHandler.success(res, 'Score updated', result.rows[0]);
    } catch (err) {
        console.error('Error updating score:', err);
        responseHandler.error(res, 'Error updating score');
    }
};
