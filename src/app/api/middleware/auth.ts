import { Request, Response, NextFunction } from "express";

export const authenticateAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Admin token required",
      code: "INVALID_ADMIN_TOKEN",
    });
  }

  next();
};
