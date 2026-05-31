const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const responseHandler = require('../utils/responseHandler');

// Local middleware to handle Multer upload validation or size errors gracefully
const handleMulterErrors = (err, req, res, next) => {
    if (err) {
        return responseHandler.error(res, err.message, 400);
    }
    next();
};

/**
 * @openapi
 * /api/upload/single:
 *   post:
 *     summary: Upload a single image or document to Amazon S3
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file (image or document) to upload
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 status: { type: integer }
 *                 data:
 *                   type: object
 *                   properties:
 *                     url: { type: string }
 *                     fileName: { type: string }
 *                     mimeType: { type: string }
 *                     size: { type: integer }
 *       400:
 *         description: Invalid input or file format
 *       503:
 *         description: S3 service not configured on the server
 */
router.post('/single', authMiddleware, upload.single('file'), handleMulterErrors, uploadController.uploadSingleFile);

/**
 * @openapi
 * /api/upload/multiple:
 *   post:
 *     summary: Upload multiple images or documents to Amazon S3 (Max 10 files)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                   description: The files (images or documents) to upload
 *     responses:
 *       207:
 *         description: Upload request processed (Multi-Status)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 status: { type: integer }
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadedCount: { type: integer }
 *                     failedCount: { type: integer }
 *                     uploaded: { type: array, items: { type: object } }
 *                     failed: { type: array, items: { type: object } }
 */
router.post('/multiple', authMiddleware, upload.array('files', 10), handleMulterErrors, uploadController.uploadMultipleFiles);

module.exports = router;
