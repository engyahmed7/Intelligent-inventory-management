const express = require("express");
const itemsController = require("../controllers/items.controller");
const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validation.middleware");
const itemValidation = require("../../validations/item.validation");
const upload = require("../../middlewares/upload.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Item and inventory management
 */

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     description: Only Super Admins and Managers can create items.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ItemCreate"
 *     responses:
 *       "201":
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Item"
 *       "400":
 *         description: Bad Request (e.g., invalid input)
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get a list of items (filtered, sorted, paginated)
 *     tags: [Items]
 *     description: All authenticated users can retrieve items. Waiters see only non-expired, in-stock items.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [others, food, beverages]
 *         description: Filter by item category
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field (e.g., name, price, expiryDate, stockQuantity, totalStockValue)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of items per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: List of items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Item"
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
 */
router
  .route("/")
  .post(
    authenticate,
    authorize(["Super Admin", "Manager"]),
    validate(itemValidation.createItem),
    itemsController.createItem
  )
  .get(
    authenticate,
    authorize(["Super Admin", "Manager", "Cashier", "Waiter"]),
    validate(itemValidation.getItems),
    itemsController.getItems
  );

/**
 * @swagger
 * /items/{itemId}:
 *   get:
 *     summary: Get details of a specific item
 *     tags: [Items]
 *     description: All authenticated users can retrieve item details. Waiters cannot view expired/out-of-stock items.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the item to retrieve
 *     responses:
 *       "200":
 *         description: Item details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Item"
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden (e.g., Waiter trying to access expired item)
 *       "404":
 *         description: Item not found
 *   patch:
 *     summary: Update details of a specific item
 *     tags: [Items]
 *     description: Only Super Admins and Managers can update items.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ItemUpdate"
 *     responses:
 *       "200":
 *         description: Item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Item"
 *       "400":
 *         description: Bad Request (e.g., invalid input)
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Item not found
 *   delete:
 *     summary: Delete a specific item
 *     tags: [Items]
 *     description: Only Super Admins and Managers can delete items. Cannot delete if item is part of an active order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the item to delete
 *     responses:
 *       "204":
 *         description: Item deleted successfully
 *       "400":
 *         description: Bad Request (e.g., item is part of an order)
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Item not found
 */
router
  .route("/:itemId")
  .get(
    authenticate,
    authorize(["Super Admin", "Manager", "Cashier", "Waiter"]),
    validate(itemValidation.getItem),
    itemsController.getItem
  )
  .patch(
    authenticate,
    authorize(["Super Admin", "Manager"]),
    validate(itemValidation.updateItem),
    itemsController.updateItem
  )
  .delete(
    authenticate,
    authorize(["Super Admin", "Manager"]),
    validate(itemValidation.deleteItem),
    itemsController.deleteItem
  );

/**
 * @swagger
 * /items/export/csv:
 *   get:
 *     summary: Export item inventory to a CSV file
 *     tags: [Items]
 *     description: Only Super Admins and Managers can export item data.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: CSV file containing item data
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "500":
 *         description: Internal Server Error (Failed to generate CSV)
 */
router.get(
  "/export/csv",
  authenticate,
  authorize(["Super Admin", "Manager"]),
  itemsController.exportItems
);

/**
 * @swagger
 * /items/import/csv:
 *   post:
 *     summary: Import items from a CSV file
 *     tags: [Items]
 *     description: Only Super Admins and Managers can import item data. Supports creating new items and updating existing ones based on ID.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csvFile:
 *                 type: string
 *                 format: binary
 *                 description: The CSV file to upload.
 *     responses:
 *       "200":
 *         description: CSV processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 created:
 *                   type: integer
 *                   description: Number of items created
 *                 updated:
 *                   type: integer
 *                   description: Number of items updated
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: integer
 *                       message:
 *                         type: string
 *                   description: List of errors encountered during processing (if any)
 *       "400":
 *         description: Bad Request (e.g., no file uploaded, invalid CSV format, missing headers, validation errors in rows)
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "500":
 *         description: Internal Server Error (Failed to process CSV)
 */
router.post(
  "/import/csv",
  authenticate,
  authorize(["Super Admin", "Manager"]),
  upload.single("csvFile"),
  itemsController.importItems
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         price:
 *           type: number
 *           format: float
 *         category:
 *           type: string
 *           enum: [others, food, beverages]
 *         expiryDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         stockQuantity:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 10
 *         name: "Spring Water"
 *         description: "500ml bottled water"
 *         price: 1.50
 *         category: "beverages"
 *         expiryDate: "2026-12-31"
 *         stockQuantity: 150
 *         createdAt: "2025-06-02T19:12:01.000Z"
 *         updatedAt: "2025-06-02T19:12:01.000Z"
 *
 *     ItemCreate:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - category
 *         - stockQuantity
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           format: float
 *           minimum: 0
 *         category:
 *           type: string
 *           enum: [others, food, beverages]
 *         expiryDate:
 *           type: string
 *           format: date
 *           description: "YYYY-MM-DD format"
 *         stockQuantity:
 *           type: integer
 *           minimum: 0
 *       example:
 *         name: "Croissant"
 *         description: "Freshly baked butter croissant"
 *         price: 2.75
 *         category: "food"
 *         expiryDate: "2025-06-05"
 *         stockQuantity: 50
 *
 *     ItemUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           format: float
 *           minimum: 0
 *         category:
 *           type: string
 *           enum: [others, food, beverages]
 *         expiryDate:
 *           type: string
 *           format: date
 *           description: "YYYY-MM-DD format"
 *         stockQuantity:
 *           type: integer
 *           minimum: 0
 *       example:
 *         price: 2.95
 *         stockQuantity: 45
 */

module.exports = router;
