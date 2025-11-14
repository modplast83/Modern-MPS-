import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Truck,
  Factory,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Hash,
  ShoppingCart,
  Scale,
  FileText,
  User,
} from "lucide-react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { useTranslation } from "react-i18next";

const inventoryFormSchema = z.object({
  material_group_id: z.string().min(1, "warehouse.materialGroupRequired"),
  item_id: z.string().min(1, "warehouse.itemRequired"),
  location_id: z.string().transform((val) => parseInt(val)),
  current_stock: z.string().transform((val) => parseFloat(val)),
  unit: z.string().min(1, "warehouse.unitRequired"),
});

const locationFormSchema = z.object({
  name: z.string().min(1, "warehouse.locationNameEn"),
  name_ar: z.string().min(1, "warehouse.locationNameAr"),
  coordinates: z.string().optional(),
  tolerance_range: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
});

const movementFormSchema = z.object({
  inventory_id: z.string().transform((val) => parseInt(val)),
  movement_type: z.string().min(1, "warehouse.movementTypeRequired"),
  quantity: z.string().transform((val) => parseFloat(val)),
  reference_number: z.string().optional(),
  reference_type: z.string().optional(),
  notes: z.string().optional(),
});

export default function Warehouse() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>{t('pages.warehouse.(null);_const_[editinglocation,_seteditinglocation]_=_usestate')}<any>{t('pages.warehouse.(null);_const_[editingmovement,_seteditingmovement]_=_usestate')}<any>{t('pages.warehouse.(null);_const_[activelocationtab,_setactivelocationtab]_=_usestate')}<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch inventory data
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const response = await fetch("/api/inventory");
      if (!response.ok) throw new Error(t("warehouse.fetchInventoryError"));
      return response.json();
    },
  });

  // Fetch inventory stats
  const { data: stats } = useQuery({
    queryKey: ["/api/inventory/stats"],
    queryFn: async () => {
      const response = await fetch("/api/inventory/stats");
      if (!response.ok) throw new Error(t("warehouse.fetchStatsError"));
      return response.json();
    },
  });

  // Fetch all items initially
  const { data: allItems = [] } = useQuery({
    queryKey: ["/api/items"],
    queryFn: async () => {
      const response = await fetch("/api/items");
      if (!response.ok) throw new Error(t("warehouse.fetchItemsError"));
      return response.json();
    },
  });

  // Fetch locations for dropdown
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const response = await fetch("/api/locations");
      if (!response.ok) throw new Error(t("warehouse.fetchLocationsError"));
      return response.json();
    },
  });

  // Fetch material groups for dropdown
  const { data: materialGroups = [] } = useQuery({
    queryKey: ["/api/material-groups"],
    queryFn: async () => {
      const response = await fetch("/api/material-groups");
      if (!response.ok) throw new Error(t("warehouse.fetchMaterialGroupsError"));
      return response.json();
    },
  });

  // Fetch inventory movements
  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ["/api/inventory-movements"],
    queryFn: async () => {
      const response = await fetch("/api/inventory-movements");
      if (!response.ok) throw new Error(t("warehouse.fetchMovementsError"));
      return response.json();
    },
  });

  // Add/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingItem
        ? `/api/inventory/${editingItem.id}`
        : "/api/inventory";
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(t("common.error"));
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
      setIsAddDialogOpen(false);
      setEditingItem(null);
      toast({
        title: t("common.success"),
        description: editingItem
          ? t("warehouse.inventoryUpdated")
          : t("warehouse.inventoryUpdated"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(t("common.error"));
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
      toast({
        title: t("common.success"),
        description: t("warehouse.inventoryUpdated"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    },
  });

  // Location mutations
  const locationMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingLocation
        ? `/api/locations/${editingLocation.id}`
        : "/api/locations";
      const method = editingLocation ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(t("common.error"));
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setIsLocationDialogOpen(false);
      setEditingLocation(null);
      toast({
        title: t("common.success"),
        description: t("warehouse.locationSaved"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(t("common.error"));
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: t("common.success"),
        description: t("warehouse.locationSaved"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    },
  });

  // Movement mutations
  const movementMutation = useMutation({
    mutationFn: async (data: any) => {
      // Ensure user is authenticated
      if (!user?.id) {
        throw new Error(t("common.error"));
      }

      const response = await fetch("/api/inventory-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, created_by: user.id }),
      });

      if (!response.ok) throw new Error(t("common.error"));
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stats"] });
      setIsMovementDialogOpen(false);
      toast({
        title: t("common.success"),
        description: t("warehouse.movementRecorded"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    },
  });

  const deleteMovementMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/inventory-movements/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(t("common.error"));
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-movements"] });
      toast({
        title: t("common.success"),
        description: t("common.delete"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      material_group_id: "",
      item_id: "",
      location_id: "",
      current_stock: "",
      unit: "كيلو",
    },
  });

  const locationForm = useForm({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      name_ar: "",
      coordinates: "",
      tolerance_range: "",
    },
  });

  const movementForm = useForm({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      inventory_id: "",
      movement_type: "",
      quantity: "",
      reference_number: "",
      reference_type: "",
      notes: "",
    },
  });

  // Watch for material group selection to filter items
  const selectedMaterialGroupId = form.watch("material_group_id");

  // Set default active location tab when locations are available - prioritize locations with inventory
  useEffect(() => {
    if (
      locations.length > 0 &&
      inventoryItems.length > 0 &&
      !activeLocationTab
    ) {
      // Find a location that has inventory items
      const locationWithInventory = locations.find((location: any) =>
        inventoryItems.some(
          (item: any) =>
            item.location_id?.toString() === location.id?.toString(),
        ),
      );

      if (locationWithInventory) {
        setActiveLocationTab(locationWithInventory.id?.toString() || "");
      } else {
        // Fall back to first location if no inventory items found
        setActiveLocationTab(locations[0].id?.toString() || "");
      }
    }
  }, [locations, inventoryItems, activeLocationTab]);

  // Filter items based on selected material group
  const filteredItemsByGroup = allItems.filter(
    (item: any) =>
      !selectedMaterialGroupId || item.category_id === selectedMaterialGroupId,
  );

  // Filter inventory by location for current tab
  const getInventoryByLocation = (locationId: string) => {
    return inventoryItems.filter(
      (item: any) =>
        item.location_id?.toString() === locationId &&
        ((item.item_name_ar || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          (item.item_code || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (item.category_name_ar || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())),
    );
  };

  // Original filtered items for other tabs that need all inventory
  const filteredItems = inventoryItems.filter(
    (item: any) =>
      (item.item_name_ar || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (item.item_code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category_name_ar || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.reset({
      material_group_id: item.material_group_id?.toString() || "",
      item_id: item.item_id,
      location_id: item.location_id?.toString() || "",
      current_stock: item.current_stock?.toString() || "0",
      unit: item.unit || "كيلو",
    });
    setIsAddDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.reset({
      material_group_id: "",
      item_id: "",
      location_id: "",
      current_stock: "",
      unit: "كيلو",
    });
    setIsAddDialogOpen(true);
  };

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const onLocationSubmit = (data: any) => {
    locationMutation.mutate(data);
  };

  const onMovementSubmit = (data: any) => {
    // Convert numeric fields to strings for decimal schema validation
    const formattedData = {
      ...data,
      quantity: data.quantity?.toString() || "0",
      inventory_id: parseInt(data.inventory_id),
    };
    movementMutation.mutate(formattedData);
  };

  const handleAddLocation = () => {
    setEditingLocation(null);
    locationForm.reset({
      name: "",
      name_ar: "",
      coordinates: "",
      tolerance_range: "",
    });
    setIsLocationDialogOpen(true);
  };

  const handleEditLocation = (location: any) => {
    setEditingLocation(location);
    locationForm.reset({
      name: location.name || "",
      name_ar: location.name_ar || "",
      coordinates: location.coordinates || "",
      tolerance_range: location.tolerance_range?.toString() || "",
    });
    setIsLocationDialogOpen(true);
  };

  const handleAddMovement = () => {
    setEditingMovement(null);
    movementForm.reset({
      inventory_id: "",
      movement_type: "",
      quantity: "",
      reference_number: "",
      reference_type: "",
      notes: "",
    });
    setIsMovementDialogOpen(true);
  };

  return (
    <div className={t("pages.warehouse.name.min_h_screen_bg_gray_50")}>
      <Header />
      <div className={t("pages.warehouse.name.flex")}>
        <Sidebar />
        <main className={t("pages.warehouse.name.flex_1_lg_mr_64_p_6")}>
          <div className={t("pages.warehouse.name.mb_6")}>
            <h1 className={t("pages.warehouse.name.text_2xl_font_bold_text_gray_900_mb_2")}>
              {t("warehouse.title")}
            </h1>
            <p className={t("pages.warehouse.name.text_gray_600")}>
              {t("sidebar.warehouse")}
            </p>
          </div>

          {/* Statistics Cards */}
          <div className={t("pages.warehouse.name.grid_grid_cols_1_md_grid_cols_4_gap_6_mb_6")}>
            <Card>
              <CardHeader className={t("pages.warehouse.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
                <CardTitle className={t("pages.warehouse.name.text_sm_font_medium")}>
                  {t("warehouse.totalItems")}
                </CardTitle>
                <Package className={t("pages.warehouse.name.h_4_w_4_text_muted_foreground")} />
              </CardHeader>
              <CardContent>
                <div className={t("pages.warehouse.name.text_2xl_font_bold")}>
                  {stats?.totalItems || 0}
                </div>
                <p className={t("pages.warehouse.name.text_xs_text_muted_foreground")}>{t("common.active")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={t("pages.warehouse.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
                <CardTitle className={t("pages.warehouse.name.text_sm_font_medium")}>
                  {t("warehouse.lowStockItems")}
                </CardTitle>
                <AlertTriangle className={t("pages.warehouse.name.h_4_w_4_text_destructive")} />
              </CardHeader>
              <CardContent>
                <div className={t("pages.warehouse.name.text_2xl_font_bold_text_destructive")}>
                  {stats?.lowStockItems || 0}
                </div>
                <p className={t("pages.warehouse.name.text_xs_text_muted_foreground")}>
                  {t("warehouse.reorderNeeded")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={t("pages.warehouse.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
                <CardTitle className={t("pages.warehouse.name.text_sm_font_medium")}>
                  {t("warehouse.totalValue")}
                </CardTitle>
                <TrendingUp className={t("pages.warehouse.name.h_4_w_4_text_green_600")} />
              </CardHeader>
              <CardContent>
                <div className={t("pages.warehouse.name.text_2xl_font_bold")}>
                  {stats?.totalValue
                    ? `${Number(stats.totalValue).toLocaleString()} ر.س`
                    : "0 ر.س"}
                </div>
                <p className={t("pages.warehouse.name.text_xs_text_muted_foreground")}>
                  {t("common.total")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={t("pages.warehouse.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
                <CardTitle className={t("pages.warehouse.name.text_sm_font_medium")}>
                  {t("warehouse.movements")}
                </CardTitle>
                <TrendingDown className={t("pages.warehouse.name.h_4_w_4_text_blue_600")} />
              </CardHeader>
              <CardContent>
                <div className={t("pages.warehouse.name.text_2xl_font_bold")}>
                  {stats?.movementsToday || 0}
                </div>
                <p className={t("pages.warehouse.name.text_xs_text_muted_foreground")}>
                  {t("dashboard.today")}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs
            defaultValue={activeLocationTab || "production-hall"}
            className={t("pages.warehouse.name.space_y_4")}
          >
            <TabsList className={t("pages.warehouse.name.flex_flex_wrap_w_full_justify_start")}>
              <TabsTrigger value="production-hall" className={t("pages.warehouse.name.shrink_0")}>
                {t("warehouse.productionHall")}
              </TabsTrigger>
              <TabsTrigger value="received-quantities" className={t("pages.warehouse.name.shrink_0")}>
                {t("warehouse.receivedQuantities")}
              </TabsTrigger>
              {locations.map((location: any) => (
                <TabsTrigger
                  key={location.id}
                  value={location.id.toString()}
                  className={t("pages.warehouse.name.shrink_0")}
                >
                  {location.name_ar || location.name}
                </TabsTrigger>
              ))}
              <TabsTrigger value="movements" className={t("pages.warehouse.name.shrink_0")}>
                {t("warehouse.movements")}
              </TabsTrigger>
            </TabsList>

            {/* Production Hall Tab */}
            <TabsContent value="production-hall" className={t("pages.warehouse.name.space_y_4")}>
              <ProductionHallContent />
            </TabsContent>

            {/* Received Quantities Tab */}
            <TabsContent value="received-quantities" className={t("pages.warehouse.name.space_y_4")}>
              <ReceivedQuantitiesContent />
            </TabsContent>

            {/* Dynamic location-based inventory tabs */}
            {locations.map((location: any) => (
              <TabsContent
                key={location.id}
                value={location.id.toString()}
                className={t("pages.warehouse.name.space_y_4")}
              >
                <Card>
                  <CardHeader>
                    <div className={t("pages.warehouse.name.flex_items_center_justify_between")}>
                      <CardTitle>
                        {t("warehouse.inventory")} {location.name_ar || location.name}
                      </CardTitle>
                      <div className={t("pages.warehouse.name.flex_space_x_2_space_x_reverse")}>
                        <div className={t("pages.warehouse.name.relative")}>
                          <Search className={t("pages.warehouse.name.absolute_left_3_top_1_2_transform_translate_y_1_2_h_4_w_4_text_gray_400")} />
                          <Input
                            placeholder={t("common.search")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={t("pages.warehouse.name.pl_10_w_64")}
                          />
                        </div>
                        <Dialog
                          open={isAddDialogOpen}
                          onOpenChange={setIsAddDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button onClick={handleAdd}>
                              <Plus className={t("pages.warehouse.name.h_4_w_4_mr_2")} />
                              {t("warehouse.addInventoryItem")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className={t("pages.warehouse.name.max_w_md")}>
                            <DialogHeader>
                              <DialogTitle>
                                {editingItem
                                  ? t("warehouse.editInventoryItem")
                                  : t("warehouse.addInventoryItem")}
                              </DialogTitle>
                              <DialogDescription>
                                {editingItem
                                  ? t("warehouse.editInventoryItem")
                                  : t("warehouse.addInventoryItem")}
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                              <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className={t("pages.warehouse.name.space_y_4")}
                              >
                                <FormField
                                  control={form.control}
                                  name="{t('pages.warehouse.name.material_group_id')}"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t("warehouse.materialGroup")}</FormLabel>
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          form.setValue("item_id", "");
                                        }}
                                        value={field.value ?? ""}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder={t("common.select")} />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {materialGroups.map((group: any) => (
                                            <SelectItem
                                              key={group.id}
                                              value={group.id.toString()}
                                            >
                                              {group.name_ar || group.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="{t('pages.warehouse.name.item_id')}"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t("warehouse.item")}</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value ?? ""}
                                        disabled={!selectedMaterialGroupId}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue
                                              placeholder={
                                                selectedMaterialGroupId
                                                  ? t("common.select")
                                                  : t("warehouse.materialGroupRequired")
                                              }
                                            />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {filteredItemsByGroup
                                            .filter(
                                              (item: any) =>
                                                item.id &&
                                                item.id !== "" &&
                                                item.id !== null &&
                                                item.id !== undefined,
                                            )
                                            .map((item: any) => (
                                              <SelectItem
                                                key={item.id}
                                                value={item.id.toString()}
                                              >
                                                {item.name_ar} ({item.code})
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="{t('pages.warehouse.name.location_id')}"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t("warehouse.location")}</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value ?? ""}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder={t("common.select")} />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {locations.map((location: any) => (
                                            <SelectItem
                                              key={location.id}
                                              value={location.id.toString()}
                                            >
                                              {location.name_ar}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className={t("pages.warehouse.name.grid_grid_cols_2_gap_4")}>
                                  <FormField
                                    control={form.control}
                                    name="{t('pages.warehouse.name.current_stock')}"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>{t("warehouse.currentStock")}</FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            type="number"
                                            step="0.01"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name="{t('pages.warehouse.name.unit')}"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>{t("warehouse.unit")}</FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          value={field.value ?? ""}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="كيلو">
                                              {t("warehouse.kg")}
                                            </SelectItem>
                                            <SelectItem value="قطعة">
                                              {t("warehouse.piece")}
                                            </SelectItem>
                                            <SelectItem value="طن">
                                              {t("warehouse.ton")}
                                            </SelectItem>
                                            <SelectItem value="متر">
                                              {t("warehouse.meter")}
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className={t("pages.warehouse.name.flex_justify_end_space_x_2_space_x_reverse")}>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddDialogOpen(false)}
                                  >
                                    {t("common.cancel")}
                                  </Button>
                                  <Button
                                    type="submit"
                                    disabled={mutation.isPending}
                                  >
                                    {mutation.isPending
                                      ? t("dashboard.saving")
                                      : t("common.save")}
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
                    {inventoryLoading ? (
                      <div className={t("pages.warehouse.name.text_center_py_8")}>{t("common.loading")}</div>{t('pages.warehouse.)_:_(')}<div className={t("pages.warehouse.name.overflow_x_auto")}>
                        <table className={t("pages.warehouse.name.min_w_full_divide_y_divide_gray_200")}>
                          <thead className={t("pages.warehouse.name.bg_gray_50")}>
                            <tr>
                              <th className={t("pages.warehouse.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                                {t("warehouse.item")}
                              </th>
                              <th className={t("pages.warehouse.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                                {t("common.category")}
                              </th>
                              <th className={t("pages.warehouse.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                                {t("warehouse.currentStock")}
                              </th>
                              <th className={t("pages.warehouse.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                                {t("common.actions")}
                              </th>
                            </tr>
                          </thead>
                          <tbody className={t("pages.warehouse.name.bg_white_divide_y_divide_gray_200")}>
                            {getInventoryByLocation(location.id.toString())
                              .length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className={t("pages.warehouse.name.px_6_py_8_text_center_text_gray_500")}
                                >
                                  {searchTerm
                                    ? t("common.noData")
                                    : t("common.noData")}
                                </td>
                              </tr>
                            ) : (
                              getInventoryByLocation(
                                location.id.toString(),
                              ).map((item: any) => {
                                const currentStock = parseFloat(
                                  item.current_stock || 0,
                                );

                                return (
                                  <tr
                                    key={item.id}
                                    className={t("pages.warehouse.name.hover_bg_gray_50")}
                                  >
                                    <td className={t("pages.warehouse.name.px_6_py_4")}>
                                      <div>
                                        <div className={t("pages.warehouse.name.text_sm_font_medium_text_gray_900")}>
                                          {item.item_name_ar || item.item_name}
                                        </div>
                                        <div className={t("pages.warehouse.name.text_sm_text_gray_500")}>
                                          {item.item_code}
                                        </div>
                                      </div>
                                    </td>
                                    <td className={t("pages.warehouse.name.px_6_py_4_text_sm_text_gray_900")}>
                                      {item.category_name_ar ||
                                        item.category_name ||
                                        "-"}
                                    </td>
                                    <td className={t("pages.warehouse.name.px_6_py_4_text_sm_text_gray_900")}>
                                      {currentStock.toLocaleString()}{" "}
                                      {item.unit}
                                    </td>
                                    <td className={t("pages.warehouse.name.px_6_py_4")}>
                                      <div className={t("pages.warehouse.name.flex_space_x_2_space_x_reverse")}>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEdit(item)}
                                        >
                                          <Edit className={t("pages.warehouse.name.h_3_w_3")} />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            deleteMutation.mutate(item.id)
                                          }
                                          disabled={deleteMutation.isPending}
                                        >
                                          <Trash2 className={t("pages.warehouse.name.h_3_w_3")} />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}

            <TabsContent value="movements" className={t("pages.warehouse.name.space_y_4")}>
              <Card>
                <CardHeader>
                  <div className={t("pages.warehouse.name.flex_justify_between_items_center")}>
                    <div>
                      <CardTitle>{t("warehouse.movements")}</CardTitle>
                      <p className={t("pages.warehouse.name.text_sm_text_gray_600_mt_1")}> </p>
                    </div>
                    <Dialog
                      open={isMovementDialogOpen}
                      onOpenChange={setIsMovementDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button onClick={handleAddMovement}>
                          <Plus className={t("pages.warehouse.name.h_4_w_4_mr_2")} />
                          {t("warehouse.addMovement")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={t("pages.warehouse.name.max_w_md")}>
                        <DialogHeader>
                          <DialogTitle>{t("warehouse.addMovement")}</DialogTitle>
                          <DialogDescription>
                            {t("warehouse.addMovement")}
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...movementForm}>
                          <form
                            onSubmit={movementForm.handleSubmit(
                              onMovementSubmit,
                            )}
                            className={t("pages.warehouse.name.space_y_4")}
                          >
                            <FormField
                              control={movementForm.control}
                              name="{t('pages.warehouse.name.inventory_id')}"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("warehouse.item")}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value ?? ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t("common.select")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {inventoryItems.map((item: any) => (
                                        <SelectItem
                                          key={item.id}
                                          value={item.id.toString()}
                                        >
                                          {item.item_name_ar} -{" "}
                                          {item.location_name_ar}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={movementForm.control}
                              name="{t('pages.warehouse.name.movement_type')}"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("warehouse.movementType")}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value ?? ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t("common.select")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="in">{t("warehouse.in")}</SelectItem>
                                      <SelectItem value="out">{t("warehouse.out")}</SelectItem>
                                      <SelectItem value="transfer">
                                        {t("warehouse.transfer")}
                                      </SelectItem>
                                      <SelectItem value="adjustment">
                                        {t("warehouse.adjustment")}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={movementForm.control}
                              name="{t('pages.warehouse.name.quantity')}"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("common.quantity")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="0.01"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className={t("pages.warehouse.name.grid_grid_cols_2_gap_4")}>
                              <FormField
                                control={movementForm.control}
                                name="{t('pages.warehouse.name.reference_number')}"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t("warehouse.referenceNumber")}</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="{t('pages.warehouse.placeholder.po-001')}" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={movementForm.control}
                                name="{t('pages.warehouse.name.reference_type')}"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t("warehouse.referenceType")}</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value ?? ""}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={t("common.select")} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="purchase">
                                          {t("orders.purchase")}
                                        </SelectItem>
                                        <SelectItem value="sale">
                                          {t("orders.sale")}
                                        </SelectItem>
                                        <SelectItem value="production">
                                          {t("production.title")}
                                        </SelectItem>
                                        <SelectItem value="adjustment">
                                          {t("warehouse.adjustment")}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={movementForm.control}
                              name="{t('pages.warehouse.name.notes')}"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("common.notes")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder={t("common.notes")}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className={t("pages.warehouse.name.flex_justify_end_space_x_2_space_x_reverse")}>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsMovementDialogOpen(false)}
                              >
                                {t("common.cancel")}
                              </Button>
                              <Button
                                type="submit"
                                disabled={movementMutation.isPending}
                              >
                                {movementMutation.isPending
                                  ? t("dashboard.saving")
                                  : t("common.save")}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {movementsLoading ? (
                    <div className={t("pages.warehouse.name.text_center_py_8")}>{t("common.loading")}</div>{t('pages.warehouse.)_:_(')}<div className={t("pages.warehouse.name.overflow_x_auto")}>
                      <table className={t("pages.warehouse.name.min_w_full_divide_y_divide_gray_200")}>
                        <thead className={t("pages.warehouse.name.bg_gray_50")}>
                          <tr>
                            <th className={t("pages.warehouse.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("warehouse.item")}
                            </th>
                            <th className={t("pages.warehouse.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("warehouse.movementType")}
                            </th>
                            <th className={t("pages.warehouse.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("common.quantity")}
                            </th>
                            <th className={t("pages.warehouse.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("warehouse.referenceNumber")}
                            </th>
                            <th className={t("pages.warehouse.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("common.date")}
                            </th>
                            <th className={t("pages.warehouse.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("common.user")}
                            </th>
                            <th className={t("pages.warehouse.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("common.actions")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className={t("pages.warehouse.name.bg_white_divide_y_divide_gray_200")}>
                          {movements.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className={t("pages.warehouse.name.px_6_py_8_text_center_text_gray_500")}
                              >
                                {t("common.noData")}
                              </td>
                            </tr>
                          ) : (
                            movements.map((movement: any) => (
                              <tr
                                key={movement.id}
                                className={t("pages.warehouse.name.hover_bg_gray_50")}
                              >
                                <td className={t("pages.warehouse.name.px_6_py_4")}>
                                  <div>
                                    <div className={t("pages.warehouse.name.text_sm_font_medium_text_gray_900")}>
                                      {movement.item_name}
                                    </div>
                                    <div className={t("pages.warehouse.name.text_sm_text_gray_500")}>
                                      {movement.item_code}
                                    </div>
                                  </div>
                                </td>
                                <td className={t("pages.warehouse.name.px_6_py_4")}>
                                  <Badge
                                    variant={
                                      movement.movement_type === "in"
                                        ? "default"
                                        : movement.movement_type === "out"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                  >
                                    {movement.movement_type === "in"
                                      ? t("warehouse.in")
                                      : movement.movement_type === "out"
                                        ? t("warehouse.out")
                                        : movement.movement_type === "transfer"
                                          ? t("warehouse.transfer")
                                          : t("warehouse.adjustment")}
                                  </Badge>
                                </td>
                                <td className={t("pages.warehouse.name.px_6_py_4_text_sm_text_gray_900")}>
                                  {parseFloat(
                                    movement.quantity,
                                  ).toLocaleString()}
                                </td>
                                <td className={t("pages.warehouse.name.px_6_py_4_text_sm_text_gray_900")}>
                                  {movement.reference_number || "-"}
                                </td>
                                <td className={t("pages.warehouse.name.px_6_py_4_text_sm_text_gray_900")}>
                                  {new Date(
                                    movement.created_at,
                                  ).toLocaleDateString("en-GB")}
                                </td>
                                <td className={t("pages.warehouse.name.px_6_py_4_text_sm_text_gray_900")}>
                                  {movement.user_name || "-"}
                                </td>
                                <td className={t("pages.warehouse.name.px_6_py_4")}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      deleteMovementMutation.mutate(movement.id)
                                    }
                                    disabled={deleteMovementMutation.isPending}
                                  >
                                    <Trash2 className={t("pages.warehouse.name.h_3_w_3")} />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// Production Hall Component
function ProductionHallContent() {
  const { t } = useTranslation();
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptWeight, setReceiptWeight] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch production orders ready for receipt - Optimized polling
  const { data: productionOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/warehouse/production-hall"],
    refetchInterval: 120000, // Reduced to 2 minutes instead of aggressive 30s polling
    staleTime: 90000, // Cache for 1.5 minutes to reduce server load
  });

  // Show each production order separately - no grouping
  const individualOrders = React.useMemo(() => {
    return productionOrders.map((order: any) => ({
      ...order,
      quantity_required: parseFloat(order.quantity_required) || 0,
      total_film_weight: parseFloat(order.total_film_weight) || 0,
      total_cut_weight: parseFloat(order.total_cut_weight) || 0,
      total_received_weight: parseFloat(order.total_received_weight) || 0,
      waste_weight: parseFloat(order.waste_weight) || 0,
      remaining_to_receive: 
        (parseFloat(order.total_cut_weight) || 0) - 
        (parseFloat(order.total_received_weight) || 0),
    }));
  }, [productionOrders]);

  // Receipt mutation
  const receiptMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/warehouse/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(t("common.error"));
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/warehouse/production-hall"],
      });
      setReceiptDialogOpen(false);
      setSelectedOrders(new Set());
      setReceiptWeight("");
      setReceiptNotes("");
      toast({
        title: t("common.success"),
        description: t("warehouse.received"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    },
  });

  const handleSelectOrder = (productionOrderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(productionOrderId)) {
      newSelection.delete(productionOrderId);
    } else {
      newSelection.add(productionOrderId);
    }
    setSelectedOrders(newSelection);
  };

  const handleReceiptSubmit = () => {
    if (selectedOrders.size === 0) {
      toast({
        title: t("common.error"),
        description: t("orders.selectAtLeastOne"),
        variant: "destructive",
      });
      return;
    }

    if (!receiptWeight || parseFloat(receiptWeight) <= 0) {
      toast({
        title: t("common.error"),
        description: t("common.required"),
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
      return;
    }

    const selectedOrdersList = Array.from(selectedOrders);
    const totalWeight = parseFloat(receiptWeight);
    const numOrders = selectedOrdersList.length;
    
    // Distribute weight equally among selected production orders
    const baseWeight = Math.floor((totalWeight * 1000) / numOrders) / 1000;
    const remainder = totalWeight - (baseWeight * numOrders);

    // Create receipts for each selected production order
    selectedOrdersList.forEach((productionOrderId, index) => {
      const order = individualOrders.find(
        (o) => o.production_order_id.toString() === productionOrderId,
      );
      if (order) {
        // Add remainder to last order to ensure exact total
        const weight = index === numOrders - 1 
          ? baseWeight + remainder 
          : baseWeight;
          
        receiptMutation.mutate({
          production_order_id: parseInt(productionOrderId),
          received_weight_kg: weight,
          received_by: user.id,
          notes: receiptNotes,
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className={t("pages.warehouse.name.flex_items_center_justify_between")}>
          <CardTitle className={t("pages.warehouse.name.flex_items_center_gap_2")}>
            <Factory className={t("pages.warehouse.name.h_5_w_5")} />
            {t("warehouse.productionHall")}
          </CardTitle>
          <div className={t("pages.warehouse.name.flex_space_x_2_space_x_reverse")}>
            <Dialog
              open={receiptDialogOpen}
              onOpenChange={setReceiptDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  disabled={selectedOrders.size === 0}
                  data-testid="button-receive-materials"
                >
                  <Truck className={t("pages.warehouse.name.h_4_w_4_mr_2")} />
                  {t("warehouse.receiveMaterials")} ({selectedOrders.size})
                </Button>
              </DialogTrigger>
              <DialogContent className={t("pages.warehouse.name.max_w_md")}>
                <DialogHeader>
                  <DialogTitle>{t("warehouse.receiveMaterials")}</DialogTitle>
                  <DialogDescription>
                    {t("warehouse.receiveMaterials")}
                  </DialogDescription>
                </DialogHeader>
                <div className={t("pages.warehouse.name.space_y_4")}>
                  <div>
                    <label className={t("pages.warehouse.name.text_sm_font_medium")}>
                      {t("warehouse.receivedWeight")}
                    </label>
                    <Input
                      type="number"
                      step="0.001"
                      value={receiptWeight}
                      onChange={(e) => setReceiptWeight(e.target.value)}
                      placeholder={t("warehouse.receivedWeight")}
                      data-testid="input-receipt-weight"
                    />
                  </div>
                  <div>
                    <label className={t("pages.warehouse.name.text_sm_font_medium")}>
                      {t("common.notes")}
                    </label>
                    <textarea
                      value={receiptNotes}
                      onChange={(e) => setReceiptNotes(e.target.value)}
                      placeholder={t("common.notes")}
                      className={t("pages.warehouse.name.w_full_min_h_60px_p_2_border_rounded_md")}
                      data-testid="textarea-receipt-notes"
                    />
                  </div>
                  <div className={t("pages.warehouse.name.flex_space_x_2_space_x_reverse")}>
                    <Button
                      onClick={handleReceiptSubmit}
                      disabled={receiptMutation.isPending}
                      data-testid="button-confirm-receipt"
                    >
                      {receiptMutation.isPending
                        ? t("dashboard.saving")
                        : t("common.confirm")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setReceiptDialogOpen(false)}
                      data-testid="button-cancel-receipt"
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className={t("pages.warehouse.name.flex_justify_center_py_8")}>{t("common.loading")}</div>{t('pages.warehouse.)_:_individualorders.length_===_0_?_(')}<div className={t("pages.warehouse.name.text_center_py_8_text_gray_500")}>
            <Factory className={t("pages.warehouse.name.h_12_w_12_mx_auto_mb_4_text_gray_300")} />
            <p>{t("common.noData")}</p>
            <p className={t("pages.warehouse.name.text_sm")}>{t("common.noData")}</p>
          </div>{t('pages.warehouse.)_:_(')}<div className={t("pages.warehouse.name.overflow_x_auto")}>
            <table className={t("pages.warehouse.name.w_full")}>
              <thead>
                <tr className={t("pages.warehouse.name.border_b")}>
                  <th className={t("pages.warehouse.name.text_right_py_3_px_4_font_medium")}>
                    <input
                      type="checkbox"
                      checked={
                        selectedOrders.size === individualOrders.length &&
                        individualOrders.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders(
                            new Set(
                              individualOrders.map((o: any) => o.production_order_id.toString()),
                            ),
                          );
                        } else {
                          setSelectedOrders(new Set());
                        }
                      }}
                      data-testid="checkbox-select-all"
                    />
                  </th>
                  <th className={t("pages.warehouse.name.text_right_py_3_px_4_font_medium")}>
                    {t("orders.orderNumber")}
                  </th>
                  <th className={t("pages.warehouse.name.text_right_py_3_px_4_font_medium")}>
                    {t("production.productionOrderNumber")}
                  </th>
                  <th className={t("pages.warehouse.name.text_right_py_3_px_4_font_medium")}>{t("orders.customer")}</th>
                  <th className={t("pages.warehouse.name.text_right_py_3_px_4_font_medium")}>
                    {t("warehouse.item")}
                  </th>
                  <th className={t("pages.warehouse.name.text_right_py_3_px_4_font_medium")}>
                    {t("production.quantityRequired")}
                  </th>
                  <th className={t("pages.warehouse.name.text_right_py_3_px_4_font_medium")}>
                    {t("production.filmProduced")}
                  </th>
                  <th className={t("pages.warehouse.name.text_right_py_3_px_4_font_medium")}>
                    {t("production.cutQuantity")}
                  </th>
                  <th className={t("pages.warehouse.name.text_right_py_3_px_4_font_medium")}>
                    {t("warehouse.previouslyReceived")}
                  </th>
                  <th className={t("pages.warehouse.name.text_right_py_3_px_4_font_medium")}>
                    {t("warehouse.remainingToReceive")}
                  </th>
                  <th className={t("pages.warehouse.name.text_right_py_3_px_4_font_medium")}>{t("production.waste")}</th>
                  <th className={t("pages.warehouse.name.text_right_py_3_px_4_font_medium")}>{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {individualOrders.map((order: any) => {
                  const remainingWeight = order.remaining_to_receive;

                  return (
                    <tr
                      key={order.production_order_id}
                      className={`border-b hover:bg-gray-50 ${selectedOrders.has(order.production_order_id.toString()) ? "bg-blue-50" : ""}`}
                    >
                      <td className={t("pages.warehouse.name.py_3_px_4")}>
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(
                            order.production_order_id.toString(),
                          )}
                          onChange={() =>
                            handleSelectOrder(order.production_order_id.toString())
                          }
                          data-testid={`checkbox-select-${order.production_order_id}`}
                        />
                      </td>
                      <td
                        className={t("pages.warehouse.name.py_3_px_4")}
                        data-testid={`text-order-number-${order.production_order_id}`}
                      >
                        <div className={t("pages.warehouse.name.font_medium")}>
                          {order.order_number}
                        </div>
                      </td>
                      <td
                        className={t("pages.warehouse.name.py_3_px_4")}
                        data-testid={`text-production-order-${order.production_order_id}`}
                      >
                        <Badge variant="outline" className={t("pages.warehouse.name.text_blue_600")}>
                          {order.production_order_number}
                        </Badge>
                      </td>
                      <td
                        className={t("pages.warehouse.name.py_3_px_4")}
                        data-testid={`text-customer-${order.production_order_id}`}
                      >
                        {order.customer_name_ar || order.customer_name}
                      </td>
                      <td
                        className={t("pages.warehouse.name.py_3_px_4")}
                        data-testid={`text-item-${order.production_order_id}`}
                      >
                        <div>
                          <div className={t("pages.warehouse.name.font_medium")}>{order.item_name_ar || order.item_name}</div>
                          <div className={t("pages.warehouse.name.text_xs_text_gray_500")}>{order.size_caption}</div>
                        </div>
                      </td>
                      <td
                        className={t("pages.warehouse.name.py_3_px_4")}
                        data-testid={`text-required-${order.production_order_id}`}
                      >
                        {order.quantity_required.toFixed(2)} {t("warehouse.kg")}
                      </td>
                      <td
                        className={t("pages.warehouse.name.py_3_px_4")}
                        data-testid={`text-film-${order.production_order_id}`}
                      >
                        <span className={t("pages.warehouse.name.text_blue_600_font_medium")}>
                          {order.total_film_weight.toFixed(2)} {t("warehouse.kg")}
                        </span>
                      </td>
                      <td
                        className={t("pages.warehouse.name.py_3_px_4")}
                        data-testid={`text-cut-${order.production_order_id}`}
                      >
                        <span className={t("pages.warehouse.name.text_green_600_font_medium")}>
                          {order.total_cut_weight.toFixed(2)} {t("warehouse.kg")}
                        </span>
                      </td>
                      <td
                        className={t("pages.warehouse.name.py_3_px_4")}
                        data-testid={`text-received-${order.production_order_id}`}
                      >
                        <span className={t("pages.warehouse.name.text_orange_600_font_medium")}>
                          {order.total_received_weight.toFixed(2)} {t("warehouse.kg")}
                        </span>
                      </td>
                      <td
                        className={t("pages.warehouse.name.py_3_px_4")}
                        data-testid={`text-remaining-${order.production_order_id}`}
                      >
                        <span className={t("pages.warehouse.name.text_purple_600_font_bold")}>
                          {remainingWeight.toFixed(2)} {t("warehouse.kg")}
                        </span>
                      </td>
                      <td
                        className={t("pages.warehouse.name.py_3_px_4")}
                        data-testid={`text-waste-${order.production_order_id}`}
                      >
                        <span className={t("pages.warehouse.name.text_red_600")}>
                          {order.waste_weight.toFixed(2)} {t("warehouse.kg")}
                        </span>
                      </td>
                      <td
                        className={t("pages.warehouse.name.py_3_px_4")}
                        data-testid={`status-${order.production_order_id}`}
                      >
                        {remainingWeight >{t('pages.warehouse.0_?_(')}<Badge
                            variant="outline"
                            className={t("pages.warehouse.name.text_orange_600_border_orange_600")}
                          >
                            {t("orders.partial")}
                          </Badge>{t('pages.warehouse.)_:_(')}<Badge
                            variant="outline"
                            className={t("pages.warehouse.name.text_green_600_border_green_600")}
                          >
                            <CheckCircle className={t("pages.warehouse.name.h_3_w_3_mr_1")} />
                            {t("orders.complete")}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Received Quantities Component
function ReceivedQuantitiesContent() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>{t('pages.warehouse.(new_set());_const_[sortby,_setsortby]_=_usestate')}<"date" | "weight" | "customer">("date");

  // Fetch received quantities with detailed information
  const { data: receivedQuantities = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/warehouse/receipts-detailed"],
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 240000, // Cache for 4 minutes
  });

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = receivedQuantities.filter(
      (order) =>
        (order.order_number || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (order.customer_name_ar || order.customer_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (order.item_name_ar || order.item_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "weight":
          return (
            Number(b.total_received_weight) - Number(a.total_received_weight)
          );
        case "customer":
          return (a.customer_name_ar || a.customer_name || "").localeCompare(
            b.customer_name_ar || b.customer_name || "",
          );
        case "date":
        default:
          const aLatestDate = Math.max(
            ...(a.receipts?.map((r: any) =>
              new Date(r.receipt_date).getTime(),
            ) || [0]),
          );
          const bLatestDate = Math.max(
            ...(b.receipts?.map((r: any) =>
              new Date(r.receipt_date).getTime(),
            ) || [0]),
          );
          return bLatestDate - aLatestDate;
      }
    });
  }, [receivedQuantities, searchTerm, sortBy]);

  const toggleOrderExpansion = (orderNumber: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderNumber)) {
      newExpanded.delete(orderNumber);
    } else {
      newExpanded.add(orderNumber);
    }
    setExpandedOrders(newExpanded);
  };

  const getTotalStats = () => {
    const totalWeight = filteredData.reduce(
      (sum, order) => sum + Number(order.total_received_weight || 0),
      0,
    );
    const totalReceipts = filteredData.reduce(
      (sum, order) => sum + (order.receipts?.length || 0),
      0,
    );
    return { totalWeight, totalReceipts, totalOrders: filteredData.length };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={t("pages.warehouse.name.flex_items_center_gap_2")}>
            <Package className={t("pages.warehouse.name.h_5_w_5")} />
            {t("warehouse.receivedQuantities")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={t("pages.warehouse.name.text_center_py_8")}
            data-testid="loading-received-quantities"
          >
            <div className={t("pages.warehouse.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto_mb_4")}></div>
            {t("common.loading")}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = getTotalStats();

  return (
    <div className={t("pages.warehouse.name.space_y_6")}>
      {/* Header with Statistics */}
      <Card>
        <CardHeader>
          <div className={t("pages.warehouse.name.flex_items_center_justify_between")}>
            <div>
              <CardTitle className={t("pages.warehouse.name.flex_items_center_gap_2")}>
                <Package className={t("pages.warehouse.name.h_5_w_5")} />
                {t("warehouse.receivedQuantities")}
              </CardTitle>
              <CardDescription>
                {t("warehouse.receivedQuantities")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics Cards */}
          <div className={t("pages.warehouse.name.grid_grid_cols_1_md_grid_cols_4_gap_4_mb_6")}>
            <div className={t("pages.warehouse.name.bg_blue_50_dark_bg_blue_900_20_p_4_rounded_lg")}>
              <div className={t("pages.warehouse.name.flex_items_center_gap_2")}>
                <ShoppingCart className={t("pages.warehouse.name.h_4_w_4_text_blue_600")} />
                <span className={t("pages.warehouse.name.text_sm_font_medium_text_blue_600")}>
                  {t("dashboard.totalOrders")}
                </span>
              </div>
              <div className={t("pages.warehouse.name.text_2xl_font_bold_text_blue_700")}>
                {stats.totalOrders}
              </div>
            </div>
            <div className={t("pages.warehouse.name.bg_green_50_dark_bg_green_900_20_p_4_rounded_lg")}>
              <div className={t("pages.warehouse.name.flex_items_center_gap_2")}>
                <Scale className={t("pages.warehouse.name.h_4_w_4_text_green_600")} />
                <span className={t("pages.warehouse.name.text_sm_font_medium_text_green_600")}>
                  {t("warehouse.totalWeight")}
                </span>
              </div>
              <div className={t("pages.warehouse.name.text_2xl_font_bold_text_green_700")}>
                {stats.totalWeight.toFixed(2)} {t("warehouse.kg")}
              </div>
            </div>
            <div className={t("pages.warehouse.name.bg_orange_50_dark_bg_orange_900_20_p_4_rounded_lg")}>
              <div className={t("pages.warehouse.name.flex_items_center_gap_2")}>
                <FileText className={t("pages.warehouse.name.h_4_w_4_text_orange_600")} />
                <span className={t("pages.warehouse.name.text_sm_font_medium_text_orange_600")}>
                  {t("warehouse.totalReceipts")}
                </span>
              </div>
              <div className={t("pages.warehouse.name.text_2xl_font_bold_text_orange_700")}>
                {stats.totalReceipts}
              </div>
            </div>
            <div className={t("pages.warehouse.name.bg_purple_50_dark_bg_purple_900_20_p_4_rounded_lg")}>
              <div className={t("pages.warehouse.name.flex_items_center_gap_2")}>
                <TrendingUp className={t("pages.warehouse.name.h_4_w_4_text_purple_600")} />
                <span className={t("pages.warehouse.name.text_sm_font_medium_text_purple_600")}>
                  {t("warehouse.averageWeight")}
                </span>
              </div>
              <div className={t("pages.warehouse.name.text_2xl_font_bold_text_purple_700")}>
                {stats.totalOrders > 0
                  ? (stats.totalWeight / stats.totalOrders).toFixed(2)
                  : "0"}{" "}
                {t("warehouse.kg")}
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className={t("pages.warehouse.name.flex_flex_col_sm_flex_row_gap_4_mb_6")}>
            <div className={t("pages.warehouse.name.relative_flex_1")}>
              <Search className={t("pages.warehouse.name.absolute_right_3_top_1_2_transform_translate_y_1_2_h_4_w_4_text_gray_400")} />
              <Input
                placeholder={t("common.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={t("pages.warehouse.name.pr_10")}
                data-testid="search-received-quantities"
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={(value: "date" | "weight" | "customer") =>
                setSortBy(value)
              }
            >
              <SelectTrigger className={t("pages.warehouse.name.w_full_sm_w_48")}>
                <SelectValue placeholder={t("common.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">{t("common.date")}</SelectItem>
                <SelectItem value="weight">{t("warehouse.weight")}</SelectItem>
                <SelectItem value="customer">{t("orders.customer")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredData.length === 0 ? (
        <Card>
          <CardContent className={t("pages.warehouse.name.py_12")}>
            <div
              className={t("pages.warehouse.name.text_center_text_gray_500")}
              data-testid="no-received-quantities"
            >
              <Package className={t("pages.warehouse.name.h_12_w_12_mx_auto_mb_4_opacity_50")} />
              <p className={t("pages.warehouse.name.text_lg_font_medium_mb_2")}>{t("common.noData")}</p>
              <p className={t("pages.warehouse.name.text_sm")}>
                {searchTerm
                  ? t("common.noData")
                  : t("common.noData")}
              </p>
            </div>
          </CardContent>
        </Card>{t('pages.warehouse.)_:_(')}<div className={t("pages.warehouse.name.space_y_4")}>
          {filteredData.map((order: any) => {
            const isExpanded = expandedOrders.has(order.order_number);
            const latestReceipt =
              order.receipts?.reduce((latest: any, current: any) =>
                new Date(current.receipt_date) >{t('pages.warehouse.new_date(latest.receipt_date)_?_current_:_latest,_)_||_null;_return_(')}<Card
                key={order.order_number}
                className={t("pages.warehouse.name.overflow_hidden_hover_shadow_md_transition_shadow")}
              >
                <div className={t("pages.warehouse.name.p_6")}>
                  {/* Order Header */}
                  <div className={t("pages.warehouse.name.flex_items_start_justify_between_mb_4")}>
                    <div className={t("pages.warehouse.name.flex_1")}>
                      <div className={t("pages.warehouse.name.flex_items_center_gap_3_mb_2")}>
                        <Badge
                          variant="outline"
                          className={t("pages.warehouse.name.text_blue_600_border_blue_200_bg_blue_50")}
                        >
                          <Hash className={t("pages.warehouse.name.h_3_w_3_mr_1")} />
                          {order.order_number}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={t("pages.warehouse.name.bg_green_100_text_green_700")}
                        >
                          {order.receipts?.length || 0} {t("warehouse.receipt")}
                        </Badge>
                      </div>

                      <div className={t("pages.warehouse.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_4_gap_4")}>
                        <div>
                          <p className={t("pages.warehouse.name.text_sm_text_gray_500_mb_1")}>{t("orders.customer")}</p>
                          <p
                            className={t("pages.warehouse.name.font_medium")}
                            data-testid={`customer-name-${order.order_number}`}
                          >
                            {order.customer_name_ar || order.customer_name}
                          </p>
                        </div>

                        <div>
                          <p className={t("pages.warehouse.name.text_sm_text_gray_500_mb_1")}>{t("warehouse.product")}</p>
                          <p
                            className={t("pages.warehouse.name.font_medium")}
                            data-testid={`item-name-${order.order_number}`}
                          >
                            {order.item_name_ar || order.item_name}
                          </p>
                        </div>

                        <div>
                          <p className={t("pages.warehouse.name.text_sm_text_gray_500_mb_1")}>
                            {t("warehouse.totalWeight")}
                          </p>
                          <p
                            className={t("pages.warehouse.name.font_bold_text_green_600_text_lg")}
                            data-testid={`total-weight-${order.order_number}`}
                          >
                            {Number(order.total_received_weight).toFixed(2)}{" "}
                            {t("warehouse.kg")}
                          </p>
                        </div>

                        <div>
                          <p className={t("pages.warehouse.name.text_sm_text_gray_500_mb_1")}>
                            {t("warehouse.lastReceived")}
                          </p>
                          <p className={t("pages.warehouse.name.text_sm")}>
                            {latestReceipt
                              ? new Date(
                                  latestReceipt.receipt_date,
                                ).toLocaleDateString("ar")
                              : "-"}
                          </p>
                        </div>
                      </div>

                      {/* Product Specifications */}
                      {(order.size_caption ||
                        order.width ||
                        order.thickness ||
                        order.raw_material) && (
                        <div
                          className={t("pages.warehouse.name.mt_4_p_3_bg_gray_50_dark_bg_gray_800_rounded_lg")}
                          data-testid={`size-${order.order_number}`}
                        >
                          <p className={t("pages.warehouse.name.text_sm_font_medium_text_gray_700_dark_text_gray_300_mb_2")}>
                            {t("orders.productSpecs")}:
                          </p>
                          <div className={t("pages.warehouse.name.grid_grid_cols_2_md_grid_cols_4_gap_2_text_sm")}>
                            {order.size_caption && (
                              <div>
                                <span className={t("pages.warehouse.name.text_gray_500")}>{t("items.size")}:</span>
                                <span className={t("pages.warehouse.name.mr_1_font_medium")}>
                                  {order.size_caption}
                                </span>
                              </div>
                            )}
                            {order.width && (
                              <div>
                                <span className={t("pages.warehouse.name.text_gray_500")}>{t("items.width")}:</span>
                                <span className={t("pages.warehouse.name.mr_1_font_medium")}>
                                  {order.width}م
                                </span>
                              </div>
                            )}
                            {order.thickness && (
                              <div>
                                <span className={t("pages.warehouse.name.text_gray_500")}>{t("items.thickness")}:</span>
                                <span className={t("pages.warehouse.name.mr_1_font_medium")}>
                                  {order.thickness}مم
                                </span>
                              </div>
                            )}
                            {order.raw_material && (
                              <div>
                                <span className={t("pages.warehouse.name.text_gray_500")}>{t("items.rawMaterial")}:</span>
                                <span className={t("pages.warehouse.name.mr_1_font_medium")}>
                                  {order.raw_material}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOrderExpansion(order.order_number)}
                      className={t("pages.warehouse.name.ml_4")}
                      data-testid={`expand-order-${order.order_number}`}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className={t("pages.warehouse.name.h_4_w_4_mr_1")} />
                          {t("common.hide")}
                        </>{t('pages.warehouse.)_:_(')}<>
                          <ChevronDown className={t("pages.warehouse.name.h_4_w_4_mr_1")} />
                          {t("common.showDetails")}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Expanded Receipts Details */}
                  {isExpanded && order.receipts && (
                    <div
                      className={t("pages.warehouse.name.border_t_pt_4")}
                      data-testid={`receipts-detail-${order.order_number}`}
                    >
                      <h4 className={t("pages.warehouse.name.font_medium_text_gray_800_dark_text_gray_200_mb_3_flex_items_center_gap_2")}>
                        <FileText className={t("pages.warehouse.name.h_4_w_4")} />
                        {t("warehouse.receiptDetails")} ({order.receipts.length})
                      </h4>
                      <div className={t("pages.warehouse.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_3_gap_4")}>
                        {order.receipts.map((receipt: any) => (
                          <div
                            key={receipt.receipt_id}
                            className={t("pages.warehouse.name.border_rounded_lg_p_4_bg_white_dark_bg_gray_800_shadow_sm")}
                          >
                            <div className={t("pages.warehouse.name.flex_items_center_justify_between_mb_3")}>
                              <Badge variant="outline" className={t("pages.warehouse.name.text_xs")}>
                                {t("warehouse.receipt")} #{receipt.receipt_id}
                              </Badge>
                              <span className={t("pages.warehouse.name.text_xs_text_gray_500")}>
                                {new Date(
                                  receipt.receipt_date,
                                ).toLocaleDateString("ar")}
                              </span>
                            </div>

                            <div className={t("pages.warehouse.name.space_y_2_text_sm")}>
                              <div className={t("pages.warehouse.name.flex_items_center_gap_2")}>
                                <Scale className={t("pages.warehouse.name.h_3_w_3_text_green_600")} />
                                <span className={t("pages.warehouse.name.text_gray_600")}>{t("common.quantity")}:</span>
                                <span className={t("pages.warehouse.name.font_semibold_text_green_600")}>
                                  {Number(receipt.received_weight_kg).toFixed(
                                    2,
                                  )}{" "}
                                  {t("warehouse.kg")}
                                </span>
                              </div>

                              <div className={t("pages.warehouse.name.flex_items_center_gap_2")}>
                                <User className={t("pages.warehouse.name.h_3_w_3_text_blue_600")} />
                                <span className={t("pages.warehouse.name.text_gray_600")}>{t("warehouse.receivedBy")}:</span>
                                <span className={t("pages.warehouse.name.font_medium")}>
                                  {receipt.received_by_name}
                                </span>
                              </div>

                              {receipt.production_order_number && (
                                <div className={t("pages.warehouse.name.flex_items_center_gap_2")}>
                                  <Factory className={t("pages.warehouse.name.h_3_w_3_text_purple_600")} />
                                  <span className={t("pages.warehouse.name.text_gray_600")}>
                                    {t("production.productionOrder")}:
                                  </span>
                                  <span className={t("pages.warehouse.name.font_medium")}>
                                    {receipt.production_order_number}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
