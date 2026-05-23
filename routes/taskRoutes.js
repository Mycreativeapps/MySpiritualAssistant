const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public - available for selection during/after register
router.get('/master', taskController.getMasterTasks);

// Protected
router.use(authMiddleware);
router.post('/assign', taskController.assignTasks);
router.post('/assign-mentee', taskController.assignTaskToMentee);
router.get('/daily', taskController.getUserDailyTasks);
router.put('/:id/score', taskController.updateTaskScore);

// Routine Management
router.get('/routines', taskController.getRoutines);
router.post('/routines', taskController.createRoutine);
router.post('/routines/mentee', taskController.createRoutineForMentee);
router.put('/routines/:id', taskController.updateRoutine);
router.delete('/routines/:id', taskController.deleteRoutine);

module.exports = router;
