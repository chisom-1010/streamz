// src/frontend/components/UserNavigation.tsx - Fixed to connect AuthForm to useAuth hook
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Dialog, DialogContent } from "./ui/dialog";
import { User, Settings, LogOut, UserPlus } from "lucide-react";
import AuthForm from "./AuthForm";
import Link from "next/link";

export default function UserNavigation() {
  const { user, isAuthenticated, loading, logout, login, register } = useAuth(); // ✅ Get login/register from useAuth
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Enhanced debug logging
  useEffect(() => {
    const savedUser = localStorage.getItem("streamz_user");
    const info = {
      isAuthenticated,
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
      loading,
      savedUserExists: !!savedUser,
      savedUserData: savedUser ? JSON.parse(savedUser) : null,
      timestamp: new Date().toISOString(),
    };

    console.log("🔍 UserNavigation Debug:", info);

    if (isAuthenticated && user) {
      console.log("✅ User is authenticated, should show dropdown");
    } else if (loading) {
      console.log("🔄 Still loading authentication state");
    } else {
      console.log("👤 Showing sign in button - not authenticated");
    }
  }, [isAuthenticated, user, loading]);

  // ✅ Fixed: Connect AuthForm to useAuth hook directly
  const handleAuthSuccess = async (formData: {
    email: string;
    password?: string;
    name?: string;
    isLogin?: boolean;
  }) => {
    console.log("✅ Auth success in UserNavigation, processing...", formData);

    try {
      // The AuthForm will handle calling the useAuth hook methods directly
      // So we just need to close the dialog
      setShowAuthDialog(false);

      console.log("🚪 Auth dialog closed");
    } catch (error) {
      console.error("❌ Error in auth success handler:", error);
    }
  };

  const handleLogout = () => {
    console.log("🚪 Logging out user");
    logout();
  };

  // Show loading state
  if (loading) {
    console.log("🔄 UserNavigation: showing loading spinner");
    return (
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show sign in button if not authenticated
  if (!isAuthenticated || !user) {
    console.log("👤 UserNavigation: showing sign in button");
    console.log("🔍 Current state:", { isAuthenticated, hasUser: !!user });

    return (
      <>
        <Button
          onClick={() => {
            console.log("🔘 Sign in button clicked");
            setShowAuthDialog(true);
          }}
          variant="default"
          size="sm"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Sign In
        </Button>

        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="p-0 max-w-md">
            {/* ✅ Pass login and register methods directly to AuthForm */}
            <AuthFormWrapper
              login={login}
              register={register}
              onSuccess={handleAuthSuccess}
              onClose={() => {
                console.log("🚪 Closing auth dialog");
                setShowAuthDialog(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show user dropdown if authenticated
  console.log("👤 UserNavigation: showing user dropdown for:", user.name);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 cursor-pointer">
            <AvatarImage src={user?.avatarUrl} alt={user?.name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end" forceMount>
        {/* User Info */}
        <div className="flex items-center justify-start gap-2 p-3">
          <Avatar className="h-10 w-10 cursor-pointer">
            <AvatarImage src={user?.avatarUrl} alt={user?.name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium text-sm cursor-pointer">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Profile Menu Items */}
        <DropdownMenuItem asChild>
          <Link href="/profile" className="w-full cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings" className="w-full cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ✅ New wrapper component that connects AuthForm to useAuth hook
interface AuthFormWrapperProps {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  onSuccess: (data: any) => void;
  onClose: () => void;
}

function AuthFormWrapper({
  login,
  register,
  onSuccess,
  onClose,
}: AuthFormWrapperProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🔐 Login form submitted:", { email: loginData.email });

    if (!loginData.email.trim() || !loginData.password.trim()) {
      console.log("❌ Missing email or password");
      return;
    }

    setLoading(true);

    try {
      console.log("📡 Calling useAuth.login...");
      await login(loginData.email.trim(), loginData.password);

      console.log("✅ Login successful via useAuth");

      // Reset form and close
      setLoginData({ email: "", password: "" });
      onSuccess({ email: loginData.email, isLogin: true });
    } catch (error: any) {
      console.error("❌ Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("📝 Signup form submitted:", {
      name: signupData.name,
      email: signupData.email,
    });

    const { name, email, password, confirmPassword } = signupData;

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      console.log("❌ Missing required fields");
      return;
    }

    if (password !== confirmPassword) {
      console.log("❌ Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      console.log("📡 Calling useAuth.register...");
      await register(email.trim(), name.trim(), password);

      console.log("✅ Registration successful via useAuth");

      // Reset form and close
      setSignupData({ name: "", email: "", password: "", confirmPassword: "" });
      onSuccess({ email, name, isLogin: false });
    } catch (error: any) {
      console.error("❌ Registration failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Join Streamz</h2>
        <p className="text-muted-foreground">
          Create an account or sign in to access personalized features
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-muted rounded-lg p-1">
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "login"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("login")}
        >
          Sign In
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "signup"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("signup")}
        >
          Sign Up
        </button>
      </div>

      {/* Login Form */}
      {activeTab === "login" && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={loginData.email}
              onChange={(e) =>
                setLoginData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full p-3 border rounded-lg"
              placeholder="Enter your email"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData((prev) => ({ ...prev, password: e.target.value }))
              }
              className="w-full p-3 border rounded-lg"
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground p-3 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      )}

      {/* Signup Form */}
      {activeTab === "signup" && (
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={signupData.name}
              onChange={(e) =>
                setSignupData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full p-3 border rounded-lg"
              placeholder="Enter your full name"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={signupData.email}
              onChange={(e) =>
                setSignupData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full p-3 border rounded-lg"
              placeholder="Enter your email"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={signupData.password}
              onChange={(e) =>
                setSignupData((prev) => ({ ...prev, password: e.target.value }))
              }
              className="w-full p-3 border rounded-lg"
              placeholder="Create a password"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={signupData.confirmPassword}
              onChange={(e) =>
                setSignupData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              className="w-full p-3 border rounded-lg"
              placeholder="Confirm your password"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground p-3 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
      )}

      <div className="mt-4 text-center">
        <button
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
