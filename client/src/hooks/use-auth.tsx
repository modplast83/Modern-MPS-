// @refresh reset
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { AuthUser } from "@/types";

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

if (typeof window !== "undefined") {
  (window as any).__AuthContext = AuthContext;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            const normalizedUser = normalizeUserRole(data.user);
            setUser(normalizedUser);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.warn("Error checking auth session:", error);
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "فشل تسجيل الدخول");
      }

      const data = await response.json();
      const normalizedUser = normalizeUserRole(data.user);
      setUser(normalizedUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.warn("Error during logout:", error);
    }
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isLoading, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 🔧 تحويل أسماء الأدوار من الـ API إلى رموز موحدة
 */
function normalizeUserRole(user: any): AuthUser {
  let normalizedRole: AuthUser["role"] = "employee";

  const roleName = user.role_name?.toLowerCase() || "";
  const roleNameAr = user.role_name_ar || "";

  if (roleName.includes("admin") || roleNameAr.includes("مدير")) {
    normalizedRole = "admin";
  } else if (roleName.includes("manager") || roleNameAr.includes("مشرف")) {
    normalizedRole = "manager";
  } else if (roleName.includes("supervisor") || roleNameAr.includes("مشرف")) {
    normalizedRole = "supervisor";
  }

  return {
    ...user,
    role: normalizedRole,
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error("useAuth called outside AuthProvider.");
    if (import.meta.env.DEV) {
      console.warn("Development fallback: returning empty auth state");
      return {
        user: null,
        login: async () => {
          throw new Error("Auth not available - please refresh page");
        },
        logout: () => window.location.reload(),
        isLoading: false,
        isAuthenticated: false,
      };
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
