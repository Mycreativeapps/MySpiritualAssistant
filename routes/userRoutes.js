const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/authMiddleware');

router.get('/my-profile', auth, userController.getProfileStats);
router.get('/scores/history', auth, userController.getScoreHistory);
router.get('/:userId/stats', auth, userController.getUserStatsById);
router.get('/:userId/history', auth, userController.getUserScoreHistoryById);
router.post('/sync-timezone', auth, userController.syncTimezone);
router.put('/profile', auth, userController.updateProfile);

module.exports = router;
