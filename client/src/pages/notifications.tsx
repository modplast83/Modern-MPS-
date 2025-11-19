import React from "react";
import PageLayout from "../components/layout/PageLayout";
import NotificationCenter from "../components/notifications/NotificationCenter";

export default function NotificationsPage() {
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <NotificationCenter />
      </div>
    </PageLayout>
  );
}
