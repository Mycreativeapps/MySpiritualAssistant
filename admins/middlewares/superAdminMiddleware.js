const superAdminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'super-admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Super-Administrator privileges required for Web Dashboard.'
        });
    }
    next();
};

module.exports = superAdminMiddleware;
