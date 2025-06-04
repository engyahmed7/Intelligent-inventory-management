const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads"); 
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const csvFilter = (req, file, cb) => {
  if (file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv")) {
    cb(null, true);
  } else {
    cb(new Error("Only .csv files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: csvFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});

module.exports = upload;

