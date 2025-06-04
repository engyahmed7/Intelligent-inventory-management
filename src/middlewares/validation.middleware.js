const { validationResult } = require("express-validator");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

/**
 * Middleware to validate request body/params/query using express-validator schemas.
 * @param {Array} validations - Array of express-validator validation chains.
 * @returns {function} Express middleware function.
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.param, 
      message: err.msg,
    }));

    const errorMessage = formattedErrors[0]?.message || "Validation failed";
    next(new ApiError(400, errorMessage, true, { errors: formattedErrors }));
  };
};

module.exports = validate;
