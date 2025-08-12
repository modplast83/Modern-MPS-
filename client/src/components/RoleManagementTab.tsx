import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Role } from "@shared/schema";
import { Plus, Edit, Trash2, Shield, Check, X } from "lucide-react";

export default function RoleManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newRole, setNewRole] = useState({
    name: "",
    name_ar: "",
    permissions: [] as string[]
  });
  
  const [editingRole, setEditingRole] = useState<any | null>(null);

  // Available permissions list
  const availablePermissions = [
    { id: "view_dashboard", name: "عرض لوحة التحكم", category: "عام" },
    { id: "manage_orders", name: "إدارة الطلبات", category: "الطلبات" },
    { id: "manage_production", name: "إدارة الإنتاج", category: "الإنتاج" },
    { id: "manage_maintenance", name: "إدارة الصيانة", category: "الصيانة" },
    { id: "manage_quality", name: "إدارة الجودة", category: "الجودة" },
    { id: "manage_inventory", name: "إدارة المخزون", category: "المخزون" },
    { id: "manage_users", name: "إدارة المستخدمين", category: "المستخدمين" },
    { id: "manage_hr", name: "إدارة الموارد البشرية", category: "الموارد البشرية" },
    { id: "view_reports", name: "عرض التقارير", category: "التقارير" },
    { id: "manage_settings", name: "إدارة الإعدادات", category: "النظام" },
    { id: "manage_definitions", name: "إدارة التعريفات", category: "النظام" }
  ];

  // Fetch roles
  const { data: roles = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/roles']
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      return await apiRequest('/api/roles', {
        method: 'POST',
        body: JSON.stringify(roleData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setNewRole({ name: "", name_ar: "", permissions: [] });
      toast({
        title: "تم إنشاء الدور بنجاح",
        description: "تم إضافة الدور الجديد إلى النظام",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في إنشاء الدور",
        description: "حدث خطأ أثناء إنشاء الدور",
        variant: "destructive",
      });
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, roleData }: { id: number; roleData: any }) => {
      return await apiRequest(`/api/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(roleData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setEditingRole(null);
      toast({
        title: "تم تحديث الدور بنجاح",
        description: "تم حفظ التغييرات على الدور",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في تحديث الدور",
        description: "حدث خطأ أثناء تحديث الدور",
        variant: "destructive",
      });
    }
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/roles/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      toast({
        title: "تم حذف الدور بنجاح",
        description: "تم إزالة الدور من النظام",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في حذف الدور",
        description: "حدث خطأ أثناء حذف الدور",
        variant: "destructive",
      });
    }
  });

  const handleCreateRole = () => {
    if (!newRole.name || !newRole.name_ar) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال اسم الدور باللغتين العربية والإنجليزية",
        variant: "destructive",
      });
      return;
    }

    createRoleMutation.mutate(newRole);
  };

  const handleUpdateRole = () => {
    if (editingRole) {
      updateRoleMutation.mutate({
        id: editingRole.id,
        roleData: editingRole
      });
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean, isEditing = false) => {
    if (isEditing && editingRole) {
      setEditingRole({
        ...editingRole,
        permissions: checked 
          ? [...editingRole.permissions, permissionId]
          : editingRole.permissions.filter((p: string) => p !== permissionId)
      });
    } else {
      setNewRole({
        ...newRole,
        permissions: checked 
          ? [...newRole.permissions, permissionId]
          : newRole.permissions.filter(p => p !== permissionId)
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري تحميل الأدوار...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add New Role Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            إضافة دور جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">اسم الدور (بالإنجليزية)</Label>
              <Input
                id="roleName"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="admin, manager, operator..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleNameAr">اسم الدور (بالعربية)</Label>
              <Input
                id="roleNameAr"
                value={newRole.name_ar}
                onChange={(e) => setNewRole({ ...newRole, name_ar: e.target.value })}
                placeholder="مدير، مشرف، مشغل..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>الصلاحيات</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePermissions.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={`new-${permission.id}`}
                    checked={newRole.permissions.includes(permission.id)}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(permission.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`new-${permission.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permission.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCreateRole}
              disabled={createRoleMutation.isPending}
              className="flex items-center gap-2"
            >
              {createRoleMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الإضافة...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  إضافة الدور
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            الأدوار الموجودة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم</TableHead>
                <TableHead>اسم الدور</TableHead>
                <TableHead>الاسم بالعربية</TableHead>
                <TableHead>عدد الصلاحيات</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(roles as any[]).map((role: any) => (
                <TableRow key={role.id}>
                  <TableCell>{role.id}</TableCell>
                  <TableCell>
                    {editingRole?.id === role.id ? (
                      <Input
                        value={editingRole.name}
                        onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                        className="max-w-[150px]"
                      />
                    ) : (
                      <Badge variant="outline">{role.name}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRole?.id === role.id ? (
                      <Input
                        value={editingRole.name_ar}
                        onChange={(e) => setEditingRole({ ...editingRole, name_ar: e.target.value })}
                        className="max-w-[150px]"
                      />
                    ) : (
                      role.name_ar
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRole?.id === role.id ? (
                      <div className="space-y-2 max-w-[300px]">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          الصلاحيات المتاحة:
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                          {availablePermissions.slice(0, 6).map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2 space-x-reverse text-xs">
                              <Checkbox
                                id={`table-edit-${permission.id}`}
                                checked={editingRole.permissions?.includes(permission.id)}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(permission.id, checked as boolean, true)
                                }
                                className="w-3 h-3"
                              />
                              <label
                                htmlFor={`table-edit-${permission.id}`}
                                className="text-xs leading-none cursor-pointer"
                              >
                                {permission.name}
                              </label>
                            </div>
                          ))}
                          {availablePermissions.length > 6 && (
                            <div className="text-xs text-muted-foreground">
                              و {availablePermissions.length - 6} صلاحيات أخرى...
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {role.permissions?.length || 0} صلاحية
                        </Badge>
                        {role.permissions?.length > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              toast({
                                title: `صلاحيات الدور: ${role.name_ar}`,
                                description: (
                                  <div className="space-y-1">
                                    {role.permissions.slice(0, 5).map((permId: string) => {
                                      const perm = availablePermissions.find(p => p.id === permId);
                                      return perm ? (
                                        <div key={permId} className="text-xs">
                                          • {perm.name}
                                        </div>
                                      ) : null;
                                    })}
                                    {role.permissions.length > 5 && (
                                      <div className="text-xs text-muted-foreground">
                                        و {role.permissions.length - 5} صلاحيات أخرى...
                                      </div>
                                    )}
                                  </div>
                                ),
                              });
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            عرض
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {editingRole?.id === role.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={handleUpdateRole}
                            disabled={updateRoleMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            حفظ
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRole(null)}
                          >
                            <X className="w-3 h-3" />
                            إلغاء
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRole({ ...role })}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteRoleMutation.mutate(role.id)}
                            disabled={deleteRoleMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            حذف
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(roles as any[]).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد أدوار محددة في النظام
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Permissions Editor - Only shown when editing */}
      {editingRole && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              تفاصيل صلاحيات الدور: {editingRole.name_ar}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              يمكنك تعديل الصلاحيات الأساسية في الجدول أعلاه، أو استخدام هذا القسم لإدارة جميع الصلاحيات
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePermissions.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={`edit-${permission.id}`}
                    checked={editingRole.permissions?.includes(permission.id)}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(permission.id, checked as boolean, true)
                    }
                  />
                  <label
                    htmlFor={`edit-${permission.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permission.name}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {permission.category}
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                المجموع: {editingRole.permissions?.length || 0} صلاحية محددة
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingRole({
                    ...editingRole,
                    permissions: availablePermissions.map(p => p.id)
                  })}
                >
                  تحديد الكل
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingRole({
                    ...editingRole,
                    permissions: []
                  })}
                >
                  إلغاء تحديد الكل
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}