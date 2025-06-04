const { sequelize } = require("../src/models");

const setupDatabase = async () => {
  console.log("Attempting to connect to the database...");
  try {
    await sequelize.authenticate();
    console.log("Database connection successful.");

    console.log("Synchronizing models with the database...");
    await sequelize.sync({ force: true }); 
    console.log("Database synchronized successfully (Tables created/recreated).");


    process.exit(0); 
  } catch (error) {
    console.error("Failed to set up database:", error);
    process.exit(1); 
  }
};

setupDatabase();

