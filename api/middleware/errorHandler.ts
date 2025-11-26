import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error occurred:", {
    message: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Multer errors
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "File too large",
      message: "Maximum file size is 500MB",
      code: "FILE_TOO_LARGE",
    });
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      error: "Invalid file upload",
      message: "Only video files are allowed",
      code: "INVALID_FILE_TYPE",
    });
  }

  // Database errors
  if (error.code === "23505") {
    return res.status(409).json({
      error: "Duplicate entry",
      message: "Resource already exists",
      code: "DUPLICATE_ENTRY",
    });
  }

  // Default server error
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong on our end",
    code: "INTERNAL_ERROR",
    timestamp: new Date().toISOString(),
  });
};
