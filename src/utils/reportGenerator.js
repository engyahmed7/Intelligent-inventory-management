const fs = require("fs");
const { Parser } = require("json2csv");

const generateSalesCSV = async (data, filePath) => {
  try {
    if (!data || data.length === 0) {
      console.log("No data to write to CSV.");
      return;
    }

    const fields = [
      { label: "📅 Date", value: "date" },
      { label: "🧾 Order ID", value: "orderId" },
      { label: "🧑‍🍳 Waiter involved", value: "waiter" },
      { label: "🛒 Items in Order", value: "items" },
      { label: "🧮 Total Cost", value: "totalCost" },
      { label: "🗂️ Category Breakdown", value: "categoryBreakdown" },
      { label: "📦 Order Status", value: "status" },
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    fs.writeFileSync(filePath, csv);
    console.log("CSV written successfully to", filePath);
  } catch (error) {
    console.error("Failed to write CSV:", error);
  }
};

module.exports = generateSalesCSV;
