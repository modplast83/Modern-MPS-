import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        console.error(t('orders.print.qrCodeError'), error);
      }
    };

    generateQRCode();

    // Auto print after QR code is generated (small delay)
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, [order, customer, t]);

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      waiting: t('orders.status.waiting'),
      for_production: t('orders.status.for_production'),
      in_production: t('orders.status.in_production'),
      completed: t('orders.status.completed'),
      cancelled: t('orders.status.cancelled'),
      on_hold: t('orders.status.on_hold'),
      pending: t('orders.status.pending'),
    };
    return statusMap[status] || status;
  };

  const orderProductionOrders = productionOrders.filter(
    (po: any) => po.order_id === order.id
  );

  const totalQuantity = orderProductionOrders.reduce(
    (sum: number, po: any) =>{t('components.orders.OrderPrintTemplate.sum_+_parsefloat(po.quantity_kg_||_0),_0_);_return_(')}<>
      {/* Preview on screen */}
      <div className={t("components.orders.orderprinttemplate.name.no_print_fixed_inset_0_bg_black_bg_opacity_50_z_50_flex_items_center_justify_center")}>
        <div className={t("components.orders.orderprinttemplate.name.bg_white_rounded_lg_p_4_max_w_4xl_max_h_90vh_overflow_y_auto")}>
          <div className={t("components.orders.orderprinttemplate.name.flex_justify_between_items_center_mb_4")}>
            <h2 className={t("components.orders.orderprinttemplate.name.text_xl_font_bold")}>{t('orders.print.preview')}</h2>
            <button
              onClick={onClose}
              className={t("components.orders.orderprinttemplate.name.px_4_py_2_bg_gray_500_text_white_rounded_hover_bg_gray_600")}
              data-testid="button-close-print"
            >
              {t('common.close')}
            </button>
          </div>
          <div className={t("components.orders.orderprinttemplate.name.border_border_gray_300_p_6_bg_white")}>
            <PrintContent
              order={order}
              customer={customer}
              orderProductionOrders={orderProductionOrders}
              customerProducts={customerProducts}
              items={items}
              qrCodeUrl={qrCodeUrl}
              totalQuantity={totalQuantity}
              getStatusText={getStatusText}
              t={t}
            />
          </div>
        </div>
      </div>

      {/* Actual print content */}
      <div className={t("components.orders.orderprinttemplate.name.print_container")}>
        <PrintContent
          order={order}
          customer={customer}
          orderProductionOrders={orderProductionOrders}
          customerProducts={customerProducts}
          items={items}
          qrCodeUrl={qrCodeUrl}
          totalQuantity={totalQuantity}
          getStatusText={getStatusText}
          t={t}
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
      <div className={t("components.orders.orderprinttemplate.name.print_header")}>
        <div>
          <h1 className={t("components.orders.orderprinttemplate.name.print_title")}>{t('components.orders.OrderPrintTemplate.طلب_عميل')}</h1>
          <p className={t("components.orders.orderprinttemplate.name.print_subtitle")}>{t('components.orders.OrderPrintTemplate.order_form')}</p>
        </div>
        {qrCodeUrl && (
          <img
            src={qrCodeUrl}
            alt="{t('components.orders.OrderPrintTemplate.alt.qr_code')}"
            className={t("components.orders.orderprinttemplate.name.print_qr")}
          />
        )}
      </div>

      {/* Document Info */}
      <div className={t("components.orders.orderprinttemplate.name.print_info")}>
        <div className={t("components.orders.orderprinttemplate.name.print_info_item")}>
          <span className={t("components.orders.orderprinttemplate.name.print_info_label")}>{t('components.orders.OrderPrintTemplate.رقم_الطلب:')}</span>
          <span className={t("components.orders.orderprinttemplate.name.print_info_value")}>{order.order_number}</span>
        </div>
        <div className={t("components.orders.orderprinttemplate.name.print_info_item")}>
          <span className={t("components.orders.orderprinttemplate.name.print_info_label")}>{t('components.orders.OrderPrintTemplate.تاريخ_الإصدار:')}</span>
          <span className={t("components.orders.orderprinttemplate.name.print_info_value")}>
            {format(new Date(), "dd/MM/yyyy - HH:mm")}
          </span>
        </div>
        <div className={t("components.orders.orderprinttemplate.name.print_info_item")}>
          <span className={t("components.orders.orderprinttemplate.name.print_info_label")}>{t('components.orders.OrderPrintTemplate.العميل:')}</span>
          <span className={t("components.orders.orderprinttemplate.name.print_info_value")}>
            {customer?.name_ar || customer?.name || "غير محدد"}
          </span>
        </div>
        <div className={t("components.orders.orderprinttemplate.name.print_info_item")}>
          <span className={t("components.orders.orderprinttemplate.name.print_info_label")}>{t('components.orders.OrderPrintTemplate.رمز_العميل:')}</span>
          <span className={t("components.orders.orderprinttemplate.name.print_info_value")}>
            {customer?.id || "غير محدد"}
          </span>
        </div>
        <div className={t("components.orders.orderprinttemplate.name.print_info_item")}>
          <span className={t("components.orders.orderprinttemplate.name.print_info_label")}>{t('components.orders.OrderPrintTemplate.تاريخ_الطلب:')}</span>
          <span className={t("components.orders.orderprinttemplate.name.print_info_value")}>
            {order.created_at
              ? format(new Date(order.created_at), "dd/MM/yyyy")
              : "غير محدد"}
          </span>
        </div>
        <div className={t("components.orders.orderprinttemplate.name.print_info_item")}>
          <span className={t("components.orders.orderprinttemplate.name.print_info_label")}>{t('components.orders.OrderPrintTemplate.تاريخ_التسليم_المتوقع:')}</span>
          <span className={t("components.orders.orderprinttemplate.name.print_info_value")}>
            {order.delivery_date
              ? format(new Date(order.delivery_date), "dd/MM/yyyy")
              : "غير محدد"}
          </span>
        </div>
        <div className={t("components.orders.orderprinttemplate.name.print_info_item")}>
          <span className={t("components.orders.orderprinttemplate.name.print_info_label")}>{t('components.orders.OrderPrintTemplate.مدة_التسليم:')}</span>
          <span className={t("components.orders.orderprinttemplate.name.print_info_value")}>
            {order.delivery_days || "غير محدد"} يوم
          </span>
        </div>
        <div className={t("components.orders.orderprinttemplate.name.print_info_item")}>
          <span className={t("components.orders.orderprinttemplate.name.print_info_label")}>{t('components.orders.OrderPrintTemplate.الحالة:')}</span>
          <span className={t("components.orders.orderprinttemplate.name.print_badge_print_badge_info")}>
            {getStatusText(order.status)}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      {customer && (
        <div className={t("components.orders.orderprinttemplate.name.print_section")}>
          <h3 className={t("components.orders.orderprinttemplate.name.print_section_title")}>{t('components.orders.OrderPrintTemplate.معلومات_العميل')}</h3>
          <div className={t("components.orders.orderprinttemplate.name.print_grid_2")}>
            <div>
              <strong>{t('components.orders.OrderPrintTemplate.العنوان:')}</strong> {customer.address || "غير محدد"}
            </div>
            <div>
              <strong>{t('components.orders.OrderPrintTemplate.المدينة:')}</strong> {customer.city || "غير محدد"}
            </div>
            <div>
              <strong>{t('components.orders.OrderPrintTemplate.الهاتف:')}</strong> {customer.phone || "غير محدد"}
            </div>
            <div>
              <strong>{t('components.orders.OrderPrintTemplate.الرقم_الضريبي:')}</strong>{" "}
              {customer.tax_number || "غير محدد"}
            </div>
          </div>
        </div>
      )}

      {/* Production Orders Table */}
      <div className={t("components.orders.orderprinttemplate.name.print_section_avoid_page_break")}>
        <h3 className={t("components.orders.orderprinttemplate.name.print_section_title")}>
          أوامر الإنتاج ({orderProductionOrders.length})
        </h3>
        <table className={t("components.orders.orderprinttemplate.name.print_table")}>
          <thead>
            <tr>
              <th>#</th>
              <th>{t('components.orders.OrderPrintTemplate.رقم_أمر_الإنتاج')}</th>
              <th>{t('components.orders.OrderPrintTemplate.المنتج')}</th>
              <th>{t('components.orders.OrderPrintTemplate.المقاس')}</th>
              <th>{t('components.orders.OrderPrintTemplate.الكمية_(كجم)')}</th>
              <th>{t('components.orders.OrderPrintTemplate.الحالة')}</th>
              <th>{t('components.orders.OrderPrintTemplate.الملاحظات')}</th>
            </tr>
          </thead>
          <tbody>
            {orderProductionOrders.map((po: any, index: number) => {
              const customerProduct = customerProducts.find(
                (cp: any) => cp.id === po.customer_product_id
              );
              const item = items.find(
                (i: any) =>{t('components.orders.OrderPrintTemplate.i.id_===_customerproduct?.item_id_);_return_(')}<tr key={po.id}>
                  <td>{index + 1}</td>
                  <td>{po.production_order_number}</td>
                  <td>{item?.name_ar || item?.name || "غير محدد"}</td>
                  <td>{customerProduct?.size_caption || "غير محدد"}</td>
                  <td>{parseFloat(po.quantity_kg || 0).toFixed(2)}</td>
                  <td>
                    <span className={t("components.orders.orderprinttemplate.name.print_badge_print_badge_info")}>
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
                <strong>{t('components.orders.OrderPrintTemplate.المجموع_الكلي:')}</strong>
              </td>
              <td colSpan={3}>
                <strong>{totalQuantity.toFixed(2)} كجم</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Product Specifications */}
      {orderProductionOrders.length >{t('components.orders.OrderPrintTemplate.0_&&_(')}<div className={t("components.orders.orderprinttemplate.name.print_section_avoid_page_break")}>
          <h3 className={t("components.orders.orderprinttemplate.name.print_section_title")}>{t('components.orders.OrderPrintTemplate.مواصفات_المنتجات')}</h3>
          {orderProductionOrders.map((po: any, index: number) => {
            const customerProduct = customerProducts.find(
              (cp: any) =>{t('components.orders.OrderPrintTemplate.cp.id_===_po.customer_product_id_);_if_(!customerproduct)_return_null;_return_(')}<div
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
                <div className={t("components.orders.orderprinttemplate.name.print_grid_3")}>
                  <div>
                    <strong>{t('components.orders.OrderPrintTemplate.العرض:')}</strong>{" "}
                    {customerProduct.width || "غير محدد"} سم
                  </div>
                  <div>
                    <strong>{t('components.orders.OrderPrintTemplate.الكشة_اليمنى:')}</strong>{" "}
                    {customerProduct.right_facing || "غير محدد"} سم
                  </div>
                  <div>
                    <strong>{t('components.orders.OrderPrintTemplate.الكشة_اليسرى:')}</strong>{" "}
                    {customerProduct.left_facing || "غير محدد"} سم
                  </div>
                  <div>
                    <strong>{t('components.orders.OrderPrintTemplate.السماكة:')}</strong>{" "}
                    {customerProduct.thickness || "غير محدد"} مايكرون
                  </div>
                  <div>
                    <strong>{t('components.orders.OrderPrintTemplate.طول_القص:')}</strong>{" "}
                    {customerProduct.cutting_length_cm || "غير محدد"} سم
                  </div>
                  <div>
                    <strong>{t('components.orders.OrderPrintTemplate.اسطوانة_الطباعة:')}</strong>{" "}
                    {customerProduct.printing_cylinder || "غير محدد"}
                  </div>
                  <div>
                    <strong>{t('components.orders.OrderPrintTemplate.الخامة:')}</strong>{" "}
                    {customerProduct.raw_material || "غير محدد"}
                  </div>
                  <div>
                    <strong>{t('components.orders.OrderPrintTemplate.اللون:')}</strong>{" "}
                    {customerProduct.master_batch_id || "غير محدد"}
                  </div>
                  <div>
                    <strong>{t('components.orders.OrderPrintTemplate.الطباعة:')}</strong>{" "}
                    {customerProduct.is_printed ? "نعم" : "لا"}
                  </div>
                  <div>
                    <strong>{t('components.orders.OrderPrintTemplate.الثقب:')}</strong>{" "}
                    {customerProduct.punching || "غير محدد"}
                  </div>
                  <div>
                    <strong>{t('components.orders.OrderPrintTemplate.وحدة_القطع:')}</strong>{" "}
                    {customerProduct.cutting_unit || "غير محدد"}
                  </div>
                  <div>
                    <strong>{t('components.orders.OrderPrintTemplate.وزن_الوحدة:')}</strong>{" "}
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
        <div className={t("components.orders.orderprinttemplate.name.print_notes_avoid_page_break")}>
          <div className={t("components.orders.orderprinttemplate.name.print_notes_title")}>{t('components.orders.OrderPrintTemplate.ملاحظات_وتعليمات:')}</div>
          <div className={t("components.orders.orderprinttemplate.name.print_notes_content")}>{order.notes}</div>
        </div>
      )}

      {/* Signatures */}
      <div className={t("components.orders.orderprinttemplate.name.print_signatures")}>
        <div className={t("components.orders.orderprinttemplate.name.print_signature")}>
          <div className={t("components.orders.orderprinttemplate.name.print_signature_line")}></div>
          <div className={t("components.orders.orderprinttemplate.name.print_signature_label")}>{t('components.orders.OrderPrintTemplate.المُعد')}</div>
        </div>
        <div className={t("components.orders.orderprinttemplate.name.print_signature")}>
          <div className={t("components.orders.orderprinttemplate.name.print_signature_line")}></div>
          <div className={t("components.orders.orderprinttemplate.name.print_signature_label")}>{t('components.orders.OrderPrintTemplate.المدير_الفني')}</div>
        </div>
        <div className={t("components.orders.orderprinttemplate.name.print_signature")}>
          <div className={t("components.orders.orderprinttemplate.name.print_signature_line")}></div>
          <div className={t("components.orders.orderprinttemplate.name.print_signature_label")}>{t('components.orders.OrderPrintTemplate.الإدارة')}</div>
        </div>
      </div>

      {/* Footer */}
      <div className={t("components.orders.orderprinttemplate.name.print_footer")}>
        <p>
          هذا المستند تم إنشاؤه إلكترونياً بتاريخ{" "}
          {format(new Date(), "dd/MM/yyyy - HH:mm")}
        </p>
        <p>{t('components.orders.OrderPrintTemplate.نظام_إدارة_الإنتاج_-_factory_iq')}</p>
      </div>
    </>
  );
}
