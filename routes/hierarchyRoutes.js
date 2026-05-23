const express = require('express');
const router = express.Router();
const hierarchyController = require('../controllers/hierarchyController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/assign', hierarchyController.assignParent);
router.get('/children', hierarchyController.getChildren);

module.exports = router;
