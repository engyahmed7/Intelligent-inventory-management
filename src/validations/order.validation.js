const { body, query, param } = require("express-validator");

const orderStatuses = ["pending", "completed", "expired", "cancelled"];
const sortableOrderFields = ["createdAt", "updatedAt", "totalCost", "status"];

const createOrder = [
  body("waiterId")
    .isInt({ min: 1 })
    .withMessage("Waiter ID must be a positive integer"),
  body("status")
    .optional()
    .isIn(orderStatuses)
    .withMessage(`Status must be one of: ${orderStatuses.join(", ")}`),
];

const modifyOrderItem = [
  param("orderId")
    .isInt({ min: 1 })
    .withMessage("Order ID must be a positive integer"),
  body("itemId")
    .isInt({ min: 1 })
    .withMessage("Item ID must be a positive integer"),
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer greater than 0")
    .toInt(),
];

const removeOrderItem = [
  param("orderId")
    .isInt({ min: 1 })
    .withMessage("Order ID must be a positive integer"),
  param("itemId")
    .isInt({ min: 1 })
    .withMessage("Item ID must be a positive integer"),
];

const updateOrder = [
  param("orderId")
    .isInt({ min: 1 })
    .withMessage("Order ID must be a positive integer"),
  body("status")
    .optional()
    .isIn(orderStatuses)
    .withMessage(`Status must be one of: ${orderStatuses.join(", ")}`),
  body("waiterId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Waiter ID must be a positive integer"),
  body().custom((value, { req }) => {
    if (!req.body.status && !req.body.waiterId) {
      throw new Error(
        "At least one field (status or waiterId) must be provided for update"
      );
    }
    return true;
  }),
];

const getOrder = [
  param("orderId")
    .isInt({ min: 1 })
    .withMessage("Order ID must be a positive integer"),
];

const getOrders = [
  query("status")
    .optional()
    .isIn(orderStatuses)
    .withMessage(`Status must be one of: ${orderStatuses.join(", ")}`),
  query("waiterId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Waiter ID must be a positive integer"),
  query("sortBy")
    .optional()
    .isIn(sortableOrderFields)
    .withMessage(`SortBy must be one of: ${sortableOrderFields.join(", ")}`),
  query("sortOrder")
    .optional()
    .toUpperCase()
    .isIn(["ASC", "DESC"])
    .withMessage("SortOrder must be ASC or DESC"),
  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Limit must be a positive integer")
    .toInt(),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
];

module.exports = {
  modifyOrderItem,
  removeOrderItem,
  updateOrder,
  getOrder,
  getOrders,
  createOrder,
};
