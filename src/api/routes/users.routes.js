const express = require("express");
const usersController = require("../controllers/users.controller");
const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validation.middleware");
const userValidation = require("../../validations/user.validation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (accessible primarily by Admins/Managers)
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user (Cashier or Waiter)
 *     tags: [Users]
 *     description: Only Super Admins and Managers can create new users.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserCreate"
 *     responses:
 *       "201":
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       "400":
 *         description: Bad Request (e.g., email already taken, invalid role)
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden (User does not have permission)
 *   get:
 *     summary: Get a list of users (filtered, paginated)
 *     tags: [Users]
 *     description: Only Super Admins and Managers can retrieve the full user list.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by user name (partial match)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Super Admin, Manager, Cashier, Waiter]
 *         description: Filter by user role
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field (e.g., name, email, createdAt)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (ascending or descending)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of users per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/User"
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router
  .route("/")
  .post(
    authenticate,
    authorize(["Super Admin", "Manager"]),
    validate(userValidation.addUser),
    usersController.addUser
  );

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get details of a specific user
 *     tags: [Users]
 *     description: Super Admins and Managers can get any user. Users can get their own details.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to retrieve
 *     responses:
 *       "200":
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden (User trying to access another user without permission)
 *       "404":
 *         description: User not found
 *   patch:
 *     summary: Update details of a specific user
 *     tags: [Users]
 *     description: Super Admins and Managers can update any user. Users can update their own details (limited fields).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserUpdate"
 *     responses:
 *       "200":
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       "400":
 *         description: Bad Request (e.g., invalid input, email already taken)
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: User not found
 *   delete:
 *     summary: Delete a specific user
 *     tags: [Users]
 *     description: Only Super Admins and Managers can delete users.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to delete
 *     responses:
 *       "204":
 *         description: User deleted successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: User not found
 */
router
  .route("/:userId")
  .get(
    authenticate,
    authorize(["Super Admin", "Manager", "Cashier", "Waiter"]),
    validate(userValidation.getUser),
    usersController.getUser
  );

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the user
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [Super Admin, Manager, Cashier, Waiter]
 *         emailVerified:
 *           type: boolean
 *           description: Whether the user has verified their email address
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 1
 *         name: "John Doe"
 *         email: "john.doe@example.com"
 *         role: "Waiter"
 *         emailVerified: true
 *         createdAt: "2025-06-02T19:11:30.000Z"
 *         updatedAt: "2025-06-02T19:11:30.000Z"
 *
 *     UserCreate:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *         role:
 *           type: string
 *           enum: [Cashier, Waiter]
 *       example:
 *         name: "Jane Smith"
 *         email: "jane.smith@example.com"
 *         password: "password123"
 *         role: "Cashier"
 *
 *     UserUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: Only include if changing the password
 *         role:
 *           type: string
 *           enum: [Cashier, Waiter]
 *           description: Role change typically restricted to Admins/Managers
 *       example:
 *         name: "Johnathan Doe"
 *         email: "john.doe.updated@example.com"
 */

module.exports = router;
