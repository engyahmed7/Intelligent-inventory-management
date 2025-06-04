const { Order } = require("../models");
const { Op } = require("sequelize");

/**
 * Finds pending orders older than 4 hours and updates their status to 'expired'.
 */
const checkExpiredOrders = async () => {
  console.log("Running expired order check job...");
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

  try {
    const [updateCount] = await Order.update(
      { status: "expired" },
      {
        where: {
          status: "pending",
          createdAt: {
            [Op.lt]: fourHoursAgo, 
          }
        },
      }
    );

    if (updateCount > 0) {
      console.log(`Updated ${updateCount} pending orders to 'expired'.`);
    } else {
      console.log("No pending orders found older than 4 hours.");
    }
  } catch (error) {
    console.error("Error during expired order check job:", error);
  }
};

module.exports = checkExpiredOrders;

