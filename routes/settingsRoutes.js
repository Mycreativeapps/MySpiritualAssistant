const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/:key', settingsController.getSetting);
router.put('/:key', authMiddleware, settingsController.updateSetting);

module.exports = router;
