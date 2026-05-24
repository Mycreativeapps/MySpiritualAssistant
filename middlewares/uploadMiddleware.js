const multer = require('multer');

// Store files in memory buffer before uploading to S3
const storage = multer.memoryStorage();

// File size limits (10 MB maximum)
const limits = {
    fileSize: 10 * 1024 * 1024
};

// Define allowed mime types for images and documents
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'text/plain',
        'text/csv'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and standard documents are allowed.'), false);
    }
};

const upload = multer({
    storage,
    limits,
    fileFilter
});

module.exports = upload;
