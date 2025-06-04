const express = require("express");
const config = require("../../../config/config"); 
const authRoutes = require("./auth.routes");
const usersRoutes = require("./users.routes");
const itemsRoutes = require("./items.routes");
const ordersRoutes = require("./orders.routes");
const reportsRoutes = require("./reports.routes");
const swaggerRoutes = require("./swagger.routes.js"); 
const genAiRoutes = require("./genai.routes.js"); 

const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/users",
    route: usersRoutes,
  },
  {
    path: "/items",
    route: itemsRoutes,
  },
  {
    path: "/orders",
    route: ordersRoutes,
  },
  {
    path: "/reports",
    route: reportsRoutes,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

router.use("/genai", genAiRoutes);

if (config.env !== "production") {
  router.use("/docs", swaggerRoutes);
  console.log(`Swagger UI available at /api/docs`);
}

module.exports = router;
