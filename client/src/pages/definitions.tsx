import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Cog, Package, Truck, MapPin } from "lucide-react";

export default function Definitions() {
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: ["/api/machines"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const definitionSections = [
    {
      title: "العملاء",
      icon: Building2,
      data: customers,
      loading: customersLoading,
      columns: ["الاسم", "الهاتف", "العنوان", "الحالة"],
      renderRow: (item: any) => (
        <tr key={item.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {item.name}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {item.phone || '-'}
          </td>
          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
            {item.address || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
              {item.status === 'active' ? 'نشط' : 'غير نشط'}
            </Badge>
          </td>
        </tr>
      )
    },
    {
      title: "المنتجات",
      icon: Package,
      data: products,
      loading: productsLoading,
      columns: ["الاسم", "الكود", "النوع", "اللون", "الحالة"],
      renderRow: (item: any) => (
        <tr key={item.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {item.name}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {item.code}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {item.type === 'hdpe' ? 'HDPE' : 
             item.type === 'ldpe' ? 'LDPE' : 
             item.type === 'pp' ? 'PP' : item.type}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {item.color || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
              {item.status === 'active' ? 'نشط' : 'غير نشط'}
            </Badge>
          </td>
        </tr>
      )
    },
    {
      title: "المكائن",
      icon: Cog,
      data: machines,
      loading: machinesLoading,
      columns: ["الاسم", "النوع", "السرعة", "الحالة"],
      renderRow: (item: any) => (
        <tr key={item.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {item.name_ar}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {item.type === 'extrusion' ? 'بثق' :
             item.type === 'printing' ? 'طباعة' :
             item.type === 'cutting' ? 'قص' : item.type}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {item.speed_rating ? `${item.speed_rating} م/دقيقة` : '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                item.status === 'running' ? 'bg-green-400' :
                item.status === 'maintenance' ? 'bg-yellow-400' :
                'bg-red-400'
              }`}></div>
              <span className="text-sm text-gray-700">
                {item.status === 'running' ? 'تعمل' :
                 item.status === 'maintenance' ? 'صيانة' :
                 'متوقفة'}
              </span>
            </div>
          </td>
        </tr>
      )
    },
    {
      title: "المستخدمين",
      icon: Users,
      data: users,
      loading: usersLoading,
      columns: ["الاسم", "اسم المستخدم", "الدور", "القسم", "الحالة"],
      renderRow: (item: any) => (
        <tr key={item.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {item.display_name_ar}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {item.username}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {item.role_id === 1 ? 'مدير النظام' :
             item.role_id === 2 ? 'مشرف' :
             item.role_id === 3 ? 'مشغل' :
             item.role_id === 4 ? 'مفتش جودة' :
             item.role_id === 5 ? 'فني صيانة' : 'موظف'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {item.section_id === 1 ? 'الإنتاج' :
             item.section_id === 2 ? 'الجودة' :
             item.section_id === 3 ? 'الصيانة' :
             item.section_id === 4 ? 'المستودع' : 'عام'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
              {item.status === 'active' ? 'نشط' : 'غير نشط'}
            </Badge>
          </td>
        </tr>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 p-4 pb-20 lg:pb-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">التعريفات الأساسية</h1>
            <p className="text-gray-600">إدارة البيانات الأساسية للنظام</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">العملاء</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.isArray(customers) ? customers.length : 0}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">المنتجات</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.isArray(products) ? products.length : 0}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">المكائن</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.isArray(machines) ? machines.length : 0}
                    </p>
                  </div>
                  <Cog className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">المستخدمين</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.isArray(users) ? users.length : 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {definitionSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.title}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {section.loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {section.columns.map((column) => (
                                <th key={column} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Array.isArray(section.data) && section.data.length > 0 ? (
                              section.data.map(section.renderRow)
                            ) : (
                              <tr>
                                <td colSpan={section.columns.length} className="px-6 py-4 text-center text-gray-500">
                                  لا توجد بيانات متاحة
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}