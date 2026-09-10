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
        responseHandler.error(res, 'We encountered an issue fetching your score history. Please try again later.');
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
        responseHandler.error(res, 'We encountered an issue fetching your profile details. Please try again later.');
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
        responseHandler.error(res, 'We encountered an issue fetching the user statistics. Please try again later.');
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
        responseHandler.error(res, 'We encountered an issue fetching the score history for this user. Please try again later.');
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
        responseHandler.error(res, 'We encountered an issue updating your timezone. Please check your connection and try again.');
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
        console.error('Update profile error:', err);
        responseHandler.error(res, 'Failed to update profile.');
    }
};

/**
 * Sync user device status (app_version & permissions_status)
 */
exports.syncDeviceStatus = async (req, res) => {
    const userId = req.user.id;
    const { app_version, permissions_status } = req.body;

    try {
        await db.query(
            `UPDATE users 
             SET app_version = COALESCE($1, app_version),
                 permissions_status = COALESCE($2, permissions_status)
             WHERE id = $3`,
            [app_version || null, permissions_status ? JSON.stringify(permissions_status) : null, userId]
        );
        responseHandler.success(res, 'Device status synced successfully');
    } catch (err) {
        console.error('syncDeviceStatus Error:', err);
        responseHandler.error(res, 'Failed to sync device status.');
    }
};

/**
 * Check for app updates against backend settings
 */
exports.checkAppUpdate = async (req, res) => {
    const currentVersion = req.query.current_version || '1.0.0';

    try {
        const result = await db.query(
            "SELECT key, value FROM app_settings WHERE key IN ('app_version_settings', 'latest_app_version', 'min_required_version', 'force_update_enabled', 'play_store_url')"
        );

        const settings = {};
        result.rows.forEach(row => {
            let val = row.value;
            try {
                if (typeof val === 'string') val = JSON.parse(val);
            } catch (e) {}
            settings[row.key] = val;
        });

        // Consolidate settings with defaults
        const latestVersion = settings.latest_app_version || '1.0.4';
        const minVersion = settings.min_required_version || '1.0.0';
        const forceUpdate = settings.force_update_enabled === true || settings.force_update_enabled === 'true';
        const playStoreUrl = settings.play_store_url || 'https://play.google.com/store/apps/details?id=com.myspiritualcoach';

        // Version comparator helper (e.g. "1.0.4" vs "1.0.5")
        const cleanVersion = (v) => String(v).replace(/^v/i, '').trim();
        const compareVersions = (v1, v2) => {
            const parts1 = cleanVersion(v1).split('.').map(Number);
            const parts2 = cleanVersion(v2).split('.').map(Number);
            for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                const val1 = parts1[i] || 0;
                const val2 = parts2[i] || 0;
                if (val1 > val2) return 1;
                if (val1 < val2) return -1;
            }
            return 0;
        };

        const isOutdated = compareVersions(currentVersion, latestVersion) < 0;
        const isBelowMin = compareVersions(currentVersion, minVersion) < 0;
        const isForceUpdate = isBelowMin || (isOutdated && forceUpdate);

        responseHandler.success(res, 'App update status fetched', {
            update_available: isOutdated,
            force_update: isForceUpdate,
            latest_version: latestVersion,
            min_required_version: minVersion,
            play_store_url: playStoreUrl,
            release_notes: settings.release_notes || 'Performance improvements and bug fixes.'
        });
    } catch (err) {
        console.error('checkAppUpdate Error:', err);
        responseHandler.error(res, 'Failed to check app update');
    }
};

