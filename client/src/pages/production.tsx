import { useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import ProductionTabs from "../components/production/ProductionTabs";
import RollCreationModal from "../components/modals/RollCreationModal";

export default function Production() {
  const [isRollModalOpen, setIsRollModalOpen] = useState(false);
  const [selectedProductionOrderId, setSelectedProductionOrderId] = useState<
    number | undefined
  >();

  const handleCreateRoll = (productionOrderId?: number) => {
    setSelectedProductionOrderId(productionOrderId);
    setIsRollModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsRollModalOpen(false);
    setSelectedProductionOrderId(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        <Sidebar />
        <MobileNav />

        <main className="flex-1 lg:mr-64 p-2 md:p-4 pb-20 lg:pb-4">
          <ProductionTabs onCreateRoll={handleCreateRoll} />
        </main>
      </div>

      <RollCreationModal
        isOpen={isRollModalOpen}
        onClose={handleCloseModal}
        selectedProductionOrderId={selectedProductionOrderId}
      />
    </div>
  );
}
