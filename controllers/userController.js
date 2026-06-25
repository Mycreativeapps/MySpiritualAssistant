const db = require('../config/db');
const responseHandler = require('../utils/responseHandler');

/**
 * Get daily total scores for the last 7 days
 */
exports.getScoreHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.query(`
            SELECT 
                date::date as day,
                SUM(score) as total_score
            FROM daily_tasks
            WHERE user_id = $1
            AND date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY day
            ORDER BY day ASC
        `, [userId]);

        responseHandler.success(res, 'Score history fetched', result.rows);
    } catch (err) {
        console.error('getScoreHistory Error:', err);
        responseHandler.error(res, 'Failed to fetch score history');
    }
};

/**
 * Get user profile stats (join date, routine totals)
 */
exports.getProfileStats = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.query(`
            SELECT 
                u.id, u.name, u.email, u.phone_number, u.gender, u.year_of_birth, u.timezone, u.profile_url, u.role, u.is_active, u.created_at as join_date,
                (SELECT COUNT(*) FROM user_routines WHERE user_id = $1 AND is_active = true) as active_routines,
                (SELECT SUM(score) FROM daily_tasks WHERE user_id = $1) as lifetime_score
            FROM users u
            WHERE u.id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return responseHandler.error(res, 'User not found', 404);
        }

        responseHandler.success(res, 'Profile stats fetched', result.rows[0]);
    } catch (err) {
        console.error('getProfileStats Error:', err);
        responseHandler.error(res, 'Failed to fetch profile stats');
    }
};

/**
 * Get stats for a specific user by ID
 */
exports.getUserStatsById = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(`
            SELECT 
                u.name, u.email, u.phone_number, u.gender, u.year_of_birth, u.profile_url, u.created_at as join_date,
                (SELECT COUNT(*) FROM daily_tasks WHERE user_id = $1 AND completed_at IS NOT NULL) as tasks_completed,
                (SELECT SUM(score) FROM daily_tasks WHERE user_id = $1) as lifetime_score
            FROM users u
            WHERE u.id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return responseHandler.error(res, 'User not found', 404);
        }

        responseHandler.success(res, 'User stats fetched', result.rows[0]);
    } catch (err) {
        console.error('getUserStatsById Error:', err);
        responseHandler.error(res, 'Failed to fetch user stats');
    }
};

/**
 * Get daily total scores for a specific user by ID for the last 7 days
 */
exports.getUserScoreHistoryById = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(`
            SELECT 
                date::date as day,
                SUM(score) as total_score
            FROM daily_tasks
            WHERE user_id = $1
            AND date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY day
            ORDER BY day ASC
        `, [userId]);

        responseHandler.success(res, 'Score history fetched', result.rows);
    } catch (err) {
        console.error('getUserScoreHistoryById Error:', err);
        responseHandler.error(res, 'Failed to fetch score history');
    }
};

/**
 * Sync user timezone
 */
exports.syncTimezone = async (req, res) => {
    const userId = req.user.id;
    const { timezone } = req.body;

    if (!timezone) {
        return responseHandler.error(res, 'Timezone is required', 400);
    }

    try {
        await db.query(
            'UPDATE users SET timezone = $1 WHERE id = $2',
            [timezone, userId]
        );
        responseHandler.success(res, 'Timezone synced successfully');
    } catch (err) {
        console.error('syncTimezone Error:', err);
        responseHandler.error(res, 'Failed to sync timezone');
    }
};

/**
 * Update user profile (name, profile_url, gender)
 */
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, profile_url, gender, year_of_birth, phone_number } = req.body;

    try {
        const result = await db.query(
            `UPDATE users 
             SET name = COALESCE($1, name), 
                 profile_url = COALESCE($2, profile_url),
                 gender = COALESCE($3, gender),
                 year_of_birth = COALESCE($4, year_of_birth),
                 phone_number = COALESCE($5, phone_number)
             WHERE id = $6 
             RETURNING id, name, email, phone_number, gender, year_of_birth, timezone, profile_url, role`,
            [name || null, profile_url || null, gender || null, year_of_birth || null, phone_number || null, userId]
        );

        if (result.rows.length === 0) {
            return responseHandler.error(res, 'User not found', 404);
        }

        responseHandler.success(res, 'Profile updated successfully', result.rows[0]);
    } catch (err) {
        console.error('updateProfile Error:', err);
        responseHandler.error(res, 'Failed to update profile');
    }
};
