import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ProductionTabs from "@/components/production/ProductionTabs";
import RecentRolls from "@/components/dashboard/RecentRolls";
import MachineStatus from "@/components/dashboard/MachineStatus";
import AIAssistant from "@/components/ai/AIAssistant";
import RollCreationModal from "@/components/modals/RollCreationModal";

export default function Dashboard() {
  const [isRollModalOpen, setIsRollModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 p-4 pb-20 lg:pb-4">
          <DashboardStats />
          
          <ProductionTabs onCreateRoll={() => setIsRollModalOpen(true)} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RecentRolls />
            <MachineStatus onCreateRoll={() => setIsRollModalOpen(true)} />
          </div>
          
          <AIAssistant />
        </main>
      </div>
      
      <RollCreationModal 
        isOpen={isRollModalOpen} 
        onClose={() => setIsRollModalOpen(false)} 
      />
    </div>
  );
}
