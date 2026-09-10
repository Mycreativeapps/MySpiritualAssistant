const express = require('express');
const router = express.Router();

const authMiddleware = require('../../middlewares/authMiddleware');
const superAdminMiddleware = require('../middlewares/superAdminMiddleware');
const developerMiddleware = require('../middlewares/developerMiddleware');

const adminUserController = require('../controllers/adminUserController');
const adminDeveloperController = require('../controllers/adminDeveloperController');
const adminBroadcastController = require('../controllers/adminBroadcastController');

// All admin web routes require valid JWT Authentication
router.use(authMiddleware);

/**
 * Super-Admin Check Endpoint (Used by Web Dashboard on login/load)
 */
router.get('/verify-session', superAdminMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Super-Admin session verified',
        user: {
            id: req.user.id,
            name: req.user.name || 'Super-Admin',
            email: req.user.email,
            profile_url: req.user.profile_url || null,
            role: req.user.role,
            isDeveloper: req.user.id === '1782923913061_7e2b'
        }
    });
});

// Apply Super-Admin Middleware to all subsequent routes
router.use(superAdminMiddleware);

// --- User Management Routes ---
router.get('/users', adminUserController.listUsers);
router.patch('/users/:userId/role', adminUserController.updateUserRole);
router.patch('/users/:userId/status', adminUserController.toggleUserStatus);
router.get('/stats', adminUserController.getSystemOverview);

// --- Broadcast Push Notification Routes ---
router.post('/broadcast', adminBroadcastController.sendBroadcast);
router.get('/broadcast/history', adminBroadcastController.getBroadcastHistory);

// --- Developer Exclusive Routes ---
router.get('/developer/settings', developerMiddleware, adminDeveloperController.getAppSettings);
router.post('/developer/settings', developerMiddleware, adminDeveloperController.updateAppSetting);
router.post('/developer/test-notification', developerMiddleware, adminDeveloperController.sendTestNotification);
router.get('/developer/health', developerMiddleware, adminDeveloperController.getSystemHealth);

module.exports = router;
