module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "completed", "expired", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },
      totalCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          min: 0,
        },
      },
      waiterId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
    },
    {
      timestamps: true,
      indexes: [
        { fields: ["status"] },
        { fields: ["waiterId"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  Order.associate = (models) => {
    Order.belongsTo(models.User, {
      foreignKey: "waiterId",
      as: "waiter",
    });

    Order.belongsToMany(models.Item, {
      through: models.OrderItem,
      foreignKey: "orderId",
      as: "items",
    });

    Order.hasMany(models.OrderItem, {
      foreignKey: "orderId",
      as: "orderItems",
    });
  };

  return Order;
};
