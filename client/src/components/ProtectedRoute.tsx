import { useAuth } from "../hooks/use-auth";
import { canAccessRoute } from "../utils/roleUtils";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  path: string;
}

export default function ProtectedRoute({ children, path }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Wait for auth to load
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Redirect to="/login" />;
  }

  // Check if user has permission to access this route
  if (!canAccessRoute(user, path)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-2xl font-bold text-red-600 mb-4">غير مصرح</div>
        <div className="text-lg text-gray-600 mb-4">
          ليس لديك الصلاحيات اللازمة للوصول لهذه الصفحة
        </div>
        <a
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          العودة للصفحة الرئيسية
        </a>
      </div>
    );
  }

  // User has permission, render the page
  return <>{children}</>;
}