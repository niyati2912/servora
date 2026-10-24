const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");

// backend/private_uploads/driver_licenses (independent of where node was started)
const uploadDirectory = path.resolve(
  __dirname,
  "..",
  "..",
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

// The MIME type and extension come from the client and can be faked, so
// after multer has saved the file we check the real first bytes.
// Returns "application/pdf", "image/jpeg", "image/png", or null.
async function detectLicenseFileType(filePath) {
  let handle;

  try {
    handle = await fsp.open(filePath, "r");
    const buffer = Buffer.alloc(8);
    const { bytesRead } = await handle.read(buffer, 0, 8, 0);

    if (bytesRead >= 4 && buffer.toString("latin1", 0, 4) === "%PDF") {
      return "application/pdf";
    }

    if (
      bytesRead >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return "image/jpeg";
    }

    if (
      bytesRead >= 8 &&
      buffer.equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      )
    ) {
      return "image/png";
    }

    return null;
  } catch {
    return null;
  } finally {
    await handle?.close().catch(() => {});
  }
}

module.exports = {
  uploadDriverLicense,
  uploadDirectory,
  detectLicenseFileType
};