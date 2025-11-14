import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Search,
  QrCode,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/use-auth";
import {
  insertConsumablePartSchema,
  insertConsumablePartTransactionSchema,
} from "../../../../shared/schema";

// Extend shared schemas with UI-specific validation rules
const consumablePartSchema = insertConsumablePartSchema.extend({
  current_quantity: z.coerce
    .number()
    .min(0, "الكمية يجب أن تكون صفر أو أكثر")
    .default(0),
  min_quantity: z.coerce.number().min(0).optional(),
  max_quantity: z.coerce.number().min(0).optional(),
});

const barcodeTransactionSchema = insertConsumablePartTransactionSchema
  .extend({
    barcode: z.string().min(1, "الباركود مطلوب"),
    quantity: z.coerce.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
    manual_entry: z.boolean().default(false),
  })
  .omit({ consumable_part_id: true, performed_by: true });

type ConsumablePartFormData = z.infer<typeof consumablePartSchema>{t('components.maintenance.ConsumablePartsTab.;_type_barcodetransactionformdata_=_z.infer')}<typeof barcodeTransactionSchema>;

interface ConsumablePartsTabProps {
  consumableParts?: any[];
  isLoading?: boolean;
}

export default function ConsumablePartsTab({
  consumableParts: propParts,
  isLoading: propLoading,
}: ConsumablePartsTabProps) {
  const { t } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch consumable parts data
  const {
    data: consumableParts,
    isLoading,
    isError: partsError,
  } = useQuery({
    queryKey: ["/api/consumable-parts"],
    enabled: !propParts,
  });

  // Fetch transactions for activity tracking
  const { data: transactions, isError: transactionsError } = useQuery({
    queryKey: ["/api/consumable-parts-transactions"],
  });

  const partsData = (propParts || consumableParts || []) as any[];
  const loading = propLoading || isLoading;

  // Form hooks
  const addForm = useForm<ConsumablePartFormData>({
    resolver: zodResolver(consumablePartSchema),
    defaultValues: {
      code: "",
      type: "",
      status: "active",
      current_quantity: 0,
      unit: "قطعة",
    },
  });

  const editForm = useForm<ConsumablePartFormData>({
    resolver: zodResolver(consumablePartSchema),
  });

  const transactionForm = useForm<BarcodeTransactionFormData>({
    resolver: zodResolver(barcodeTransactionSchema),
    defaultValues: {
      quantity: 1,
      transaction_type: "in",
      manual_entry: true,
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ConsumablePartFormData) =>
      apiRequest("/api/consumable-parts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consumable-parts"] });
      toast({ title: t("toast.successSaved") });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: () => {
      toast({
        title: t("errors.savingError"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<ConsumablePartFormData>;
    }) =>
      apiRequest(`/api/consumable-parts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consumable-parts"] });
      toast({ title: t("toast.successSaved") });
      setIsEditDialogOpen(false);
      setEditingPart(null);
    },
    onError: () => {
      toast({
        title: t("errors.savingError"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/consumable-parts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consumable-parts"] });
      toast({ title: t("toast.successDeleted") });
    },
    onError: () => {
      toast({
        title: t("errors.deletingError"),
        variant: "destructive",
      });
    },
  });

  const transactionMutation = useMutation({
    mutationFn: (data: BarcodeTransactionFormData) => {
      // Ensure user is authenticated
      if (!user?.id) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      // Find the part by barcode first
      const part = partsData.find((p: any) => p.barcode === data.barcode);
      if (!part) {
        throw new Error("لم يتم العثور على قطعة غيار بهذا الباركود");
      }

      return apiRequest("/api/consumable-parts-transactions/barcode", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          consumable_part_id: part.id,
          performed_by: user.id,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consumable-parts"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/consumable-parts-transactions"],
      });
      toast({ title: t("warehouse.movementRecorded") });
      setIsTransactionDialogOpen(false);
      transactionForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: t("errors.savingError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter parts based on search term
  const filteredParts = partsData.filter((part: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      part.code?.toLowerCase().includes(searchLower) ||
      part.type?.toLowerCase().includes(searchLower) ||
      String(part.part_id || "")
        .toLowerCase()
        .includes(searchLower) ||
      part.barcode?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (part: any) => {
    setEditingPart(part);
    editForm.reset({
      code: part.code || "",
      type: part.type || "",
      status: part.status || "active",
      notes: part.notes || "",
      location: part.location || "",
      unit: part.unit || "قطعة",
      current_quantity: part.current_quantity || 0,
      min_quantity: part.min_quantity || undefined,
      max_quantity: part.max_quantity || undefined,
      barcode: part.barcode || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذه القطعة؟")) {
      deleteMutation.mutate(id);
    }
  };

  const onAddSubmit = (data: ConsumablePartFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: ConsumablePartFormData) => {
    if (editingPart) {
      updateMutation.mutate({ id: editingPart.id, data });
    }
  };

  const onTransactionSubmit = (data: BarcodeTransactionFormData) => {
    transactionMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className={t("components.maintenance.consumablepartstab.name.bg_green_100_text_green_800")}>
            {t("common.active")}
          </Badge>{t('components.maintenance.ConsumablePartsTab.);_case_"inactive":_return')}<Badge variant="secondary">{t("common.inactive")}</Badge>{t('components.maintenance.ConsumablePartsTab.;_case_"maintenance":_return')}<Badge variant="destructive">{t("maintenance.maintenance")}</Badge>{t('components.maintenance.ConsumablePartsTab.;_default:_return')}<Badge variant="outline">{status}</Badge>;
    }
  };

  const getQuantityStatus = (current: number, min?: number) => {
    if (min && current <= min) {
      return <span className={t("components.maintenance.consumablepartstab.name.text_red_600_font_semibold")}>{t("warehouse.lowStock")}</span>;
    }
    return <span className={t("components.maintenance.consumablepartstab.name.text_green_600")}>{current}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <div className={t("components.maintenance.consumablepartstab.name.flex_items_center_justify_between")}>
          <CardTitle>{t("maintenance.consumableParts")}</CardTitle>
          <div className={t("components.maintenance.consumablepartstab.name.flex_space_x_2_space_x_reverse")}>
            <div className={t("components.maintenance.consumablepartstab.name.relative")}>
              <Search className={t("components.maintenance.consumablepartstab.name.absolute_left_3_top_1_2_transform_translate_y_1_2_h_4_w_4_text_gray_400")} />
              <Input
                placeholder={t("common.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={t("components.maintenance.consumablepartstab.name.pl_10_w_64")}
                data-testid="input-search"
              />
            </div>

            {/* Barcode Transaction Dialog */}
            <Dialog
              open={isTransactionDialogOpen}
              onOpenChange={setIsTransactionDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className={t("components.maintenance.consumablepartstab.name.bg_blue_50_hover_bg_blue_100")}
                  data-testid="button-barcode"
                >
                  <QrCode className={t("components.maintenance.consumablepartstab.name.h_4_w_4_mr_2")} />
                  {t("warehouse.movementType")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('components.maintenance.ConsumablePartsTab.تسجيل_حركة_باركود')}</DialogTitle>
                  <DialogDescription>{t('components.maintenance.ConsumablePartsTab.قم_بإدخال_الباركود_لتسجيل_حركة_دخول_أو_خروج_قطعة_غيار')}</DialogDescription>
                </DialogHeader>
                <Form {...transactionForm}>
                  <form
                    onSubmit={transactionForm.handleSubmit(onTransactionSubmit)}
                    className={t("components.maintenance.consumablepartstab.name.space_y_4")}
                  >
                    <FormField
                      control={transactionForm.control}
                      name="{t('components.maintenance.ConsumablePartsTab.name.barcode')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('components.maintenance.ConsumablePartsTab.الباركود')}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="{t('components.maintenance.ConsumablePartsTab.placeholder.امسح_أو_أدخل_الباركود')}"
                              data-testid="input-barcode"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className={t("components.maintenance.consumablepartstab.name.grid_grid_cols_2_gap_4")}>
                      <FormField
                        control={transactionForm.control}
                        name="{t('components.maintenance.ConsumablePartsTab.name.transaction_type')}"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('components.maintenance.ConsumablePartsTab.نوع_الحركة')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-transaction-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="in">{t('components.maintenance.ConsumablePartsTab.دخول')}</SelectItem>
                                <SelectItem value="out">{t('components.maintenance.ConsumablePartsTab.خروج')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={transactionForm.control}
                        name="{t('components.maintenance.ConsumablePartsTab.name.quantity')}"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('components.maintenance.ConsumablePartsTab.الكمية')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="1"
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                                data-testid="input-quantity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={transactionForm.control}
                      name="{t('components.maintenance.ConsumablePartsTab.name.transaction_reason')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('components.maintenance.ConsumablePartsTab.سبب_الحركة')}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="{t('components.maintenance.ConsumablePartsTab.placeholder.اختياري_-_سبب_الحركة')}"
                              data-testid="input-reason"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={transactionForm.control}
                      name="{t('components.maintenance.ConsumablePartsTab.name.notes')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('components.maintenance.ConsumablePartsTab.ملاحظات')}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ""}
                              placeholder="{t('components.maintenance.ConsumablePartsTab.placeholder.ملاحظات_إضافية')}"
                              data-testid="textarea-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className={t("components.maintenance.consumablepartstab.name.flex_justify_end_space_x_2_space_x_reverse")}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsTransactionDialogOpen(false)}
                        data-testid="button-cancel-transaction"
                      >{t('components.maintenance.ConsumablePartsTab.إلغاء')}</Button>
                      <Button
                        type="submit"
                        disabled={transactionMutation.isPending}
                        data-testid="button-submit-transaction"
                      >
                        {transactionMutation.isPending
                          ? "جاري التسجيل..."
                          : "تسجيل الحركة"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Add Consumable Part Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className={t("components.maintenance.consumablepartstab.name.bg_green_600_hover_bg_green_700_text_white")}
                  data-testid="button-add"
                >
                  <Plus className={t("components.maintenance.consumablepartstab.name.h_4_w_4_mr_2")} />
                  {t("maintenance.addSparePart")}
                </Button>
              </DialogTrigger>
              <DialogContent className={t("components.maintenance.consumablepartstab.name.max_w_2xl")}>
                <DialogHeader>
                  <DialogTitle>{t('components.maintenance.ConsumablePartsTab.إضافة_قطعة_غيار_استهلاكية_جديدة')}</DialogTitle>
                  <DialogDescription>{t('components.maintenance.ConsumablePartsTab.إضافة_قطعة_غيار_استهلاكية_جديدة_إلى_النظام_مع_تحديد_المواصفات_والكميات')}</DialogDescription>
                </DialogHeader>
                <Form {...addForm}>
                  <form
                    onSubmit={addForm.handleSubmit(onAddSubmit)}
                    className={t("components.maintenance.consumablepartstab.name.space_y_4")}
                  >
                    <div className={t("components.maintenance.consumablepartstab.name.grid_grid_cols_2_gap_4")}>
                      <FormField
                        control={addForm.control}
                        name="{t('components.maintenance.ConsumablePartsTab.name.code')}"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('components.maintenance.ConsumablePartsTab.الكود')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="{t('components.maintenance.ConsumablePartsTab.placeholder.كود_قطعة_الغيار')}"
                                data-testid="input-code"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="{t('components.maintenance.ConsumablePartsTab.name.type')}"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('components.maintenance.ConsumablePartsTab.النوع')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="{t('components.maintenance.ConsumablePartsTab.placeholder.نوع_قطعة_الغيار')}"
                                data-testid="input-type"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className={t("components.maintenance.consumablepartstab.name.grid_grid_cols_2_gap_4")}>
                      <FormField
                        control={addForm.control}
                        name="{t('components.maintenance.ConsumablePartsTab.name.barcode')}"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('components.maintenance.ConsumablePartsTab.الباركود')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="{t('components.maintenance.ConsumablePartsTab.placeholder.الباركود_(اختياري)')}"
                                data-testid="input-barcode-add"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="{t('components.maintenance.ConsumablePartsTab.name.location')}"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('components.maintenance.ConsumablePartsTab.الموقع')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="{t('components.maintenance.ConsumablePartsTab.placeholder.موقع_التخزين')}"
                                data-testid="input-location"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className={t("components.maintenance.consumablepartstab.name.grid_grid_cols_3_gap_4")}>
                      <FormField
                        control={addForm.control}
                        name="{t('components.maintenance.ConsumablePartsTab.name.current_quantity')}"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('components.maintenance.ConsumablePartsTab.الكمية_الحالية')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                                data-testid="input-current-quantity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="{t('components.maintenance.ConsumablePartsTab.name.min_quantity')}"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('components.maintenance.ConsumablePartsTab.الحد_الأدنى')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  )
                                }
                                data-testid="input-min-quantity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="{t('components.maintenance.ConsumablePartsTab.name.max_quantity')}"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('components.maintenance.ConsumablePartsTab.الحد_الأقصى')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  )
                                }
                                data-testid="input-max-quantity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className={t("components.maintenance.consumablepartstab.name.grid_grid_cols_2_gap_4")}>
                      <FormField
                        control={addForm.control}
                        name="{t('components.maintenance.ConsumablePartsTab.name.unit')}"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('components.maintenance.ConsumablePartsTab.الوحدة')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? undefined}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-unit">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="قطعة">{t('components.maintenance.ConsumablePartsTab.قطعة')}</SelectItem>
                                <SelectItem value="كيلو">{t('components.maintenance.ConsumablePartsTab.كيلو')}</SelectItem>
                                <SelectItem value="متر">{t('components.maintenance.ConsumablePartsTab.متر')}</SelectItem>
                                <SelectItem value="ليتر">{t('components.maintenance.ConsumablePartsTab.ليتر')}</SelectItem>
                                <SelectItem value="علبة">{t('components.maintenance.ConsumablePartsTab.علبة')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="{t('components.maintenance.ConsumablePartsTab.name.status')}"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('components.maintenance.ConsumablePartsTab.الحالة')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? undefined}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">{t('components.maintenance.ConsumablePartsTab.نشط')}</SelectItem>
                                <SelectItem value="inactive">{t('components.maintenance.ConsumablePartsTab.غير_نشط')}</SelectItem>
                                <SelectItem value="maintenance">{t('components.maintenance.ConsumablePartsTab.صيانة')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={addForm.control}
                      name="{t('components.maintenance.ConsumablePartsTab.name.notes')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('components.maintenance.ConsumablePartsTab.ملاحظات')}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ""}
                              placeholder="{t('components.maintenance.ConsumablePartsTab.placeholder.ملاحظات_إضافية')}"
                              data-testid="textarea-notes-add"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className={t("components.maintenance.consumablepartstab.name.flex_justify_end_space_x_2_space_x_reverse")}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        data-testid="button-cancel-add"
                      >{t('components.maintenance.ConsumablePartsTab.إلغاء')}</Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                        data-testid="button-submit-add"
                      >
                        {createMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className={t("components.maintenance.consumablepartstab.name.text_center_py_8")} data-testid="loading-state">{t('components.maintenance.ConsumablePartsTab.جاري_التحميل...')}</div>{t('components.maintenance.ConsumablePartsTab.)_:_partserror_?_(')}<div
            className={t("components.maintenance.consumablepartstab.name.text_center_py_8_text_red_600")}
            data-testid="error-state"
          >
            <AlertTriangle className={t("components.maintenance.consumablepartstab.name.h_12_w_12_mx_auto_mb_4")} />
            <p>{t('components.maintenance.ConsumablePartsTab.فشل_في_تحميل_قطع_الغيار_الاستهلاكية')}</p>
          </div>{t('components.maintenance.ConsumablePartsTab.)_:_(')}<div className={t("components.maintenance.consumablepartstab.name.overflow_x_auto")}>
            <table className={t("components.maintenance.consumablepartstab.name.min_w_full_divide_y_divide_gray_200")}>
              <thead className={t("components.maintenance.consumablepartstab.name.bg_gray_50")}>
                <tr>
                  <th className={t("components.maintenance.consumablepartstab.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>{t('components.maintenance.ConsumablePartsTab.معرف_القطعة')}</th>
                  <th className={t("components.maintenance.consumablepartstab.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>{t('components.maintenance.ConsumablePartsTab.الكود')}</th>
                  <th className={t("components.maintenance.consumablepartstab.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>{t('components.maintenance.ConsumablePartsTab.النوع')}</th>
                  <th className={t("components.maintenance.consumablepartstab.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>{t('components.maintenance.ConsumablePartsTab.الكمية')}</th>
                  <th className={t("components.maintenance.consumablepartstab.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>{t('components.maintenance.ConsumablePartsTab.الحالة')}</th>
                  <th className={t("components.maintenance.consumablepartstab.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>{t('components.maintenance.ConsumablePartsTab.الباركود')}</th>
                  <th className={t("components.maintenance.consumablepartstab.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>{t('components.maintenance.ConsumablePartsTab.العمليات')}</th>
                </tr>
              </thead>
              <tbody className={t("components.maintenance.consumablepartstab.name.bg_white_divide_y_divide_gray_200")}>
                {filteredParts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className={t("components.maintenance.consumablepartstab.name.px_6_py_8_text_center_text_gray_500")}
                      data-testid="empty-state"
                    >
                      {searchTerm
                        ? "لا توجد نتائج للبحث"
                        : "لا توجد قطع غيار استهلاكية"}
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((part: any) => (
                    <tr
                      key={part.id}
                      className={t("components.maintenance.consumablepartstab.name.hover_bg_gray_50")}
                      data-testid={`row-part-${part.id}`}
                    >
                      <td
                        className={t("components.maintenance.consumablepartstab.name.px_6_py_4_text_sm_font_medium_text_gray_900")}
                        data-testid={`text-part-id-${part.id}`}
                      >
                        {part.part_id}
                      </td>
                      <td
                        className={t("components.maintenance.consumablepartstab.name.px_6_py_4_text_sm_text_gray_900")}
                        data-testid={`text-code-${part.id}`}
                      >
                        {part.code}
                      </td>
                      <td
                        className={t("components.maintenance.consumablepartstab.name.px_6_py_4_text_sm_text_gray_900")}
                        data-testid={`text-type-${part.id}`}
                      >
                        {part.type}
                      </td>
                      <td
                        className={t("components.maintenance.consumablepartstab.name.px_6_py_4_text_sm")}
                        data-testid={`text-quantity-${part.id}`}
                      >
                        {getQuantityStatus(
                          part.current_quantity,
                          part.min_quantity,
                        )}{" "}
                        {part.unit}
                      </td>
                      <td
                        className={t("components.maintenance.consumablepartstab.name.px_6_py_4")}
                        data-testid={`badge-status-${part.id}`}
                      >
                        {getStatusBadge(part.status)}
                      </td>
                      <td
                        className={t("components.maintenance.consumablepartstab.name.px_6_py_4_text_sm_text_gray_500")}
                        data-testid={`text-barcode-${part.id}`}
                      >
                        {part.barcode || "-"}
                      </td>
                      <td className={t("components.maintenance.consumablepartstab.name.px_6_py_4")}>
                        <div className={t("components.maintenance.consumablepartstab.name.flex_space_x_2_space_x_reverse")}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(part)}
                            data-testid={`button-edit-${part.id}`}
                          >
                            <Edit className={t("components.maintenance.consumablepartstab.name.h_3_w_3")} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(part.id)}
                            className={t("components.maintenance.consumablepartstab.name.text_red_600_hover_text_red_700")}
                            data-testid={`button-delete-${part.id}`}
                          >
                            <Trash2 className={t("components.maintenance.consumablepartstab.name.h_3_w_3")} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className={t("components.maintenance.consumablepartstab.name.max_w_2xl")}>
            <DialogHeader>
              <DialogTitle>{t('components.maintenance.ConsumablePartsTab.تعديل_قطعة_الغيار_الاستهلاكية')}</DialogTitle>
              <DialogDescription>{t('components.maintenance.ConsumablePartsTab.تعديل_بيانات_وتفاصيل_قطعة_الغيار_الاستهلاكية_المحددة')}</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className={t("components.maintenance.consumablepartstab.name.space_y_4")}
              >
                {/* Same form fields as add form but using editForm */}
                <div className={t("components.maintenance.consumablepartstab.name.grid_grid_cols_2_gap_4")}>
                  <FormField
                    control={editForm.control}
                    name="{t('components.maintenance.ConsumablePartsTab.name.code')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('components.maintenance.ConsumablePartsTab.الكود')}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="{t('components.maintenance.ConsumablePartsTab.name.type')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('components.maintenance.ConsumablePartsTab.النوع')}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-type" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className={t("components.maintenance.consumablepartstab.name.grid_grid_cols_2_gap_4")}>
                  <FormField
                    control={editForm.control}
                    name="{t('components.maintenance.ConsumablePartsTab.name.barcode')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('components.maintenance.ConsumablePartsTab.الباركود')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            data-testid="input-edit-barcode"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="{t('components.maintenance.ConsumablePartsTab.name.location')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('components.maintenance.ConsumablePartsTab.الموقع')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            data-testid="input-edit-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className={t("components.maintenance.consumablepartstab.name.grid_grid_cols_3_gap_4")}>
                  <FormField
                    control={editForm.control}
                    name="{t('components.maintenance.ConsumablePartsTab.name.current_quantity')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('components.maintenance.ConsumablePartsTab.الكمية_الحالية')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                            data-testid="input-edit-current-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="{t('components.maintenance.ConsumablePartsTab.name.min_quantity')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('components.maintenance.ConsumablePartsTab.الحد_الأدنى')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              )
                            }
                            data-testid="input-edit-min-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="{t('components.maintenance.ConsumablePartsTab.name.max_quantity')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('components.maintenance.ConsumablePartsTab.الحد_الأقصى')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              )
                            }
                            data-testid="input-edit-max-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className={t("components.maintenance.consumablepartstab.name.grid_grid_cols_2_gap_4")}>
                  <FormField
                    control={editForm.control}
                    name="{t('components.maintenance.ConsumablePartsTab.name.unit')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('components.maintenance.ConsumablePartsTab.الوحدة')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-unit">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="قطعة">{t('components.maintenance.ConsumablePartsTab.قطعة')}</SelectItem>
                            <SelectItem value="كيلو">{t('components.maintenance.ConsumablePartsTab.كيلو')}</SelectItem>
                            <SelectItem value="متر">{t('components.maintenance.ConsumablePartsTab.متر')}</SelectItem>
                            <SelectItem value="ليتر">{t('components.maintenance.ConsumablePartsTab.ليتر')}</SelectItem>
                            <SelectItem value="علبة">{t('components.maintenance.ConsumablePartsTab.علبة')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="{t('components.maintenance.ConsumablePartsTab.name.status')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('components.maintenance.ConsumablePartsTab.الحالة')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">{t('components.maintenance.ConsumablePartsTab.نشط')}</SelectItem>
                            <SelectItem value="inactive">{t('components.maintenance.ConsumablePartsTab.غير_نشط')}</SelectItem>
                            <SelectItem value="maintenance">{t('components.maintenance.ConsumablePartsTab.صيانة')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="{t('components.maintenance.ConsumablePartsTab.name.notes')}"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('components.maintenance.ConsumablePartsTab.ملاحظات')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          data-testid="textarea-edit-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className={t("components.maintenance.consumablepartstab.name.flex_justify_end_space_x_2_space_x_reverse")}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    data-testid="button-cancel-edit"
                  >{t('components.maintenance.ConsumablePartsTab.إلغاء')}</Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-submit-edit"
                  >
                    {updateMutation.isPending
                      ? "جاري الحفظ..."
                      : "حفظ التغييرات"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
