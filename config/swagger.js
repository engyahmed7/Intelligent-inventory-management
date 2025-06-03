const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GeekyAir Backend API",
      version: "1.0.0",
      description:
        "API documentation for the GeekyAir internal system assessment.",
    },
    servers: [
      {
        url: `/api`, 
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [], 
      },
    ],
  },
  apis: [
    path.join(__dirname, "../src/api/routes/*.js"),
    path.join(__dirname, "../src/models/*.js"), 
    path.join(__dirname, "../src/validations/*.js"), 
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
