import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = file.originalname
      .replace(extension, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

    callback(null, `${Date.now()}-${safeName || "book"}${extension}`);
  }
});

const imageFileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
    return;
  }

  callback(new Error("Only image files are allowed."));
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5
  },
  fileFilter: imageFileFilter
});

