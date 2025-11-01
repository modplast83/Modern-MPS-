import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const ProductionDashboardV2: React.FC = () => {
  const [stats] = useState({
    totalOrders: 5,
    activeOrders: 3,
    totalRolls: 25,
    completed: 2,
  });

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card><CardContent><h3>📦 إجمالي الأوامر</h3><p>{stats.totalOrders}</p></CardContent></Card>
      <Card><CardContent><h3>⚙️ الأوامر النشطة</h3><p>{stats.activeOrders}</p></CardContent></Card>
      <Card><CardContent><h3>🎞️ إجمالي الرولات</h3><p>{stats.totalRolls}</p></CardContent></Card>
      <Card><CardContent><h3>✅ المكتملة</h3><p>{stats.completed}</p></CardContent></Card>
    </div>
  );
};

export default ProductionDashboardV2;
