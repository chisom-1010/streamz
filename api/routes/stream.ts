// api/api/routes/stream.ts
import express from 'express';
import { streamVideo } from '../controllers/VideoController';

const router = express.Router();

// Handle OPTIONS preflight
router.options('/:id', (req, res) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://streamz-p03k.onrender.com',
    'https://streamz-api-39o0.onrender.com',
    req.headers.origin || '',
  ];

  const requestOrigin = req.headers.origin || '';
  const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : '*';

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Range, Content-Type, Authorization'
  );
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Content-Length, Content-Range, Content-Type, Accept-Ranges'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Stream video
router.get('/:id', streamVideo);

export default router;
