"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "../../lib/api";
import VideoUpload from "../../components/VideoUpload";
import VideoList from "../../components/VideoList";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  Shield,
  LogOut,
  BarChart3,
  Video,
  Users,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminTokenState] = useState("");
  const [videoCount, setVideoCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loginRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    console.log("🔍 Admin Page: Checking authentication...");
    const savedToken = apiClient.getAdminToken();

    if (savedToken) {
      console.log("✅ Admin token found, authenticating...");
      setIsAuthenticated(true);
      loadDashboardData();
    } else {
      console.log("❌ No admin token found");
      setIsLoading(false);
    }
  }, []);

  // Animate login form when ready
  useEffect(() => {
    if (!isAuthenticated && loginRef.current && !isLoading) {
      console.log("🎨 Animating login form...");
      gsap.fromTo(
        loginRef.current,
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power2.out" }
      );
    }
  }, [isAuthenticated, isLoading]);

  // Animate dashboard when authenticated
  useEffect(() => {
    if (isAuthenticated && dashboardRef.current) {
      console.log("🎨 Animating dashboard...");
      const tl = gsap.timeline();
      tl.fromTo(
        dashboardRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5 }
      ).fromTo(
        ".dashboard-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 },
        "-=0.2"
      );
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      console.log("📊 Loading dashboard data...");
      const response = await apiClient.getVideos();
      setVideoCount(response.videos.length);
      console.log(`✅ Loaded ${response.videos.length} videos`);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🔐 Admin login attempt...");

    if (!adminToken.trim()) {
      toast("Missing Token", {
        description: "Please enter your admin token",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Test the token by making a request
      console.log("🧪 Testing admin token...");
      apiClient.setAdminToken(adminToken.trim());
      await apiClient.checkHealth();

      console.log("✅ Admin token valid!");

      // Update state FIRST, then animate
      setIsAuthenticated(true);

      // Load dashboard data
      loadDashboardData();

      // Animate transition (optional - happens after state update)
      if (loginRef.current) {
        gsap.to(loginRef.current, {
          opacity: 0,
          scale: 0.9,
          duration: 0.3,
        });
      }

      toast("Login Successful", {
        description: "Welcome to the admin dashboard!",
      });
    } catch (error) {
      console.error("❌ Admin login failed:", error);
      apiClient.clearAdminToken();

      toast("Login Failed", {
        description: "Invalid admin token or backend is not running",
      });

      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    console.log("🚪 Admin logging out...");

    // Animate first
    if (dashboardRef.current) {
      gsap.to(dashboardRef.current, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          // Clear token and state after animation
          apiClient.clearAdminToken();
          setIsAuthenticated(false);
          setAdminTokenState("");

          toast("Logged Out", {
            description: "You have been logged out successfully.",
          });

          // Redirect to home
          router.push("/");
        },
      });
    } else {
      // If no ref, just logout immediately
      apiClient.clearAdminToken();
      setIsAuthenticated(false);
      setAdminTokenState("");
      router.push("/");
    }
  };

  const handleUploadComplete = () => {
    console.log("✅ Video upload completed, refreshing data...");
    loadDashboardData();
  };

  // Loading state
  if (isLoading) {
    console.log("🔄 Admin Page: Loading...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Login form (not authenticated)
  if (!isAuthenticated) {
    console.log("🔐 Admin Page: Showing login form");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <Card ref={loginRef} className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <p className="text-muted-foreground">
              Enter your admin token to continue
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-token">Admin Token</Label>
                <Input
                  id="admin-token"
                  type="password"
                  value={adminToken}
                  onChange={(e) => setAdminTokenState(e.target.value)}
                  placeholder="Enter your admin token"
                  required
                  autoComplete="off"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Access Dashboard
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard (authenticated)
  console.log("✅ Admin Page: Showing dashboard");
  return (
    <div ref={dashboardRef} className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Video className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Streamz Admin</h1>
                <Badge variant="secondary" className="text-xs">
                  Dashboard
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="cursor-pointer">
                  Home
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Videos
              </CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{videoCount}</div>
              <p className="text-xs text-muted-foreground">
                Videos uploaded to platform
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Storage Used
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4 GB</div>
              <p className="text-xs text-muted-foreground">
                Of 10 GB available
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <p className="text-xs text-muted-foreground">
                Unique visitors this month
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Upload and Management */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="dashboard-card">
            <VideoUpload onUploadComplete={handleUploadComplete} />
          </div>

          {/* Quick Actions */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Video className="h-4 w-4 mr-2" />
                Manage Videos
              </Button>
              <Link href="/admin/UserManagement">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-2" />
                System Health
              </Button>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Video Management */}
        <div className="dashboard-card">
          <Card>
            <CardHeader>
              <CardTitle>Manage Videos</CardTitle>
              <p className="text-muted-foreground">
                All uploaded videos on your platform
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <VideoList />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
