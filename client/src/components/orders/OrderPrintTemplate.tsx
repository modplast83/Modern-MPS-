import { useEffect, useState } from "react";
import { format } from "date-fns";

interface OrderPrintTemplateProps {
  order: any;
  customer: any;
  productionOrders: any[];
  customerProducts: any[];
  items: any[];
  onClose: () => void;
}

export default function OrderPrintTemplate({
  order,
  customer,
  productionOrders,
  customerProducts,
  items,
  onClose,
}: OrderPrintTemplateProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Debug: Log the data received
  useEffect(() => {
    console.log("📄 OrderPrintTemplate - Data received:", {
      order,
      customer,
      productionOrders,
      customerProducts: customerProducts.length,
      items: items.length,
    });
  }, [order, customer, productionOrders, customerProducts, items]);

  useEffect(() => {
    // Generate QR code for the order
    const generateQRCode = async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const qrData = JSON.stringify({
          type: "order",
          order_id: order.id,
          order_number: order.order_number,
          customer: customer?.name_ar || customer?.name,
          date: order.created_at,
        });
        const qrUrl = await QRCode.toDataURL(qrData, {
          width: 150,
          margin: 1,
          errorCorrectionLevel: "M",
        });
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error("خطأ في إنشاء رمز QR:", error);
      }
    };

    generateQRCode();
  }, [order, customer]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      waiting: "قيد الانتظار",
      for_production: "جاهز للإنتاج",
      in_production: "قيد الإنتاج",
      completed: "مكتمل",
      cancelled: "ملغي",
      on_hold: "معلق",
      pending: "معلق",
    };
    return statusMap[status] || status;
  };

  const orderProductionOrders = productionOrders.filter(
    (po: any) => po.order_id === order.id
  );

  const totalQuantity = orderProductionOrders.reduce(
    (sum: number, po: any) => sum + parseFloat(po.quantity_kg || 0),
    0
  );

  return (
    <>
      {/* Preview on screen */}
      <div className="no-print fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">معاينة طباعة الطلب</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                data-testid="button-print-order"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                طباعة
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                data-testid="button-close-print"
              >
                إغلاق
              </button>
            </div>
          </div>
          <div className="border border-gray-300 p-6 bg-white">
            <PrintContent
              order={order}
              customer={customer}
              orderProductionOrders={orderProductionOrders}
              customerProducts={customerProducts}
              items={items}
              qrCodeUrl={qrCodeUrl}
              totalQuantity={totalQuantity}
              getStatusText={getStatusText}
            />
          </div>
        </div>
      </div>

      {/* Actual print content */}
      <div className="print-container">
        <PrintContent
          order={order}
          customer={customer}
          orderProductionOrders={orderProductionOrders}
          customerProducts={customerProducts}
          items={items}
          qrCodeUrl={qrCodeUrl}
          totalQuantity={totalQuantity}
          getStatusText={getStatusText}
        />
      </div>
    </>
  );
}

