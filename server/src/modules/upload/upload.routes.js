import { Router } from "express";
import multer from "multer";
import path from "node:path";
import stream from "node:stream";
import { sendSuccess, sendError } from "../../utils/response.js";
import cloudinary from "../../config/cloudinary.js";

const router = Router();

// Use memory storage so we can upload the file buffer directly to Cloudinary
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
  
  const fileBuffer = req.file.buffer;

  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: "goticket_uploads" },
    (error, result) => {
      if (error) {
        console.error("Cloudinary upload failed:", error);
        return sendError(res, "Image upload to Cloudinary failed.");
      }
      
      // Return the secure URL from Cloudinary
      return sendSuccess(res, { 
        url: result.secure_url,
        filename: result.public_id
      });
    }
  );

  // Pipe the buffer to Cloudinary
  stream.Readable.from(fileBuffer).pipe(uploadStream);
});

export default router;
