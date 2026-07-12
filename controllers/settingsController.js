const db = require('../config/db');
const responseHandler = require('../utils/responseHandler');

/**
 * @openapi
 * /api/settings/{key}:
 *   get:
 *     summary: Get a specific setting by key
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 */
exports.getSetting = async (req, res) => {
    const { key } = req.params;
    try {
        const result = await db.query('SELECT value FROM app_settings WHERE key = $1', [key]);
        if (result.rows.length > 0) {
            responseHandler.success(res, 'Setting fetched successfully', result.rows[0].value);
        } else {
            responseHandler.error(res, 'Setting not found', 404);
        }
    } catch (err) {
        console.error('Error fetching setting:', err);
        responseHandler.error(res, 'Error fetching setting');
    }
};

/**
 * @openapi
 * /api/settings/{key}:
 *   put:
 *     summary: Update a specific setting by key
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: object
 *                 description: The JSON value to store
 */
exports.updateSetting = async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    try {
        // Fetch feature_permissions to check if user is authorized
        const permResult = await db.query('SELECT value FROM app_settings WHERE key = $1', ['feature_permissions']);
        let isAuthorized = false;
        
        if (permResult.rows.length > 0) {
            const permissions = permResult.rows[0].value;
            // Check specific keys based on what they are trying to update
            if (key === 'donation_details' && permissions.edit_support_us?.includes(req.user.id)) {
                isAuthorized = true;
            }
            // Add other setting key permissions here if needed
        }

        if (!isAuthorized) {
            return responseHandler.error(res, 'Access Denied: You do not have permission to modify this setting.', 403);
        }
        await db.query(
            `INSERT INTO app_settings (key, value, updated_at) 
             VALUES ($1, $2, NOW()) 
             ON CONFLICT (key) 
             DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
            [key, JSON.stringify(value)]
        );
        responseHandler.success(res, 'Setting updated successfully');
    } catch (err) {
        console.error('Error updating setting:', err);
        responseHandler.error(res, 'Error updating setting');
    }
};
