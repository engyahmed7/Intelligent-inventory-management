const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const reportService = require("../../services/report.service");
const pick = require("../../utils/pick");

const getWaiterCommissionReport = catchAsync(async (req, res) => {
  const {
    startDate,
    endDate,
    waiterName,
    export: exportCsv,
    format,
  } = pick(req.query, [
    "startDate",
    "endDate",
    "waiterName",
    "export",
    "format",
  ]);

  const reportData = await reportService.generateWaiterCommissionReport(
    startDate,
    endDate,
    waiterName,
    req.user,
    exportCsv && format === "csv"
  );

  if (exportCsv && format === "csv") {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const fileName = `waiter_commission_report_${
      start.toISOString().split("T")[0]
    }_to_${end.toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(reportData);
  } else {
    res.status(200).send(reportData);
  }
});

module.exports = {
  getWaiterCommissionReport,
};
