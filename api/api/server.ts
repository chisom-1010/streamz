// api/server.ts - API ONLY (no Next.js!)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import videoRoutes from "./routes/videos.js";
import authRoutes from "./routes/auth.js";
import { errorHandler } from "../middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ========== MIDDLEWARE ==========

// CORS - Allow frontend requests
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Local frontend
      "https://streamz-p03k.onrender.com", // Production frontend
      process.env.FRONTEND_URL || "",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Body parsing
app.use(express.json({ limit: "700mb" }));
app.use(express.urlencoded({ extended: true, limit: "700mb" }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ========== ROUTES ==========

// API Routes
app.use("/api/videos", videoRoutes);
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Streamz API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// 404 for API routes
app.use("/api/*splat", (req, res) => {
  res.status(404).json({
    error: "API route not found",
    path: req.path,
  });
});

// Root route info
app.get("/", (req, res) => {
  res.json({
    message: "Streamz API Server",
    documentation: {
      health: "/api/health",
      videos: "/api/videos",
      auth: "/api/auth",
    },
  });
});

// Global error handler
app.use(errorHandler);

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log(`
=====================================
🚀 Streamz API Server (Backend Only)
📍 Port: ${PORT}
🌐 Health: http://localhost:${PORT}/api/health
📚 API Docs: http://localhost:${PORT}/
=====================================
  `);
});
