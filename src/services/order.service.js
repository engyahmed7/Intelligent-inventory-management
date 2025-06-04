const { Order, OrderItem, Item, User, sequelize } = require("../models");
const { Op } = require("sequelize");
const ApiError = require("../utils/ApiError");
const emailService = require("./email.service");
const genAiService = require("./genai.service");

/**
 * Check if an item is available to be added to an order.
 * (Not expired and in stock)
 * @param {number} itemId
 * @returns {Promise<Item>}
 */
const checkItemAvailability = async (itemId) => {
  const item = await Item.findByPk(itemId);
  if (!item) {
    throw new ApiError(404, `Item with ID ${itemId} not found`);
  }
  const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
  const isOutOfStock = item.stockQuantity <= 0;

  if (isExpired) {
    throw new ApiError(
      400,
      `Item "${item.name}" is expired and cannot be added to the order.`
    );
  }
  if (isOutOfStock) {
    throw new ApiError(
      400,
      `Item "${item.name}" is out of stock and cannot be added to the order.`
    );
  }
  return item;
};

/**
 * Calculate the total cost of an order based on its items.
 * @param {number} orderId
 * @returns {Promise<number>}
 */
const calculateOrderTotal = async (orderId, transaction) => {
  const orderItems = await OrderItem.findAll({
    where: { orderId },
    transaction,
  });
  let total = 0;
  for (const orderItem of orderItems) {
    total += parseFloat(orderItem.priceAtOrder) * orderItem.quantity;
  }
  console.log("Total cost:", total);
  return total;
};

/**
 * Create a new order.
 * Initially empty, items are added separately.
 * @param {User} cashier - The cashier creating the order.
 * @returns {Promise<Order>}
 */
const createOrder = async (cashier) => {
  const order = await Order.create({});
  return order;
};

/**
 * Add an item to an existing order or update its quantity.
 * @param {number} orderId
 * @param {number} itemId
 * @param {number} quantity
 * @returns {Promise<Order>}
 */
const addItemToOrder = async (orderId, itemId, quantity) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  if (order.status !== "pending") {
    throw new ApiError(400, "Cannot modify items in a non-pending order");
  }

  const item = await checkItemAvailability(itemId);

  if (item.stockQuantity < quantity) {
    throw new ApiError(
      400,
      `Insufficient stock for item "${item.name}". Available: ${item.stockQuantity}`
    );
  }

  let orderItem = await OrderItem.findOne({ where: { orderId, itemId } });

  const transaction = await sequelize.transaction();
  try {
    if (orderItem) {
      const quantityChange = quantity - orderItem.quantity;
      if (item.stockQuantity < quantityChange) {
        throw new ApiError(
          400,
          `Insufficient stock for item "${item.name}". Available: ${item.stockQuantity}`
        );
      }
      orderItem.quantity = quantity;
      orderItem.priceAtOrder = item.price;
      await orderItem.save({ transaction });
      item.stockQuantity -= quantityChange;
    } else {
      orderItem = await OrderItem.create(
        {
          orderId,
          itemId,
          quantity,
          priceAtOrder: item.price,
        },
        { transaction }
      );
      item.stockQuantity -= quantity;
    }

    await item.save({ transaction });

    const totalCost = await calculateOrderTotal(orderId, transaction);
    order.totalCost = totalCost;
    await order.save({ transaction });

    await transaction.commit();

    checkSalesMilestone().catch((err) => {
      console.error("Error checking sales milestone:", err);
    });

    return Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: "orderItems", include: [Item] }],
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Create a new order
 * @param {Object} orderBody
 * @returns {Promise<Order>}
 */

const checkSalesMilestone = async () => {
  try {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const result = await Order.findOne({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "orderCount"],
        [sequelize.fn("SUM", sequelize.col("totalCost")), "totalSales"],
      ],
      where: {
        createdAt: {
          [Op.gte]: tenDaysAgo,
        },
        status: "completed",
      },
    });

    const orderCount = parseInt(result.getDataValue("orderCount") || 0);
    const totalSales = parseFloat(result.getDataValue("totalSales") || 0);

    if (orderCount >= 500) {
      console.log(
        `Sales milestone reached: ${orderCount} orders in the last 10 days`
      );

      const adminUsers = await User.findAll({
        where: {
          role: {
            [Op.in]: ["Super Admin", "Manager"],
          },
        },
      });

      if (!adminUsers || adminUsers.length === 0) {
        console.log("No admin users found to notify about sales milestone");
        return;
      }

      let emailSubject = `Sales Milestone Reached: 500+ Orders in 10 Days`;
      let emailBody = `
        Congratulations! Your restaurant has reached a significant sales milestone:
        
        Orders in the last 10 days: ${orderCount}
        Total sales amount: $${totalSales.toFixed(2)}
        
        This is an automated notification triggered when 500 or more orders are completed within a 10-day period.
      `;

      if (genAiService.isGenAiAvailable()) {
        try {
          const emailData = await genAiService.generateAdminEmail(
            "Sales Milestone Reached",
            {
              orderCount,
              totalSales,
              period: "10 days",
              milestone: 500,
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
        `Notification sent to ${adminUsers.length} admin(s) about sales milestone`
      );
    }
  } catch (error) {
    console.error("Error in checkSalesMilestone:", error);
    throw error;
  }
};

/**
 * Remove an item from an order.
 * @param {number} orderId
 * @param {number} itemId
 * @returns {Promise<Order>}
 */
const removeItemFromOrder = async (orderId, itemId) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  if (order.status !== "pending") {
    throw new ApiError(400, "Cannot modify items in a non-pending order");
  }

  const orderItem = await OrderItem.findOne({ where: { orderId, itemId } });
  if (!orderItem) {
    throw new ApiError(404, "Item not found in this order");
  }

  const item = await Item.findByPk(itemId);

  const transaction = await sequelize.transaction();
  try {
    const removedQuantity = orderItem.quantity;
    await orderItem.destroy({ transaction });

    if (item) {
      item.stockQuantity += removedQuantity;
      await item.save({ transaction });
    }

    const totalCost = await calculateOrderTotal(orderId);
    order.totalCost = totalCost;
    await order.save({ transaction });

    await transaction.commit();

    return Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: "orderItems", include: [Item] }],
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Update order status or assign waiter.
 * @param {number} orderId
 * @param {object} updateData - Contains status or waiterId
 * @param {User} user - The user performing the action
 * @returns {Promise<Order>}
 */
