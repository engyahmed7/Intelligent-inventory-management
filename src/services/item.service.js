const { Item, Order, OrderItem, User, sequelize } = require("../models");
const { Op } = require("sequelize");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const emailService = require("./email.service");
const genAiService = require("./genai.service");

const Papa = require("papaparse");
const unparseCsv = Papa.unparse;
const parseCsv = Papa.parse;
const fs = require("fs");

/**
 * Create a new item
 * @param {Object} itemBody
 * @returns {Promise<Item>}
 */
const createItem = async (itemBody) => {
  if (await Item.findOne({ where: { name: itemBody.name } })) {
    throw new ApiError(400, "Item name already taken");
  }

  const item = await Item.create(itemBody);

  if (item.category.toLowerCase() === "food" && item.price >= 200) {
    try {
      await notifyAdminsOfPremiumFoodItem(item);
    } catch (error) {
      console.error(
        "Failed to send admin notification for premium food item:",
        error
      );
    }
  }

  return item;
};

/**
 * Notify administrators about a new premium food item
 * @param {Item} item - The newly created food item
 * @returns {Promise<void>}
 */
const notifyAdminsOfPremiumFoodItem = async (item) => {
  try {
    const adminUsers = await User.findAll({
      where: {
        role: {
          [Op.in]: ["Super Admin", "Manager"],
        },
      },
    });

    if (!adminUsers || adminUsers.length === 0) {
      console.log("No admin users found to notify about premium food item");
      return;
    }

    let emailSubject = `New Premium Food Item Added: ${item.name}`;
    let emailBody = `
      A new premium food item has been added to the inventory:
      
      Name: ${item.name}
      Description: ${item.description}
      Price: $${item.price}
      Category: ${item.category}
      Expiry Date: ${
        item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A"
      }
      Stock Quantity: ${item.stockQuantity}
      
      This notification is sent automatically for all new food items with a price of $200 or higher.
    `;

    if (genAiService.isGenAiAvailable()) {
      try {
        const emailData = await genAiService.generateAdminEmail(
          "New Premium Food Item Added",
          {
            item: {
              name: item.name,
              description: item.description,
              price: item.price,
              category: item.category,
              expiryDate: item.expiryDate,
              stockQuantity: item.stockQuantity,
            },
          }
        );

        if (emailData && emailData.subject && emailData.body) {
          emailSubject = emailData.subject;
          emailBody = emailData.body;
        }
      } catch (genAiError) {
        console.error(
          "Failed to generate email content with GenAI:",
          genAiError
        );
      }
    }

    for (const admin of adminUsers) {
      await emailService.sendEmail(admin.email, emailSubject, emailBody);
    }

    console.log(
      `Notification sent to ${adminUsers.length} admin(s) about new premium food item: ${item.name}`
    );
  } catch (error) {
    console.error("Error in notifyAdminsOfPremiumFoodItem:", error);
    throw error;
  }
};

const queryItems = async (filter, options, user) => {
  const where = {};

  if (filter.category) {
    where.category = filter.category;
  }

  if (user.role === "Waiter") {
    where.expiryDate = {
      [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }],
    };
  }

  const limit = parseInt(options.limit, 10) || 10;
  const page = parseInt(options.page, 10) || 1;
  const offset = (page - 1) * limit;

  const order = [];

  if (options.sortBy) {
    let sortField;
    const direction =
      options.sortOrder?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    switch (options.sortBy) {
      case "name":
      case "price":
      case "expiryDate":
        sortField = options.sortBy;
        order.push([sortField, direction]);
        break;

      case "stockValue":
        order.push([literal("price * quantity"), direction]);
        break;

      default:
        break;
    }
  }

  const { count, rows } = await Item.findAndCountAll({
    where,
    order,
    limit,
    offset,
  });

  return {
    results: rows,
    totalResults: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
};

const getItemById = async (id) => {
  const item = await Item.findByPk(id, {
    attributes: [
      "id",
      "name",
      "description",
      "price",
      "category",
      "expiryDate",
      "stockQuantity",
    ],
  });

  if (!item) {
    throw new ApiError(400, `Item with ID ${id} not found`);
  }

  return item;
};

const updateItemById = async (id, updateBody) => {
  const item = await Item.findByPk(id);
  if (!item) {
    throw new ApiError(400, `Item with ID ${id} not found`);
  }
  const updatedItem = await item.update(updateBody);
  return updatedItem;
};

const deleteItemById = async (id) => {
  const item = await Item.findByPk(id);
  if (!item) {
    throw new ApiError(400, `Item with ID ${id} not found`);
  }
  await item.destroy();
  return item;
};

/**
 * Export items to CSV format.
 * @param {User} user - Requesting user (for potential future filtering)
 * @returns {Promise<string>} - CSV string
 */
