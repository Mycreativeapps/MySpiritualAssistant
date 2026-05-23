/**
 * Utility to standardize success and error responses
 */

const success = (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        status: statusCode,
        data
    });
};

const error = (res, message, statusCode = 500, errorData = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        status: statusCode,
        error: errorData
    });
};

module.exports = {
    success,
    error
};
