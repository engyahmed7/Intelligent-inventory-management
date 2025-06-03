const { body, query, param } = require("express-validator");

const register = [
  body("name").notEmpty().withMessage("Name is required").trim(),
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .isIn(["Manager", "Cashier", "Waiter"])
    .withMessage("Invalid role. Allowed roles: Manager, Cashier, Waiter"), 
];

const login = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const verifyEmail = [
  query("token").notEmpty().withMessage("Verification token is required"),
];

const requestPasswordReset = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
];

const resetPassword = [
  query("token").notEmpty().withMessage("Password reset token is required!!"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

module.exports = {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
};
