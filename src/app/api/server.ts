import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import videoRoutes from "@/app/api/routes/videos";
import authRoutes from "@/app/api/routes/auth";
import { errorHandler } from "./middleware/errorHandler.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "700mb" }));
app.use(express.urlencoded({ extended: true, limit: "700mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use("/api/videos", videoRoutes);
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Streamz Backend API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      videos: "/api/videos",
      auth: "/api/auth",
      health: "/api/health",
    },
  });
});

// 404 handler
app.use("/*splat", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: "ROUTE_NOT_FOUND",
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log("🚀 Streamz Backend API Server");
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📚 API Documentation:`);
  console.log(`   - Health: http://localhost:${PORT}/api/health`);
  console.log(`   - Videos: http://localhost:${PORT}/api/videos`);
  console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
  console.log(`   - Auth: http://localhost:${PORT}/api/admin`);
  console.log("=====================================");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Server terminated");
  process.exit(0);
});
