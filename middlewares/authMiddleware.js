const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Check for inactivity, fetch role and current token version
        const userResult = await db.query('SELECT last_active_at, role, token_version FROM users WHERE id = $1', [decoded.id]);
        if (userResult.rows.length === 0) {
            console.log('Auth Failure: User not found for ID', decoded.id);
            return res.status(401).json({ message: 'User not found' });
        }

        const user = userResult.rows[0];

        // --- Single Device Session Check ---
        if (decoded.token_version !== undefined && decoded.token_version !== user.token_version) {
            console.log(`Auth Failure: Version mismatch for user ${decoded.id}. Token: ${decoded.token_version}, DB: ${user.token_version}`);
            return res.status(401).json({ message: 'Another device logged in. Please login again to continue.' });
        }

        req.user = { ...decoded, role: user.role };

        const lastActiveDate = userResult.rows[0].last_active_at ? new Date(userResult.rows[0].last_active_at) : new Date();
        const inactiveDuration = (new Date() - lastActiveDate) / (1000 * 60 * 60);

        if (inactiveDuration > 72) {
            console.log('Auth Failure: Session expired for user', decoded.id, 'Inactive for', inactiveDuration, 'hours');
            // Invalidate session for security
            await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [decoded.id]);
            return res.status(401).json({ message: 'Session expired due to 72h inactivity. Please login again.' });
        }

        // Update last active
        await db.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [decoded.id]);

        next();
    } catch (err) {
        console.log('Auth Failure: Invalid or expired token', err.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
