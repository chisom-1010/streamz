import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../lib/api";
import { User } from "../shared/types/user";
import { toast } from "sonner";

interface UseUserManagementParams {
  initialFilter?: "all" | "active" | "inactive";
  limit?: number;
}

interface UseUserManagementReturn {
  // Data
  users: User[];
  loading: boolean;
  error: string | null;
  total: number;

  // Filters
  filter: "all" | "active" | "inactive";
  searchTerm: string;
  filteredUsers: User[];

  // Actions
  setFilter: (filter: "all" | "active" | "inactive") => void;
  setSearchTerm: (term: string) => void;
  loadUsers: () => Promise<void>;
  toggleUserStatus: (user: User) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

export const useUserManagement = ({
  initialFilter = "all",
  limit = 50,
}: UseUserManagementParams = {}): UseUserManagementReturn => {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">(
    initialFilter
  );
  const [searchTerm, setSearchTerm] = useState("");

  //const { toast } = useToast();

  // Load users from API
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit,
        offset: 0,
        ...(filter !== "all" && { active: filter === "active" }),
      };

      const response = await apiClient.getAllUsers(params);
      setUsers(response.users);
      setTotal(response.total);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load users";
      setError(errorMessage);

      toast("Error Loading Users", {
        description: errorMessage,
        //variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filter, limit, toast]);

  // Toggle user active status
  const toggleUserStatus = useCallback(
    async (user: User) => {
      try {
        const response = await apiClient.toggleUserStatus(user.id);

        // Update user in the list optimistically
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  isActive: response.user.isActive,
                  //updatedAt: response.user.updatedAt,
                }
              : u
          )
        );

        toast("Status Updated", {
          description: response.message,
        });
      } catch (err: any) {
        const errorMessage = err.message || "Failed to update user status";

        toast("Error", {
          description: errorMessage,
          //variant: "destructive",
        });

        throw err; // Re-throw so component can handle if needed
      }
    },
    [toast]
  );

  // Refresh users (alias for loadUsers)
  const refreshUsers = useCallback(() => {
    return loadUsers();
  }, [loadUsers]);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load users when filter changes
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    // Data
    users,
    loading,
    error,
    total,

    // Filters
    filter,
    searchTerm,
    filteredUsers,

    // Actions
    setFilter,
    setSearchTerm,
    loadUsers,
    toggleUserStatus,
    refreshUsers,
  };
};
