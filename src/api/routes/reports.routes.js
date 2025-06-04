const express = require("express");
const reportsController = require("../controllers/reports.controller");
const {
  authenticate,
  authorize,
} = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validation.middleware");
const reportValidation = require("../../validations/report.validation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Generate commission reports for waiters
 */

/**
 * @swagger
 * /reports/waiter-commission:
 *   get:
 *     summary: Generate a waiter commission report
 *     tags: [Reports]
 *     description: |
 *       Generates a commission report for waiters based on completed orders within a specified date range.
 *       - Accessible by Super Admins, Managers, and Cashiers to view reports for any waiter.
 *       - Waiters can only view their own commission report.
 *       - Supports filtering by date range and optionally by waiter name (partial match).
 *       - Returns JSON by default. Returns CSV if `export=true` and `format=csv` query parameters are provided.
 *       - Commission rates: Others 0.25%, Food 1%, Beverages 0.5%.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report (YYYY-MM-DD)
 *       - in: query
 *         name: waiterName
 *         schema:
 *           type: string
 *         description: Filter by waiter name (partial match, case-insensitive). Required for Waiter role if not provided by default.
 *       - in: query
 *         name: export
 *         schema:
 *           type: boolean
 *         default: false
 *         description: Set to true to export the report.
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv]
 *         description: Specify format for export (only csv supported currently).
 *     responses:
 *       "200":
 *         description: Commission report generated successfully (JSON or CSV)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/WaiterCommissionReportEntry"
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *             description: CSV file containing the commission report data.
 *       "400":
 *         description: Bad Request (e.g., invalid date format, missing required parameters)
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden (e.g., Waiter trying to access another waiter's report)
 *       "500":
 *         description: Internal Server Error (Failed to generate report)
 */
router.get(
  "/waiter-commission",
  authenticate,
  authorize(["Super Admin", "Manager", "Cashier", "Waiter"]),
  validate(reportValidation.getWaiterCommissionReport),
  reportsController.getWaiterCommissionReport 
);

/**
 * @swagger
 * components:
 *   schemas:
 *     WaiterCommissionReportEntry:
 *       type: object
 *       properties:
 *         waiterId:
 *           type: integer
 *         waiterName:
 *           type: string
 *         totalOrders:
 *           type: integer
 *           description: Total number of completed orders served by the waiter in the period.
 *         totalItemsSold:
 *           type: integer
 *           description: Total number of items sold across all completed orders.
 *         itemsSoldByCategory:
 *           type: object
 *           properties:
 *             food:
 *               type: integer
 *             beverages:
 *               type: integer
 *             others:
 *               type: integer
 *           description: Number of items sold in each category.
 *         totalRevenueGenerated:
 *           type: number
 *           format: float
 *           description: Total revenue generated from the waiter's completed orders.
 *         totalCommission:
 *           type: number
 *           format: float
 *           description: Total commission earned by the waiter based on category rates.
 *       example:
 *         waiterId: 5
 *         waiterName: "Bob"
 *         totalOrders: 15
 *         totalItemsSold: 45
 *         itemsSoldByCategory:
 *           food: 20
 *           beverages: 15
 *           others: 10
 *         totalRevenueGenerated: 350.75
 *         totalCommission: 4.55 # Example calculation
 */

module.exports = router;
