import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import DashboardStats from "../components/dashboard/DashboardStats";
import Shortcuts from "../components/dashboard/Shortcuts";
import QuickNotes from "../components/dashboard/QuickNotes";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        <Sidebar />
        <MobileNav />

        <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4">
          <Shortcuts />
          <DashboardStats />

          <div className="mb-6">
            <QuickNotes />
          </div>
        </main>
      </div>
    </div>
  );
}
