import { useEffect, useState } from "react";
import { format } from "date-fns";
import "../../print.css";

interface ProductionOrderPrintTemplateProps {
  productionOrder: any;
  order: any;
  customer: any;
  customerProduct: any;
  item: any;
  machine: any;
  operator: any;
  rolls: any[];
  onClose: () => void;
}

export default function ProductionOrderPrintTemplate({
  productionOrder,
  order,
  customer,
  customerProduct,
  item,
  machine,
  operator,
  rolls,
  onClose,
}: ProductionOrderPrintTemplateProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    // Generate QR code for the production order
    const generateQRCode = async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const qrData = JSON.stringify({
          type: "production_order",
          production_order_id: productionOrder.id,
          production_order_number: productionOrder.production_order_number,
          order_number: order?.order_number,
          customer: customer?.name_ar || customer?.name,
          date: productionOrder.created_at,
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
  }, [productionOrder, order, customer]);

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "معلق",
      active: "نشط",
      completed: "مكتمل",
      cancelled: "ملغي",
    };
    return statusMap[status] || status;
  };

  const getRollStageText = (stage: string) => {
    const stageMap: Record<string, string> = {
      film: "تفليم",
      printing: "طباعة",
      cutting: "تقطيع",
      done: "جاهز",
    };
    return stageMap[stage] || stage;
  };

  // Calculate statistics
  const totalRolls = rolls.length;
  const completedRolls = rolls.filter((r: any) => r.stage === "done").length;
  const totalWeight = rolls.reduce(
    (sum: number, r: any) => sum + parseFloat(r.weight_kg || 0),
    0
  );
  const progressPercentage =
    productionOrder.quantity_kg > 0
      ? (totalWeight / productionOrder.quantity_kg) * 100
      : 0;

  return (
    <>
      {/* Preview on screen */}
      <div className="no-print fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">معاينة طباعة أمر الإنتاج</h2>
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
              productionOrder={productionOrder}
              order={order}
              customer={customer}
              customerProduct={customerProduct}
              item={item}
              machine={machine}
              operator={operator}
              rolls={rolls}
              qrCodeUrl={qrCodeUrl}
              totalRolls={totalRolls}
              completedRolls={completedRolls}
              totalWeight={totalWeight}
              progressPercentage={progressPercentage}
              getStatusText={getStatusText}
              getRollStageText={getRollStageText}
            />
          </div>
        </div>
      </div>

      {/* Actual print content */}
      <div className="print-container">
        <PrintContent
          productionOrder={productionOrder}
          order={order}
          customer={customer}
          customerProduct={customerProduct}
          item={item}
          machine={machine}
          operator={operator}
          rolls={rolls}
          qrCodeUrl={qrCodeUrl}
          totalRolls={totalRolls}
          completedRolls={completedRolls}
          totalWeight={totalWeight}
          progressPercentage={progressPercentage}
          getStatusText={getStatusText}
          getRollStageText={getRollStageText}
        />
      </div>
    </>
  );
}

