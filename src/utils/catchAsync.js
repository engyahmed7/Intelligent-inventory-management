/**
 * Wraps an asynchronous route handler to catch errors and pass them to the next middleware.
 * @param {function} fn - The asynchronous function to wrap.
 * @returns {function} Express route handler.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

module.exports = catchAsync;

