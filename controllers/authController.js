const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const nodemailer = require('nodemailer');
const Joi = require('joi');

const crypto = require('crypto');
const responseHandler = require('../utils/responseHandler');
const { generateTimestampId } = require('../utils/idGenerator');

// Joi Validation Schemas
const sendOTPSchema = Joi.object({
    email: Joi.string().email().required()
});

const verifyOTPSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required()
});

const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    phone_number: Joi.string().pattern(/^[0-9+]{10,15}$/).required(),
    password: Joi.string().min(6).required(),
    timezone: Joi.string().default('UTC'),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    year_of_birth: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
    fcm_token: Joi.string().optional(),
    country_code: Joi.string().optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    fcm_token: Joi.string().optional(),
    force: Joi.boolean().optional()
});

const refreshSchema = Joi.object({
    refresh_token: Joi.string().required()
});

// Helper to generate tokens
const generateTokens = async (user, client = db) => {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, token_version: user.token_version },
        process.env.JWT_SECRET,
        { expiresIn: '365d' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');

    await client.query(
        "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 years')",
        [user.id, refreshToken]
    );

    return { accessToken, refreshToken };
};

// Configure email transporter (supports any SMTP — Gmail, GoDaddy, etc.)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: process.env.EMAIL_SECURE !== 'false', // true for port 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper function to retry sending emails (handles intermittent ECONNRESET errors)
const sendMailWithRetry = async (mailOptions, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error(`Attempt ${i + 1} failed to send email to ${mailOptions.to}:`, error.message);
            if (i === retries - 1) throw error;
            await new Promise(res => setTimeout(res, 1500)); // wait 1.5s before retry
        }
    }
};

/**
 * @openapi
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP to email for verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
exports.sendOTP = async (req, res) => {
    // 1. Validation
    const { email } = req.body;
    const { error: validationError } = sendOTPSchema.validate(req.body);
    if (validationError) return responseHandler.error(res, validationError.details[0].message, 400);

    try {
        // Check if user already exists
        const userExists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return responseHandler.error(res, 'User with this email already registered', 409);
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Basic Rate Limiting: Check if a request was made in the last X seconds
        const cooldownSeconds = process.env.OTP_COOLDOWN_SECONDS || 60;
        const recentRequest = await db.query(
            `SELECT created_at FROM email_verifications WHERE email = $1 AND created_at > NOW() - INTERVAL '${cooldownSeconds} seconds'`,
            [email]
        );

        if (recentRequest.rows.length > 0) {
            return responseHandler.error(res, `Please wait ${cooldownSeconds} seconds before requesting a new OTP`, 429);
        }

        await db.query('DELETE FROM email_verifications WHERE email = $1', [email]);
        await db.query(
            "INSERT INTO email_verifications (email, otp, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')",
            [email, otp]
        );

        const mailOptions = {
            from: `"MySpiritualCoach" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email - MySpiritualCoach',
            text: `Your OTP for email verification is: ${otp}. It will expire in 10 minutes.`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); border: 1px solid #eef2f6;">
                    <div style="background: linear-gradient(135deg, #FF9933 0%, #FFCC33 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Hare Krishna</h1>
                        <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px; font-weight: 500;">Your spiritual journey begins here</p>
                    </div>
                    
                    <div style="padding: 40px 30px; text-align: center;">
                        <div style="background-color: #fff9f2; border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px dashed #FF9933;">
                            <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                            <h2 style="color: #1e293b; font-size: 48px; margin: 0; font-weight: 800; letter-spacing: 8px; color: #FF9933;">${otp}</h2>
                        </div>
                        
                        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                            Please use the code above to verify your email address. This code will expire in <strong>10 minutes</strong>.
                        </p>
                        
                        <div style="height: 1px; background-color: #e2e8f0; margin: 30px 0;"></div>
                        
                        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                            If you didn't request this code, you can safely ignore this email. Someone might have typed your email address by mistake.
                        </p>
                    </div>
                    
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #64748b; font-size: 12px; margin: 0; font-weight: 500;">
                            &copy; ${new Date().getFullYear()} MySpiritualCoach. All rights reserved.
                        </p>
                    </div>
                </div>
            `
        };

        console.log(`Sending OTP to: ${email}`);
        await sendMailWithRetry(mailOptions);
        console.log(`OTP successfully sent to: ${email}`);
        responseHandler.success(res, 'OTP sent successfully');
    } catch (err) {
        console.error('Error in sendOTP:', err);
        responseHandler.error(res, 'Error sending OTP');
    }
};

/**
 * @openapi
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP sent to email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string }
 *               otp: { type: string }
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
exports.verifyOTP = async (req, res) => {
    // 1. Validation
    const { error: validationError } = verifyOTPSchema.validate(req.body);
    if (validationError) return responseHandler.error(res, validationError.details[0].message, 400);

    const { email, otp } = req.body;

    try {
        const result = await db.query(
            'SELECT * FROM email_verifications WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
            [email, otp]
        );

        if (result.rows.length === 0) {
            return responseHandler.error(res, 'Invalid or expired OTP', 400);
        }

        await db.query('UPDATE email_verifications SET is_verified = TRUE WHERE email = $1', [email]);
        responseHandler.success(res, 'Email verified successfully');
    } catch (err) {
        console.error('Error verifying OTP:', err);
        responseHandler.error(res, 'Error verifying OTP');
    }
};

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 */
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const { error: validationError } = sendOTPSchema.validate(req.body);
    if (validationError) return responseHandler.error(res, validationError.details[0].message, 400);

    try {
        const userResult = await db.query('SELECT name FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return responseHandler.error(res, 'User not found with this email', 404);
        }

        const user = userResult.rows[0];
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await db.query('DELETE FROM email_verifications WHERE email = $1', [email]);
        await db.query(
            "INSERT INTO email_verifications (email, otp, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')",
            [email, otp]
        );

        const mailOptions = {
            from: `"MySpiritualCoach" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your Password - MySpiritualCoach',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #FF9933;">Password Reset Request</h2>
                    <p>Hare Krishna, <b>${user.name}</b>,</p>
                    <p>We received a request to reset your password. Use the following code to proceed:</p>
                    <div style="background: #fdf6ec; padding: 20px; text-align: center; border-radius: 8px;">
                        <h1 style="color: #FF9933; letter-spacing: 5px; margin: 0;">${otp}</h1>
                    </div>
                    <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                </div>
            `
        };

        await sendMailWithRetry(mailOptions);
        responseHandler.success(res, 'Password reset OTP sent successfully');
    } catch (err) {
        console.error('Error in forgotPassword:', err);
        responseHandler.error(res, 'Error processing password reset');
    }
};

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, password]
 *             properties:
 *               email: { type: string }
 *               otp: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
