// src/backend/controllers/authController.ts - Updated with password authentication
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../config/database.js";
import { users } from "../shared/db/schema/index";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const SALT_ROUNDS = 12;

interface AuthRequest extends Request {
  body: {
    email: string;
    name?: string;
    password: string;
  };
}

// Register new user with password
export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Email, name, and password are required",
        code: "MISSING_FIELDS",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
        message: "Please provide a valid email address",
        code: "INVALID_EMAIL",
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: "Weak password",
        message: "Password must be at least 8 characters long",
        code: "WEAK_PASSWORD",
      });
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
        message: "A user with this email already exists",
        code: "USER_EXISTS",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        id: uuidv4(),
        email: email.toLowerCase(),
        name: name.trim(),
        passwordHash,
        isActive: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        isActive: users.isActive,
        createdAt: users.created_at,
      });

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Registration failed",
      message: "An error occurred during user registration",
      code: "REGISTRATION_ERROR",
    });
  }
};

// Login user with password
export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Missing credentials",
        message: "Email and password are required",
        code: "MISSING_CREDENTIALS",
      });
    }

    // Find user by email
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        passwordHash: users.passwordHash,
        avatarUrl: users.avatarUrl,
        isActive: users.isActive,
        createdAt: users.created_at,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: "Account disabled",
        message: "Your account has been disabled",
        code: "ACCOUNT_DISABLED",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Update last login (optional)
    await db
      .update(users)
      .set({ updated_at: new Date() })
      .where(eq(users.id, user.id));

    // Return user data (without password hash)
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Login failed",
      message: "An error occurred during login",
      code: "LOGIN_ERROR",
    });
  }
};

// Get user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.query.id as string;

    if (!userId) {
      return res.status(400).json({
        error: "Missing user ID",
        message: "User ID is required",
        code: "MISSING_USER_ID",
      });
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        isActive: users.isActive,
        createdAt: users.created_at,
        updatedAt: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "No user found with this ID",
        code: "USER_NOT_FOUND",
      });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Failed to fetch profile",
      message: "An error occurred while fetching user profile",
      code: "PROFILE_ERROR",
    });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.query.id as string;
    const { name, avatarUrl } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "Missing user ID",
        message: "User ID is required",
        code: "MISSING_USER_ID",
      });
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      return res.status(404).json({
        error: "User not found",
        message: "No user found with this ID",
        code: "USER_NOT_FOUND",
      });
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        name: name?.trim() || existingUser.name,
        avatarUrl: avatarUrl || existingUser.avatarUrl,
        updated_at: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        isActive: users.isActive,
        createdAt: users.created_at,
        updatedAt: users.updated_at,
      });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      error: "Failed to update profile",
      message: "An error occurred while updating profile",
      code: "UPDATE_ERROR",
    });
  }
};

// Admin: Get all users (existing function - no changes needed)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0, active } = req.query;

    let query: any = db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        isActive: users.isActive,
        createdAt: users.created_at,
      })
      .from(users);

    // Filter by active status if provided
    if (active !== undefined) {
      query = query.where(eq(users.isActive, active === "true"));
    }

    const allUsers = await query
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .orderBy(users.created_at);

    // Get total count
    const totalUsers = await db.select().from(users);

    res.json({
      users: allUsers,
      total: totalUsers.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      error: "Failed to fetch users",
      message: "An error occurred while fetching users",
      code: "FETCH_USERS_ERROR",
    });
  }
};

// Admin: Toggle user active status (existing function - no changes needed)
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Missing user ID",
        message: "User ID is required",
        code: "MISSING_USER_ID",
      });
    }

    // Get current user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "No user found with this ID",
        code: "USER_NOT_FOUND",
      });
    }

    // Toggle active status
    const [updatedUser] = await db
      .update(users)
      .set({
        isActive: !user.isActive,
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        isActive: users.isActive,
        updatedAt: users.updated_at,
      });

    res.json({
      message: `User ${
        updatedUser.isActive ? "activated" : "deactivated"
      } successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({
      error: "Failed to update user status",
      message: "An error occurred while updating user status",
      code: "STATUS_UPDATE_ERROR",
    });
  }
};

// Admin: Verify admin token (existing function - no changes needed)
export const verifyAdmin = async (req: Request, res: Response) => {
  try {
    res.json({
      message: "Admin token is valid",
      isAdmin: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin verification error:", error);
    res.status(500).json({
      error: "Admin verification failed",
      message: "An error occurred during admin verification",
      code: "ADMIN_VERIFICATION_ERROR",
    });
  }
};
