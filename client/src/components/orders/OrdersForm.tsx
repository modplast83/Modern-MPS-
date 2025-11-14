import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Search, Plus, Trash2 } from "lucide-react";
import { formatNumber, formatWeight, formatPercentage } from "../../lib/formatNumber";

// Master batch colors mapping
const masterBatchColors = [
  { id: "PT-111111", name: "WHITE", name_ar: "أبيض", color: "#FFFFFF", textColor: "#000000" },
  { id: "PT-000000", name: "BLACK", name_ar: "أسود", color: "#000000", textColor: "#FFFFFF" },
  { id: "PT-8B0000", name: "DARK_RED", name_ar: "أحمر غامق", color: "#8B0000", textColor: "#FFFFFF" },
  { id: "PT-006400", name: "DARK_GREEN", name_ar: "أخضر غامق", color: "#006400", textColor: "#FFFFFF" },
  { id: "PT-000080", name: "NAVY_BLUE", name_ar: "أزرق بحري", color: "#000080", textColor: "#FFFFFF" },
  { id: "PT-2F4F4F", name: "DARK_GRAY", name_ar: "رمادي غامق", color: "#2F4F4F", textColor: "#FFFFFF" },
  { id: "PT-FF0000", name: "RED", name_ar: "أحمر", color: "#FF0000", textColor: "#FFFFFF" },
  { id: "PT-0000FF", name: "BLUE", name_ar: "أزرق", color: "#0000FF", textColor: "#FFFFFF" },
  { id: "PT-00FF00", name: "GREEN", name_ar: "أخضر", color: "#00FF00", textColor: "#000000" },
  { id: "PT-FFFF00", name: "YELLOW", name_ar: "أصفر", color: "#FFFF00", textColor: "#000000" },
  { id: "PT-FFA500", name: "ORANGE", name_ar: "برتقالي", color: "#FFA500", textColor: "#000000" },
  { id: "PT-800080", name: "PURPLE", name_ar: "بنفسجي", color: "#800080", textColor: "#FFFFFF" },
  { id: "PT-FFC0CB", name: "PINK", name_ar: "وردي", color: "#FFC0CB", textColor: "#000000" },
  { id: "PT-A52A2A", name: "BROWN", name_ar: "بني", color: "#A52A2A", textColor: "#FFFFFF" },
  { id: "PT-C0C0C0", name: "SILVER", name_ar: "فضي", color: "#C0C0C0", textColor: "#000000" },
  { id: "PT-FFD700", name: "GOLD", name_ar: "ذهبي", color: "#FFD700", textColor: "#000000" },
  { id: "PT-E2DCC8", name: "BEIGE", name_ar: "بيج", color: "#E2DCC8", textColor: "#000000" },
  { id: "PT-ADD8E6", name: "LIGHT_BLUE", name_ar: "أزرق فاتح", color: "#ADD8E6", textColor: "#000000" },
  { id: "PT-90EE90", name: "LIGHT_GREEN", name_ar: "أخضر فاتح", color: "#90EE90", textColor: "#000000" },
  { id: "PT-D3D3D3", name: "LIGHT_GRAY", name_ar: "رمادي فاتح", color: "#D3D3D3", textColor: "#000000" },
  { id: "PT-MIX", name: "MIX", name_ar: "مخلوط", color: "#E2DCC8", textColor: "#000000" },
  { id: "PT-CLEAR", name: "CLEAR", name_ar: "شفاف", color: "#E2DCC8", textColor: "#000000" },
];

const getMasterBatchArabicName = (masterBatchId: string, t: any): string => {
  if (!masterBatchId) return t('orders.notSpecified');
  const color = masterBatchColors.find((c) => c.id === masterBatchId);
  return color?.name_ar || masterBatchId;
};

const createOrderFormSchema = (t: any) => z.object({
  customer_id: z.string().min(1, t('orders.validation.customerRequired')),
  delivery_days: z.coerce.number().int().positive().max(365, t('orders.validation.deliveryDaysRange')),
  notes: z.string().optional(),
});

