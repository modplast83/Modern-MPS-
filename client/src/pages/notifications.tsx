import React from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import NotificationCenter from "../components/notifications/NotificationCenter";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="flex">
        <Sidebar />
        <MobileNav />

        <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4">
          <div className="max-w-7xl mx-auto">
            <NotificationCenter />
          </div>
        </main>
      </div>
    </div>
  );
}