function PrintContent({
  productionOrder,
  order,
  customer,
  customerProduct,
  item,
  machine,
  operator,
  rolls,
  qrCodeUrl,
  totalRolls,
  completedRolls,
  totalWeight,
  progressPercentage,
  getStatusText,
  getRollStageText,
}: any) {
  return (
    <>
      {/* Header */}
      <div className="print-header">
        <div>
          <h1 className="print-title">أمر إنتاج</h1>
          <p className="print-subtitle">Production Order</p>
        </div>
        {qrCodeUrl && (
          <img src={qrCodeUrl} alt="QR Code" className="print-qr" />
        )}
      </div>

      {/* Document Info */}
      <div className="print-info">
        <div className="print-info-item">
          <span className="print-info-label">رقم أمر الإنتاج:</span>
          <span className="print-info-value">
            {productionOrder.production_order_number}
          </span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">تاريخ الإصدار:</span>
          <span className="print-info-value">
            {format(new Date(), "dd/MM/yyyy - HH:mm")}
          </span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">رقم الطلب:</span>
          <span className="print-info-value">
            {order?.order_number || "غير محدد"}
          </span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">العميل:</span>
          <span className="print-info-value">
            {customer?.name_ar || customer?.name || "غير محدد"}
          </span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">تاريخ الإنشاء:</span>
          <span className="print-info-value">
            {productionOrder.created_at
              ? format(new Date(productionOrder.created_at), "dd/MM/yyyy")
              : "غير محدد"}
          </span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">الحالة:</span>
          <span className="print-badge print-badge-info">
            {getStatusText(productionOrder.status)}
          </span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">الكمية المطلوبة:</span>
          <span className="print-info-value">
            {parseFloat(productionOrder.quantity_kg || 0).toFixed(2)} كجم
          </span>
        </div>
        <div className="print-info-item">
          <span className="print-info-label">التقدم:</span>
          <span className="print-info-value">
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Production Assignment */}
      <div className="print-section">
        <h3 className="print-section-title">التخصيص</h3>
        <div className="print-grid-2">
          <div>
            <strong>الماكينة:</strong>{" "}
            {machine?.name_ar || machine?.name || "غير محدد"}
            {machine?.id && ` (${machine.id})`}
          </div>
          <div>
            <strong>العامل المخصص:</strong>{" "}
            {operator?.display_name_ar ||
              operator?.display_name ||
              "غير محدد"}
          </div>
        </div>
      </div>

      {/* Product Specifications */}
      <div className="print-section avoid-page-break">
        <h3 className="print-section-title">مواصفات المنتج</h3>
        <div
          style={{
            padding: "10px",
            border: "1px solid #ddd",
            background: "#fafafa",
          }}
        >
          <h4 style={{ marginBottom: "10px", fontWeight: "bold" }}>
            {item?.name_ar || item?.name || "منتج"} -{" "}
            {customerProduct?.size_caption || "غير محدد"}
          </h4>
          <div className="print-grid-3">
            <div>
              <strong>العرض:</strong>{" "}
              {customerProduct?.width || "غير محدد"} سم
            </div>
            <div>
              <strong>الكشة اليمنى:</strong>{" "}
              {customerProduct?.right_facing || "غير محدد"} سم
            </div>
            <div>
              <strong>الكشة اليسرى:</strong>{" "}
              {customerProduct?.left_facing || "غير محدد"} سم
            </div>
            <div>
              <strong>السماكة:</strong>{" "}
              {customerProduct?.thickness || "غير محدد"} مايكرون
            </div>
            <div>
              <strong>طول القص:</strong>{" "}
              {customerProduct?.cutting_length_cm || "غير محدد"} سم
            </div>
            <div>
              <strong>اسطوانة الطباعة:</strong>{" "}
              {customerProduct?.printing_cylinder || "غير محدد"}
            </div>
            <div>
              <strong>الخامة:</strong>{" "}
              {customerProduct?.raw_material || "غير محدد"}
            </div>
            <div>
              <strong>اللون:</strong>{" "}
              {customerProduct?.master_batch_id || "غير محدد"}
            </div>
            <div>
              <strong>الطباعة:</strong>{" "}
              {customerProduct?.is_printed ? "نعم" : "لا"}
            </div>
            <div>
              <strong>الثقب:</strong>{" "}
              {customerProduct?.punching || "غير محدد"}
            </div>
            <div>
              <strong>وحدة القطع:</strong>{" "}
              {customerProduct?.cutting_unit || "غير محدد"}
            </div>
            <div>
              <strong>وزن الوحدة:</strong>{" "}
              {customerProduct?.unit_weight_kg || "غير محدد"} كجم
            </div>
          </div>
        </div>
      </div>

      {/* Progress Statistics */}
      <div className="print-section avoid-page-break">
        <h3 className="print-section-title">إحصائيات الإنتاج</h3>
        <div className="print-stats">
          <div className="print-stat-card">
            <div className="print-stat-label">إجمالي الرولات</div>
            <div className="print-stat-value">{totalRolls}</div>
          </div>
          <div className="print-stat-card">
            <div className="print-stat-label">الرولات المكتملة</div>
            <div className="print-stat-value">{completedRolls}</div>
          </div>
          <div className="print-stat-card">
            <div className="print-stat-label">الوزن المنتج</div>
            <div className="print-stat-value">
              {totalWeight.toFixed(2)} كجم
            </div>
          </div>
          <div className="print-stat-card">
            <div className="print-stat-label">نسبة الإنجاز</div>
            <div className="print-stat-value">
              {progressPercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="print-progress" style={{ marginTop: "15px" }}>
          <div
            className="print-progress-bar"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          >
            {progressPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Rolls Table */}
      {rolls.length > 0 && (
        <div className="print-section avoid-page-break">
          <h3 className="print-section-title">
            سجل الإنتاج - الرولات ({totalRolls})
          </h3>
          <table className="print-table">
            <thead>
              <tr>
                <th>#</th>
                <th>رقم الرول</th>
                <th>الوزن (كجم)</th>
                <th>المرحلة</th>
                <th>تاريخ الإنشاء</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {rolls.map((roll: any, index: number) => (
                <tr key={roll.id}>
                  <td>{index + 1}</td>
                  <td>{roll.roll_number}</td>
                  <td>{parseFloat(roll.weight_kg || 0).toFixed(2)}</td>
                  <td>
                    <span
                      className={`print-badge ${
                        roll.stage === "done"
                          ? "print-badge-success"
                          : "print-badge-warning"
                      }`}
                    >
                      {getRollStageText(roll.stage)}
                    </span>
                  </td>
                  <td>
                    {roll.created_at
                      ? format(new Date(roll.created_at), "dd/MM/yyyy HH:mm")
                      : "-"}
                  </td>
                  <td>{roll.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ textAlign: "left" }}>
                  <strong>المجموع:</strong>
                </td>
                <td colSpan={4}>
                  <strong>{totalWeight.toFixed(2)} كجم</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Notes */}
      {productionOrder.notes && (
        <div className="print-notes avoid-page-break">
          <div className="print-notes-title">ملاحظات:</div>
          <div className="print-notes-content">
            {productionOrder.notes}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="print-signatures">
        <div className="print-signature">
          <div className="print-signature-line"></div>
          <div className="print-signature-label">مسؤول الإنتاج</div>
        </div>
        <div className="print-signature">
          <div className="print-signature-line"></div>
          <div className="print-signature-label">مشرف القسم</div>
        </div>
        <div className="print-signature">
          <div className="print-signature-line"></div>
          <div className="print-signature-label">مدير الإنتاج</div>
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
