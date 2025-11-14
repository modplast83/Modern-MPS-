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
    productionOrder.quantity_kg >{t('components.production.ProductionOrderPrintTemplate.0_?_(totalweight_/_productionorder.quantity_kg)_*_100_:_0;_return_(')}<>
      {/* Preview on screen */}
      <div className={t("components.production.name.no_print_fixed_inset_0_bg_black_bg_opacity_50_z_50_flex_items_center_justify_center")}>
        <div className={t("components.production.name.bg_white_rounded_lg_p_4_max_w_4xl_max_h_90vh_overflow_y_auto")}>
          <div className={t("components.production.name.flex_justify_between_items_center_mb_4")}>
            <h2 className={t("components.production.name.text_xl_font_bold")}>{t('components.production.ProductionOrderPrintTemplate.معاينة_طباعة_أمر_الإنتاج')}</h2>
            <button
              onClick={onClose}
              className={t("components.production.name.px_4_py_2_bg_gray_500_text_white_rounded_hover_bg_gray_600")}
              data-testid="button-close-print"
            >{t('components.production.ProductionOrderPrintTemplate.إغلاق')}</button>
          </div>
          <div className={t("components.production.name.border_border_gray_300_p_6_bg_white")}>
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
      <div className={t("components.production.name.print_container")}>
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
      <div className={t("components.production.name.print_header")}>
        <div>
          <h1 className={t("components.production.name.print_title")}>{t('components.production.ProductionOrderPrintTemplate.أمر_إنتاج')}</h1>
          <p className={t("components.production.name.print_subtitle")}>{t('components.production.ProductionOrderPrintTemplate.production_order')}</p>
        </div>
        {qrCodeUrl && (
          <img src={qrCodeUrl} alt="{t('components.production.ProductionOrderPrintTemplate.alt.qr_code')}" className={t("components.production.name.print_qr")} />
        )}
      </div>

      {/* Document Info */}
      <div className={t("components.production.name.print_info")}>
        <div className={t("components.production.name.print_info_item")}>
          <span className={t("components.production.name.print_info_label")}>{t('components.production.ProductionOrderPrintTemplate.رقم_أمر_الإنتاج:')}</span>
          <span className={t("components.production.name.print_info_value")}>
            {productionOrder.production_order_number}
          </span>
        </div>
        <div className={t("components.production.name.print_info_item")}>
          <span className={t("components.production.name.print_info_label")}>{t('components.production.ProductionOrderPrintTemplate.تاريخ_الإصدار:')}</span>
          <span className={t("components.production.name.print_info_value")}>
            {format(new Date(), "dd/MM/yyyy - HH:mm")}
          </span>
        </div>
        <div className={t("components.production.name.print_info_item")}>
          <span className={t("components.production.name.print_info_label")}>{t('components.production.ProductionOrderPrintTemplate.رقم_الطلب:')}</span>
          <span className={t("components.production.name.print_info_value")}>
            {order?.order_number || "غير محدد"}
          </span>
        </div>
        <div className={t("components.production.name.print_info_item")}>
          <span className={t("components.production.name.print_info_label")}>{t('components.production.ProductionOrderPrintTemplate.العميل:')}</span>
          <span className={t("components.production.name.print_info_value")}>
            {customer?.name_ar || customer?.name || "غير محدد"}
          </span>
        </div>
        <div className={t("components.production.name.print_info_item")}>
          <span className={t("components.production.name.print_info_label")}>{t('components.production.ProductionOrderPrintTemplate.تاريخ_الإنشاء:')}</span>
          <span className={t("components.production.name.print_info_value")}>
            {productionOrder.created_at
              ? format(new Date(productionOrder.created_at), "dd/MM/yyyy")
              : "غير محدد"}
          </span>
        </div>
        <div className={t("components.production.name.print_info_item")}>
          <span className={t("components.production.name.print_info_label")}>{t('components.production.ProductionOrderPrintTemplate.الحالة:')}</span>
          <span className={t("components.production.name.print_badge_print_badge_info")}>
            {getStatusText(productionOrder.status)}
          </span>
        </div>
        <div className={t("components.production.name.print_info_item")}>
          <span className={t("components.production.name.print_info_label")}>{t('components.production.ProductionOrderPrintTemplate.الكمية_المطلوبة:')}</span>
          <span className={t("components.production.name.print_info_value")}>
            {parseFloat(productionOrder.quantity_kg || 0).toFixed(2)} كجم
          </span>
        </div>
        <div className={t("components.production.name.print_info_item")}>
          <span className={t("components.production.name.print_info_label")}>{t('components.production.ProductionOrderPrintTemplate.التقدم:')}</span>
          <span className={t("components.production.name.print_info_value")}>
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Production Assignment */}
      <div className={t("components.production.name.print_section")}>
        <h3 className={t("components.production.name.print_section_title")}>{t('components.production.ProductionOrderPrintTemplate.التخصيص')}</h3>
        <div className={t("components.production.name.print_grid_2")}>
          <div>
            <strong>{t('components.production.ProductionOrderPrintTemplate.الماكينة:')}</strong>{" "}
            {machine?.name_ar || machine?.name || "غير محدد"}
            {machine?.id && ` (${machine.id})`}
          </div>
          <div>
            <strong>{t('components.production.ProductionOrderPrintTemplate.العامل_المخصص:')}</strong>{" "}
            {operator?.display_name_ar ||
              operator?.display_name ||
              "غير محدد"}
          </div>
        </div>
      </div>

      {/* Product Specifications */}
      <div className={t("components.production.name.print_section_avoid_page_break")}>
        <h3 className={t("components.production.name.print_section_title")}>{t('components.production.ProductionOrderPrintTemplate.مواصفات_المنتج')}</h3>
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
          <div className={t("components.production.name.print_grid_3")}>
            <div>
              <strong>{t('components.production.ProductionOrderPrintTemplate.العرض:')}</strong>{" "}
              {customerProduct?.width || "غير محدد"} سم
            </div>
            <div>
              <strong>{t('components.production.ProductionOrderPrintTemplate.الكشة_اليمنى:')}</strong>{" "}
              {customerProduct?.right_facing || "غير محدد"} سم
            </div>
            <div>
              <strong>{t('components.production.ProductionOrderPrintTemplate.الكشة_اليسرى:')}</strong>{" "}
              {customerProduct?.left_facing || "غير محدد"} سم
            </div>
            <div>
              <strong>{t('components.production.ProductionOrderPrintTemplate.السماكة:')}</strong>{" "}
              {customerProduct?.thickness || "غير محدد"} مايكرون
            </div>
            <div>
              <strong>{t('components.production.ProductionOrderPrintTemplate.طول_القص:')}</strong>{" "}
              {customerProduct?.cutting_length_cm || "غير محدد"} سم
            </div>
            <div>
              <strong>{t('components.production.ProductionOrderPrintTemplate.اسطوانة_الطباعة:')}</strong>{" "}
              {customerProduct?.printing_cylinder || "غير محدد"}
            </div>
            <div>
              <strong>{t('components.production.ProductionOrderPrintTemplate.الخامة:')}</strong>{" "}
              {customerProduct?.raw_material || "غير محدد"}
            </div>
            <div>
              <strong>{t('components.production.ProductionOrderPrintTemplate.اللون:')}</strong>{" "}
              {customerProduct?.master_batch_id || "غير محدد"}
            </div>
            <div>
              <strong>{t('components.production.ProductionOrderPrintTemplate.الطباعة:')}</strong>{" "}
              {customerProduct?.is_printed ? "نعم" : "لا"}
            </div>
            <div>
              <strong>{t('components.production.ProductionOrderPrintTemplate.الثقب:')}</strong>{" "}
              {customerProduct?.punching || "غير محدد"}
            </div>
            <div>
              <strong>{t('components.production.ProductionOrderPrintTemplate.وحدة_القطع:')}</strong>{" "}
              {customerProduct?.cutting_unit || "غير محدد"}
            </div>
            <div>
              <strong>{t('components.production.ProductionOrderPrintTemplate.وزن_الوحدة:')}</strong>{" "}
              {customerProduct?.unit_weight_kg || "غير محدد"} كجم
            </div>
          </div>
        </div>
      </div>

      {/* Progress Statistics */}
      <div className={t("components.production.name.print_section_avoid_page_break")}>
        <h3 className={t("components.production.name.print_section_title")}>{t('components.production.ProductionOrderPrintTemplate.إحصائيات_الإنتاج')}</h3>
        <div className={t("components.production.name.print_stats")}>
          <div className={t("components.production.name.print_stat_card")}>
            <div className={t("components.production.name.print_stat_label")}>{t('components.production.ProductionOrderPrintTemplate.إجمالي_الرولات')}</div>
            <div className={t("components.production.name.print_stat_value")}>{totalRolls}</div>
          </div>
          <div className={t("components.production.name.print_stat_card")}>
            <div className={t("components.production.name.print_stat_label")}>{t('components.production.ProductionOrderPrintTemplate.الرولات_المكتملة')}</div>
            <div className={t("components.production.name.print_stat_value")}>{completedRolls}</div>
          </div>
          <div className={t("components.production.name.print_stat_card")}>
            <div className={t("components.production.name.print_stat_label")}>{t('components.production.ProductionOrderPrintTemplate.الوزن_المنتج')}</div>
            <div className={t("components.production.name.print_stat_value")}>
              {totalWeight.toFixed(2)} كجم
            </div>
          </div>
          <div className={t("components.production.name.print_stat_card")}>
            <div className={t("components.production.name.print_stat_label")}>{t('components.production.ProductionOrderPrintTemplate.نسبة_الإنجاز')}</div>
            <div className={t("components.production.name.print_stat_value")}>
              {progressPercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className={t("components.production.name.print_progress")} style={{ marginTop: "15px" }}>
          <div
            className={t("components.production.name.print_progress_bar")}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          >
            {progressPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Rolls Table */}
      {rolls.length >{t('components.production.ProductionOrderPrintTemplate.0_&&_(')}<div className={t("components.production.name.print_section_avoid_page_break")}>
          <h3 className={t("components.production.name.print_section_title")}>
            سجل الإنتاج - الرولات ({totalRolls})
          </h3>
          <table className={t("components.production.name.print_table")}>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('components.production.ProductionOrderPrintTemplate.رقم_الرول')}</th>
                <th>{t('components.production.ProductionOrderPrintTemplate.الوزن_(كجم)')}</th>
                <th>{t('components.production.ProductionOrderPrintTemplate.المرحلة')}</th>
                <th>{t('components.production.ProductionOrderPrintTemplate.تاريخ_الإنشاء')}</th>
                <th>{t('components.production.ProductionOrderPrintTemplate.ملاحظات')}</th>
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
                  <strong>{t('components.production.ProductionOrderPrintTemplate.المجموع:')}</strong>
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
        <div className={t("components.production.name.print_notes_avoid_page_break")}>
          <div className={t("components.production.name.print_notes_title")}>{t('components.production.ProductionOrderPrintTemplate.ملاحظات:')}</div>
          <div className={t("components.production.name.print_notes_content")}>
            {productionOrder.notes}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className={t("components.production.name.print_signatures")}>
        <div className={t("components.production.name.print_signature")}>
          <div className={t("components.production.name.print_signature_line")}></div>
          <div className={t("components.production.name.print_signature_label")}>{t('components.production.ProductionOrderPrintTemplate.مسؤول_الإنتاج')}</div>
        </div>
        <div className={t("components.production.name.print_signature")}>
          <div className={t("components.production.name.print_signature_line")}></div>
          <div className={t("components.production.name.print_signature_label")}>{t('components.production.ProductionOrderPrintTemplate.مشرف_القسم')}</div>
        </div>
        <div className={t("components.production.name.print_signature")}>
          <div className={t("components.production.name.print_signature_line")}></div>
          <div className={t("components.production.name.print_signature_label")}>{t('components.production.ProductionOrderPrintTemplate.مدير_الإنتاج')}</div>
        </div>
      </div>

      {/* Footer */}
      <div className={t("components.production.name.print_footer")}>
        <p>
          هذا المستند تم إنشاؤه إلكترونياً بتاريخ{" "}
          {format(new Date(), "dd/MM/yyyy - HH:mm")}
        </p>
        <p>{t('components.production.ProductionOrderPrintTemplate.نظام_إدارة_الإنتاج_-_factory_iq')}</p>
      </div>
    </>
  );
}
