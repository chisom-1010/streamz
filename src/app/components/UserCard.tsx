"use client";

import React from "react";
import { User } from "../../shared/types/user.js";
import { Card, CardContent } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { Button } from "./ui/button.jsx";
import {
  UserCheck,
  UserX,
  Mail,
  //Calendar,
  MoreVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.jsx";

interface UserCardProps {
  user: User;
  onToggleStatus?: (user: User) => void;
  onClick?: (user: User) => void;
  className?: string;
}

export default function UserCard({
  user,
  onToggleStatus,
  onClick,
  className,
}: UserCardProps) {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStatus?.(user);
  };

  const handleCardClick = () => {
    onClick?.(user);
  };

  return (
    <Card
      className={`${className} ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      } transition-shadow`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-primary font-medium text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{user.name}</h4>
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

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                {user.email}
              </div>
            </div>
          </div>

          {/* Actions */}
          {onToggleStatus && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleToggleStatus}
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
