const express = require("express");
const ordersController = require("../controllers/orders.controller");
const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validation.middleware");
const orderValidation = require("../../validations/order.validation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     description: Cashiers can create new orders and assign a waiter.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/OrderCreate"
 *     responses:
 *       "201":
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Order"
 *       "400":
 *         description: Bad Request (e.g., invalid input, item not available/expired, waiter not found)
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden (Only Cashiers can create orders)
 *   get:
 *     summary: Get a list of orders (filtered, sorted, paginated)
 *     tags: [Orders]
 *     description: Super Admins/Managers/Cashiers can view all orders. Waiters can view orders assigned to them.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, expired]
 *         description: Filter by order status
 *       - in: query
 *         name: waiterId
 *         schema:
 *           type: integer
 *         description: Filter by assigned waiter ID (Admin/Manager/Cashier only)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field (e.g., createdAt, totalAmount, status)
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
 *         description: Maximum number of orders per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: List of orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Order"
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
  .post(authenticate, authorize(["Cashier"]), ordersController.createOrder)
  .get(
    authenticate,
    authorize(["Super Admin", "Manager", "Cashier", "Waiter"]),
    validate(orderValidation.getOrders),
    ordersController.getOrders
  );

/**
 * @swagger
 * /orders/{orderId}/items/bulk:
 *   post:
 *     summary: Add multiple items to a specific order
 *     tags: [Orders]
 *     description: Cashiers can add multiple items to a pending order in bulk.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the order to modify
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: "#/components/schemas/OrderItemInput"
 *     responses:
 *       200:
 *         description: Items added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid input, insufficient stock, or order not pending
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order or item not found
 */
router.post(
  "/:orderId/items/bulk",
  authenticate,
  authorize(["Cashier"]),
  validate(orderValidation.addItemsToOrder),
  ordersController.addItemsToOrder
);
/**
 * @swagger
 * /orders/{orderId}/items:
 *   post:
 *     summary: Add an item to a specific order
 *     tags: [Orders]
 *     description: Cashiers can add or update an item in a pending order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: paths
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the order to modify
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - quantity
 *             properties:
 *               itemId:
 *                 type: integer
 *                 example: 3
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Item added or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid input, insufficient stock, or order not pending
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order or item not found
 */
router.post(
  "/:orderId/items",
  authenticate,
  authorize(["Cashier"]),
  validate(orderValidation.modifyOrderItem),
  ordersController.addItemToOrder
);

/**
 * @swagger
 * /orders/{orderId}/items/{itemId}:
 *   delete:
 *     summary: Remove an item from a specific order
 *     tags: [Orders]
 *     description: Cashiers can remove an item from a pending order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the order
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the item to remove
 *     responses:
 *       200:
 *         description: Item removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Order not pending or item not part of order
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order or item not found
 */
router.delete(
  "/:orderId/items/:itemId",
  authenticate,
  authorize(["Cashier"]),
  validate(orderValidation.removeOrderItem),
  ordersController.removeItemFromOrder
);

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Get details of a specific order
 *     tags: [Orders]
 *     description: Super Admins/Managers/Cashiers can view any order. Waiters can view orders assigned to them.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the order to retrieve
 *     responses:
 *       "200":
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/OrderDetailed"
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Order not found
 *   patch:
 *     summary: Update a specific order (e.g., add/remove items, change status)
 *     tags: [Orders]
 *     description: Cashiers can update pending orders (add/remove items, change quantity, assign waiter, mark complete). Admins/Managers might have broader update permissions (handled in service).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the order to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/OrderUpdate"
 *     responses:
 *       "200":
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/OrderDetailed"
 *       "400":
 *         description: Bad Request (e.g., invalid input, item not available/expired, order not pending)
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Order not found or item not found
 */
