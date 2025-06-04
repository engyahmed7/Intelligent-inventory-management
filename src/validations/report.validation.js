const { query } = require("express-validator");

const getWaiterCommissionReport = [
  query("startDate")
    .notEmpty().withMessage("Start date is required")
    .isISO8601().withMessage("Start date must be a valid date (YYYY-MM-DD)")
    .toDate(),
  query("endDate")
    .notEmpty().withMessage("End date is required")
    .isISO8601().withMessage("End date must be a valid date (YYYY-MM-DD)")
    .toDate()
    .custom((endDate, { req }) => {
      if (endDate < req.query.startDate) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
  query("waiterName").optional().trim(),
  query("export")
    .optional()
    .isBoolean().withMessage("Export must be true or false")
    .toBoolean(),
  query("format")
    .optional()
    .toLowerCase()
    .isIn(["csv"])
    .withMessage("Format must be csv if provided"),
  query().custom((value, { req }) => {
    if (req.query.format === "csv" && !req.query.export) {
      throw new Error("format=csv requires export=true");
    }
    return true;
  }),
];

module.exports = {
  getWaiterCommissionReport,
};

