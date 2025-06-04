const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User } = require("../models");
const config = require("../../config/config");
const emailService = require("./email.service");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

/**
 * Register a new user
 * @param {object} userData - User data (name, email, password, role)
 * @returns {Promise<User>}
 */
const registerUser = async (userData) => {
  if (await User.findOne({ where: { email: userData.email } })) {
    throw new ApiError(400, "Email already taken");
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const user = await User.create({ ...userData, verificationToken });

  const verificationUrl = `${config.baseUrl}/api/auth/verify-email?token=${verificationToken}`;
  const subject = "Email Verification";
  const text = `Please verify your email by clicking the following link: ${verificationUrl}`;
  const html = `<p>Please verify your email by clicking the following link:</p><a href="${verificationUrl}">${verificationUrl}</a>`;

  await emailService.sendEmail(user.email, subject, text, html);

  user.password = undefined;
  return user;
};

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: User, token: string}>}
 */
const loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.isValidPassword(password))) {
    throw new ApiError(401, "Incorrect email or password");
  }

  if (!user.emailVerified) {
    throw new ApiError(401, "Email not verified");
  }

  const token = generateAuthToken(user.id, user.role);
  user.password = undefined; 
  return { user, token };
};

/**
 * Generate JWT auth token
 * @param {number} userId
 * @param {string} role
 * @returns {string}
 */
const generateAuthToken = (userId, role) => {
  const payload = {
    sub: userId,
    role: role,
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Verify email using token
 * @param {string} token
 * @returns {Promise<void>}
 */
const verifyEmail = async (token) => {
  const user = await User.findOne({ where: { verificationToken: token, emailVerified: false } });

  console.log(user);
  if (!user) {
    throw new ApiError(400, "Invalid verification token");
  }

  user.emailVerified = true;
  user.verificationToken = null; 
  await user.save();
};

/**
 * Initiate password reset process
 * @param {string} email
 * @returns {Promise<void>}
 */
const requestPasswordReset = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; 
  await user.save();

  const resetUrl = `${config.baseUrl}/reset-password?token=${resetToken}`; 
  const subject = "Password Reset Request";
  const text = `You requested a password reset. Click the following link to reset your password: ${resetUrl}\nIf you did not request this, please ignore this email.`;
  const html = `<p>You requested a password reset. Click the following link to reset your password:</p><a href="${resetUrl}">${resetUrl}</a><p>If you did not request this, please ignore this email.</p>`;

  await emailService.sendEmail(user.email, subject, text, html);
};

/**
 * Reset password using token
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { [require("sequelize").Op.gt]: Date.now() }, 
    },
  });

  if (!user) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Password reset token is invalid or has expired"
    );
  }

  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();
};

module.exports = {
  registerUser,
  loginUser,
  generateAuthToken,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
};
