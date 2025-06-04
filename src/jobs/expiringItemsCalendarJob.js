const dayjs = require("dayjs");
const { Item, User } = require("../models");
const { Op } = require("sequelize");
const { addExpiryReminder } = require("../services/googleCalendar.service");

const addExpiringItemsToCalendar = async () => {
  const targetDate = dayjs().add(3, "day").startOf("day").toDate();

  const items = await Item.findAll({
    where: {
      expiryDate: {
        [Op.lte]: targetDate,
      },
      stockQuantity: { [Op.gt]: 0 },
    },
  });

  if (!items.length) {
    console.log("No items nearing expiry.");
    return;
  }

  const users = await User.findAll({
    where: {
      role: { [Op.in]: ["Manager", "Super Admin"] },
      googleTokens: { [Op.ne]: null },
    },
  });

  for (const item of items) {
    for (const user of users) {
      try {
        const { access_token, refresh_token } = user.googleTokens;
        await addExpiryReminder(access_token, refresh_token, {
          name: item.name,
          quantity: item.stockQuantity,
          expiryDate: item.expiryDate,
        });
      } catch (err) {
        console.error("Failed to add event:", err);
      }
    }
  }

  console.log("Expiring item reminders added to calendar.");
};

module.exports = addExpiringItemsToCalendar;
