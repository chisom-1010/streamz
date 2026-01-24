"use client";

import { useRouter } from "next/navigation";
import { useUserManagement } from "../hooks/UserManagement";
import { User } from "../shared/types/user";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Mail,
  ArrowLeft,
  MoreVertical,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface UserManagementProps {
  className?: string;
  limit?: number;
  onUserClick?: (user: User) => void;
}

export default function UserManagement({
  className,
  limit = 50,
  onUserClick,
}: UserManagementProps) {
  const {
    // Data
    loading,
    total,
    filteredUsers,

    // Filters
    filter,
    searchTerm,

    // Actions
    setFilter,
    setSearchTerm,
    toggleUserStatus,
    refreshUsers,
  } = useUserManagement({ limit });

  // UI helper functions
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleUserClick = (user: User) => {
    onUserClick?.(user);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleUserStatus(user);
    } catch (error) {
      // Error is already handled in the hook
      console.error("Failed to toggle user status:", error);
    }
  };

  const router = useRouter();

  // Loading skeleton
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <Badge variant="secondary">{total} total users</Badge>
          <Button variant="default" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            {(["all", "active", "inactive"] as const).map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="capitalize"
              >
                {filterType}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No users found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow ${
                  onUserClick ? "cursor-pointer hover:bg-muted/50" : ""
                }`}
                onClick={() => handleUserClick(user)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{user.name}</h4>
                      <Badge
                        variant={user.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {user.isActive ? (
                          <>
                            <UserCheck className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()} // Prevent row click
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(user);
                      }}
                      className="flex items-center gap-2"
                    >
                      {user.isActive ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Deactivate User
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Activate User
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {filteredUsers.length > 0 && (
          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {filteredUsers.length} of {total} users
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={refreshUsers}
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
