
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDirectory = path.resolve(
  process.cwd(),
  "private_uploads",
  "driver_licenses"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png"
]);

const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  }
});

const uploadDriverLicense = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
      !allowedTypes.has(file.mimetype) ||
      !allowedExtensions.has(extension)
    ) {
      return callback(
        new Error("Upload a PDF, JPG or PNG licence file.")
      );
    }

    callback(null, true);
  }
});

module.exports = {
  uploadDriverLicense,
  uploadDirectory
};