interface OrdersFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, productionOrders: any[]) => void;
  customers: any[];
  customerProducts: any[];
  items: any[];
  editingOrder?: any;
}

type ProdOrderInForm = {
  uid: string;
  id?: number;
  customer_product_id: number | null;
  quantity_kg: number | null;
  overrun_percentage: number;
};

const genUid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `po-${Date.now()}-${Math.random().toString(16).slice(2)}`);

export default function OrdersForm({
  isOpen,
  onClose,
  onSubmit,
  customers,
  customerProducts,
  items,
  editingOrder,
}: OrdersFormProps) {
  const { t } = useTranslation();
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>{t('components.orders.OrdersForm.("");_const_[productionordersinform,_setproductionordersinform]_=_usestate')}<ProdOrderInForm[]>{t('components.orders.OrdersForm.([]);_const_[quantitypreviews,_setquantitypreviews]_=_usestate')}<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderForm = useForm({
    resolver: zodResolver(createOrderFormSchema(t)),
    defaultValues: {
      customer_id: "",
      delivery_days: 15,
      notes: "",
    },
  });

  // Load editing order data when dialog opens for editing
  useEffect(() => {
    const loadEditingOrderData = async () => {
      if (isOpen && editingOrder) {
        // Load order data
        orderForm.reset({
          customer_id: editingOrder.customer_id != null ? String(editingOrder.customer_id) : "",
          delivery_days: editingOrder.delivery_days || 15,
          notes: editingOrder.notes || "",
        });
        setSelectedCustomerId(editingOrder.customer_id != null ? String(editingOrder.customer_id) : "");

        // Load existing production orders for this order
        try {
          const response = await fetch(`/api/production-orders?order_id=${editingOrder.id}`);
          if (response.ok) {
            const data = await response.json();
            const existingProdOrders = data.data || [];

            // Convert existing production orders to form format with stable uid
            const formattedOrders: ProdOrderInForm[] = existingProdOrders.map((po: any) => ({
              uid: po.id ? `po-${po.id}` : genUid(),
              id: po.id,
              customer_product_id: po.customer_product_id ?? null,
              quantity_kg: po.quantity_kg != null ? parseFloat(po.quantity_kg) : null,
              overrun_percentage: po.overrun_percentage != null ? parseFloat(po.overrun_percentage) : 0,
            }));

            setProductionOrdersInForm(formattedOrders);

            // Load previews for existing orders in parallel
            await Promise.all(
              formattedOrders.map((order) =>
                order.customer_product_id && order.quantity_kg && order.quantity_kg > 0
                  ? updateQuantityPreview(order.uid, order.customer_product_id, order.quantity_kg)
                  : Promise.resolve()
              )
            );
          }
        } catch (error) {
          console.error(t('orders.errors.loadProductionOrdersFailed'), error);
          setProductionOrdersInForm([]);
        }
      } else if (isOpen && !editingOrder) {
        // Reset form for new order
        orderForm.reset({
          customer_id: "",
          delivery_days: 15,
          notes: "",
        });
        setSelectedCustomerId("");
        setProductionOrdersInForm([]);
        setQuantityPreviews({});
      }
    };

    loadEditingOrderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingOrder]);

  // Function to preview quantity calculations
  const previewQuantityCalculation = async (customerProductId: number, baseQuantityKg: number) => {
    if (!customerProductId || !baseQuantityKg || baseQuantityKg <= 0) return null;

    try {
      const response = await fetch("/api/production-orders/preview-quantities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_product_id: customerProductId,
          quantity_kg: baseQuantityKg,
        }),
      });

      if (response.ok) return await response.json();
      return null;
    } catch (error) {
      console.error("Error previewing quantity calculation:", error);
      return null;
    }
  };

  // Update quantity preview keyed by uid (not index)
  const updateQuantityPreview = async (uid: string, customerProductId?: number, baseQuantityKg?: number) => {
    const po = productionOrdersInForm.find((x) => x.uid === uid);
    const productId = customerProductId ?? po?.customer_product_id!;
    const quantity = baseQuantityKg ?? po?.quantity_kg!;

    if (productId && quantity && quantity > 0) {
      const preview = await previewQuantityCalculation(productId, quantity);
      if (preview && preview.data) {
        setQuantityPreviews((prev) => ({ ...prev, [uid]: preview.data }));
      }
    } else {
      setQuantityPreviews((prev) => {
        const updated = { ...prev };
        delete updated[uid];
        return updated;
      });
    }
  };

  const addProductionOrder = () => {
    setProductionOrdersInForm((prev) => [
      ...prev,
      {
        uid: genUid(),
        customer_product_id: null,
        quantity_kg: null,
        overrun_percentage: 0,
      },
    ]);
  };

  const removeProductionOrder = (index: number) => {
    setProductionOrdersInForm((prev) => {
      const uid = prev[index]?.uid;
      if (uid) {
        setQuantityPreviews((old) => {
          const copy = { ...old };
          delete copy[uid];
          return copy;
        });
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateProductionOrder = async (index: number, field: keyof ProdOrderInForm | string, value: any) => {
    setProductionOrdersInForm((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    // Update preview when customer_product_id or quantity_kg changes
    const po = productionOrdersInForm[index];
    const uid = po?.uid;
    if (!uid) return;

    if (field === "customer_product_id" || field === "quantity_kg") {
      const productId = field === "customer_product_id" ? value : po?.customer_product_id;
      const quantity = field === "quantity_kg" ? value : po?.quantity_kg;
      if (productId && quantity && quantity > 0) {
        await updateQuantityPreview(uid, productId, quantity);
      } else {
        setQuantityPreviews((prev) => {
          const updated = { ...prev };
          delete updated[uid];
          return updated;
        });
      }
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer: any) => {
    if (!customerSearchTerm) return true;

    const searchLower = customerSearchTerm.toLowerCase();
    return (
      (customer.name || "").toLowerCase().includes(searchLower) ||
      (customer.name_ar || "").toLowerCase().includes(searchLower) ||
      String(customer.id || "").toLowerCase().includes(searchLower)
    );
  });

  // Filter customer products based on selected customer (normalize to string)
  const filteredCustomerProducts = customerProducts.filter((product: any) =>
    selectedCustomerId ? String(product.customer_id) === selectedCustomerId : true
  );

  const handleSubmit = async (data: any) => {
    // منع الإرسال المتعدد
    if (isSubmitting) return;

    // تحقق سريع قبل الإرسال
    if (productionOrdersInForm.length === 0) {
      alert(t('orders.validation.atLeastOneProductionOrder'));
      return;
    }
    for (let i = 0; i < productionOrdersInForm.length; i++) {
      const po = productionOrdersInForm[i];
      if (!po.customer_product_id) {
        alert(t('orders.validation.selectProductForOrder', { number: i + 1 }));
        return;
      }
      if (!(po.quantity_kg && po.quantity_kg > 0)) {
        alert(t('orders.validation.enterQuantityForOrder', { number: i + 1 }));
        return;
      }
    }


    try {
      setIsSubmitting(true);
      await onSubmit(data, productionOrdersInForm);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // عدم السماح بالإغلاق أثناء الإرسال
    if (isSubmitting) return;

    orderForm.reset();
    setProductionOrdersInForm([]);
    setQuantityPreviews({});
    setSelectedCustomerId("");
    setCustomerSearchTerm("");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={t("components.orders.ordersform.name.max_w_3xl_max_h_85vh_overflow_y_auto")}>
        <DialogHeader>
          <DialogTitle className={t("components.orders.ordersform.name.text_xl")}>
            {editingOrder ? t('orders.editOrder') : t('orders.addNewOrder')}
          </DialogTitle>
          <DialogDescription className={t("components.orders.ordersform.name.text_sm")}>
            {editingOrder ? t('orders.editOrderDetails') : t('orders.addNewOrderDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...orderForm}>
          <form onSubmit={orderForm.handleSubmit(handleSubmit)} className={t("components.orders.ordersform.name.space_y_4")}>
            {/* Customer Selection with Search */}
            <FormField
              control={orderForm.control}
              name="{t('components.orders.OrdersForm.name.customer_id')}"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('orders.customer')}</FormLabel>
                  <div className={t("components.orders.ordersform.name.space_y_2")}>
                    <div className={t("components.orders.ordersform.name.relative")}>
                      <Search className={t("components.orders.ordersform.name.absolute_left_3_top_1_2_transform_translate_y_1_2_h_4_w_4_text_gray_400")} />
                      <Input
                        placeholder={t('orders.searchCustomerPlaceholder')}
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        className={t("components.orders.ordersform.name.pl_10")}
                        data-testid="input-search-customers"
                      />
                    </div>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCustomerId(String(value));
                        // Reset production orders when customer changes
                        setProductionOrdersInForm([]);
                        setQuantityPreviews({});
                      }}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-customer">
                          <SelectValue placeholder={t('orders.selectCustomer')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCustomers.map((customer: any) => (
                          <SelectItem key={customer.id} value={String(customer.id)}>
                            {customer.name_ar || customer.name}
                            {customer.name && customer.name_ar ? ` - ${customer.name}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Production Orders Section */}
            <div className={t("components.orders.ordersform.name.border_t_pt_4")}>
              <div className={t("components.orders.ordersform.name.flex_items_center_justify_between_mb_3")}>
                <h3 className={t("components.orders.ordersform.name.text_base_font_semibold")}>{t('orders.productionOrders')}</h3>
                <Button
                  type="button"
                  onClick={addProductionOrder}
                  variant="outline"
                  size="sm"
                  data-testid="button-add-production-order"
                >
                  <Plus className={t("components.orders.ordersform.name.h_4_w_4_mr_2")} />
                  {t('orders.addProductionOrder')}
                </Button>
              </div>

              {productionOrdersInForm.length === 0 && (
                <div className={t("components.orders.ordersform.name.text_center_py_6_text_sm_text_gray_500")}>
                  {t('orders.validation.atLeastOneProductionOrder')}
                </div>
              )}

              <div className={t("components.orders.ordersform.name.space_y_3")}>
                {productionOrdersInForm.map((prodOrder, index) => (
                  <div
                    key={prodOrder.uid}
                    className={t("components.orders.ordersform.name.p_3_border_rounded_lg_bg_gray_50")}
                    data-testid={`production-order-${index}`}
                  >
                    <div className={t("components.orders.ordersform.name.flex_items_center_justify_between_mb_2")}>
                      <h4 className={t("components.orders.ordersform.name.text_sm_font_medium")}>{t('orders.productionOrderNumber', { number: index + 1 })}</h4>
                      <Button
                        type="button"
                        onClick={() => removeProductionOrder(index)}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-remove-production-order-${index}`}
                      >
                        <Trash2 className={t("components.orders.ordersform.name.h_4_w_4_text_red_500")} />
                      </Button>
                    </div>

                    <div className={t("components.orders.ordersform.name.grid_grid_cols_3_gap_3")}>
                      <div className={t("components.orders.ordersform.name.col_span_2")}>
                        <label className={t("components.orders.ordersform.name.text_sm_font_medium_text_gray_700")}>{t('orders.customerProduct')}</label>
                        <Select
                          onValueChange={(value) =>
                            updateProductionOrder(index, "customer_product_id", parseInt(value, 10))
                          }
                          value={prodOrder.customer_product_id?.toString() || ""}
                        >
                          <SelectTrigger className={t("components.orders.ordersform.name.h_auto_min_h_50px_w_full")} data-testid={`select-product-${index}`}>
                            <SelectValue placeholder={t('orders.selectProduct')}>
                              {prodOrder.customer_product_id &&
                                (() => {
                                  const selectedProduct = filteredCustomerProducts.find(
                                    (p: any) => p.id === prodOrder.customer_product_id
                                  );
                                  if (selectedProduct) {
                                    const item = items.find((it: any) => it.id === selectedProduct.item_id);
                                    const parts = [
                                      item?.name_ar || item?.name || t('orders.productNotSpecified'),
                                      selectedProduct.size_caption,
                                      selectedProduct.cutting_length_cm ? `${selectedProduct.cutting_length_cm} ${t('common.cm')}` : null,
                                      selectedProduct.master_batch_id ? getMasterBatchArabicName(selectedProduct.master_batch_id, t) : null,
                                      selectedProduct.raw_material,
                                    ].filter(Boolean);
                                    return <div className={t("components.orders.ordersform.name.text_right_text_sm")}>{parts.join(" - ")}</div>;
                                  }
                                  return t('orders.selectProduct');
                                })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className={t("components.orders.ordersform.name.max_w_750px_w_750px_")}>
                            {filteredCustomerProducts.map((product: any) => (
                              <SelectItem key={product.id} value={String(product.id)} className={t("components.orders.ordersform.name.h_auto_min_h_70px_py_2")}>
                                <div className={t("components.orders.ordersform.name.w_full_text_right_py_1_min_w_650px_")}>
                                  <div className={t("components.orders.ordersform.name.font_semibold_text_gray_900_mb_1_text_sm_leading_relaxed")}>
                                    {(() => {
                                      const item = items.find((it: any) =>{t('components.orders.OrdersForm.it.id_===_product.item_id);_return_(')}<>
                                          <div>{item?.name_ar || item?.name || t('orders.productNotSpecified')}</div>
                                          {product?.size_caption && <div>{product.size_caption}</div>}
                                          {product.cutting_length_cm && <div>{t('orders.cuttingLength')}: {product.cutting_length_cm} {t('common.cm')}</div>}
                                        </>
                                      );
                                    })()}
                                  </div>
                                  <div className={t("components.orders.ordersform.name.grid_grid_cols_2_gap_6_text_sm_text_gray_600")}>
                                    <div className={t("components.orders.ordersform.name.space_y_2")}>
                                      {product.thickness && (
                                        <div className={t("components.orders.ordersform.name.flex_items_center_gap_2")}>
                                          <span className={t("components.orders.ordersform.name.font_medium_text_gray_700")}>{t('orders.thickness')}:</span>
                                          <span className={t("components.orders.ordersform.name.text_blue_600_font_semibold_bg_blue_50_px_2_py_0_5_rounded")}>
                                            {product.thickness} {t('orders.micron')}
                                          </span>
                                        </div>
                                      )}
                                      {product.master_batch_id && (
                                        <div className={t("components.orders.ordersform.name.flex_items_center_gap_2")}>
                                          <span className={t("components.orders.ordersform.name.font_medium_text_gray_700")}>{t('orders.masterBatch')}:</span>
                                          <span className={t("components.orders.ordersform.name.text_purple_600_font_semibold_bg_purple_50_px_2_py_0_5_rounded")}>
                                            {getMasterBatchArabicName(product.master_batch_id, t)}
                                          </span>
                                        </div>
                                      )}
                                      {product.raw_material && (
                                        <div className={t("components.orders.ordersform.name.flex_items_center_gap_2")}>
                                          <span className={t("components.orders.ordersform.name.font_medium_text_gray_700")}>{t('orders.rawMaterial')}:</span>
                                          <span className={t("components.orders.ordersform.name.text_green_600_font_semibold_bg_green_50_px_2_py_0_5_rounded")}>
                                            {product.raw_material}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className={t("components.orders.ordersform.name.space_y_2")}>
                                      {product.width && (
                                        <div>
                                          <span className={t("components.orders.ordersform.name.font_medium_text_gray_700")}>{t('orders.width')}:</span>{" "}
                                          <span className={t("components.orders.ordersform.name.text_orange_600_font_medium")}>{product.width} {t('common.cm')}</span>
                                        </div>
                                      )}
                                      {product.punching && (
                                        <div>
                                          <span className={t("components.orders.ordersform.name.font_medium_text_gray_700")}>{t('orders.punching')}:</span>{" "}
                                          <span className={t("components.orders.ordersform.name.text_teal_600_font_medium")}>{product.punching}</span>
                                        </div>
                                      )}
                                      {product.cutting_unit && (
                                        <div>
                                          <span className={t("components.orders.ordersform.name.font_medium_text_gray_700")}>{t('orders.cuttingUnit')}:</span>{" "}
                                          <span className={t("components.orders.ordersform.name.text_indigo_600_font_medium")}>{product.cutting_unit}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {product.notes && (
                                    <div className={t("components.orders.ordersform.name.mt_2_text_xs_text_gray_500_bg_gray_50_rounded_p_2")}>
                                      <span className={t("components.orders.ordersform.name.font_medium")}>{t('common.notes')}:</span> {product.notes}
                                    </div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className={t("components.orders.ordersform.name.text_sm_font_medium_text_gray_700")}>{t('orders.baseQuantityKg')}</label>
                        <Input
                          type="number"
                          placeholder={t('common.quantity')}
                          value={prodOrder.quantity_kg ?? ""}
                          onChange={(e) => {
                            const num = Number.parseFloat(e.target.value);
                            updateProductionOrder(index, "quantity_kg", Number.isNaN(num) ? null : num);
                          }}
                          className={t("components.orders.ordersform.name.w_full")}
                          data-testid={`input-base-quantity-${index}`}
                        />
                        {quantityPreviews[prodOrder.uid] && (
                          <div className={t("components.orders.ordersform.name.mt_2_p_2_bg_blue_50_rounded_border_border_blue_200")}>
                            <div className={t("components.orders.ordersform.name.text_xs_font_medium_text_blue_800_mb_1")}>{t('orders.preview')}:</div>
                            <div className={t("components.orders.ordersform.name.text_xs_space_y_1")}>
                              <div className={t("components.orders.ordersform.name.text_blue_700")}>
                                <span className={t("components.orders.ordersform.name.font_medium")}>{t('orders.overrunPercentage')}:</span>{" "}
                                {formatPercentage(quantityPreviews[prodOrder.uid].overrun_percentage)}
                              </div>
                              <div className={t("components.orders.ordersform.name.text_blue_700")}>
                                <span className={t("components.orders.ordersform.name.font_medium")}>{t('orders.finalQuantity')}:</span>{" "}
                                {formatWeight(quantityPreviews[prodOrder.uid].final_quantity_kg)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Days & Notes Section */}
            <div className={t("components.orders.ordersform.name.border_t_pt_4")}>
              <div className={t("components.orders.ordersform.name.grid_grid_cols_3_gap_4")}>
                <FormField
                  control={orderForm.control}
                  name="{t('components.orders.OrdersForm.name.delivery_days')}"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('orders.deliveryDays')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          placeholder={t('orders.deliveryDaysPlaceholder')}
                          data-testid="input-delivery-days"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={orderForm.control}
                  name="{t('components.orders.OrdersForm.name.notes')}"
                  render={({ field }) => (
                    <FormItem className={t("components.orders.ordersform.name.col_span_2")}>
                      <FormLabel>{t('common.notes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t('orders.notesPlaceholder')}
                          className={t("components.orders.ordersform.name.min_h_40px_resize_none")}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className={t("components.orders.ordersform.name.flex_justify_end_space_x_2_space_x_reverse_pt_3_border_t")}>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                data-testid="button-cancel"
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-submit">
                {isSubmitting ? t('orders.saving') : editingOrder ? t('orders.updateOrder') : t('orders.saveOrder')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
