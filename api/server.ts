// api/server.ts - API ONLY (no Next.js!)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import videoRoutes from './routes/videos';
import authRoutes from './routes/auth';
import streamRoutes from './routes/stream';
import { errorHandler } from './middleware/errorHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ========== MIDDLEWARE ==========
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} -> ${req.url}`);
  next();
});

// CORS - Allow frontend requests
const corsOptions = {
  origin: [
    'http://localhost:3000', // Local frontend
    'https://streamz-bg0h.onrender.com', // Production frontend
    'https://streamz-api-uvey.onrender.com', // Production backend
    'https://pub-7801d043ab3f4e069174ad35d8439a99.r2.dev', // R2 direct access
    process.env.FRONTEND_URL || '',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '700mb' }));
app.use(express.urlencoded({ extended: true, limit: '700mb' }));

// ========== ROUTES ==========

// API Routes
app.use('/api/stream', streamRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Streamz API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 404 for API routes
app.use('/api/*splat', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    path: req.path,
  });
});

// Root route info
app.get('/', (req, res) => {
  res.json({
    message: 'Streamz API Server',
    documentation: {
      health: '/api/health',
      videos: '/api/videos',
      auth: '/api/auth',
      stream: '/api/stream',
    },
  });
});

// Global error handler/app.use(errorHandler);
app.use(errorHandler);

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`
=====================================
🚀 Streamz API Server (Backend Only)
📍 Port: ${PORT}
🌐 Health: http://localhost:${PORT}/api/health
🌐 Health: http://localhost:${PORT}/api/videos
🌐 Health: http://localhost:${PORT}/api/auth
🌐 Health: http://localhost:${PORT}/api/stream
📚 API Docs: http://localhost:${PORT}/
=====================================
  `);
});
