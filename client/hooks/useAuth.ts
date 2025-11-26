import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../lib/api";
import { User } from "../shared/types/user";
import { toast } from "sonner";

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; avatarUrl?: string }) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  //const { toast } = useToast();

  // Debug logging
  useEffect(() => {
    console.log("🔍 useAuth state changed:", {
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
      isAuthenticated: !!user,
      loading,
      timestamp: new Date().toISOString(),
    });
  }, [user, loading]);

  const saveUserToStorage = useCallback((userData: User) => {
    try {
      const userJson = JSON.stringify(userData);
      console.log("💾 Saving user to localStorage:", userJson);

      localStorage.setItem("streamz_user", userJson);

      // Verify it was saved
      const saved = localStorage.getItem("streamz_user");
      console.log("✅ Verified saved data:", saved);

      return true;
    } catch (error) {
      console.error("❌ Failed to save user to localStorage:", error);
      return false;
    }
  }, []);

  const loadUserFromStorage = useCallback(() => {
    try {
      const savedUser = localStorage.getItem("streamz_user");
      console.log("🔍 Loading user from localStorage:", savedUser);

      if (savedUser) {
        const userData = JSON.parse(savedUser);
        console.log("✅ Parsed user data:", userData);

        // Validate user data has required fields
        if (userData && userData.id && userData.name && userData.email) {
          console.log("✅ User data is valid, setting user state");
          return userData;
        } else {
          console.log("❌ Invalid user data, removing from storage");
          localStorage.removeItem("streamz_user");
          return null;
        }
      } else {
        console.log("❌ No saved user found");
        return null;
      }
    } catch (error) {
      console.error("❌ Error loading user from localStorage:", error);
      localStorage.removeItem("streamz_user");
      return null;
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    console.log("🔍 Checking auth status...");
    setLoading(true);

    try {
      const userData = loadUserFromStorage();
      setUser(userData);
    } catch (error) {
      console.error("❌ Error checking auth status:", error);
      setUser(null);
    } finally {
      console.log("✅ Auth check complete, setting loading to false");
      setLoading(false);
    }
  }, [loadUserFromStorage]);

  // Check auth status on mount
  useEffect(() => {
    // Add a small delay to ensure component is mounted
    const timer = setTimeout(() => {
      checkAuthStatus();
    }, 100);

    return () => clearTimeout(timer);
  }, [checkAuthStatus]);

  const login = useCallback(
    async (email: string, password: string) => {
      console.log("🔐 Starting login process for:", email);

      try {
        setLoading(true);
        const response = await apiClient.login(email, password);
        console.log("✅ Login API response:", response);

        if (response && response.user) {
          console.log("✅ User received from API:", response.user);

          // Save to localStorage first
          const savedSuccessfully = saveUserToStorage(response.user);

          if (savedSuccessfully) {
            console.log("✅ User saved to localStorage successfully");

            // Then update state
            setUser(response.user);
            console.log("✅ User state updated");

            toast("Login Successful", {
              description: `Welcome back, ${response.user.name}!`,
            });
          } else {
            throw new Error("Failed to save user data");
          }
        } else {
          console.error("❌ No user in login response:", response);
          throw new Error("Invalid login response - no user data");
        }
      } catch (error: any) {
        console.error("❌ Login failed:", error);
        setUser(null);
        localStorage.removeItem("streamz_user");

        toast("Login Failed", {
          description: error.message || "Invalid credentials",
          //variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast, saveUserToStorage]
  );

  const register = useCallback(
    async (email: string, name: string, password: string) => {
      console.log("👤 Starting registration for:", { email, name });

      try {
        setLoading(true);
        const response = await apiClient.register(email, name, password);
        console.log("✅ Registration API response:", response);

        if (response && response.user) {
          console.log("✅ User received from API:", response.user);

          // Save to localStorage first
          const savedSuccessfully = saveUserToStorage(response.user);

          if (savedSuccessfully) {
            console.log("✅ User saved to localStorage successfully");

            // Then update state
            setUser(response.user);
            console.log("✅ User state updated");

            toast("Account Created", {
              description: `Welcome to Streamz, ${response.user.name}!`,
            });
          } else {
            throw new Error("Failed to save user data");
          }
        } else {
          console.error("❌ No user in registration response:", response);
          throw new Error("Invalid registration response - no user data");
        }
      } catch (error: any) {
        console.error("❌ Registration failed:", error);
        setUser(null);
        localStorage.removeItem("streamz_user");

        toast("Registration Failed", {
          description: error.message || "Failed to create account",
          //variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast, saveUserToStorage]
  );

  const logout = useCallback(() => {
    console.log("🚪 Logging out user:", user?.name);

    try {
      localStorage.removeItem("streamz_user");
      console.log("✅ User removed from localStorage");
    } catch (error) {
      console.error("❌ Error removing user from localStorage:", error);
    }

    setUser(null);
    console.log("✅ User state cleared");

    toast("Logged Out", {
      description: "You have been logged out successfully",
    });
  }, [user, toast]);

  const updateProfile = useCallback(
    async (data: { name?: string; avatarUrl?: string }) => {
      if (!user) {
        console.error("❌ Cannot update profile: not authenticated");
        throw new Error("Not authenticated");
      }

      try {
        const response = await apiClient.updateProfile(user.id, data);

        // Save updated user to localStorage
        saveUserToStorage(response.user);
        setUser(response.user);

        toast("Profile Updated", {
          description: "Your profile has been updated successfully",
        });
      } catch (error: any) {
        toast("Update Failed", {
          description: error.message || "Failed to update profile",
          //variant: "destructive",
        });
        throw error;
      }
    },
    [user, toast, saveUserToStorage]
  );

  return {
    user,
    isAuthenticated: !!user && !loading,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };
};
