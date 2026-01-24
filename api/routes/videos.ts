// api/api/routes/videos.ts

import express from 'express';
import multer from 'multer';
import {
  uploadVideo,
  getVideos,
  getVideo,
  updateVideo,
  deleteVideo,
  streamVideo,
} from '../controllers/VideoController.ts';
import { authenticateAdmin } from '../middleware/auth.ts';

const router = express.Router();

// Configure multer for video uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  },
});

// Public routes
router.get('/stream/:id', streamVideo);
router.get('/:id', getVideo); // Get video metadata
router.get('/', getVideos); // List all videos

// Admin routes (protected)
router.post('/', authenticateAdmin, upload.single('video'), uploadVideo);
router.put('/:id', authenticateAdmin, updateVideo);
router.delete('/:id', authenticateAdmin, deleteVideo);

export default router;
