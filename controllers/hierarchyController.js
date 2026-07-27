const db = require('../config/db');
const responseHandler = require('../utils/responseHandler');

/**
 * @openapi
 * /api/hierarchy/assign:
 *   post:
 *     summary: Assign a parent to a child
 *     tags: [Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [parent_id]
 *             properties:
 *               parent_id: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Parent assigned successfully
 */
exports.assignParent = async (req, res) => {
    const child_id = req.user.id;
    const { parent_id } = req.body;

    try {
        if (child_id === parent_id) {
            return responseHandler.error(res, 'You cannot set yourself as your own mentor', 400);
        }

        // Check for circular relationship: Is the person you are trying to set as mentor actually your mentee?
        const circularCheck = await db.query(
            'SELECT 1 FROM user_relationships WHERE parent_id = $1 AND child_id = $2',
            [child_id, parent_id]
        );

        if (circularCheck.rows.length > 0) {
            return responseHandler.error(res, 'This user is already your mentee. A mentor cannot be their own mentee.', 400);
        }

        // 1. Assign parent (Idempotent using ON CONFLICT)
        const user_relation_id = `${require('crypto').randomUUID()}_${Date.now()}`;
        await db.query(
            'INSERT INTO user_relationships (user_relation_id, parent_id, child_id) VALUES ($1, $2, $3) ON CONFLICT (parent_id, child_id) DO NOTHING',
            [user_relation_id, parent_id, child_id]
        );

        responseHandler.success(res, 'Mentor assigned successfully');
    } catch (err) {
        console.error(err);
        responseHandler.error(res, 'We encountered an issue assigning this mentor. Please try again later.');
    }
};

/**
 * @openapi
 * /api/hierarchy/children:
 *   get:
 *     summary: Fetch direct Level 1 children
 *     tags: [Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of children
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
exports.getChildren = async (req, res) => {
    const parent_id = req.user.id;

    try {
        const result = await db.query(
            `SELECT 
                u.id, u.name, u.email, u.phone_number, u.profile_url, u.gender,
                (SELECT SUM(score) FROM daily_tasks WHERE user_id = u.id) as lifetime_score
             FROM users u 
             JOIN user_relationships r ON u.id = r.child_id 
             WHERE r.parent_id = $1 AND u.is_active = true`,
            [parent_id]
        );
        responseHandler.success(res, 'Mentees fetched successfully', result.rows);
    } catch (err) {
        console.error(err);
        responseHandler.error(res, 'We encountered an issue fetching your mentees. Please try again later.');
    }
};

/**
 * @openapi
 * /api/hierarchy/parents:
 *   get:
 *     summary: Fetch direct mentors (parents)
 *     tags: [Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of mentors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
exports.getParents = async (req, res) => {
    const child_id = req.user.id;

    try {
        const result = await db.query(
            `SELECT 
                u.id, u.name, u.email, u.phone_number, u.profile_url, u.gender,
                (SELECT SUM(score) FROM daily_tasks WHERE user_id = u.id) as lifetime_score
             FROM users u 
             JOIN user_relationships r ON u.id = r.parent_id 
             WHERE r.child_id = $1 AND u.is_active = true`,
            [child_id]
        );
        responseHandler.success(res, 'Mentors fetched successfully', result.rows);
    } catch (err) {
        console.error(err);
        responseHandler.error(res, 'We encountered an issue fetching your mentors. Please try again later.');
    }
};
