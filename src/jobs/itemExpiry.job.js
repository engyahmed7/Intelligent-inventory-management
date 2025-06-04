const { Item, User } = require("../models");
const { Op } = require("sequelize");
const emailService = require("../services/email.service");
const {
  isGenAiAvailable,
  generateAdminEmail,
} = require("../services/genai.service"); 

/**
 * Finds items expiring soon or already expired and notifies admins/managers.
 * Optionally uses GenAI to format the email if available.
 */
const checkItemExpiry = async () => {
  console.log("Running item expiry check job...");
  const today = new Date();
  const fiveDaysFromNow = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

  try {
    const expiringSoonItems = await Item.findAll({
      where: {
        expiryDate: {
          [Op.eq]: fiveDaysFromNow.toISOString().split("T")[0],
        },
        stockQuantity: { [Op.gt]: 0 },
      },
      raw: true, 
    });

    const expiredTodayItems = await Item.findAll({
      where: {
        expiryDate: {
          [Op.eq]: today.toISOString().split("T")[0],
        },
        stockQuantity: { [Op.gt]: 0 },
      },
      raw: true, 
    });

    if (expiringSoonItems.length === 0 && expiredTodayItems.length === 0) {
      console.log("No items expiring soon or today requiring notification.");
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

    const recipientEmails = recipients.map((user) => user.email).join(", ");

    const emailData = {
      expiringSoon: expiringSoonItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.stockQuantity,
      })),
      expiredToday: expiredTodayItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.stockQuantity,
      })),
    };

    let subject = "Item Expiry Alert";
    let textBody = "";
    let htmlBody = "";

    if (isGenAiAvailable()) {
      try {
        const genEmail = await generateAdminEmail(
          "Item Expiry Report",
          emailData
        );
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
        textBody = `GenAI failed. Default report:\n\nExpiring in 5 days:\n${JSON.stringify(
          emailData.expiringSoon
        )}\n\nExpired today:\n${JSON.stringify(emailData.expiredToday)}`;
        htmlBody = `<p>GenAI failed. Default report:</p><p><b>Expiring in 5 days:</b><br>${JSON.stringify(
          emailData.expiringSoon
        )}</p><p><b>Expired today:</b><br>${JSON.stringify(
          emailData.expiredToday
        )}</p>`;
      }
    } else {
      if (expiringSoonItems.length > 0) {
        subject = "Item Expiry Alert: Items Expiring Soon";
        textBody += "The following items are expiring in 5 days:\n";
        htmlBody += "<p>The following items are expiring in 5 days:</p><ul>";
        expiringSoonItems.forEach((item) => {
          textBody += `- ${item.name} (ID: ${item.id}), Quantity: ${item.stockQuantity}\n`;
          htmlBody += `<li>${item.name} (ID: ${item.id}), Quantity: ${item.stockQuantity}</li>`;
        });
        htmlBody += "</ul>";
        textBody += "\n";
        htmlBody += "<br>";
      }
      if (expiredTodayItems.length > 0) {
        subject =
          expiringSoonItems.length > 0
            ? "Item Expiry Alert: Expiring Soon & Expired Today"
            : "Item Expiry Alert: Items Expired Today";
        textBody += "The following items expired today:\n";
        htmlBody += "<p>The following items expired today:</p><ul>";
        expiredTodayItems.forEach((item) => {
          textBody += `- ${item.name} (ID: ${item.id}), Quantity: ${item.stockQuantity}\n`;
          htmlBody += `<li>${item.name} (ID: ${item.id}), Quantity: ${item.stockQuantity}</li>`;
        });
        htmlBody += "</ul>";
      }
    }

    await emailService.sendEmail(recipientEmails, subject, textBody, htmlBody);
    console.log(
      `Sent item expiry notification to ${recipients.length} recipients.`
    );
  } catch (error) {
    console.error("Error during item expiry check job:", error);
  }
};

module.exports = checkItemExpiry;
