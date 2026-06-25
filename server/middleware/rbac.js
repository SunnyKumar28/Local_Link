/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to specified roles.
 *
 * Usage: authorize('Shopkeeper')  or  authorize('Customer', 'Shopkeeper')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — please log in first',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — role '${req.user.role}' is not authorized for this resource`,
      });
    }

    next();
  };
};

module.exports = { authorize };