function PrintContent({
  order,
  customer,
  orderProductionOrders,
  customerProducts,
  items,
  qrCodeUrl,
  totalQuantity,
  getStatusText,
}: any) {
  return (
    <>
      {/* Header */}
      <div className="print-header">
        <div>
          <h1 className="print-title">طلب عميل</h1>
          <p className="print-subtitle">Order Form</p>
        </div>
        {qrCodeUrl && (
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="print-qr"
          />
        )}
      </div>

      {/* Document Info */}
      <div className="print-info">
        <div className="print-info-item">
          <span className="print-info-label">رقم الطلب:</span>
          <span className="print-info-value">{order.order_number}</span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">تاريخ الإصدار:</span>
          <span className="print-info-value">
            {format(new Date(), "dd/MM/yyyy - HH:mm")}
          </span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">العميل:</span>
          <span className="print-info-value">
            {customer?.name_ar || customer?.name || "غير محدد"}
          </span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">رمز العميل:</span>
          <span className="print-info-value">
            {customer?.id || "غير محدد"}
          </span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">تاريخ الطلب:</span>
          <span className="print-info-value">
            {order.created_at
              ? format(new Date(order.created_at), "dd/MM/yyyy")
              : "غير محدد"}
          </span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">تاريخ التسليم المتوقع:</span>
          <span className="print-info-value">
            {order.delivery_date
              ? format(new Date(order.delivery_date), "dd/MM/yyyy")
              : "غير محدد"}
          </span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">مدة التسليم:</span>
          <span className="print-info-value">
            {order.delivery_days || "غير محدد"} يوم
          </span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">الحالة:</span>
          <span className="print-badge print-badge-info">
            {getStatusText(order.status)}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      {customer && (
        <div className="print-section">
          <h3 className="print-section-title">معلومات العميل</h3>
          <div className="print-grid-2">
            <div>
              <strong>العنوان:</strong> {customer.address || "غير محدد"}
            </div>
            <div>
              <strong>المدينة:</strong> {customer.city || "غير محدد"}
            </div>
            <div>
              <strong>الهاتف:</strong> {customer.phone || "غير محدد"}
            </div>
            <div>
              <strong>الرقم الضريبي:</strong>{" "}
              {customer.tax_number || "غير محدد"}
            </div>
          </div>
        </div>
      )}

      {/* Production Orders Table */}
      <div className="print-section avoid-page-break">
        <h3 className="print-section-title">
          أوامر الإنتاج ({orderProductionOrders.length})
        </h3>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: "3%" }}>#</th>
              <th style={{ width: "10%" }}>رقم أمر الإنتاج</th>
              <th style={{ width: "15%" }}>المنتج</th>
              <th style={{ width: "12%" }}>المقاس</th>
              <th style={{ width: "8%" }}>الكمية المطلوبة (كجم)</th>
              <th style={{ width: "8%" }}>الكمية المنتجة (كجم)</th>
              <th style={{ width: "8%" }}>الكمية الصافية (كجم)</th>
              <th style={{ width: "7%" }}>نسبة الإكمال</th>
              <th style={{ width: "8%" }}>الحالة</th>
              <th style={{ width: "21%" }}>الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {orderProductionOrders.map((po: any, index: number) => {
              const customerProduct = customerProducts.find(
                (cp: any) => cp.id === po.customer_product_id
              );
              const item = items.find(
                (i: any) => i.id === customerProduct?.item_id
              );

              const producedQty = parseFloat(po.produced_quantity_kg || 0);
              const netQty = parseFloat(po.net_quantity_kg || 0);
              const requiredQty = parseFloat(po.final_quantity_kg || po.quantity_kg || 0);
              const completionPercentage = requiredQty > 0 
                ? ((netQty / requiredQty) * 100).toFixed(1)
                : "0.0";

              return (
                <tr key={po.id}>
                  <td>{index + 1}</td>
                  <td>{po.production_order_number}</td>
                  <td>{item?.name_ar || item?.name || "غير محدد"}</td>
                  <td>{customerProduct?.size_caption || "غير محدد"}</td>
                  <td>{requiredQty.toFixed(2)}</td>
                  <td>{producedQty.toFixed(2)}</td>
                  <td>{netQty.toFixed(2)}</td>
                  <td>
                    <strong>{completionPercentage}%</strong>
                  </td>
                  <td>
                    <span className="print-badge print-badge-info">
                      {getStatusText(po.status)}
                    </span>
                  </td>
                  <td style={{ fontSize: "9px" }}>{po.notes || "-"}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: "left" }}>
                <strong>المجموع الكلي:</strong>
              </td>
              <td>
                <strong>{totalQuantity.toFixed(2)}</strong>
              </td>
              <td>
                <strong>
                  {orderProductionOrders.reduce(
                    (sum: number, po: any) => sum + parseFloat(po.produced_quantity_kg || 0),
                    0
                  ).toFixed(2)}
                </strong>
              </td>
              <td>
                <strong>
                  {orderProductionOrders.reduce(
                    (sum: number, po: any) => sum + parseFloat(po.net_quantity_kg || 0),
                    0
                  ).toFixed(2)}
                </strong>
              </td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Product Specifications */}
      {orderProductionOrders.length > 0 && (
        <div className="print-section avoid-page-break">
          <h3 className="print-section-title">مواصفات المنتجات</h3>
          {orderProductionOrders.map((po: any, index: number) => {
            const customerProduct = customerProducts.find(
              (cp: any) => cp.id === po.customer_product_id
            );

            if (!customerProduct) return null;

            return (
              <div
                key={po.id}
                style={{
                  marginBottom: "15px",
                  padding: "10px",
                  border: "1px solid #ddd",
                  background: "#fafafa",
                }}
              >
                <h4 style={{ marginBottom: "8px", fontWeight: "bold" }}>
                  {index + 1}. {customerProduct.size_caption || "منتج"}
                </h4>
                <div className="print-grid-3">
                  <div>
                    <strong>العرض:</strong>{" "}
                    {customerProduct.width || "غير محدد"} سم
                  </div>
                  <div>
                    <strong>الدخلات يمين:</strong>{" "}
                    {customerProduct.right_facing || "غير محدد"} سم
                  </div>
                  <div>
                    <strong>الدخلات يسار:</strong>{" "}
                    {customerProduct.left_facing || "غير محدد"} سم
                  </div>
                  <div>
                    <strong>السماكة:</strong>{" "}
                    {customerProduct.thickness || "غير محدد"} مايكرون
                  </div>
                  <div>
                    <strong>طول القطع:</strong>{" "}
                    {customerProduct.cutting_length_cm || "غير محدد"} سم
                  </div>
                  <div>
                    <strong>اسطوانة الطباعة:</strong>{" "}
                    {customerProduct.printing_cylinder || "غير محدد"}
                  </div>
                  <div>
                    <strong>الخامة:</strong>{" "}
                    {customerProduct.raw_material || "غير محدد"}
                  </div>
                  <div>
                    <strong>اللون:</strong>{" "}
                    {customerProduct.master_batch_id || "غير محدد"}
                  </div>
                  <div>
                    <strong>الطباعة:</strong>{" "}
                    {customerProduct.is_printed ? "نعم" : "لا"}
                  </div>
                  <div>
                    <strong>التخريم:</strong>{" "}
                    {customerProduct.punching || "غير محدد"}
                  </div>
                  <div>
                    <strong>وحدة القطع:</strong>{" "}
                    {customerProduct.cutting_unit || "غير محدد"}
                  </div>
                  <div>
                    <strong>وزن الوحدة:</strong>{" "}
                    {customerProduct.unit_weight_kg || "غير محدد"} كجم
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="print-notes avoid-page-break">
          <div className="print-notes-title">ملاحظات وتعليمات:</div>
          <div className="print-notes-content">{order.notes}</div>
        </div>
      )}

      {/* Signatures */}
      <div className="print-signatures">
        <div className="print-signature">
          <div className="print-signature-line"></div>
          <div className="print-signature-label">تم الاعداد بواسطة</div>
        </div>
        <div className="print-signature">
          <div className="print-signature-line"></div>
          <div className="print-signature-label">المندوب</div>
        </div>
        <div className="print-signature">
          <div className="print-signature-line"></div>
          <div className="print-signature-label">الإدارة</div>
        </div>
      </div>

      {/* Footer */}
      <div className="print-footer">
        <p>
          هذا المستند تم إنشاؤه إلكترونياً بتاريخ{" "}
          {format(new Date(), "dd/MM/yyyy - HH:mm")}
        </p>
        <p>نظام إدارة الإنتاج - Factory IQ</p>
      </div>
    </>
  );
}
