const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});

const clearS3Uploads = async () => {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName || !process.env.AWS_ACCESS_KEY_ID) {
        console.error('AWS credentials or bucket name not configured in .env file.');
        process.exit(1);
    }

    try {
        console.log(`Listing all files under "uploads/" folder in S3 bucket: ${bucketName}...`);
        
        const listCommand = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'uploads/'
        });
        const listResponse = await s3Client.send(listCommand);

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            console.log('The "uploads/" folder is already empty on S3.');
            process.exit(0);
        }

        const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key }));
        console.log(`Found ${objectsToDelete.length} files. Deleting from S3...`);

        const deleteCommand = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
                Objects: objectsToDelete
            }
        });
        await s3Client.send(deleteCommand);
        console.log('SUCCESS: Successfully cleared all files from "uploads/" folder in S3.');
        process.exit(0);
    } catch (err) {
        console.error('FAILED: Error clearing S3 bucket:', err.message);
        process.exit(1);
    }
};

clearS3Uploads();