exports.resetPassword = async (req, res) => {
    const { error: validationError } = resetPasswordSchema.validate(req.body);
    if (validationError) return responseHandler.error(res, validationError.details[0].message, 400);

    const { email, otp, password } = req.body;

    try {
        const result = await db.query(
            'SELECT * FROM email_verifications WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
            [email, otp]
        );

        if (result.rows.length === 0) {
            return responseHandler.error(res, 'Invalid or expired OTP', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
        await db.query('DELETE FROM email_verifications WHERE email = $1', [email]);

        responseHandler.success(res, 'Password reset successfully. You can now login.');
    } catch (err) {
        console.error('Error resetting password:', err);
        responseHandler.error(res, 'Error resetting password');
    }
};

exports.register = async (req, res) => {
    // 1. Validation
    const { error: validationError } = registerSchema.validate(req.body);
    if (validationError) return responseHandler.error(res, validationError.details[0].message, 400);

    const { name, email, phone_number, password, timezone, gender, year_of_birth, fcm_token } = req.body;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Check if phone already registered
        const phoneCheck = await client.query('SELECT id FROM users WHERE phone_number = $1', [phone_number]);
        if (phoneCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return responseHandler.error(res, 'Phone number already registered', 409);
        }

        // Check if email is verified
        const verifyCheck = await client.query(
            'SELECT is_verified FROM email_verifications WHERE email = $1 AND is_verified = TRUE',
            [email]
        );

        if (verifyCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return responseHandler.error(res, 'Email not verified. Please verify your email first.', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = generateTimestampId();
        const result = await client.query(
            'INSERT INTO users (id, name, email, phone_number, password_hash, timezone, gender, year_of_birth, fcm_token) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, email',
            [userId, name, email, phone_number, hashedPassword, timezone, gender, year_of_birth, fcm_token]
        );

        // Clean up verification
        await client.query('DELETE FROM email_verifications WHERE email = $1', [email]);

        // Generate tokens
        const user = result.rows[0];
        const { accessToken, refreshToken } = await generateTokens(user, client);

        await client.query('COMMIT');
        responseHandler.success(res, 'User registered successfully', {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: name,
                email: user.email,
                phone_number: phone_number,
                gender: gender,
                timezone: timezone,
                profile_url: null,
                role: 'devotee'
            }
        }, 201);
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        if (err.code === '23505') {
            return responseHandler.error(res, 'Email already registered', 409);
        }
        responseHandler.error(res, 'Error registering user', 500);
    } finally {
        if (client) client.release();
    }
};

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               fcm_token: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
exports.login = async (req, res) => {
    // 1. Validation
    const { error: validationError } = loginSchema.validate(req.body);
    if (validationError) return responseHandler.error(res, validationError.details[0].message, 400);

    const { email, password, fcm_token, force } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return responseHandler.error(res, 'User not found with this email', 404);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return responseHandler.error(res, 'Invalid password. Please try again.', 401);
        }

        if (!user.is_active) {
            return responseHandler.error(res, 'Account is deactivated. Please contact support.', 403);
        }

        // --- Single Device Session Logic ---
        // If user already has an FCM token and it's different from the current one, warn them
        if (user.fcm_token && user.fcm_token !== fcm_token && !force) {
            return responseHandler.error(res, 'SESSION_ALREADY_ACTIVE', 409);
        }

        let newTokenVersion = (user.token_version || 0) + 1;

        // Update FCM Token, Last active, and Increment Token Version
        await db.query(
            'UPDATE users SET fcm_token = $1, last_active_at = NOW(), token_version = $2 WHERE id = $3',
            [fcm_token || user.fcm_token, newTokenVersion, user.id]
        );

        // Update user object for token generation
        user.token_version = newTokenVersion;

        // Clean old sessions (refresh tokens)
        await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);

        const { accessToken, refreshToken } = await generateTokens(user);

        // --- Trigger Security Email Notification ---
        // We will send this in the background
        const sendSecurityEmail = async () => {
            try {
                const mailOptions = {
                    from: `"MySpiritualCoach Security" <${process.env.EMAIL_USER}>`,
                    to: user.email,
                    subject: 'Security Alert: New Sign-in Detected 🔐',
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                            <h2 style="color: #FF9933;">Security Alert</h2>
                            <p>Hare Krishna, <b>${user.name}</b>,</p>
                            <p>A new sign-in was detected on your account.</p>
                            <p><b>Time:</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                            <p>If this was you, you can safely ignore this email. If not, please change your password immediately to secure your account.</p>
                            <hr style="border: 0; border-top: 1px solid #eee;" />
                            <p style="font-size: 12px; color: #777;">&copy; MySpiritualCoach Team</p>
                        </div>
                    `
                };
                await sendMailWithRetry(mailOptions);
                console.log(`Security email sent to: ${user.email}`);
            } catch (emailErr) {
                console.error('Failed to send security email:', emailErr);
            }
        };
        sendSecurityEmail();

        responseHandler.success(res, 'Login successful', {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone_number: user.phone_number,
                gender: user.gender,
                timezone: user.timezone,
                profile_url: user.profile_url,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Error logging in:', err);
        responseHandler.error(res, 'Internal server error', 500);
    }
};

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token: { type: string }
 *     responses:
 *       200:
 *         description: Token refreshed
 */
exports.refresh = async (req, res) => {
    const { error: validationError } = refreshSchema.validate(req.body);
    if (validationError) return responseHandler.error(res, validationError.details[0].message, 400);

    const { refresh_token } = req.body;

    try {
        const result = await db.query(
            'SELECT r.*, u.email FROM refresh_tokens r JOIN users u ON r.user_id = u.id WHERE r.token = $1 AND r.expires_at > NOW()',
            [refresh_token]
        );

        if (result.rows.length === 0) {
            return responseHandler.error(res, 'Invalid or expired refresh token', 401);
        }

        const session = result.rows[0];
        const accessToken = jwt.sign(
            { id: session.user_id, email: session.email },
            process.env.JWT_SECRET,
            { expiresIn: '365d' }
        );

        // Slide the last active window
        await db.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [session.user_id]);
        responseHandler.success(res, 'Token refreshed', { accessToken });
    } catch (err) {
        console.error('Error refreshing token:', err);
        responseHandler.error(res, 'Error refreshing token');
    }
};

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout user (invalidate refresh token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token: { type: string }
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
exports.logout = async (req, res) => {
    const { refresh_token } = req.body;

    try {
        if (refresh_token) {
            await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refresh_token]);
        }
        // Clear FCM token to stop notifications
        if (req.user && req.user.id) {
            await db.query('UPDATE users SET fcm_token = NULL WHERE id = $1', [req.user.id]);
        }
        responseHandler.success(res, 'Logged out successfully');
    } catch (err) {
        console.error('Error logging out:', err);
        responseHandler.error(res, 'Error logging out');
    }
};
/**
 * @openapi
 * /api/auth/deactivate:
 *   post:
 *     summary: Deactivate user account (Soft Delete)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 */
exports.deactivateAccount = async (req, res) => {
    try {
        await db.query('UPDATE users SET is_active = FALSE WHERE id = $1', [req.user.id]);

        // Optionally, invalidate all refresh tokens
        await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);

        responseHandler.success(res, 'Account deactivated successfully');
    } catch (err) {
        console.error('Error deactivating account:', err);
        responseHandler.error(res, 'Error deactivating account', 500);
    }
};

exports.sendTestNotification = async (req, res) => {
    try {
        const { id } = req.user;
        const userResult = await db.query('SELECT fcm_token FROM users WHERE id = $1', [id]);
        const user = userResult.rows[0];

        if (!user || !user.fcm_token) {
            return responseHandler.error(res, 'No FCM token found for user in DB', 400);
        }

        const { sendNotification } = require('../services/notificationService');
        const result = await sendNotification(user.fcm_token, {
            data: {
                title: 'Test Notification 🔔',
                body: `This is a simple test notification to check if it works.`,
                daily_task_id: '00000000-0000-0000-0000-000000000000',
                options: JSON.stringify([])
            }
        });

        if (result) {
            return responseHandler.success(res, 'Test notification sent successfully!');
        } else {
            return responseHandler.error(res, 'Failed to send notification. Check server logs.', 500);
        }
    } catch (err) {
        console.error('Error in sendTestNotification:', err);
        return responseHandler.error(res, 'Internal server error', 500);
    }
};