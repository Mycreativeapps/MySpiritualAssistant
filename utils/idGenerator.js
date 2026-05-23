const crypto = require('crypto');

/**
 * Generates a unique ID based on current timestamp (milliseconds)
 * plus a random 4-character hex suffix to ensure uniqueness
 * in high-concurrency scenarios.
 * Example: 1712345678901_a2b3
 */
const generateTimestampId = () => {
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(2).toString('hex');
    return `${timestamp}_${randomSuffix}`;
};

module.exports = {
    generateTimestampId
};
