jest.mock("fs");
jest.mock("../../src/models", () => ({
  Item: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));
jest.mock("../../src/utils/ApiError", () => {
  return class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
      this.name = "ApiError";
    }
  };
});

const fs = require("fs");
const { importItemsFromCsv } = require("../../src/services/item.service");
const { Item, sequelize } = require("../../src/models");
const ApiError = require("../../src/utils/ApiError");

describe("importItemsFromCsv", () => {
  let transaction;
  const tempFilePath = "/tmp/test.csv";

  beforeEach(() => {
    jest.clearAllMocks();
    transaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    sequelize.transaction.mockResolvedValue(transaction);
    fs.unlinkSync.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should import new items from valid CSV", async () => {
    const csvContent = `name,description,price,category,expiryDate,stockQuantity
Burger,Delicious beef burger,250,food,2025-01-01,10
Cola,Refreshing drink,50,beverages,,100
`;
    fs.readFileSync.mockReturnValue(csvContent);

    Item.findByPk.mockResolvedValue(null);
    Item.findOne.mockResolvedValue(null);
    Item.create.mockResolvedValue({});

    const result = await importItemsFromCsv(tempFilePath);

    expect(result).toEqual({ created: 2, updated: 0, errors: [] });
    expect(Item.create).toHaveBeenCalledTimes(2);
    expect(transaction.commit).toHaveBeenCalled();
    expect(transaction.rollback).not.toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalledWith(tempFilePath);
  });

  it("should update existing item if id is provided", async () => {
    const csvContent = `id,name,description,price,category,expiryDate,stockQuantity
1,Burger,Updated burger,300,food,2025-01-01,20
`;
    fs.readFileSync.mockReturnValue(csvContent);

    const mockItem = { update: jest.fn().mockResolvedValue({}) };
    Item.findByPk.mockResolvedValue(mockItem);

    const result = await importItemsFromCsv(tempFilePath);

    expect(result).toEqual({ created: 0, updated: 1, errors: [] });
    expect(mockItem.update).toHaveBeenCalled();
    expect(transaction.commit).toHaveBeenCalled();
    expect(transaction.rollback).not.toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalledWith(tempFilePath);
  });

  it("should return errors and rollback if CSV has invalid data", async () => {
    const csvContent = `name,description,price,category,expiryDate,stockQuantity
,Bad item,,invalidcat,notadate,-5
`;
    fs.readFileSync.mockReturnValue(csvContent);

    const result = await importItemsFromCsv(tempFilePath);

    expect(result.created).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(transaction.rollback).toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalledWith(tempFilePath);
  });

  it("should throw ApiError if CSV is empty", async () => {
    const csvContent = ``;
    console.error = jest.fn();

    fs.readFileSync.mockReturnValue(csvContent);

    await expect(importItemsFromCsv(tempFilePath)).rejects.toThrow(
      "CSV file is empty or invalid."
    );
    expect(fs.unlinkSync).toHaveBeenCalledWith(tempFilePath);
  });

  it("should throw ApiError if file cannot be parsed", async () => {
    const originalConsoleError = console.error;
    console.error = jest.fn();

    fs.readFileSync.mockImplementation(() => {
      throw new Error("File error");
    });

    await expect(importItemsFromCsv(tempFilePath)).rejects.toThrow(ApiError);
    expect(fs.unlinkSync).toHaveBeenCalledWith(tempFilePath);

    console.error = originalConsoleError;
  });
});
