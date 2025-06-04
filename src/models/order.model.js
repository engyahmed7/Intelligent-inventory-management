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
        type: DataTypes.ENUM("pending", "completed", "expired", "cancelled"), // Added cancelled for flexibility
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
        allowNull: true, // An order might be created before a waiter is assigned
        references: {
          model: "Users", // Assumes your User model table name is 'Users'
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL", // Or restrict, depending on requirements
      },
      // Optional: Add cashierId if needed to track who created the order
      // cashierId: {
      //   type: DataTypes.INTEGER,
      //   allowNull: false,
      //   references: {
      //     model: 'Users',
      //     key: 'id'
      //   }
      // }
    },
    {
      timestamps: true, // Adds createdAt and updatedAt
      indexes: [
        { fields: ["status"] },
        { fields: ["waiterId"] },
        { fields: ["createdAt"] }, // Index for finding old pending orders
      ],
    }
  );

  Order.associate = (models) => {
    // Order belongs to one Waiter
    Order.belongsTo(models.User, {
      foreignKey: "waiterId",
      as: "waiter",
    });

    // Order can have many Items through OrderItem
    Order.belongsToMany(models.Item, {
      through: models.OrderItem,
      foreignKey: "orderId",
      as: "items",
    });

    // Direct association to OrderItem to easily fetch quantities/details
    Order.hasMany(models.OrderItem, {
      foreignKey: "orderId",
      as: "orderItems",
    });

    // Optional: Order belongs to one Cashier
    // Order.belongsTo(models.User, { foreignKey: 'cashierId', as: 'cashier' });
  };

  return Order;
};
