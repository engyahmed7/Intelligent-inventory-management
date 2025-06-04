const { sequelize, User, Order, OrderItem, Item } = require("../models");
const { Op } = require("sequelize");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const { QueryTypes } = require("sequelize");
const { Parser } = require("json2csv");
const fs = require("fs");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;

/**
 * Generate Waiter Commission Report
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string|null} waiterName - Optional partial name match
 * @param {User} requestingUser - User requesting the report
 * @param {boolean} exportCsv - Flag to indicate CSV export
 * @returns {Promise<object[]|string>} - Array of report objects or CSV string
 */
const generateWaiterCommissionReport = async (
  startDate,
  endDate,
  waiterName,
  requestingUser,
  exportCsv = false
) => {
  let waiterFilter = "";
  const replacements = {
    startDate,
    endDate: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1),
  };

  if (requestingUser.role === "Waiter") {
    waiterFilter = `AND u.id = :waiterId`;
    replacements.waiterId = requestingUser.id;
  } else if (waiterName) {
    waiterFilter = `AND u.name ILIKE :waiterName`; 
    replacements.waiterName = `%${waiterName}%`;
  } else if (
    !["Super Admin", "Manager", "Cashier"].includes(requestingUser.role)
  ) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Forbidden: Insufficient permissions."
    );
  }

  const query = `
    SELECT
        u.id AS "waiterId",
        u."name" AS "waiterName",
        COUNT(DISTINCT oi.id) AS "totalItemsSold",
        SUM(CASE WHEN i.category = 'food' THEN oi.quantity ELSE 0 END) AS "itemsSoldFood",
        SUM(CASE WHEN i.category = 'beverages' THEN oi.quantity ELSE 0 END) AS "itemsSoldBeverages",
        SUM(CASE WHEN i.category = 'others' THEN oi.quantity ELSE 0 END) AS "itemsSoldOthers",
        SUM(oi."priceAtOrder" * oi.quantity) AS "totalRevenue",
        SUM(
            CASE
                WHEN i.category = 'food' THEN oi."priceAtOrder" * oi.quantity * 0.01 -- 1%
                WHEN i.category = 'beverages' THEN oi."priceAtOrder" * oi.quantity * 0.005 -- 0.5%
                WHEN i.category = 'others' THEN oi."priceAtOrder" * oi.quantity * 0.0025 -- 0.25%
                ELSE 0
            END
        ) AS "totalCommission"
    FROM
        "Users" u
    JOIN
        "Orders" o ON u.id = o."waiterId"
    JOIN
        "OrderItems" oi ON o.id = oi."orderId"
    JOIN
        "Items" i ON oi."itemId" = i.id
    WHERE
        u.role = 'Waiter'
        AND o.status = 'completed'
        AND o."updatedAt" >= :startDate
        AND o."updatedAt" <= :endDate
        ${waiterFilter}
    GROUP BY
        u.id, u."name"
    ORDER BY
        u."name";
  `;

  try {
    const results = await sequelize.query(query, {
      replacements: replacements,
      type: QueryTypes.SELECT,
      plain: false,
      mapToModel: false,
      raw: true,
    });

    const formattedResults = results.map((row) => ({
      ...row,
      totalRevenue: parseFloat(row.totalRevenue || 0).toFixed(2),
      totalCommission: parseFloat(row.totalCommission || 0).toFixed(2),
      totalItemsSold: parseInt(row.totalItemsSold || 0, 10),
      itemsSoldFood: parseInt(row.itemsSoldFood || 0, 10),
      itemsSoldBeverages: parseInt(row.itemsSoldBeverages || 0, 10),
      itemsSoldOthers: parseInt(row.itemsSoldOthers || 0, 10),
    }));

    if (exportCsv) {
      if (formattedResults.length === 0) {
        return ""; 
      }
      const parser = new Parser();
      const csv = parser.parse(formattedResults);
      return csv;
    } else {
      return formattedResults;
    }
  } catch (error) {
    console.error("Error generating waiter commission report:", error);
    throw new ApiError(500, "Failed to generate report");
  }
};

exports.uploadToDrive = async (tokens, filePath, mimeType, fileName) => {
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials(tokens);

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  console.log("Uploading file to Google Drive...");
  console.log("File path:", filePath);
  console.log("File name:", fileName);
  console.log("File MIME type:", mimeType);
  console.log("OAuth2 tokens:", tokens);

  const fileMetadata = { name: fileName };
  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: "id",
  });

  console.log("File uploaded successfully. File ID:", file.data.id);

  return file.data.id;
};

module.exports = {
  generateWaiterCommissionReport,
};
