import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { sendSuccess, sendError } from "../../utils/response.js";

const router = Router();

// Ensure upload directory exists
const uploadDir = "public/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, webp) are allowed."));
  }
});

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return sendError(res, "No file uploaded.");
  }
  
  // Return the path that can be served statically
  const fileUrl = `${process.env.API_URL || "http://localhost:5000"}/uploads/${req.file.filename}`;
  
  return sendSuccess(res, { 
    url: fileUrl,
    filename: req.file.filename
  });
});

export default router;
