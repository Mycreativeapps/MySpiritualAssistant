const developerMiddleware = (req, res, next) => {
    const DEVELOPER_USER_ID = '1782923913061_7e2b';
    if (!req.user || req.user.id !== DEVELOPER_USER_ID) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Reserved strictly for Lead Developer.'
        });
    }
    next();
};

module.exports = developerMiddleware;
