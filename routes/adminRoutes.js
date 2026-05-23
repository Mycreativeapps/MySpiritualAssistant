const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// All admin routes are protected by both auth and admin middleware
router.use(authMiddleware);
router.use(adminMiddleware);

// Master Task Management
router.post('/tasks/master', adminController.createMasterTask);
router.put('/tasks/master/:id', adminController.updateMasterTask);
router.delete('/tasks/master/:id', adminController.deleteMasterTask);

// System Overview
router.get('/stats', adminController.getSystemStats);

// User Management
router.get('/users', adminController.listUsers);
router.patch('/users/:userId/role', adminController.updateUserRole);

module.exports = router;
