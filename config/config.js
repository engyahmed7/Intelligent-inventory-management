require("dotenv").config();

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "default_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  },
  baseUrl:
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    dialect: process.env.DB_DIALECT || "postgres",
  },
  googleApiKey: process.env.GOOGLE_API_KEY || "",
};
