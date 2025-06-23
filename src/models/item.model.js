module.exports = (sequelize, DataTypes) => {
  const Item = sequelize.define(
    "Item",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      category: {
        type: DataTypes.ENUM("others", "food", "beverages"),
        allowNull: false,
      },
      expiryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      stockQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      discountedPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      discountApplied: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      indexes: [
        { fields: ["name"] },
        { fields: ["category"] },
        { fields: ["price"] },
        { fields: ["expiryDate"] },
      ],
    }
  );

  Item.associate = (models) => {
    Item.belongsToMany(models.Order, {
      through: models.OrderItem,
      foreignKey: "itemId",
      as: "orders",
    });
  };

  return Item;
};
