import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  toggleUserStatus,
  verifyAdmin,
} from "../controllers/AuthController";

const router = express.Router();

// Test route to verify auth routes are working
router.get("/", (req, res) => {
  res.json({
    message: "Auth routes are working!",
    availableRoutes: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/profile",
      "PUT /api/auth/profile",
      "GET /api/auth/admin/users",
      "PATCH /api/auth/admin/users/:id/toggle",
    ],
  });
});

// User routes
router.post("/register", register);
router.post("/login", login);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.get("/admin/verify", verifyAdmin);
router.get("/admin/users", getAllUsers);
router.patch("/admin/users/:id/toggle", toggleUserStatus);

export default router;
