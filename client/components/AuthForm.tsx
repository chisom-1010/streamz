"use client";

import React, { useState, useRef, useEffect } from "react";
import { apiClient } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { LogIn, UserPlus, Mail, User, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";

interface AuthFormProps {
  onAuthSuccess?: (user: any) => void;
  onClose?: () => void;
  className?: string;
  defaultTab?: "login" | "signup";
}

export default function AuthForm({
  onAuthSuccess,
  onClose,
  className,
  defaultTab = "login",
}: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate form entrance
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
    if (!/\d/.test(password)) errors.push("One number");
    return errors;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.email.trim() || !loginData.password.trim()) {
      toast("Missing Information", {
        description: "Please enter both email and password",
        //variant: "destructive",
      });
      return;
    }

    if (!validateEmail(loginData.email)) {
      toast("Invalid Email", {
        description: "Please enter a valid email address",
        //variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.login(
        loginData.email.trim(),
        loginData.password
      );

      toast("Login Successful", {
        description: `Welcome back, ${response.user.name}!`,
      });

      onAuthSuccess?.(response.user);
      onClose?.();

      // Reset form
      setLoginData({ email: "", password: "" });
    } catch (error: any) {
      toast("Login Failed", {
        description: error.message || "Invalid email or password",
        //variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, email, password, confirmPassword } = signupData;

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast("Missing Information", {
        description: "Please fill in all fields",
        //variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast("Invalid Email", {
        description: "Please enter a valid email address",
        //variant: "destructive",
      });
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      toast("Weak Password", {
        description: `Password must have: ${passwordErrors.join(", ")}`,
        //variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast("Password Mismatch", {
        description: "Passwords do not match",
        //variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.register(
        email.trim(),
        name.trim(),
        password
      );

      toast("Account Created!", {
        description: `Welcome to Streamz, ${response.user.name}!`,
      });

      onAuthSuccess?.(response.user);
      onClose?.();

      // Reset form
      setSignupData({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (error: any) {
      toast("Signup Failed", {
        description: error.message || "Failed to create account",
        //variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card ref={cardRef} className={className}>
      <CardHeader>
        <CardTitle className="text-center">Join Streamz</CardTitle>
        <p className="text-center text-muted-foreground">
          Create an account or sign in to access personalized features
        </p>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Enter your email"
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Enter your password"
                    className="pr-10"
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupData.name}
                    onChange={(e) =>
                      setSignupData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter your full name"
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Enter your email"
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Create a password"
                    className="pr-10"
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be 8+ characters with uppercase, lowercase, and number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">
                  Confirm Password
                </Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  value={signupData.confirmPassword}
                  onChange={(e) =>
                    setSignupData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Confirm your password"
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