router
  .route("/:orderId")
  .get(
    authenticate,
    authorize(["Super Admin", "Manager", "Cashier", "Waiter"]),
    validate(orderValidation.getOrder),
    ordersController.getOrder
  )
  .patch(
    authenticate,
    authorize(["Super Admin", "Manager", "Cashier"]),
    validate(orderValidation.updateOrder),
    ordersController.updateOrder
  );

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItemInput:
 *       type: object
 *       required:
 *         - itemId
 *         - quantity
 *       properties:
 *         itemId:
 *           type: integer
 *           description: ID of the item to add
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of the item
 *       example:
 *         itemId: 10
 *         quantity: 2
 *
 *     OrderCreate:
 *       type: object
 *       required:
 *         - waiterId
 *         - items
 *       properties:
 *         waiterId:
 *           type: integer
 *           description: ID of the waiter assigned to the order
 *         items:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/OrderItemInput"
 *           minItems: 1
 *           description: List of items and quantities for the order
 *       example:
 *         waiterId: 5
 *         items:
 *           - itemId: 10
 *             quantity: 2
 *           - itemId: 15
 *             quantity: 1
 *
 *     OrderUpdate:
 *       type: object
 *       properties:
 *         waiterId:
 *           type: integer
 *           description: New waiter ID to assign
 *         status:
 *           type: string
 *           enum: [completed]
 *           description: Mark the order as completed (only allowed value for update via this field)
 *         items:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/OrderItemInput"
 *           description: A new list of items to completely replace the existing items in the order. Use this to add/remove/update quantities.
 *       example:
 *         status: "completed"
 *       example2:
 *         items:
 *           - itemId: 10
 *             quantity: 3 # Updated quantity
 *           # Item 15 removed
 *           - itemId: 20 # New item added
 *             quantity: 1
 *
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         cashierId:
 *           type: integer
 *           description: ID of the cashier who created the order
 *         waiterId:
 *           type: integer
 *           description: ID of the waiter assigned to the order
 *         totalAmount:
 *           type: number
 *           format: float
 *           description: Calculated total cost of the order
 *         status:
 *           type: string
 *           enum: [pending, completed, expired]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 50
 *         cashierId: 3
 *         waiterId: 5
 *         totalAmount: 4.25
 *         status: "pending"
 *         createdAt: "2025-06-02T19:12:38.000Z"
 *         updatedAt: "2025-06-02T19:12:38.000Z"
 *
 *     OrderItemDetailed:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID of the OrderItem record
 *         orderId:
 *           type: integer
 *         itemId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         pricePerItem:
 *           type: number
 *           format: float
 *           description: Price of the item at the time the order was placed/updated
 *         item:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             category:
 *               type: string
 *               enum: [others, food, beverages]
 *       example:
 *         id: 101
 *         orderId: 50
 *         itemId: 10
 *         quantity: 2
 *         pricePerItem: 1.50
 *         item:
 *           name: "Spring Water"
 *           category: "beverages"
 *
 *     OrderDetailed:
 *       allOf:
 *         - $ref: "#/components/schemas/Order"
 *         - type: object
 *           properties:
 *             items:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/OrderItemDetailed"
 *             cashier:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *             waiter:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *       example:
 *         id: 50
 *         cashierId: 3
 *         waiterId: 5
 *         totalAmount: 4.25
 *         status: "pending"
 *         createdAt: "2025-06-02T19:12:38.000Z"
 *         updatedAt: "2025-06-02T19:12:38.000Z"
 *         cashier:
 *           id: 3
 *           name: "Alice"
 *         waiter:
 *           id: 5
 *           name: "Bob"
 *         items:
 *           - id: 101
 *             orderId: 50
 *             itemId: 10
 *             quantity: 2
 *             pricePerItem: 1.50
 *             item:
 *               name: "Spring Water"
 *               category: "beverages"
 *           - id: 102
 *             orderId: 50
 *             itemId: 15
 *             quantity: 1
 *             pricePerItem: 2.75
 *             item:
 *               name: "Croissant"
 *               category: "food"
 */

module.exports = router;
