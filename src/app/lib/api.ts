import { Video } from "@/shared/types/video";
import { User } from "@/shared/types/user";

//const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_BASE_URL = "";

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private adminToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;

    // Load admin token from localStorage on initialization (client-side only)
    if (typeof window !== "undefined") {
      this.adminToken = localStorage.getItem("admin_token");
    }

    console.log("🔧 API Client initialized with baseURL:", this.baseURL);
  }

  // Admin token methods (existing)
  setAdminToken(token: string) {
    this.adminToken = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_token", token);
    }
  }

  getAdminToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_token") || this.adminToken;
    }
    return this.adminToken;
  }

  clearAdminToken() {
    this.adminToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const adminToken = this.getAdminToken();

    console.log("📡 API Request:", {
      method: options.method || "GET",
      url,
      hasAdminToken: !!adminToken,
    });

    const config: RequestInit = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log("🚀 Sending request to:", url);

      const response = await fetch(url, config);

      console.log("📥 Response status:", response.status);
      console.log("📥 Response ok:", response.ok);

      // Get response text first
      const responseText = await response.text();
      console.log("📥 Raw response:", responseText);

      // Try to parse as JSON
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("❌ Failed to parse JSON response:", parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!response.ok) {
        console.error("❌ API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        });

        const errorMessage =
          responseData.error ||
          responseData.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      console.log("✅ API Success:", responseData);
      return responseData;
    } catch (error) {
      console.error("❌ API Request failed:", error);

      // Re-throw with more context
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          `Network error: Cannot connect to ${url}. Is the backend server running?`
        );
      }

      throw error;
    }
  }

  // Video API methods
  async getVideos(params?: { genre?: string; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.genre) searchParams.set("genre", params.genre);
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/videos${queryString ? `?${queryString}` : ""}`;

    return this.request<{ videos: Video[]; count: number }>(endpoint);
  }

  async getVideo(id: string) {
    return this.request<{ video: Video }>(`/api/videos/${id}`);
  }

  async uploadVideo(formData: FormData) {
    const token = this.getAdminToken();

    const response = await fetch(`${this.baseURL}/api/videos`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Upload failed",
        message: response.statusText,
      }));
      throw new Error(errorData.error || errorData.message || "Upload failed");
    }

    return response.json();
  }

  async updateVideo(id: string, data: Partial<Video>) {
    return this.request<{ video: Video; message: string }>(
      `/api/videos/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteVideo(id: string) {
    return this.request<{ message: string }>(`/api/videos/${id}`, {
      method: "DELETE",
    });
  }

  // Authentication API methods
  async register(email: string, name: string, password: string) {
    console.log("👤 API: Registering user:", { email, name });

    const response = await this.request<{ message: string; user: User }>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email, name, password }),
      }
    );

    console.log("✅ API: Registration response:", response);
    return response;
  }

  async login(email: string, password: string) {
    console.log("🔐 API: Logging in user:", email);

    const response = await this.request<{ message: string; user: User }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );

    console.log("✅ API: Login response:", response);
    return response;
  }

  async testConnection() {
    console.log("🧪 Testing backend connection...");

    try {
      const response = await fetch(`${this.baseURL}/api/health`);
      const data = await response.json();
      console.log("✅ Backend connection successful:", data);
      return { success: true, data };
    } catch (error: any) {
      console.error("❌ Backend connection failed:", error);
      return { success: false, error: error.message };
    }
  }

  async getProfile(userId: string) {
    return this.request<{ user: User }>(`/api/auth/profile?id=${userId}`);
  }

  async updateProfile(
    userId: string,
    data: { name?: string; avatarUrl?: string }
  ) {
    return this.request<{ message: string; user: User }>(
      `/api/auth/profile?id=${userId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  // Admin auth methods
  async verifyAdmin() {
    return this.request<{
      message: string;
      isAdmin: boolean;
      timestamp: string;
    }>("/api/auth/admin/verify");
  }

  async getAllUsers(params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    if (params?.active !== undefined)
      searchParams.set("active", params.active.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/auth/admin/users${
      queryString ? `?${queryString}` : ""
    }`;

    return this.request<{
      users: User[];
      total: number;
      limit: number;
      offset: number;
    }>(endpoint);
  }

  async toggleUserStatus(userId: string) {
    return this.request<{ message: string; user: User }>(
      `/api/auth/admin/users/${userId}/toggle`,
      {
        method: "PATCH",
      }
    );
  }

  async checkHealth() {
    return this.request<{
      status: string;
      service: string;
      version: string;
      timestamp: string;
      environment: string;
      endpoints: Record<string, string>;
    }>("/api/health");
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
