const config = require("./config");

module.exports = {
  development: {
    username: config.db.user,
    password: config.db.password,
    database: config.db.name,
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: false, 
  },
  test: {
    username: process.env.CI_DB_USERNAME || config.db.user,
    password: process.env.CI_DB_PASSWORD || config.db.password,
    database: process.env.CI_DB_NAME || `${config.db.name}_test`,
    host: process.env.CI_DB_HOST || config.db.host,
    port: process.env.CI_DB_PORT || config.db.port,
    dialect: config.db.dialect,
    logging: false,
  },
  production: {
    username: config.db.user,
    password: config.db.password,
    database: config.db.name,
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: false,
    dialectOptions: {
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false, 
      // },
    },
  },
};

