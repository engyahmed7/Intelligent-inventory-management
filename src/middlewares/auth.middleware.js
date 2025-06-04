const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const config = require("../../config/config");
const ApiError = require("../utils/ApiError");
const { User } = require("../models");

/**
 * Middleware to verify JWT token and attach user to request object.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Please authenticate"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, config.jwtSecret);

    const user = await User.findByPk(payload.sub, {
      attributes: {
        exclude: [
          "password",
          "verificationToken",
          "resetPasswordToken",
          "resetPasswordExpires",
        ],
      },
    });

    if (!user) {
      return next(new ApiError(401, "User not found"));
    }

    req.user = user; 
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, "Token expired"));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, "Invalid token"));
    }
    return next(new ApiError(401, "Authentication failed"));
  }
};

/**
 * Middleware factory to authorize based on user roles.
 * @param {string[]} requiredRoles - Array of roles allowed to access the route.
 * @returns {function} Express middleware function.
 */
const authorize = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user || !requiredRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "Forbidden: You do not have permission to access this resource"
        )
      );
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
