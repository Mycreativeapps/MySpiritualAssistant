const { uploadToS3 } = require('../services/s3Service');
const responseHandler = require('../utils/responseHandler');

/**
 * Handles single file upload to Amazon S3
 */
exports.uploadSingleFile = async (req, res) => {
    try {
        if (!req.file) {
            return responseHandler.error(res, 'No file uploaded or file rejected by validation filter', 400);
        }

        // Upload the file buffer to S3
        const fileUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);

        responseHandler.success(res, 'File uploaded successfully', {
            url: fileUrl,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
        }, 201);
    } catch (err) {
        console.error('uploadSingleFile Error:', err);
        if (err.message.includes('credentials') || err.message.includes('configured')) {
            return responseHandler.error(res, 'S3 storage is not configured properly on the server.', 503, err.message);
        }
        responseHandler.error(res, 'Failed to upload file to S3 storage', 500, err.message);
    }
};

/**
 * Handles multiple files upload (bulk upload) to Amazon S3
 */
exports.uploadMultipleFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return responseHandler.error(res, 'No files uploaded or files rejected by validation filter', 400);
        }

        // Map files to upload promises
        const uploadPromises = req.files.map(file => 
            uploadToS3(file.buffer, file.originalname, file.mimetype)
                .then(url => ({
                    success: true,
                    url,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size
                }))
                .catch(err => ({
                    success: false,
                    fileName: file.originalname,
                    error: err.message
                }))
        );

        // Run all uploads concurrently
        const results = await Promise.all(uploadPromises);

        const uploaded = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        responseHandler.success(res, 'Upload request processed', {
            uploadedCount: uploaded.length,
            failedCount: failed.length,
            uploaded,
            failed
        }, 207); // 207 Multi-Status
    } catch (err) {
        console.error('uploadMultipleFiles Error:', err);
        responseHandler.error(res, 'Failed to process file uploads', 500, err.message);
    }
};
