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

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

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
    return sequelize.sync();

  })
  .then(() => {
    console.log("Models synchronized successfully."); 
    server = app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);

      scheduleTask("0 17 * * *", checkItemExpiry, { timezone: "Africa/Cairo" });
      scheduleTask("0 * * * *", checkExpiredOrders, {
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
