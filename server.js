const express = require("express");
const cors = require("cors");
const httpStatus = require("http-status");
const config = require("./config/config");
const { sequelize } = require("./src/models");
const routes = require("./src/api/routes");
const ApiError = require("./src/utils/ApiError");
const errorHandler = require("./src/middlewares/error.middleware");
const { scheduleTask } = require("./src/utils/scheduler.util");
const checkItemExpiry = require("./src/jobs/itemExpiry.job");
const checkExpiredOrders = require("./src/jobs/orderStatus.job");
const applyTwentyDayExpiryDiscount = require("./src/jobs/applyTwentyDayExpiryDiscount.job");
const addExpiringItemsToCalendar = require("./src/jobs/expiringItemsCalendarJob");

const salesReport = require("./src/jobs/salesReport.job");

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));

// API routes
app.use("/api", routes);

app.use((req, res, next) => {
  next(new ApiError(400, "Not found"));
});

app.use(errorHandler);

let server;
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("Models synchronized successfully.");
    server = app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);

      // check item expiry every day
      scheduleTask("28 16 * * *", checkItemExpiry, {
        timezone: "Africa/Cairo",
      });

      // Check for expired orders every hour
      scheduleTask("0 * * * *", checkExpiredOrders, {
        timezone: "Africa/Cairo",
      });

      // Apply 20-day expiry discount
      scheduleTask("50 16 * * *", applyTwentyDayExpiryDiscount, {
        timezone: "Africa/Cairo",
      });

      // sales report generation and upload to Google Drive
      scheduleTask(
        "0 12 * * 0",
        () => {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setDate(end.getDate() + 7);

          salesReport(start, end);
        },
        {
          timezone: "Africa/Cairo",
        }
      );

      // Add expiring items to Google Calendar
      scheduleTask("48 20 * * *", addExpiringItemsToCalendar, {
        timezone: "Africa/Cairo",
      });
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database or start server:", err);
    process.exit(1);
  });


const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

const unexpectedErrorHandler = (error) => {
  console.error("Unhandled error:", error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  if (server) {
    server.close();
  }
});

module.exports = app;
