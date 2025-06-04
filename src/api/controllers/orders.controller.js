const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const orderService = require("../../services/order.service");
const pick = require("../../utils/pick");

const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.user);
  res.status(201).send(order);
});

const addItemToOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { itemId, quantity } = req.body;
  const order = await orderService.addItemToOrder(orderId, itemId, quantity);
  res.send(order);
});

const addItemsToOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Items must be a non-empty array");
  }

  const order = await orderService.addItemsToOrder(orderId, items);
  res.send(order);
});

const removeItemFromOrder = catchAsync(async (req, res) => {
  const { orderId, itemId } = req.params;
  const order = await orderService.removeItemFromOrder(orderId, itemId);
  res.send(order);
});

const updateOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const updateBody = pick(req.body, ["status", "waiterId"]);
  const order = await orderService.updateOrder(orderId, updateBody, req.user);
  res.send(order);
});

const getOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const order = await orderService.getOrderById(orderId, req.user);
  res.send(order);
});

const getOrders = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["status", "waiterId"]);
  const options = pick(req.query, ["sortBy", "sortOrder", "limit", "page"]);

  const result = await orderService.queryOrders(filter, options, req.user);
  res.send(result);
});

module.exports = {
  createOrder,
  addItemToOrder,
  removeItemFromOrder,
  updateOrder,
  getOrder,
  getOrders,
  addItemsToOrder,
};
