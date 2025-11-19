import PageLayout from "../components/layout/PageLayout";
import DashboardStats from "../components/dashboard/DashboardStats";
import Shortcuts from "../components/dashboard/Shortcuts";
import QuickNotes from "../components/dashboard/QuickNotes";

export default function Dashboard() {
  return (
    <PageLayout>
      <Shortcuts />
      <DashboardStats />

      <div className="mb-6">
        <QuickNotes />
      </div>
    </PageLayout>
  );
}
