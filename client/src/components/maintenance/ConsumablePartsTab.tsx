import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

type ConsumablePartFormData = z.infer<typeof consumablePartSchema>;
type BarcodeTransactionFormData = z.infer<typeof barcodeTransactionSchema>;

interface ConsumablePartsTabProps {
  consumableParts?: any[];
  isLoading?: boolean;
}

export default function ConsumablePartsTab({
  consumableParts: propParts,
  isLoading: propLoading,
}: ConsumablePartsTabProps) {
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
      toast({ title: "تم إضافة قطعة الغيار الاستهلاكية بنجاح" });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: () => {
      toast({
        title: "فشل في إضافة قطعة الغيار الاستهلاكية",
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
      toast({ title: "تم تحديث قطعة الغيار الاستهلاكية بنجاح" });
      setIsEditDialogOpen(false);
      setEditingPart(null);
    },
    onError: () => {
      toast({
        title: "فشل في تحديث قطعة الغيار الاستهلاكية",
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
      toast({ title: "تم حذف قطعة الغيار الاستهلاكية بنجاح" });
    },
    onError: () => {
      toast({
        title: "فشل في حذف قطعة الغيار الاستهلاكية",
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
      toast({ title: "تم تسجيل الحركة بنجاح" });
      setIsTransactionDialogOpen(false);
      transactionForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "فشل في تسجيل الحركة",
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
          <Badge variant="default" className="bg-green-100 text-green-800">
            نشط
          </Badge>
        );
      case "inactive":
        return <Badge variant="secondary">غير نشط</Badge>;
      case "maintenance":
        return <Badge variant="destructive">صيانة</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getQuantityStatus = (current: number, min?: number) => {
    if (min && current <= min) {
      return <span className="text-red-600 font-semibold">منخفض</span>;
    }
    return <span className="text-green-600">{current}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>قطع الغيار الاستهلاكية</CardTitle>
          <div className="flex space-x-2 space-x-reverse">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في قطع الغيار..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
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
                  className="bg-blue-50 hover:bg-blue-100"
                  data-testid="button-barcode"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  حركة باركود
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>تسجيل حركة باركود</DialogTitle>
                  <DialogDescription>
                    قم بإدخال الباركود لتسجيل حركة دخول أو خروج قطعة غيار
                  </DialogDescription>
                </DialogHeader>
                <Form {...transactionForm}>
                  <form
                    onSubmit={transactionForm.handleSubmit(onTransactionSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={transactionForm.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الباركود</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="امسح أو أدخل الباركود"
                              data-testid="input-barcode"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={transactionForm.control}
                        name="transaction_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نوع الحركة</FormLabel>
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
                                <SelectItem value="in">دخول</SelectItem>
                                <SelectItem value="out">خروج</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={transactionForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الكمية</FormLabel>
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
                      name="transaction_reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>سبب الحركة</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="اختياري - سبب الحركة"
                              data-testid="input-reason"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={transactionForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ""}
                              placeholder="ملاحظات إضافية"
                              data-testid="textarea-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 space-x-reverse">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsTransactionDialogOpen(false)}
                        data-testid="button-cancel-transaction"
                      >
                        إلغاء
                      </Button>
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
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-add"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة قطعة غيار
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>إضافة قطعة غيار استهلاكية جديدة</DialogTitle>
                  <DialogDescription>
                    إضافة قطعة غيار استهلاكية جديدة إلى النظام مع تحديد
                    المواصفات والكميات
                  </DialogDescription>
                </DialogHeader>
                <Form {...addForm}>
                  <form
                    onSubmit={addForm.handleSubmit(onAddSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الكود</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="كود قطعة الغيار"
                                data-testid="input-code"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>النوع</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="نوع قطعة الغيار"
                                data-testid="input-type"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="barcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الباركود</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="الباركود (اختياري)"
                                data-testid="input-barcode-add"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الموقع</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="موقع التخزين"
                                data-testid="input-location"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={addForm.control}
                        name="current_quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الكمية الحالية</FormLabel>
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
                        name="min_quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الحد الأدنى</FormLabel>
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
                        name="max_quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الحد الأقصى</FormLabel>
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الوحدة</FormLabel>
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
                                <SelectItem value="قطعة">قطعة</SelectItem>
                                <SelectItem value="كيلو">كيلو</SelectItem>
                                <SelectItem value="متر">متر</SelectItem>
                                <SelectItem value="ليتر">ليتر</SelectItem>
                                <SelectItem value="علبة">علبة</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الحالة</FormLabel>
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
                                <SelectItem value="active">نشط</SelectItem>
                                <SelectItem value="inactive">
                                  غير نشط
                                </SelectItem>
                                <SelectItem value="maintenance">
                                  صيانة
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={addForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ""}
                              placeholder="ملاحظات إضافية"
                              data-testid="textarea-notes-add"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 space-x-reverse">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        data-testid="button-cancel-add"
                      >
                        إلغاء
                      </Button>
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
          <div className="text-center py-8" data-testid="loading-state">
            جاري التحميل...
          </div>
        ) : partsError ? (
          <div
            className="text-center py-8 text-red-600"
            data-testid="error-state"
          >
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>فشل في تحميل قطع الغيار الاستهلاكية</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    معرف القطعة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    الكود
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    النوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    الكمية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    الباركود
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    العمليات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
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
                      className="hover:bg-gray-50"
                      data-testid={`row-part-${part.id}`}
                    >
                      <td
                        className="px-6 py-4 text-sm font-medium text-gray-900"
                        data-testid={`text-part-id-${part.id}`}
                      >
                        {part.part_id}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-900"
                        data-testid={`text-code-${part.id}`}
                      >
                        {part.code}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-900"
                        data-testid={`text-type-${part.id}`}
                      >
                        {part.type}
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        data-testid={`text-quantity-${part.id}`}
                      >
                        {getQuantityStatus(
                          part.current_quantity,
                          part.min_quantity,
                        )}{" "}
                        {part.unit}
                      </td>
                      <td
                        className="px-6 py-4"
                        data-testid={`badge-status-${part.id}`}
                      >
                        {getStatusBadge(part.status)}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-500"
                        data-testid={`text-barcode-${part.id}`}
                      >
                        {part.barcode || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(part)}
                            data-testid={`button-edit-${part.id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(part.id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-${part.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تعديل قطعة الغيار الاستهلاكية</DialogTitle>
              <DialogDescription>
                تعديل بيانات وتفاصيل قطعة الغيار الاستهلاكية المحددة
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="space-y-4"
              >
                {/* Same form fields as add form but using editForm */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الكود</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>النوع</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-type" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الباركود</FormLabel>
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
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الموقع</FormLabel>
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

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={editForm.control}
                    name="current_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الكمية الحالية</FormLabel>
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
                    name="min_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحد الأدنى</FormLabel>
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
                    name="max_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحد الأقصى</FormLabel>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوحدة</FormLabel>
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
                            <SelectItem value="قطعة">قطعة</SelectItem>
                            <SelectItem value="كيلو">كيلو</SelectItem>
                            <SelectItem value="متر">متر</SelectItem>
                            <SelectItem value="ليتر">ليتر</SelectItem>
                            <SelectItem value="علبة">علبة</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحالة</FormLabel>
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
                            <SelectItem value="active">نشط</SelectItem>
                            <SelectItem value="inactive">غير نشط</SelectItem>
                            <SelectItem value="maintenance">صيانة</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات</FormLabel>
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

                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    data-testid="button-cancel-edit"
                  >
                    إلغاء
                  </Button>
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