const exportItemsToCsv = async (user) => {
  try {
    const items = await Item.findAll({
      attributes: [
        "id",
        "name",
        "description",
        "price",
        "category",
        "expiryDate",
        "stockQuantity",
      ],
      raw: true,
    });

    if (items.length === 0) {
      return "";
    }

    const csvString = unparseCsv(items);
    return csvString;
  } catch (error) {
    console.error("Error exporting items to CSV:", error);
    throw new ApiError(500, "Failed to export items to CSV");
  }
};

const importItemsFromCsv = async (filePath) => {
  let createdCount = 0;
  let updatedCount = 0;
  const errors = [];

  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const itemsDataResult = parseCsv(fileContent, {
      skipEmptyLines: true,
      header: true,
    });
    const itemsData = itemsDataResult.data;

    if (!itemsData || itemsData.length === 0) {
      fs.unlinkSync(filePath);
      throw new ApiError(200, "CSV file is empty or invalid.");
    }

    const expectedHeaders = [
      "id",
      "name",
      "description",
      "price",
      "category",
      "expiryDate",
      "stockQuantity",
    ];
    const actualHeaders = Object.keys(itemsData[0]);
    const missingHeaders = expectedHeaders.filter(
      (h) => !actualHeaders.includes(h) && h !== "id"
    );
    if (missingHeaders.length > 0 && !actualHeaders.includes("name")) {
      fs.unlinkSync(filePath);
      throw new ApiError(
        400,
        `Missing required CSV headers: ${missingHeaders.join(", ")}`
      );
    }

    const transaction = await sequelize.transaction();
    try {
      for (let i = 0; i < itemsData.length; i++) {
        const row = itemsData[i];
        const rowIndex = i + 2;

        try {
          const itemPayload = {
            name: row.name ? String(row.name).trim() : null,
            description: row.description
              ? String(row.description).trim()
              : null,
            price:
              row.price !== null && row.price !== undefined
                ? parseFloat(row.price)
                : null,
            category: row.category
              ? String(row.category).toLowerCase().trim()
              : null,
            expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
            stockQuantity:
              row.stockQuantity !== null && row.stockQuantity !== undefined
                ? parseInt(row.stockQuantity, 10)
                : null,
          };

          if (!itemPayload.name)
            throw new Error("Missing required field: name");
          if (
            itemPayload.price === null ||
            isNaN(itemPayload.price) ||
            itemPayload.price < 0
          )
            throw new Error("Invalid or missing price");
          if (
            !itemPayload.category ||
            !["others", "food", "beverages"].includes(itemPayload.category)
          )
            throw new Error("Invalid or missing category");
          if (
            itemPayload.stockQuantity === null ||
            isNaN(itemPayload.stockQuantity) ||
            itemPayload.stockQuantity < 0
          )
            throw new Error("Invalid or missing stockQuantity");
          if (itemPayload.expiryDate && isNaN(itemPayload.expiryDate.getTime()))
            throw new Error("Invalid expiryDate format");

          const itemId = row.id ? parseInt(row.id, 10) : null;

          if (itemId && !isNaN(itemId)) {
            const item = await Item.findByPk(itemId, { transaction });
            if (item) {
              await item.update(itemPayload, { transaction });
              updatedCount++;
            } else {
              throw new Error(`Item with ID ${itemId} not found for update.`);
            }
          } else if (itemPayload.name) {
            const existingItem = await Item.findOne({
              where: { name: itemPayload.name },
              transaction,
            });
            if (existingItem) {
              throw new Error(
                `Item with name "${itemPayload.name}" already exists. Provide ID to update.`
              );
            }
            await Item.create(itemPayload, { transaction });
            createdCount++;
          } else {
            throw new Error("Missing ID for update or Name for creation.");
          }
        } catch (validationError) {
          errors.push({ row: rowIndex, message: validationError.message });
        }
      }

      if (errors.length > 0) {
        await transaction.rollback();
        return { created: 0, updated: 0, errors };
      } else {
        await transaction.commit();
        return { created: createdCount, updated: updatedCount, errors: [] };
      }
    } catch (dbError) {
      await transaction.rollback();
      console.error("Database error during CSV import transaction:", dbError);

      throw new ApiError(500, "Database error during import.");
    }
  } catch (parseError) {
    console.error("Error parsing or processing CSV file:", parseError);
    throw new ApiError(400, `Failed to process CSV: ${parseError.message}`);
  } finally {
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkError) {
      console.error(
        `Failed to delete temporary CSV file: ${filePath}`,
        unlinkError
      );
    }
  }
};

module.exports = {
  createItem,
  queryItems,
  getItemById,
  updateItemById,
  deleteItemById,
  exportItemsToCsv,
  importItemsFromCsv,
  notifyAdminsOfPremiumFoodItem, 
};
