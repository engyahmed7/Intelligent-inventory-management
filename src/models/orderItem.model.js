module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    "OrderItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Orders", // Assumes your Order model table name is 'Orders'
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // If an order is deleted, its items are removed
      },
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Items", // Assumes your Item model table name is 'Items'
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT", // Prevent deleting an item if it's part of an order? Or SET NULL?
        // RESTRICT is safer to maintain order history integrity.
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1, // Must order at least one item
        },
      },
      priceAtOrder: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false, // Store the price when the order was placed
        comment: "Price of the item at the time the order was placed/updated.",
      },
    },
    {
      timestamps: false, // Usually junction tables don't need timestamps unless specified
      indexes: [
        // Composite unique key to prevent adding the same item multiple times to the same order
        // If you want to allow updating quantity instead, remove this unique constraint
        // { unique: true, fields: ["orderId", "itemId"] },
        { fields: ["orderId"] },
        { fields: ["itemId"] },
      ],
    }
  );

  // No direct associations defined here as they are handled by the belongsToMany in Order and Item
  OrderItem.associate = (models) => {
    // If needed, define belongsTo associations back to Order and Item
    OrderItem.belongsTo(models.Order, { foreignKey: "orderId" });
    OrderItem.belongsTo(models.Item, { foreignKey: "itemId" });
  };

  return OrderItem;
};
