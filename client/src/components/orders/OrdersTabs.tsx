import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Plus, Trash2, RefreshCw, ChevronDown } from "lucide-react";
import OrdersSearch from "./OrdersSearch";
import OrdersTable from "./OrdersTable";
import OrdersForm from "./OrdersForm";

interface OrdersTabsProps {
  orders: any[];
  productionOrders: any[];
  customers: any[];
  customerProducts: any[];
  users: any[];
  items: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  filteredOrders: any[];
  isOrderDialogOpen: boolean;
  setIsOrderDialogOpen: (open: boolean) => void;
  editingOrder: any;
  onAddOrder: () => void;
  onEditOrder: (order: any) => void;
  onDeleteOrder: (order: any) => void;
  onStatusChange: (order: any, status: string) => void;
  onViewOrder: (order: any) => void;
  onPrintOrder: (order: any) => void;
  onOrderSubmit: (data: any, productionOrders: any[]) => void;
  onBulkDelete?: (orderIds: number[]) => Promise<void>;
  onBulkStatusChange?: (orderIds: number[], status: string) => Promise<void>;
  currentUser?: any;
  isAdmin?: boolean;
}

export default function OrdersTabs({
  orders,
  productionOrders,
  customers,
  customerProducts,
  users,
  items,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  filteredOrders,
  isOrderDialogOpen,
  setIsOrderDialogOpen,
  editingOrder,
  onAddOrder,
  onEditOrder,
  onDeleteOrder,
  onStatusChange,
  onViewOrder,
  onPrintOrder,
  onOrderSubmit,
  onBulkDelete,
  onBulkStatusChange,
  currentUser,
  isAdmin = false,
}: OrdersTabsProps) {
  // Bulk selection state
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  const handleCloseOrderDialog = () => {
    setIsOrderDialogOpen(false);
  };

  // Bulk selection handlers
  const handleOrderSelect = (orderId: number, selected: boolean) => {
    if (selected) {
      setSelectedOrders((prev) => [...prev, orderId]);
    } else {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedOrders(filteredOrders.map((order: any) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedOrders.length === 0 || !isAdmin) return;

    const confirmMessage = `هل أنت متأكد من حذف ${selectedOrders.length} طلب؟ هذا الإجراء لا يمكن التراجع عنه.`;
    if (!confirm(confirmMessage)) return;

    try {
      await onBulkDelete(selectedOrders);
      setSelectedOrders([]);
    } catch (error) {
      console.error("خطأ في الحذف الجماعي:", error);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (!onBulkStatusChange || selectedOrders.length === 0) return;

    try {
      await onBulkStatusChange(selectedOrders, status);
      setSelectedOrders([]);
    } catch (error) {
      console.error("خطأ في تغيير الحالة الجماعية:", error);
    }
  };

  return (
    <Tabs defaultValue="orders" className="space-y-4">
      <TabsList>
        <TabsTrigger value="orders">الطلبات</TabsTrigger>
        <TabsTrigger value="production-orders">أوامر الإنتاج</TabsTrigger>
      </TabsList>

      <TabsContent value="orders" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>إدارة الطلبات</CardTitle>
              <div className="flex items-center space-x-2 space-x-reverse">
                <OrdersSearch
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                />
                <Dialog
                  open={isOrderDialogOpen}
                  onOpenChange={setIsOrderDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button onClick={onAddOrder} data-testid="button-add-order">
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة طلب
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions Bar */}
            {selectedOrders.length > 0 && (
              <Alert className="mb-4">
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      تم تحديد {selectedOrders.length} طلب
                    </span>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 border-orange-600 hover:bg-orange-50"
                            data-testid="button-bulk-status-change"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            تغيير الحالة
                            <ChevronDown className="h-3 w-3 mr-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() =>
                              handleBulkStatusChange("for_production")
                            }
                          >
                            <div className="flex items-center w-full">
                              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                              إلى الإنتاج
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBulkStatusChange("on_hold")}
                          >
                            <div className="flex items-center w-full">
                              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                              إيقاف مؤقت
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBulkStatusChange("pending")}
                          >
                            <div className="flex items-center w-full">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                              في الانتظار
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBulkStatusChange("completed")}
                          >
                            <div className="flex items-center w-full">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              مكتمل
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {isAdmin && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                          data-testid="button-bulk-delete"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          حذف المحدد ({selectedOrders.length})
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrders([])}
                        data-testid="button-clear-selection"
                      >
                        إلغاء التحديد
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <OrdersTable
              orders={filteredOrders}
              customers={customers}
              users={users}
              onViewOrder={onViewOrder}
              onPrintOrder={onPrintOrder}
              onEditOrder={isAdmin ? onEditOrder : undefined}
              onDeleteOrder={onDeleteOrder}
              onStatusChange={onStatusChange}
              currentUser={currentUser}
              isAdmin={isAdmin}
              selectedOrders={selectedOrders}
              onOrderSelect={handleOrderSelect}
              onSelectAll={handleSelectAll}
            />
          </CardContent>
        </Card>

        {/* Orders Form Dialog */}
        <OrdersForm
          isOpen={isOrderDialogOpen}
          onClose={handleCloseOrderDialog}
          onSubmit={onOrderSubmit}
          customers={customers}
          customerProducts={customerProducts}
          items={items}
          editingOrder={editingOrder}
        />
      </TabsContent>

      <TabsContent value="production-orders" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle>أوامر الإنتاج</CardTitle>
              {/* TODO: Add production orders management here */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              سيتم إضافة إدارة أوامر الإنتاج هنا
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
