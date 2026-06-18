const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// Initialize AWS S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
    }
});

/**
 * Uploads a file buffer to Amazon S3.
 * @param {Buffer} fileBuffer - The buffer of the file to upload
 * @param {string} originalName - Original name of the file
 * @param {string} mimeType - The mime type of the file
 * @returns {Promise<string>} - Returns the public S3 URL of the uploaded file
 */
const uploadToS3 = async (fileBuffer, originalName, mimeType) => {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.AWS_BUCKET_NAME;

    if (!accessKeyId || !secretAccessKey || !bucketName) {
        throw new Error('AWS credentials or S3 bucket name are not configured in environment.');
    }

    const uniqueId = crypto.randomUUID();
    // Extract file extension
    const dotIndex = originalName.lastIndexOf('.');
    const extension = dotIndex !== -1 ? originalName.substring(dotIndex) : '';
    const s3Key = `uploads/${uniqueId}${extension}`;

    const uploadParams = {
        Bucket: bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimeType,
    };

    try {
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        // Construct standard regional S3 object URL
        const region = process.env.AWS_REGION || 'ap-south-1';
        const url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
        return url;
    } catch (err) {
        console.error('S3 Upload Error:', err);
        throw err;
    }
};

module.exports = {
    s3Client,
    uploadToS3
};
