const { Item, User } = require("../models");
const { Op } = require("sequelize");
const emailService = require("../services/email.service");
const {
  isGenAiAvailable,
  generateAdminEmail,
} = require("../services/genai.service");

const applyTwentyDayExpiryDiscount = async () => {
  console.log("Running 20-day expiry discount job...");
  const today = new Date();

  const twentyDaysFromNow = new Date(
    today.getTime() + 20 * 24 * 60 * 60 * 1000
  );

  try {
    console.log("Calculating expiry dates...");

    const expiringWithin20DaysItems = await Item.findAll({
      where: {
        expiryDate: {
          [Op.gt]: today.toISOString().split("T")[0],
          [Op.lte]: twentyDaysFromNow.toISOString().split("T")[0],
        },
        stockQuantity: { [Op.gt]: 0 },
        discountApplied: { [Op.not]: true }, 
      },
      raw: true,
    });

    const excludedItemIds = []; 
    const excludedCategories = []; 

    const itemsForDiscount = expiringWithin20DaysItems.filter(
      (item) =>
        !excludedItemIds.includes(item.id) &&
        !(
          excludedCategories.length &&
          excludedCategories.includes(item.category)
        )
    );

    for (const item of itemsForDiscount) {
      const originalPrice = item.price;
      const discountedPrice = +(originalPrice * 0.75).toFixed(2);
      await Item.update(
        {
          discountedPrice,
          discountApplied: true,
        },
        { where: { id: item.id } }
      );
      item.discountedPrice = discountedPrice;
      item.originalPrice = originalPrice;
    }

    if (itemsForDiscount.length === 0) {
      console.log("No items eligible for discount.");
      return;
    }

    const recipients = await User.findAll({
      where: {
        role: { [Op.in]: ["Super Admin", "Manager"] },
        emailVerified: true,
      },
      attributes: ["email"],
    });

    if (recipients.length === 0) {
      console.log("No admins/managers found to notify about item expiry.");
      return;
    }

    const emailData = {
      discounted: itemsForDiscount.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.stockQuantity,
        originalPrice: item.originalPrice,
        discountedPrice: item.discountedPrice,
      })),
      excludedItems: expiringWithin20DaysItems
        .filter(
          (item) =>
            excludedItemIds.includes(item.id) ||
            (excludedCategories.length &&
              excludedCategories.includes(item.category))
        )
        .map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
        })),
    };

    if (isGenAiAvailable()) {
      try {
        const genEmail = await generateAdminEmail("Discount Report", emailData);
        subject = genEmail.subject;
        textBody = genEmail.body;
        htmlBody = `<p>${genEmail.body.replace(/\n/g, "<br>")}</p>`;
        console.log("Generated item expiry email using GenAI.");
      } catch (genAiError) {
        console.error(
          "Failed to generate email with GenAI, falling back to default format:",
          genAiError
        );
        subject = "Item Expiry Alert (Default Format)";
        textBody = `GenAI failed. Default report:\n\n Discounted (25%):\n${JSON.stringify(
          emailData.discounted
        )}\n\nExcluded from discount:\n${JSON.stringify(
          emailData.excludedItems
        )}`;
        htmlBody = `<p>GenAI failed. Default report:</p>
             
              <p><b>Discounted (25%):</b><br>${JSON.stringify(
                emailData.discounted
              )}</p>
              <p><b>Excluded from discount:</b><br>${JSON.stringify(
                emailData.excludedItems
              )}</p>`;
      }
    } else {
      if (itemsForDiscount.length > 0) {
        subject += " & Discounted Items";
        textBody +=
          "\nThe following items expiring within 20 days received a 25% discount:\n";
        htmlBody +=
          "<br><p>The following items expiring within 20 days received a 25% discount:</p><ul>";
        itemsForDiscount.forEach((item) => {
          textBody += `- ${item.name} (ID: ${item.id}), Quantity: ${item.stockQuantity}, Original Price: $${item.originalPrice}, Discounted Price: $${item.discountedPrice}\n`;
          htmlBody += `<li>${item.name} (ID: ${item.id}), Quantity: ${item.stockQuantity}, <b>Original Price:</b> $${item.originalPrice}, <b>Discounted Price:</b> $${item.discountedPrice}</li>`;
        });
        htmlBody += "</ul>";
      }
      if (emailData.excludedItems.length > 0) {
        textBody +=
          "\nThe following items/categories were excluded from discount:\n";
        htmlBody +=
          "<br><p>The following items/categories were excluded from discount:</p><ul>";
        emailData.excludedItems.forEach((item) => {
          textBody += `- ${item.name} (ID: ${item.id}), Category: ${item.category}\n`;
          htmlBody += `<li>${item.name} (ID: ${item.id}), Category: ${item.category}</li>`;
        });
        htmlBody += "</ul>";
      }
    }
    const recipientEmails = recipients.map((user) => user.email).join(", ");

    await emailService.sendEmail(recipientEmails, subject, textBody, htmlBody);
    console.log(
      `Sent item discount notification to ${recipients.length} recipients.`
    );
  } catch (error) {
    console.error("Error applying 20-day expiry discount:", error);
    throw new Error("Failed to apply 20-day expiry discount.");
  }
};

module.exports = applyTwentyDayExpiryDiscount;
