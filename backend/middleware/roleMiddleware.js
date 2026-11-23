// Restrict route access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource`
      });
    }

    next();
  };
};

const requireStudent = authorize('student', 'admin');
const requireStaff = authorize('staff', 'admin');
const requireAdmin = authorize('admin');

module.exports = {
  authorize,
  requireStudent,
  requireStaff,
  requireAdmin
};
