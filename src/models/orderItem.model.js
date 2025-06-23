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
          model: "Orders", 
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", 
      },
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT", 
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1, 
        },
      },
      priceAtOrder: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "Price of the item at the time the order was placed/updated.",
      },
    },
    {
      timestamps: false,
      indexes: [
        { fields: ["orderId"] },
        { fields: ["itemId"] },
      ],
    }
  );

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, { foreignKey: "orderId" });
    OrderItem.belongsTo(models.Item, { foreignKey: "itemId" });
  };

  return OrderItem;
};
