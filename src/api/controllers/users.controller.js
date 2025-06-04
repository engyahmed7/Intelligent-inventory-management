const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const userService = require("../../services/user.service");
const ApiError = require("../../utils/ApiError");

const addUser = catchAsync(async (req, res) => {
  const user = await userService.addUser(req.body, req.user);
  res.status(201).send({ user });
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  res.status(200).send(user);
});

module.exports = {
  addUser,
  getUser,
};
