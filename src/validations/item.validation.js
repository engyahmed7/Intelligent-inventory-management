const { body, query, param } = require("express-validator");

const itemCategories = ["others", "food", "beverages"];
const sortableFields = ["name", "price", "expiryDate", "totalStockValue"];

const createItem = [
  body("name").notEmpty().withMessage("Name is required").trim(),
  body("description").optional().trim(),
  body("price")
    .notEmpty().withMessage("Price is required")
    .isDecimal({ decimal_digits: "0,2" }).withMessage("Price must be a valid decimal number")
    .toFloat()
    .isFloat({ min: 0 }).withMessage("Price must be non-negative"),
  body("category")
    .isIn(itemCategories)
    .withMessage(`Category must be one of: ${itemCategories.join(", ")}`),
  body("expiryDate")
    .optional({ nullable: true })
    .isISO8601().withMessage("Expiry date must be a valid date (YYYY-MM-DD)")
    .toDate(),
  body("stockQuantity")
    .notEmpty().withMessage("Stock quantity is required")
    .isInt({ min: 0 }).withMessage("Stock quantity must be a non-negative integer")
    .toInt(),
];

const getItems = [
  query("category")
    .optional()
    .isIn(itemCategories)
    .withMessage(`Category must be one of: ${itemCategories.join(", ")}`),
  query("sortBy")
    .optional()
    .isIn(sortableFields)
    .withMessage(`SortBy must be one of: ${sortableFields.join(", ")}`),
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

const getItem = [
  param("itemId").isInt({ min: 1 }).withMessage("Item ID must be a positive integer"),
];

const updateItem = [
  param("itemId").isInt({ min: 1 }).withMessage("Item ID must be a positive integer"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty").trim(),
  body("description").optional().trim(),
  body("price")
    .optional()
    .isDecimal({ decimal_digits: "0,2" }).withMessage("Price must be a valid decimal number")
    .toFloat()
    .isFloat({ min: 0 }).withMessage("Price must be non-negative"),
  body("category")
    .optional()
    .isIn(itemCategories)
    .withMessage(`Category must be one of: ${itemCategories.join(", ")}`),
  body("expiryDate")
    .optional({ nullable: true })
    .isISO8601().withMessage("Expiry date must be a valid date (YYYY-MM-DD)")
    .toDate(),
  body("stockQuantity")
    .optional()
    .isInt({ min: 0 }).withMessage("Stock quantity must be a non-negative integer")
    .toInt(),
  body().custom((value, { req }) => {
    if (Object.keys(req.body).length === 0) {
      throw new Error("At least one field must be provided for update");
    }
    return true;
  }),
];

const deleteItem = [
  param("itemId").isInt({ min: 1 }).withMessage("Item ID must be a positive integer"),
];

module.exports = {
  createItem,
  getItems,
  getItem,
  updateItem,
  deleteItem,
};

