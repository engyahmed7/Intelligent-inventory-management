const { Op } = require("sequelize");
const generateSalesCSV = require("../utils/reportGenerator");
const { Order, OrderItem, User, Item } = require("../models");
const { uploadToDrive } = require("../services/googleDrive.service");
const fs = require("fs");
const path = require("path");

const salesReport = async (startDate, endDate) => {
  console.log("Running daily expiring items report job...");

  const orders = await Order.findAll({
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
    include: [
      {
        model: User,
        as: "waiter",
        attributes: ["id", "name"],
      },
      {
        model: OrderItem,
        as: "orderItems",
        include: [
          {
            model: Item,
            attributes: ["id", "name", "category", "price"],
          },
        ],
      },
    ],
  });

  if (!orders || orders.length === 0) {
    console.log("No orders found for the specified date range.");
    return;
  }
  console.log("Orders fetched successfully.");
  console.log("Orders:", orders);

  const reportRows = [];
  for (const order of orders) {
    if (!order.orderItems || order.orderItems.length === 0) continue;

    let categoryBreakdown = {};
    let totalCost = 0;
    const itemsList = (order.orderItems || [])
      .map((oi) => {
        const item = oi.Item;
        totalCost += oi.quantity * item.price;
        categoryBreakdown[item.category] =
          (categoryBreakdown[item.category] || 0) + oi.quantity;
        return `${item.name} (x${oi.quantity})`;
      })
      .join(", ");

    reportRows.push({
      date: order.createdAt.toISOString().split("T")[0],
      orderId: order.id,
      cashier: order.cashier?.name || "",
      waiter: order.waiter?.name || "",
      items: itemsList,
      totalCost: Number(order.totalCost),
      categoryBreakdown: JSON.stringify(categoryBreakdown),
      status: order.status,
    });
  }

  const reportsDir = path.resolve(__dirname, "../../reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  const filePath = path.join(reportsDir, "sales-report.csv");
  await generateSalesCSV(reportRows, filePath);

  const admins = await User.findAll({
    where: {
      role: { [Op.in]: ["Manager", "Super Admin"] },
      googleTokens: { [Op.ne]: null },
    },
  });

  for (const admin of admins) {
    await uploadToDrive(
      admin.googleTokens,
      filePath,
      "text/csv",
      `sales-report-${startDate.toISOString().split("T")[0]}-${
        endDate.toISOString().split("T")[0]
      }.csv`
    );
  }

  console.log("Expiring items reports exported to connected Google Drives.");
};

module.exports = salesReport;
