import express from "express";
import multer from "multer";
import {
  uploadVideo,
  getVideos,
  getVideo,
  updateVideo,
  deleteVideo,
} from "../../controllers/VideoController.ts";
import { authenticateAdmin } from "../../middleware/auth.ts";

const router = express.Router();

// Configure multer for video uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"));
    }
  },
});

// Public routes
router.get("/", getVideos); // GET /api/videos - List all videos
router.get("/:videoId", getVideo); // GET /api/videos/:id - Get single video

// Admin routes (protected)
router.post("/", authenticateAdmin, upload.single("video"), uploadVideo); // POST /api/videos - Upload video
router.put("/:id", authenticateAdmin, updateVideo); // PUT /api/videos/:id - Update video
router.delete("/:id", authenticateAdmin, deleteVideo); // DELETE /api/videos/:id - Delete video

export default router;
