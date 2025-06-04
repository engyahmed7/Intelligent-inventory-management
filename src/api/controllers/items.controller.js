const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const itemService = require("../../services/item.service");
const ApiError = require("../../utils/ApiError");
const pick = require("../../utils/pick");

const createItem = catchAsync(async (req, res) => {
  const item = await itemService.createItem(req.body);
  res.status(201).send(item);
});

const getItems = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["category"]);
  const options = pick(req.query, ["sortBy", "sortOrder", "limit", "page"]);

  const result = await itemService.queryItems(filter, options, req.user);
  res.status(200).send(result);
});

const getItem = catchAsync(async (req, res) => {
  const item = await itemService.getItemById(req.params.itemId, req.user);
  res.send(item);
});

const updateItem = catchAsync(async (req, res) => {
  const item = await itemService.updateItemById(req.params.itemId, req.body);
  res.send(item);
});

const deleteItem = catchAsync(async (req, res) => {
  await itemService.deleteItemById(req.params.itemId);
  res.status(200).send({ message: "Item deleted successfully." });
});

const exportItems = catchAsync(async (req, res) => {
  const csvData = await itemService.exportItemsToCsv(req.user);
  const fileName = `items_export_${new Date().toISOString().split("T")[0]}.csv`;
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.status(200).send(csvData);
});

const importItems = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No CSV file uploaded.");
  }
  const result = await itemService.importItemsFromCsv(req.file.path, req.user);
  res.status(200).send(result);
});

module.exports = {
  createItem,
  getItems,
  getItem,
  updateItem,
  deleteItem,
  exportItems,
  importItems,
};
