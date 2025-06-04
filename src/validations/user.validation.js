const { body, param } = require("express-validator");

const addUser = [
  body("name").notEmpty().withMessage("Name is required").trim(),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .isIn(["Cashier", "Waiter"])
    .withMessage("Invalid role. Allowed roles: Cashier, Waiter"),
];

const getUser = [
    param("userId").isInt({ min: 1 }).withMessage("User ID must be a positive integer"),
];


module.exports = {
  addUser,
  getUser,
};

