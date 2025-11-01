import { useState, useEffect } from "react";
import type { ProductionOrderWithDetails } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

const ProductionOrdersV2: React.FC = () => {
  const [orders, setOrders] = useState<ProductionOrderWithDetails[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrderWithDetails | null>(null);

  useEffect(() => {
    setOrders([
      {
        id: 1,
        production_order_number: "PO-001",
        order_id: 10,
        product_id: 101,
        quantity_required: "1000",
        produced_quantity_kg: "800",
        status: "in_progress",
        created_at: new Date().toISOString(),
        customer_name: "شركة الخليج",
        product_name: "أكياس نفايات",
      },
    ]);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>📦 أوامر الإنتاج</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100 text-right">
                <th className="p-2">رقم الأمر</th>
                <th className="p-2">العميل</th>
                <th className="p-2">المنتج</th>
                <th className="p-2">الحالة</th>
                <th className="p-2">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-2">{order.production_order_number}</td>
                  <td className="p-2">{order.customer_name}</td>
                  <td className="p-2">{order.product_name}</td>
                  <td className="p-2">{order.status}</td>
                  <td className="p-2">
                    <Button onClick={() => setSelectedOrder(order)}>عرض</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selectedOrder && (
        <Card>
          <CardHeader>
            <CardTitle>🧾 تفاصيل الأمر</CardTitle>
          </CardHeader>
          <CardContent>
            <p>العميل: {selectedOrder.customer_name}</p>
            <p>المنتج: {selectedOrder.product_name}</p>
            <p>الكمية المطلوبة: {selectedOrder.quantity_required}</p>
            <p>الكمية المنتجة: {selectedOrder.produced_quantity_kg}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductionOrdersV2;
