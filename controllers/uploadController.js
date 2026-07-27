const { uploadToS3 } = require('../services/s3Service');
const responseHandler = require('../utils/responseHandler');

/**
 * Handles single file upload to Amazon S3
 */
exports.uploadSingleFile = async (req, res) => {
    try {
        if (!req.file) {
            return responseHandler.error(res, 'No file was provided, or the file type is not supported. Please upload a valid image or document.', 400);
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
            return responseHandler.error(res, 'The server is currently unable to store files. Please contact support or try again later.', 503, err.message);
        }
        responseHandler.error(res, 'We encountered an issue uploading your file. Please try again.', 500, err.message);
    }
};

/**
 * Handles multiple files upload (bulk upload) to Amazon S3
 */
exports.uploadMultipleFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return responseHandler.error(res, 'No files were provided, or the file types are not supported. Please upload valid files.', 400);
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
        responseHandler.error(res, 'We encountered an issue processing your file uploads. Please try again.', 500, err.message);
    }
};
