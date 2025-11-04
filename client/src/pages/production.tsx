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

        <main className="flex-1 lg:mr-64 p-3 md:p-4 pb-20 lg:pb-4">
          <div className="mb-4 md:mb-6 bg-gradient-to-r from-primary/10 to-primary/5 p-4 md:p-6 rounded-lg border-2 border-primary/20">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              إدارة الإنتاج
            </h1>
            <p className="text-base md:text-lg text-gray-700 font-medium">
              متابعة ومراقبة عمليات الإنتاج والرولات
            </p>
          </div>

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
