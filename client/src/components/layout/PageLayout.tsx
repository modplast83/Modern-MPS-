import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileShell from "./MobileShell";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * PageLayout - Unified layout wrapper for all pages
 * Ensures consistent structure: Header + Sidebar + MobileShell + Content
 * Handles responsive padding and spacing for mobile/desktop
 */
export default function PageLayout({ children, title, description, className = "" }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="flex">
        <Sidebar />
        <MobileShell />

        <main className={`flex-1 lg:mr-64 p-4 pb-24 lg:pb-4 ${className}`}>
          {(title || description) && (
            <div className="mb-6">
              {title && (
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
}
