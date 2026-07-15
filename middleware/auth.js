const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("./errorHandler");
const asyncHandler = require("../utils/asyncHandler");

// "protect" — verifies the JWT sent in the Authorization header and attaches
// the logged-in user to req.user so later middleware/controllers can use it.
// Apply this to any route that requires the user to be logged in.
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]; // "Bearer <token>" -> take the token part
  }

  if (!token) {
    throw new AppError("Not authorized, no token provided", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // fetch fresh user data (not just what's in the token) so role/name changes reflect immediately
    req.user = await User.findById(decoded.id);
    if (!req.user) throw new AppError("User no longer exists", 401);
    next();
  } catch (err) {
    throw new AppError("Not authorized, token invalid or expired", 401);
  }
});

// "authorize" — restricts a route to specific roles. Must run AFTER protect,
// since it relies on req.user being set.
// Usage: router.delete('/:id', protect, authorize('admin'), deleteUser)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(`Role '${req.user.role}' is not authorized for this action`, 403);
    }
    next();
  };
};

module.exports = { protect, authorize };
