import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { Plus } from "lucide-react";
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
  currentUser,
  isAdmin = false
}: OrdersTabsProps) {
  
  const handleCloseOrderDialog = () => {
    setIsOrderDialogOpen(false);
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
                <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
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