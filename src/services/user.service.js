const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const emailService = require("./email.service");
const config = require("../../config/config");
const crypto = require("crypto");

/**
 * Add a new user (Cashier or Waiter) by an Admin/Manager.
 * @param {object} userData - User data (name, email, password, role)
 * @param {User} requestingUser - The user performing the action (Admin/Manager)
 * @returns {Promise<User>}
 */
const addUser = async (userData, requestingUser) => {
  if (!["Super Admin", "Manager"].includes(requestingUser.role)) {
    throw new ApiError(
      403,
      "Forbidden: Only Super Admins or Managers can add users."
    );
  }

  if (!["Cashier", "Waiter"].includes(userData.role)) {
    throw new ApiError(400, "Invalid role. Can only add Cashier or Waiter.");
  }

  if (await User.findOne({ where: { email: userData.email } })) {
    throw new ApiError(400, "Email already taken");
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const user = await User.create({ ...userData, verificationToken });

  const verificationUrl = `${config.baseUrl}/api/auth/verify-email?token=${verificationToken}`;
  const subject = "Welcome to GeekyAir - Verify Your Email";
  const text = `Welcome! Please verify your email by clicking the following link: ${verificationUrl}`;
  const html = `<p>Welcome!</p><p>Please verify your email by clicking the following link:</p><a href="${verificationUrl}">${verificationUrl}</a>`;

  await emailService.sendEmail(user.email, subject, text, html);

  user.password = undefined;
  return user;
};

/**
 * Get user by ID.
 * @param {number} userId
 * @returns {Promise<User>}
 */
const getUserById = async (userId) => {
  const user = await User.findByPk(userId, {
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
    throw new ApiError(400, "User not found");
  }
  return user;
};

module.exports = {
  addUser,
  getUserById,
};
