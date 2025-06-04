const httpStatus = require("http-status");
const config = require("../../config/config");
const ApiError = require("../utils/ApiError");
const { Sequelize } = require("../models"); 

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (err instanceof Sequelize.ValidationError) {
    statusCode = 400;
    message = err.errors.map((e) => e.message).join(", ");
  } else if (err instanceof Sequelize.UniqueConstraintError) {
    statusCode = 400;
    const field = Object.keys(err.fields)[0];
    message = `${field} already exists.`;
  } else if (err instanceof Sequelize.ForeignKeyConstraintError) {
    statusCode = 400;
    message = `Invalid reference: ${err.index} could not be found.`;
  } else if (err instanceof Sequelize.DatabaseError) {
    statusCode = 500;
    message = "Database error occurred.";
    console.error("Sequelize Database Error:", err);
  }

  if (!(err instanceof ApiError)) {
    statusCode = statusCode || 500;
    message = message || httpStatus[statusCode];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === "development" && { stack: err.stack }), 
    ...(err.errors && { errors: err.errors }), 
  };

  if (config.env === "development") {
    console.error(err);
  }

  res.status(statusCode).send(response);
};

module.exports = errorHandler;

