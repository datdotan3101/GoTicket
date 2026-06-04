import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { sendSuccess, sendError } from "../../utils/response.js";

const router = Router();

// Ensure upload directory exists
const uploadDir = "public/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage so we can hash the file buffer before saving
const storage = multer.memoryStorage();

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
  
  // Calculate MD5 hash of the file content
  const fileBuffer = req.file.buffer;
  const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
  const ext = path.extname(req.file.originalname).toLowerCase();
  
  // Create a unique filename based purely on file content
  const filename = `${hash}${ext}`;
  const filePath = path.join(uploadDir, filename);

  // Only save the file if it doesn't already exist on the server (Deduplication)
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, fileBuffer);
  }
  
  // Return the path that can be served statically
  const fileUrl = `${process.env.API_URL || "http://localhost:5000"}/uploads/${filename}`;
  
  return sendSuccess(res, { 
    url: fileUrl,
    filename: filename
  });
});

export default router;