const updateOrder = async (orderId, updateData, user) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const allowedUpdates = {};

  if (user.role === "Cashier") {
    if (updateData.status && updateData.status === "completed") {
      if (order.status !== "pending") {
        throw new ApiError(
          400,
          "Only pending orders can be marked as completed."
        );
      }
      if (!order.waiterId) {
        throw new ApiError(
          400,
          "Cannot complete order without an assigned waiter."
        );
      }
      const itemCount = await OrderItem.count({ where: { orderId } });
      if (itemCount === 0) {
        throw new ApiError(400, "Cannot complete an empty order.");
      }
      allowedUpdates.status = "completed";
    } else if (updateData.status) {
      throw new ApiError(403, "Cashiers can only mark orders as completed.");
    }

    if (updateData.waiterId) {
      const waiter = await User.findOne({
        where: { id: updateData.waiterId, role: "Waiter" },
      });
      if (!waiter) {
        throw new ApiError(400, "Invalid Waiter ID provided.");
      }
      allowedUpdates.waiterId = updateData.waiterId;
    }
  } else if (["Super Admin", "Manager"].includes(user.role)) {
    if (updateData.status) {
      const allowedStatuses = ["pending", "completed", "expired", "cancelled"];
      if (!allowedStatuses.includes(updateData.status)) {
        throw new ApiError(
          400,
          `Invalid status. Allowed: ${allowedStatuses.join(", ")}`
        );
      }
      allowedUpdates.status = updateData.status;
    }
    if (updateData.waiterId) {
      const waiter = await User.findOne({
        where: { id: updateData.waiterId, role: "Waiter" },
      });
      if (!waiter) {
        throw new ApiError(400, "Invalid Waiter ID provided.");
      }
      allowedUpdates.waiterId = updateData.waiterId;
    }
  } else {
    throw new ApiError(403, "Forbidden: You cannot update orders.");
  }

  if (Object.keys(allowedUpdates).length === 0) {
    throw new ApiError(400, "No valid fields provided for update.");
  }

  Object.assign(order, allowedUpdates);
  await order.save();
  return order.reload({
    include: [
      { model: OrderItem, as: "orderItems", include: [Item] },
      { model: User, as: "waiter" },
    ],
  });
};

/**
 * Get order details by ID.
 * @param {number} orderId
 * @param {User} user - The requesting user
 * @returns {Promise<Order>}
 */
const getOrderById = async (orderId, user) => {
  const order = await Order.findByPk(orderId, {
    include: [
      { model: OrderItem, as: "orderItems", include: [Item] },
      {
        model: User,
        as: "waiter",
        attributes: {
          exclude: [
            "password",
            "verificationToken",
            "resetPasswordToken",
            "resetPasswordExpires",
          ],
        },
      },
    ],
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (user.role === "Waiter" && order.waiterId !== user.id) {
    throw new ApiError(
      403,
      "Forbidden: You can only view orders assigned to you."
    );
  }

  return order;
};

/**
 * Query for orders.
 * @param {object} filter - Sequelize where clause
 * @param {object} options - Query options (sortBy, sortOrder, limit, page)
 * @param {User} user - The requesting user
 * @returns {Promise<QueryResult>}
 */
const queryOrders = async (filter, options, user) => {
  const { sortBy = "createdAt", sortOrder = "DESC", limit, page } = options;
  const whereClause = { ...filter };

  if (user.role === "Waiter") {
    whereClause.waiterId = user.id;
  }

  const queryOptions = {
    where: whereClause,
    include: [
      { model: User, as: "waiter", attributes: ["id", "name", "email"] },
    ],
    order: [[sortBy, sortOrder.toUpperCase()]],
  };

  if (limit && page) {
    queryOptions.limit = parseInt(limit, 10);
    queryOptions.offset = (parseInt(page, 10) - 1) * queryOptions.limit;
  }

  const orders = await Order.findAndCountAll(queryOptions);

  return {
    results: orders.rows,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || orders.count,
    totalPages: limit ? Math.ceil(orders.count / limit) : 1,
    totalResults: orders.count,
  };
};

module.exports = {
  createOrder,
  addItemToOrder,
  removeItemFromOrder,
  updateOrder,
  getOrderById,
  queryOrders,
  checkSalesMilestone,
};
