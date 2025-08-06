import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Search, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export default function Warehouse() {
  const [searchTerm, setSearchTerm] = useState("");

  // Sample inventory data
  const inventoryItems = [
    {
      id: 1,
      name: "HDPE طبيعي",
      name_ar: "HDPE طبيعي",
      code: "HDPE-001",
      category: "مواد خام",
      currentStock: 2500,
      minStock: 1000,
      maxStock: 5000,
      unit: "كيلو",
      location: "مستودع A-1",
      lastUpdated: "2025-02-06"
    },
    {
      id: 2,
      name: "LDPE شفاف",
      name_ar: "LDPE شفاف",
      code: "LDPE-002",
      category: "مواد خام",
      currentStock: 1800,
      minStock: 1500,
      maxStock: 4000,
      unit: "كيلو",
      location: "مستودع A-2",
      lastUpdated: "2025-02-06"
    },
    {
      id: 3,
      name: "ماستر باتش أبيض",
      name_ar: "ماستر باتش أبيض",
      code: "MB-WHITE",
      category: "ماستر باتش",
      currentStock: 500,
      minStock: 200,
      maxStock: 1000,
      unit: "كيلو",
      location: "مستودع B-1",
      lastUpdated: "2025-02-05"
    },
    {
      id: 4,
      name: "أكياس مطبوعة 20x30",
      name_ar: "أكياس مطبوعة 20x30",
      code: "BAG-20X30",
      category: "منتجات نهائية",
      currentStock: 15000,
      minStock: 5000,
      maxStock: 50000,
      unit: "قطعة",
      location: "مستودع C-1",
      lastUpdated: "2025-02-06"
    }
  ];

  const getStockStatus = (current: number, min: number, max: number) => {
    if (current <= min) return { status: "منخفض", color: "destructive", icon: AlertTriangle };
    if (current >= max) return { status: "مرتفع", color: "warning", icon: TrendingUp };
    return { status: "طبيعي", color: "success", icon: Package };
  };

  const filteredItems = inventoryItems.filter(item => 
    item.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة المستودع</h1>
            <p className="text-gray-600">متابعة وإدارة المخزون والمواد الخام والمنتجات النهائية</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245</div>
                <p className="text-xs text-muted-foreground">صنف نشط</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">أصناف منخفضة</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">12</div>
                <p className="text-xs text-muted-foreground">تحتاج إعادة تموين</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$125,430</div>
                <p className="text-xs text-muted-foreground">+12% من الشهر الماضي</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">حركات اليوم</CardTitle>
                <TrendingDown className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28</div>
                <p className="text-xs text-muted-foreground">عملية دخول وخروج</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="inventory" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="inventory">المخزون الحالي</TabsTrigger>
              <TabsTrigger value="movements">حركات المخزون</TabsTrigger>
              <TabsTrigger value="locations">المواقع</TabsTrigger>
              <TabsTrigger value="reports">التقارير</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>بيانات المخزون</CardTitle>
                    <div className="flex space-x-2 space-x-reverse">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="البحث في المخزون..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        إضافة صنف
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الصنف</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفئة</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المخزون الحالي</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحد الأدنى</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحد الأقصى</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموقع</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredItems.map((item) => {
                          const stockInfo = getStockStatus(item.currentStock, item.minStock, item.maxStock);
                          const StatusIcon = stockInfo.icon;
                          
                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{item.name_ar}</div>
                                  <div className="text-sm text-gray-500">{item.code}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">{item.category}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {item.currentStock.toLocaleString()} {item.unit}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {item.minStock.toLocaleString()} {item.unit}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {item.maxStock.toLocaleString()} {item.unit}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">{item.location}</td>
                              <td className="px-6 py-4">
                                <Badge variant={stockInfo.color === 'success' ? 'default' : stockInfo.color === 'warning' ? 'secondary' : 'destructive'} className="flex items-center space-x-1">
                                  <StatusIcon className="h-3 w-3" />
                                  <span>{stockInfo.status}</span>
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex space-x-2 space-x-reverse">
                                  <Button variant="outline" size="sm">تعديل</Button>
                                  <Button variant="outline" size="sm">حركة</Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="movements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>حركات المخزون</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">سيتم إضافة تتبع حركات المخزون قريباً</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إدارة المواقع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">سيتم إضافة إدارة مواقع المستودعات قريباً</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>تقارير المستودع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">سيتم إضافة تقارير المستودع قريباً</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}