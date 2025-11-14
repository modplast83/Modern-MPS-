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
    <div className={t("pages.production.name.min_h_screen_bg_gray_50")}>
      <Header />

      <div className={t("pages.production.name.flex")}>
        <Sidebar />
        <MobileNav />

        <main className={t("pages.production.name.flex_1_lg_mr_64_p_2_md_p_4_pb_20_lg_pb_4")}>
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
