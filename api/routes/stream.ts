//streamz/api/routes/stream.ts
import express from 'express';
import { streamVideo } from '../controllers/VideoController';

const router = express.Router();

// Stream video
router.get('/:id', streamVideo);

export default router;
