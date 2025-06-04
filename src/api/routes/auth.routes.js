const express = require("express");
const authController = require("../controllers/auth.controller");
const validate = require("../../middlewares/validation.middleware");
const authValidation = require("../../validations/auth.validation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and authorization
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user (typically Cashier or Waiter by Admin/Manager)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: must be unique
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least 8 characters long
 *               role:
 *                 type: string
 *                 enum: [Cashier, Waiter] # Admins/Managers typically create these roles
 *     responses:
 *       "201":
 *         description: User registered successfully (requires email verification)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "400":
 *         description: Bad Request (e.g., email already taken, invalid input)
 *       "401":
 *         description: Unauthorized (Admin/Manager role required to register users)
 *     security:
 *       - bearerAuth: [] # Requires Admin/Manager token
 */

router.post(
  "/register",
  validate(authValidation.register),
  authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       "200":
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         description: Invalid email or password, or email not verified
 */
router.post("/login", validate(authValidation.login), authController.login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       "204":
 *         description: If email exists, password reset email sent (or request acknowledged)
 *       "404":
 *         description: User not found (optional, can return 204 to prevent email enumeration)
 */
router.post(
  "/forgot-password",
  validate(authValidation.requestPasswordReset),
  authController.requestPasswordReset
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using a token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The password reset token received via email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       "204":
 *         description: Password reset successful
 *       "400":
 *         description: Invalid token or password validation failed
 */
router.post(
  "/reset-password",
  validate(authValidation.resetPassword),
  authController.resetPassword
);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address using a token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The email verification token received via email
 *     responses:
 *       "204":
 *         description: Email verified successfully
 *       "400":
 *         description: Invalid or expired token
 */
router.post(
  "/verify-email",
  validate(authValidation.verifyEmail),
  authController.verifyEmail
);

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthTokens:
 *       type: object
 *       properties:
 *         access:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT access token
 *             expires:
 *               type: string
 *               format: date-time
 *               description: Access token expiry date/time
 *         refresh:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT refresh token
 *             expires:
 *               type: string
 *               format: date-time
 *               description: Refresh token expiry date/time
 *       example:
 *         access:
 *           token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *           expires: 2025-06-02T20:10:57.000Z
 *         refresh:
 *           token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *           expires: 2025-07-02T19:10:57.000Z
 */

module.exports = router;
