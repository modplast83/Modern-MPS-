import { useEffect, useState } from "react";
import { format } from "date-fns";
import "../../print.css";

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

    // Auto print after QR code is generated (small delay)
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, [order, customer]);

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
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              data-testid="button-close-print"
            >
              إغلاق
            </button>
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
              <th>#</th>
              <th>رقم أمر الإنتاج</th>
              <th>المنتج</th>
              <th>المقاس</th>
              <th>الكمية (كجم)</th>
              <th>الحالة</th>
              <th>الملاحظات</th>
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

              return (
                <tr key={po.id}>
                  <td>{index + 1}</td>
                  <td>{po.production_order_number}</td>
                  <td>{item?.name_ar || item?.name || "غير محدد"}</td>
                  <td>{customerProduct?.size_caption || "غير محدد"}</td>
                  <td>{parseFloat(po.quantity_kg || 0).toFixed(2)}</td>
                  <td>
                    <span className="print-badge print-badge-info">
                      {getStatusText(po.status)}
                    </span>
                  </td>
                  <td>{po.notes || "-"}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: "left" }}>
                <strong>المجموع الكلي:</strong>
              </td>
              <td colSpan={3}>
                <strong>{totalQuantity.toFixed(2)} كجم</strong>
              </td>
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
                    <strong>الكشة اليمنى:</strong>{" "}
                    {customerProduct.right_facing || "غير محدد"} سم
                  </div>
                  <div>
                    <strong>الكشة اليسرى:</strong>{" "}
                    {customerProduct.left_facing || "غير محدد"} سم
                  </div>
                  <div>
                    <strong>السماكة:</strong>{" "}
                    {customerProduct.thickness || "غير محدد"} مايكرون
                  </div>
                  <div>
                    <strong>طول القص:</strong>{" "}
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
                    <strong>الثقب:</strong>{" "}
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
          <div className="print-signature-label">المُعد</div>
        </div>
        <div className="print-signature">
          <div className="print-signature-line"></div>
          <div className="print-signature-label">المدير الفني</div>
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
